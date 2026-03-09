/**
 * @nemesis-js/core - DIContainer
 *
 * The Dependency Injection container. Manages provider registration, resolution,
 * lifecycle (singleton/transient), and circular dependency detection.
 *
 * Key design decisions:
 * - Token-based: No emitDecoratorMetadata needed. Uses @Inject(token) decorators.
 * - Singleton by default: Instances are cached after first resolution.
 * - Lazy resolution: Providers are instantiated on first `.get()` call, not at registration.
 * - Clear error messages: Circular deps, missing tokens, and invalid configs all throw descriptive errors.
 */

import {
  MetadataStorage,
  type ClassProvider,
  type ExistingProvider,
  type FactoryProvider,
  type InjectionToken,
  type Provider,
  type Type,
  type ValueProvider,
  SCOPE,
  type Scope,
} from '@nemesis-js/common';
import {
  CircularDependencyError,
  InvalidProviderError,
  MissingInjectionTokenError,
  UnknownTokenError,
} from '../errors/index.js';
import type { ILogger } from '@nemesis-js/common';

// ─── Provider Record ─────────────────────────────────────────────────────────

interface ProviderRecord<T = unknown> {
  token: InjectionToken<T>;
  provider: Provider<T>;
  instance?: T;
  scope: Scope;
}

// ─── Token Utilities ─────────────────────────────────────────────────────────

/**
 * Convert an injection token to a human-readable string for error messages.
 *
 * @param {InjectionToken} token - The injection token to stringify
 * @returns {string} A descriptive string representation of the token
 */
function tokenToString(token: InjectionToken): string {
  if (typeof token === 'symbol') return token.toString();
  if (typeof token === 'string') return token;
  if (typeof token === 'function') return token.name || 'Anonymous';
  return String(token);
}

// ─── DIContainer ─────────────────────────────────────────────────────────────

/**
 * @class DIContainer
 * @classdesc Token-based dependency injection container with singleton caching,
 * lazy resolution, and circular dependency detection.
 */
export class DIContainer {
  private readonly providers = new Map<InjectionToken, ProviderRecord>();
  private readonly resolving = new Set<InjectionToken>();
  private logger?: ILogger;

  /**
   * Inject a logger into the container.
   *
   * @param {ILogger} logger - The logger instance
   */
  setLogger(logger: ILogger): void {
    this.logger = logger;
  }

  /**
   * Register a provider in the container.
   *
   * @param {Provider<T>} provider - A class, class provider, value provider, factory provider, or existing provider
   * @returns {void}
   *
   * @example
   * container.register(MyService);
   * container.register({ provide: 'TOKEN', useValue: 42 });
   */
  register<T>(provider: Provider<T>): void {
    const record = this.normalizeProvider(provider);
    this.providers.set(record.token, record as ProviderRecord);
    this.logger?.verbose?.(`Registered provider: ${tokenToString(record.token as InjectionToken)}`, 'DIContainer');
  }

  /**
   * Register a provider under an explicit token, overriding the token in the provider object.
   *
   * @param {InjectionToken<T>} token - The token to register under
   * @param {Provider<T>} provider - The provider to register
   * @returns {void}
   */
  registerWithToken<T>(token: InjectionToken<T>, provider: Provider<T>): void {
    const record = this.normalizeProvider(provider);
    record.token = token;
    this.providers.set(token as InjectionToken, record as ProviderRecord);
    this.logger?.verbose?.(`Registered provider: ${tokenToString(token as InjectionToken)}`, 'DIContainer');
  }

  /**
   * Resolve a provider by its injection token, constructing it if not yet cached.
   *
   * @param {InjectionToken<T>} token - The token to resolve
   * @returns {T} The resolved instance
   * @throws {UnknownTokenError} When no provider is registered for the token
   * @throws {CircularDependencyError} When a circular dependency is detected
   * @throws {MissingInjectionTokenError} When a constructor parameter lacks an `@Inject` token
   */
  get<T>(token: InjectionToken<T>): T {
    const record = this.providers.get(token as InjectionToken);
    if (!record) {
      throw new UnknownTokenError(tokenToString(token as InjectionToken));
    }

    // Return cached singleton
    if (record.scope === SCOPE.SINGLETON && record.instance !== undefined) {
      return record.instance as T;
    }

    // Detect circular dependency
    if (this.resolving.has(token as InjectionToken)) {
      this.logger?.error(`Circular dependency detected for token: ${tokenToString(token as InjectionToken)}`, undefined, 'DIContainer');
      throw new CircularDependencyError(tokenToString(token as InjectionToken));
    }

    this.logger?.debug?.(`Resolving provider: ${tokenToString(token as InjectionToken)}`, 'DIContainer');
    this.resolving.add(token as InjectionToken);
    try {
      const instance = this.resolve<T>(record as ProviderRecord<T>);

      // Cache singleton
      if (record.scope === SCOPE.SINGLETON) {
        record.instance = instance;
      }

      return instance;
    } finally {
      this.resolving.delete(token as InjectionToken);
    }
  }

  /**
   * Check if a token is registered in this container.
   *
   * @param {InjectionToken} token - The token to check
   * @returns {boolean} True if the token has a registered provider
   */
  has(token: InjectionToken): boolean {
    return this.providers.has(token);
  }

  /**
   * Get all registered injection tokens.
   *
   * @returns {InjectionToken[]} List of all registered tokens
   */
  getTokens(): InjectionToken[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get all provider records (for module introspection and lifecycle management).
   *
   * @returns {Map<InjectionToken, ProviderRecord>} A copy of the providers map
   */
  getProviders(): Map<InjectionToken, ProviderRecord> {
    return new Map(this.providers);
  }

  /**
   * Clear all providers and instances. Primarily used in tests.
   *
   * @returns {void}
   */
  clear(): void {
    this.providers.clear();
    this.resolving.clear();
  }

  // ─── Private Resolution Logic ────────────────────────────────────────

  /**
   * Resolve a provider record to its concrete instance.
   *
   * @param {ProviderRecord<T>} record - The provider record to resolve
   * @returns {T} The resolved value or instance
   * @throws {InvalidProviderError} If the provider configuration is invalid
   */
  private resolve<T>(record: ProviderRecord<T>): T {
    const provider = record.provider;

    // Value provider
    if (this.isValueProvider(provider)) {
      return provider.useValue;
    }

    // Factory provider
    if (this.isFactoryProvider(provider)) {
      const deps = (provider.inject ?? []).map((dep) => this.get(dep));
      return provider.useFactory(...deps) as T;
    }

    // Existing (alias) provider
    if (this.isExistingProvider(provider)) {
      return this.get(provider.useExisting) as T;
    }

    // Class provider (either { provide, useClass } or plain class)
    const targetClass = this.isClassProvider(provider)
      ? provider.useClass
      : (provider as Type<T>);

    if (typeof targetClass !== 'function') {
      throw new InvalidProviderError(provider);
    }

    return this.instantiate<T>(targetClass);
  }

  /**
   * Instantiate a class by resolving its constructor dependencies via `@Inject` metadata.
   *
   * @param {Type<T>} targetClass - The class constructor to instantiate
   * @returns {T} The newly constructed instance
   * @throws {MissingInjectionTokenError} If any constructor parameter lacks an `@Inject` token
   */
  private instantiate<T>(targetClass: Type<T>): T {
    const injections = MetadataStorage.getInjections(targetClass);
    const paramCount = targetClass.length; // Number of constructor parameters

    const args: any[] = [];
    
    // Fallback to TypeScript's emitDecoratorMetadata if available
    const paramTypes = typeof (Reflect as any).getMetadata === 'function' 
      ? (Reflect as any).getMetadata('design:paramtypes', targetClass) || [] 
      : [];

    for (let i = 0; i < paramCount; i++) {
      let token = injections.get(i);
      
      // Implicit injection fallback
      if (token === undefined) {
        if (paramTypes[i] && typeof paramTypes[i] === 'function' && paramTypes[i] !== Object) {
          token = paramTypes[i] as InjectionToken;
        } else {
          throw new MissingInjectionTokenError(targetClass.name, i);
        }
      }
      
      args.push(this.get(token));
    }

    return new targetClass(...args);
  }

  // ─── Provider Normalization ──────────────────────────────────────────

  /**
   * Normalize any accepted provider form into a `ProviderRecord`.
   *
   * @param {Provider<T>} provider - The raw provider to normalize
   * @returns {ProviderRecord<T>} The normalized record ready for storage
   * @throws {InvalidProviderError} If the provider does not match any known shape
   */
  private normalizeProvider<T>(provider: Provider<T>): ProviderRecord<T> {
    // Plain class
    if (typeof provider === 'function') {
      return {
        token: provider as Type<T>,
        provider,
        scope: SCOPE.SINGLETON,
      };
    }

    // Object provider with `provide` key
    if (typeof provider === 'object' && provider !== null && 'provide' in provider) {
      const scope: Scope =
        ('scope' in provider && typeof provider.scope === 'string'
          ? provider.scope
          : SCOPE.SINGLETON) as Scope;

      // Value provider — store instance immediately
      if (this.isValueProvider(provider)) {
        return {
          token: provider.provide,
          provider,
          instance: provider.useValue,
          scope,
        };
      }

      return {
        token: provider.provide,
        provider,
        scope,
      };
    }

    throw new InvalidProviderError(provider);
  }

  // ─── Type Guards ─────────────────────────────────────────────────────

  /**
   * Type guard: check if a provider is a ClassProvider.
   *
   * @param {Provider<T>} provider - The provider to check
   * @returns {boolean} True if the provider has a `useClass` property
   */
  private isClassProvider<T>(provider: Provider<T>): provider is ClassProvider<T> {
    return typeof provider === 'object' && 'useClass' in provider;
  }

  /**
   * Type guard: check if a provider is a ValueProvider.
   *
   * @param {Provider<T>} provider - The provider to check
   * @returns {boolean} True if the provider has a `useValue` property
   */
  private isValueProvider<T>(provider: Provider<T>): provider is ValueProvider<T> {
    return typeof provider === 'object' && 'useValue' in provider;
  }

  /**
   * Type guard: check if a provider is a FactoryProvider.
   *
   * @param {Provider<T>} provider - The provider to check
   * @returns {boolean} True if the provider has a `useFactory` property
   */
  private isFactoryProvider<T>(provider: Provider<T>): provider is FactoryProvider<T> {
    return typeof provider === 'object' && 'useFactory' in provider;
  }

  /**
   * Type guard: check if a provider is an ExistingProvider.
   *
   * @param {Provider<T>} provider - The provider to check
   * @returns {boolean} True if the provider has a `useExisting` property
   */
  private isExistingProvider<T>(provider: Provider<T>): provider is ExistingProvider<T> {
    return typeof provider === 'object' && 'useExisting' in provider;
  }
}
