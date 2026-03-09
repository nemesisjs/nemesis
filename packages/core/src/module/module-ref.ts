/**
 * @nemesis-js/core - ModuleRef
 *
 * Represents a loaded module with its metadata, container, and resolved providers.
 * Each module gets its own ModuleRef during the loading process.
 */

import type {
  InjectionToken,
  ModuleMetadata,
  Provider,
  Type,
} from '@nemesis-js/common';
import { DIContainer } from '../container/container.js';

/**
 * @class ModuleRef
 * @classdesc Holds a module's metadata, its private DI container,
 * and references to the modules it imports.
 */
export class ModuleRef {
  /** The module class decorated with `@Module` */
  public readonly target: Type<unknown>;

  /** The module's configuration metadata */
  public readonly metadata: ModuleMetadata;

  /** The module's own DI container */
  public readonly container: DIContainer;

  /** Imported module references (populated during loading) */
  public readonly imports: ModuleRef[] = [];

  /** The instantiated module class (if applicable) */
  public instance?: unknown;

  /**
   * @param {Type<unknown>} target - The module class
   * @param {ModuleMetadata} metadata - The module configuration
   */
  constructor(target: Type<unknown>, metadata: ModuleMetadata) {
    this.target = target;
    this.metadata = metadata;
    this.container = new DIContainer();
  }

  /**
   * Get a provider by token from this module's container.
   *
   * @param {InjectionToken<T>} token - The injection token to resolve
   * @returns {T} The resolved instance
   * @throws {UnknownTokenError} When no provider is found for the token
   */
  get<T>(token: InjectionToken<T>): T {
    return this.container.get<T>(token);
  }

  /**
   * Check if this module has a provider for the given token.
   *
   * @param {InjectionToken} token - The injection token to check
   * @returns {boolean} True if the token is registered
   */
  has(token: InjectionToken): boolean {
    return this.container.has(token);
  }

  /**
   * Get the list of exported tokens and providers from this module.
   *
   * @returns {Array<InjectionToken | Provider>} The module's exports
   */
  getExports(): Array<InjectionToken | Provider> {
    return this.metadata.exports ?? [];
  }

  /**
   * Get the list of controller classes registered in this module.
   *
   * @returns {Type<unknown>[]} Array of controller classes
   */
  getControllers(): Type<unknown>[] {
    return this.metadata.controllers ?? [];
  }

  /**
   * Whether this module is marked as global (providers available to all modules).
   *
   * @returns {boolean} True if the module is global
   */
  isGlobal(): boolean {
    return this.metadata.global === true;
  }
}
