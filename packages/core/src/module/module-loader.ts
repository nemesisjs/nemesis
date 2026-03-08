/**
 * @nemesisjs/core - ModuleLoader
 *
 * Scans the module tree starting from the root module, resolves the dependency graph,
 * and registers all providers in their respective containers.
 * Handles global modules, exported providers, and imported module resolution.
 */

import {
  MetadataStorage,
  type DynamicModule,
  type InjectionToken,
  type ModuleMetadata,
  type Provider,
  type Type,
} from '@nemesisjs/common';
import { ModuleNotFoundError } from '../errors/index.js';
import { ModuleRef } from './module-ref.js';

/**
 * @class ModuleLoader
 * @classdesc Walks the module graph from the root, registers all providers into
 * their per-module containers, and resolves cross-module imports.
 */
export class ModuleLoader {
  private readonly modules = new Map<Type<unknown>, ModuleRef>();
  private readonly globalModules = new Set<ModuleRef>();

  /**
   * Load the entire module tree starting from the root module.
   * Returns a map of all loaded module references keyed by their class.
   *
   * @param {Type<unknown>} rootModule - The root module class decorated with `@Module`
   * @returns {Promise<Map<Type<unknown>, ModuleRef>>} Map of all loaded modules
   * @throws {ModuleNotFoundError} When a class is not decorated with `@Module`
   */
  async load(rootModule: Type<unknown>): Promise<Map<Type<unknown>, ModuleRef>> {
    await this.scanModule(rootModule);
    this.resolveImports();
    this.registerProviders();
    return this.modules;
  }

  /**
   * Get a loaded module reference by its class.
   *
   * @param {Type<unknown>} target - The module class
   * @returns {ModuleRef | undefined} The module reference, or undefined if not loaded
   */
  getModule(target: Type<unknown>): ModuleRef | undefined {
    return this.modules.get(target);
  }

  /**
   * Get all loaded module references.
   *
   * @returns {Map<Type<unknown>, ModuleRef>} Map of all loaded modules
   */
  getModules(): Map<Type<unknown>, ModuleRef> {
    return this.modules;
  }

  /**
   * Get all modules marked as global.
   *
   * @returns {Set<ModuleRef>} Set of global module references
   */
  getGlobalModules(): Set<ModuleRef> {
    return this.globalModules;
  }

  // ─── Private: Module Scanning ────────────────────────────────────────

  /**
   * Recursively scan a module and all its imports.
   *
   * @param {Type<unknown> | DynamicModule} target - The module class or dynamic module object
   * @returns {Promise<ModuleRef>} The module reference for the scanned module
   * @throws {ModuleNotFoundError} When the class is not decorated with `@Module`
   */
  private async scanModule(target: Type<unknown> | DynamicModule): Promise<ModuleRef> {
    // Handle dynamic modules
    let moduleClass: Type<unknown>;
    let metadata: ModuleMetadata;

    if (this.isDynamicModule(target)) {
      moduleClass = target.module;
      metadata = {
        imports: target.imports,
        controllers: target.controllers,
        providers: target.providers,
        exports: target.exports,
        global: target.global,
      };
    } else {
      moduleClass = target;
      const storedMeta = MetadataStorage.getModule(moduleClass);
      if (!storedMeta) {
        throw new ModuleNotFoundError(moduleClass.name);
      }
      metadata = storedMeta;
    }

    // Skip if already scanned
    if (this.modules.has(moduleClass)) {
      const existing = this.modules.get(moduleClass);
      if (existing === undefined) {
        throw new ModuleNotFoundError(moduleClass.name);
      }
      return existing;
    }

    const moduleRef = new ModuleRef(moduleClass, metadata);
    this.modules.set(moduleClass, moduleRef);

    // Track global modules
    if (metadata.global) {
      this.globalModules.add(moduleRef);
    }

    // Recursively scan imported modules
    const imports = metadata.imports ?? [];
    for (const importedModule of imports) {
      const importedRef = await this.scanModule(
        importedModule as Type<unknown> | DynamicModule,
      );
      moduleRef.imports.push(importedRef);
    }

    return moduleRef;
  }

  // ─── Private: Import Resolution ──────────────────────────────────────

  /**
   * For each module, make exported providers from imported modules
   * available in the importing module's container.
   *
   * @returns {void}
   */
  private resolveImports(): void {
    for (const [, moduleRef] of this.modules) {
      // Import providers from imported modules
      for (const importedRef of moduleRef.imports) {
        this.importExportedProviders(moduleRef, importedRef);
      }

      // Import providers from global modules
      for (const globalRef of this.globalModules) {
        if (globalRef !== moduleRef) {
          this.importExportedProviders(moduleRef, globalRef);
        }
      }
    }
  }

  /**
   * Copy exported providers from a source module into a target module's container.
   *
   * @param {ModuleRef} targetModule - The module that needs the providers
   * @param {ModuleRef} sourceModule - The module that exports the providers
   * @returns {void}
   */
  private importExportedProviders(targetModule: ModuleRef, sourceModule: ModuleRef): void {
    const exports = sourceModule.getExports();

    for (const exported of exports) {
      if (this.isProvider(exported)) {
        // Re-register the provider in the target module
        targetModule.container.register(exported as Provider);
      } else {
        // It's a token — look up the provider in the source and register in target
        const token = exported as InjectionToken;
        if (sourceModule.container.has(token)) {
          // Register as a factory provider that delegates to the source container
          targetModule.container.registerWithToken(token, {
            provide: token,
            useFactory: () => sourceModule.container.get(token),
          });
        }
      }
    }
  }

  // ─── Private: Provider Registration ──────────────────────────────────

  /**
   * Register all providers declared in each module into their containers.
   * Controllers are also registered since they require DI.
   *
   * @returns {void}
   */
  private registerProviders(): void {
    for (const [, moduleRef] of this.modules) {
      const providers = moduleRef.metadata.providers ?? [];
      for (const provider of providers) {
        moduleRef.container.register(provider);
      }

      // Register controllers as providers too (they need DI)
      const controllers = moduleRef.metadata.controllers ?? [];
      for (const controller of controllers) {
        moduleRef.container.register(controller);
      }
    }
  }

  // ─── Type Guards ─────────────────────────────────────────────────────

  /**
   * Type guard: check if a value is a DynamicModule object.
   *
   * @param {unknown} target - The value to check
   * @returns {boolean} True if the value has a `module` property
   */
  private isDynamicModule(target: unknown): target is DynamicModule {
    return target !== null && typeof target === 'object' && 'module' in target;
  }

  /**
   * Type guard: check if a value is a Provider (class or object with `provide`).
   *
   * @param {unknown} value - The value to check
   * @returns {boolean} True if the value is a valid provider
   */
  private isProvider(value: unknown): value is Provider {
    if (typeof value === 'function') return true;
    if (typeof value === 'object' && value !== null && 'provide' in value) return true;
    return false;
  }
}
