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

export class ModuleLoader {
  private readonly modules = new Map<Type<any>, ModuleRef>();
  private readonly globalModules = new Set<ModuleRef>();

  /**
   * Load the entire module tree starting from the root module.
   * Returns a map of all loaded modules.
   */
  async load(rootModule: Type<any>): Promise<Map<Type<any>, ModuleRef>> {
    await this.scanModule(rootModule);
    this.resolveImports();
    this.registerProviders();
    return this.modules;
  }

  /**
   * Get a loaded module by its class.
   */
  getModule(target: Type<any>): ModuleRef | undefined {
    return this.modules.get(target);
  }

  /**
   * Get all loaded modules.
   */
  getModules(): Map<Type<any>, ModuleRef> {
    return this.modules;
  }

  /**
   * Get all global modules.
   */
  getGlobalModules(): Set<ModuleRef> {
    return this.globalModules;
  }

  // ─── Private: Module Scanning ────────────────────────────────────────

  private async scanModule(target: Type<any> | DynamicModule): Promise<ModuleRef> {
    // Handle dynamic modules
    let moduleClass: Type<any>;
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
      return this.modules.get(moduleClass)!;
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
      const importedRef = await this.scanModule(importedModule as Type<any> | DynamicModule);
      moduleRef.imports.push(importedRef);
    }

    return moduleRef;
  }

  // ─── Private: Import Resolution ──────────────────────────────────────

  /**
   * For each module, make exported providers from imported modules
   * available in the importing module's container.
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

  private importExportedProviders(targetModule: ModuleRef, sourceModule: ModuleRef): void {
    const exports = sourceModule.getExports();

    for (const exported of exports) {
      if (this.isProvider(exported)) {
        // Re-register the provider in the target module
        targetModule.container.register(exported);
      } else {
        // It's a token — look up the provider in the source and register in target
        const token = exported as InjectionToken;
        if (sourceModule.container.has(token)) {
          // Register as a value provider pointing to the resolved instance
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

  private isDynamicModule(target: any): target is DynamicModule {
    return target && typeof target === 'object' && 'module' in target;
  }

  private isProvider(value: any): value is Provider {
    if (typeof value === 'function') return true;
    if (typeof value === 'object' && value !== null && 'provide' in value) return true;
    return false;
  }
}
