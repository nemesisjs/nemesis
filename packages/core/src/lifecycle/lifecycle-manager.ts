/**
 * @nemesis-js/core - LifecycleManager
 *
 * Orchestrates lifecycle hook callbacks across all registered providers.
 * Hooks are called in order: onModuleInit → onApplicationBootstrap → (shutdown) → onApplicationShutdown.
 */

import type {
  OnApplicationBootstrap,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from '@nemesis-js/common';
import type { ModuleRef } from '../module/module-ref.js';

/** All lifecycle hook method names managed by this class */
type LifecycleHook = keyof (OnModuleInit &
  OnApplicationBootstrap &
  OnModuleDestroy &
  OnApplicationShutdown);

// ─── Type Guards ─────────────────────────────────────────────────────────────

/**
 * Type guard: check if an instance implements a given lifecycle hook method.
 *
 * @param {unknown} instance - The object to inspect
 * @param {T} hook - The lifecycle hook method name
 * @returns {boolean} True if the instance has a callable hook method
 */
function hasHook<T extends LifecycleHook>(
  instance: unknown,
  hook: T,
): instance is Record<T, () => void | Promise<void>> {
  return (
    instance !== null &&
    typeof instance === 'object' &&
    hook in instance &&
    typeof (instance as Record<string, unknown>)[hook] === 'function'
  );
}

// ─── LifecycleManager ────────────────────────────────────────────────────────

/**
 * @class LifecycleManager
 * @classdesc Calls lifecycle hooks on all registered module providers at the
 * appropriate application lifecycle stage.
 */
export class LifecycleManager {
  /**
   * Call `onModuleInit()` on all providers in all modules.
   *
   * @param {Map<Function, ModuleRef>} modules - The loaded module map
   * @returns {Promise<void>}
   */
  async callModuleInit(modules: Map<Function, ModuleRef>): Promise<void> {
    await this.callHookOnAllProviders(modules, 'onModuleInit');
  }

  /**
   * Call `onApplicationBootstrap()` on all providers in all modules.
   *
   * @param {Map<Function, ModuleRef>} modules - The loaded module map
   * @returns {Promise<void>}
   */
  async callBootstrap(modules: Map<Function, ModuleRef>): Promise<void> {
    await this.callHookOnAllProviders(modules, 'onApplicationBootstrap');
  }

  /**
   * Call `onModuleDestroy()` on all providers in all modules.
   *
   * @param {Map<Function, ModuleRef>} modules - The loaded module map
   * @returns {Promise<void>}
   */
  async callModuleDestroy(modules: Map<Function, ModuleRef>): Promise<void> {
    await this.callHookOnAllProviders(modules, 'onModuleDestroy');
  }

  /**
   * Call `onApplicationShutdown()` on all providers in all modules.
   *
   * @param {Map<Function, ModuleRef>} modules - The loaded module map
   * @param {string} [signal] - The shutdown signal (e.g., 'SIGTERM')
   * @returns {Promise<void>}
   */
  async callShutdown(modules: Map<Function, ModuleRef>, signal?: string): Promise<void> {
    await this.callHookOnAllProviders(modules, 'onApplicationShutdown', signal);
  }

  // ─── Private ─────────────────────────────────────────────────────────

  /**
   * Iterate over all providers in all modules and call the given hook if implemented.
   *
   * @param {Map<Function, ModuleRef>} modules - The loaded module map
   * @param {LifecycleHook} hook - The lifecycle hook method name to call
   * @param {...unknown} args - Additional arguments to pass to the hook (e.g., signal)
   * @returns {Promise<void>}
   */
  private async callHookOnAllProviders(
    modules: Map<Function, ModuleRef>,
    hook: LifecycleHook,
    ...args: unknown[]
  ): Promise<void> {
    for (const [, moduleRef] of modules) {
      const tokens = moduleRef.container.getTokens();

      for (const token of tokens) {
        try {
          const instance = moduleRef.container.get(token);

          if (hasHook(instance, hook)) {
            if (args.length > 0) {
              // onApplicationShutdown takes an optional signal string
              const signal = typeof args[0] === 'string' ? args[0] : undefined;
              (instance as Record<string, (s?: string) => void | Promise<void>>)[hook](signal);
            } else {
              await instance[hook]();
            }
          }
        } catch {
          // Silently skip providers that are not resolvable or that fail during
          // lifecycle hook execution. This can happen for symbol tokens or
          // providers whose dependencies were already torn down.
        }
      }
    }
  }
}
