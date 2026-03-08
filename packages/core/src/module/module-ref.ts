/**
 * @nemesisjs/core - ModuleRef
 *
 * Represents a loaded module with its metadata, container, and resolved providers.
 * Each module gets its own ModuleRef during the loading process.
 */

import type {
  InjectionToken,
  ModuleMetadata,
  Provider,
  Type,
} from '@nemesisjs/common';
import { DIContainer } from '../container/container.js';

export class ModuleRef {
  public readonly target: Type<any>;
  public readonly metadata: ModuleMetadata;
  public readonly container: DIContainer;
  public readonly imports: ModuleRef[] = [];
  public instance?: any;

  constructor(target: Type<any>, metadata: ModuleMetadata) {
    this.target = target;
    this.metadata = metadata;
    this.container = new DIContainer();
  }

  /**
   * Get a provider by token from this module's container.
   */
  get<T>(token: InjectionToken<T>): T {
    return this.container.get<T>(token);
  }

  /**
   * Check if this module has a provider for the given token.
   */
  has(token: InjectionToken): boolean {
    return this.container.has(token);
  }

  /**
   * Get the list of exported tokens from this module.
   */
  getExports(): Array<InjectionToken | Provider> {
    return this.metadata.exports ?? [];
  }

  /**
   * Get the list of controllers registered in this module.
   */
  getControllers(): Type<any>[] {
    return this.metadata.controllers ?? [];
  }

  /**
   * Whether this module is marked as global.
   */
  isGlobal(): boolean {
    return this.metadata.global === true;
  }
}
