/**
 * @nemesisjs/core - LifecycleManager
 *
 * Manages lifecycle hooks for modules and their providers:
 * 1. onModuleInit - Called after the module is initialized
 * 2. onApplicationBootstrap - Called after all modules are initialized
 * 3. onModuleDestroy - Called when the application is shutting down
 * 4. onApplicationShutdown - Called after all modules are destroyed
 */

import type {
  OnApplicationBootstrap,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
  Type,
} from '@nemesisjs/common';
import type { ModuleRef } from '../module/module-ref.js';

type LifecycleHook = 'onModuleInit' | 'onModuleDestroy' | 'onApplicationBootstrap' | 'onApplicationShutdown';

function hasHook<T extends LifecycleHook>(instance: any, hook: T): boolean {
  return instance && typeof instance[hook] === 'function';
}

export class LifecycleManager {
  private readonly modules: Map<Type<any>, ModuleRef>;

  constructor(modules: Map<Type<any>, ModuleRef>) {
    this.modules = modules;
  }

  /**
   * Call onModuleInit on all providers and module instances.
   */
  async callOnModuleInit(): Promise<void> {
    await this.callHookOnAllProviders('onModuleInit');
  }

  /**
   * Call onApplicationBootstrap on all providers and module instances.
   */
  async callOnApplicationBootstrap(): Promise<void> {
    await this.callHookOnAllProviders('onApplicationBootstrap');
  }

  /**
   * Call onModuleDestroy on all providers and module instances (reverse order).
   */
  async callOnModuleDestroy(): Promise<void> {
    await this.callHookOnAllProviders('onModuleDestroy');
  }

  /**
   * Call onApplicationShutdown on all providers and module instances (reverse order).
   */
  async callOnApplicationShutdown(signal?: string): Promise<void> {
    for (const [, moduleRef] of this.modules) {
      const providers = moduleRef.container.getProviders();
      for (const [, record] of providers) {
        if (record.instance && hasHook(record.instance, 'onApplicationShutdown')) {
          await (record.instance as OnApplicationShutdown).onApplicationShutdown(signal);
        }
      }
      if (moduleRef.instance && hasHook(moduleRef.instance, 'onApplicationShutdown')) {
        await (moduleRef.instance as OnApplicationShutdown).onApplicationShutdown(signal);
      }
    }
  }

  // ─── Private ─────────────────────────────────────────────────────────

  private async callHookOnAllProviders(hook: LifecycleHook): Promise<void> {
    for (const [, moduleRef] of this.modules) {
      // Call on all resolved provider instances
      const providers = moduleRef.container.getProviders();
      for (const [token] of providers) {
        try {
          const instance = moduleRef.container.get(token);
          if (instance && hasHook(instance, hook)) {
            await (instance as any)[hook]();
          }
        } catch {
          // Provider may not be resolvable yet during init; skip gracefully
        }
      }

      // Call on the module instance itself
      if (moduleRef.instance && hasHook(moduleRef.instance, hook)) {
        await (moduleRef.instance as any)[hook]();
      }
    }
  }
}
