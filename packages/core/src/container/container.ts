/**
 * @nemesisjs/core - DIContainer
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
} from '@nemesisjs/common';
import {
  CircularDependencyError,
  InvalidProviderError,
  MissingInjectionTokenError,
  UnknownTokenError,
} from '../errors/index.js';

// ─── Provider Record ─────────────────────────────────────────────────────────

interface ProviderRecord<T = any> {
  token: InjectionToken<T>;
  provider: Provider<T>;
  instance?: T;
  scope: string;
}

// ─── Token Utilities ─────────────────────────────────────────────────────────

function tokenToString(token: InjectionToken): string {
  if (typeof token === 'symbol') return token.toString();
  if (typeof token === 'string') return token;
  if (typeof token === 'function') return token.name || 'Anonymous';
  return String(token);
}

// ─── DIContainer ─────────────────────────────────────────────────────────────

export class DIContainer {
  private readonly providers = new Map<InjectionToken, ProviderRecord>();
  private readonly resolving = new Set<InjectionToken>();

  /**
   * Register a provider in the container.
   */
  register<T>(provider: Provider<T>): void {
    const record = this.normalizeProvider(provider);
    this.providers.set(record.token, record);
  }

  /**
   * Register a provider with an explicit token.
   */
  registerWithToken<T>(token: InjectionToken<T>, provider: Provider<T>): void {
    const record = this.normalizeProvider(provider);
    record.token = token;
    this.providers.set(token, record);
  }

  /**
   * Resolve a provider by its injection token.
   */
  get<T>(token: InjectionToken<T>): T {
    const record = this.providers.get(token);
    if (!record) {
      throw new UnknownTokenError(tokenToString(token));
    }

    // Return cached singleton
    if (record.scope === SCOPE.SINGLETON && record.instance !== undefined) {
      return record.instance as T;
    }

    // Detect circular dependency
    if (this.resolving.has(token)) {
      throw new CircularDependencyError(tokenToString(token));
    }

    this.resolving.add(token);
    try {
      const instance = this.resolve<T>(record);

      // Cache singleton
      if (record.scope === SCOPE.SINGLETON) {
        record.instance = instance;
      }

      return instance;
    } finally {
      this.resolving.delete(token);
    }
  }

  /**
   * Check if a token is registered.
   */
  has(token: InjectionToken): boolean {
    return this.providers.has(token);
  }

  /**
   * Get all registered tokens.
   */
  getTokens(): InjectionToken[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get all provider records (for module introspection).
   */
  getProviders(): Map<InjectionToken, ProviderRecord> {
    return new Map(this.providers);
  }

  /**
   * Clear all providers and instances.
   */
  clear(): void {
    this.providers.clear();
    this.resolving.clear();
  }

  // ─── Private Resolution Logic ────────────────────────────────────────

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

    // Class provider
    const targetClass = this.isClassProvider(provider) ? provider.useClass : (provider as Type<T>);

    if (typeof targetClass !== 'function') {
      throw new InvalidProviderError(provider);
    }

    return this.instantiate<T>(targetClass);
  }

  /**
   * Instantiate a class by resolving its constructor dependencies via @Inject metadata.
   */
  private instantiate<T>(targetClass: Type<T>): T {
    const injections = MetadataStorage.getInjections(targetClass);
    const paramCount = targetClass.length; // Number of constructor parameters

    const args: any[] = [];
    for (let i = 0; i < paramCount; i++) {
      const token = injections.get(i);
      if (token === undefined) {
        throw new MissingInjectionTokenError(targetClass.name, i);
      }
      args.push(this.get(token));
    }

    return new targetClass(...args);
  }

  // ─── Provider Normalization ──────────────────────────────────────────

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
      const scope = ('scope' in provider && provider.scope) || SCOPE.SINGLETON;

      // Value provider - store instance immediately
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

  private isClassProvider<T>(provider: Provider<T>): provider is ClassProvider<T> {
    return typeof provider === 'object' && 'useClass' in provider;
  }

  private isValueProvider<T>(provider: Provider<T>): provider is ValueProvider<T> {
    return typeof provider === 'object' && 'useValue' in provider;
  }

  private isFactoryProvider<T>(provider: Provider<T>): provider is FactoryProvider<T> {
    return typeof provider === 'object' && 'useFactory' in provider;
  }

  private isExistingProvider<T>(provider: Provider<T>): provider is ExistingProvider<T> {
    return typeof provider === 'object' && 'useExisting' in provider;
  }
}
