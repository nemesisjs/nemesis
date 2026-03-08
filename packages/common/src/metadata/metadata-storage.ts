/**
 * @nemesisjs/common - MetadataStorage
 *
 * Central metadata store that replaces reflect-metadata.
 * Uses WeakMaps for class-level metadata and Maps for method/parameter metadata.
 * This is the backbone of the decorator system — all decorators write here,
 * and the DI container / HTTP layer reads from here.
 *
 * No `emitDecoratorMetadata` required.
 */

import type {
  CanActivate,
  ControllerMetadata,
  InjectableOptions,
  InjectionToken,
  ModuleMetadata,
  NemesisInterceptor,
  PipeTransform,
  RouteMetadata,
  RouteParamMetadata,
  Type,
} from '../interfaces/index.js';

// ─── Internal Storage Types ──────────────────────────────────────────────────

interface MethodMetadataMap {
  routes: Map<string | symbol, RouteMetadata>;
  params: Map<string | symbol, RouteParamMetadata[]>;
  guards: Map<string | symbol, Type<CanActivate>[]>;
  pipes: Map<string | symbol, Type<PipeTransform>[]>;
  interceptors: Map<string | symbol, Type<NemesisInterceptor>[]>;
}

// ─── MetadataStorage Singleton ───────────────────────────────────────────────

class MetadataStorageImpl {
  /** Injectable class metadata (scope, etc.) */
  private injectables = new WeakMap<Type<unknown>, InjectableOptions>();

  /** Constructor parameter injection tokens: class -> [paramIndex -> token] */
  private injections = new WeakMap<Type<unknown>, Map<number, InjectionToken>>();

  /** Module metadata */
  private modules = new WeakMap<Type<unknown>, ModuleMetadata>();

  /** Controller metadata (route prefix) */
  private controllers = new WeakMap<Type<unknown>, ControllerMetadata>();

  /** Method-level metadata for controllers */
  private methodMetadata = new WeakMap<Type<unknown>, MethodMetadataMap>();

  /** Class-level guards */
  private classGuards = new WeakMap<Type<unknown>, Type<CanActivate>[]>();

  /** Class-level pipes */
  private classPipes = new WeakMap<Type<unknown>, Type<PipeTransform>[]>();

  /** Class-level interceptors */
  private classInterceptors = new WeakMap<Type<unknown>, Type<NemesisInterceptor>[]>();

  // ─── Injectable ──────────────────────────────────────────────────────

  /**
   * Mark a class as injectable with the given options.
   *
   * @param {Type<unknown>} target - The class constructor to mark
   * @param {InjectableOptions} options - Scope and other DI options
   * @returns {void}
   */
  setInjectable(target: Type<unknown>, options: InjectableOptions = {}): void {
    this.injectables.set(target, options);
  }

  /**
   * Get the injectable options for a class.
   *
   * @param {Type<unknown>} target - The class constructor
   * @returns {InjectableOptions | undefined} The options, or undefined if not injectable
   */
  getInjectable(target: Type<unknown>): InjectableOptions | undefined {
    return this.injectables.get(target);
  }

  /**
   * Check if a class is marked as injectable.
   *
   * @param {Type<unknown>} target - The class constructor
   * @returns {boolean} True if the class is injectable
   */
  isInjectable(target: Type<unknown>): boolean {
    return this.injectables.has(target);
  }

  // ─── Constructor Injection ───────────────────────────────────────────

  /**
   * Store the injection token for a constructor parameter.
   *
   * @param {Type<unknown>} target - The class constructor
   * @param {number} paramIndex - The zero-based parameter index
   * @param {InjectionToken} token - The injection token to use
   * @returns {void}
   */
  setInjection(target: Type<unknown>, paramIndex: number, token: InjectionToken): void {
    let params = this.injections.get(target);
    if (!params) {
      params = new Map();
      this.injections.set(target, params);
    }
    params.set(paramIndex, token);
  }

  /**
   * Get all injection tokens for a class's constructor parameters.
   *
   * @param {Type<unknown>} target - The class constructor
   * @returns {Map<number, InjectionToken>} Map of parameter index to injection token
   */
  getInjections(target: Type<unknown>): Map<number, InjectionToken> {
    return this.injections.get(target) ?? new Map();
  }

  // ─── Module ──────────────────────────────────────────────────────────

  /**
   * Store module metadata for a class decorated with `@Module`.
   *
   * @param {Type<unknown>} target - The module class
   * @param {ModuleMetadata} metadata - The module configuration
   * @returns {void}
   */
  setModule(target: Type<unknown>, metadata: ModuleMetadata): void {
    this.modules.set(target, metadata);
  }

  /**
   * Get the module metadata for a class.
   *
   * @param {Type<unknown>} target - The module class
   * @returns {ModuleMetadata | undefined} The metadata, or undefined if not a module
   */
  getModule(target: Type<unknown>): ModuleMetadata | undefined {
    return this.modules.get(target);
  }

  /**
   * Check if a class is decorated with `@Module`.
   *
   * @param {Type<unknown>} target - The class to check
   * @returns {boolean} True if the class is a module
   */
  isModule(target: Type<unknown>): boolean {
    return this.modules.has(target);
  }

  // ─── Controller ──────────────────────────────────────────────────────

  /**
   * Store controller metadata for a class decorated with `@Controller`.
   *
   * @param {Type<unknown>} target - The controller class
   * @param {ControllerMetadata} metadata - The controller configuration
   * @returns {void}
   */
  setController(target: Type<unknown>, metadata: ControllerMetadata): void {
    this.controllers.set(target, metadata);
  }

  /**
   * Get the controller metadata for a class.
   *
   * @param {Type<unknown>} target - The controller class
   * @returns {ControllerMetadata | undefined} The metadata, or undefined if not a controller
   */
  getController(target: Type<unknown>): ControllerMetadata | undefined {
    return this.controllers.get(target);
  }

  /**
   * Check if a class is decorated with `@Controller`.
   *
   * @param {Type<unknown>} target - The class to check
   * @returns {boolean} True if the class is a controller
   */
  isController(target: Type<unknown>): boolean {
    return this.controllers.has(target);
  }

  // ─── Method Metadata (Routes, Params, Guards, etc.) ──────────────────

  /**
   * Ensure a MethodMetadataMap entry exists for a target and return it.
   *
   * @param {Type<unknown>} target - The controller class
   * @returns {MethodMetadataMap} The existing or newly created metadata map
   */
  private ensureMethodMetadata(target: Type<unknown>): MethodMetadataMap {
    let metadata = this.methodMetadata.get(target);
    if (!metadata) {
      metadata = {
        routes: new Map(),
        params: new Map(),
        guards: new Map(),
        pipes: new Map(),
        interceptors: new Map(),
      };
      this.methodMetadata.set(target, metadata);
    }
    return metadata;
  }

  // ─── Routes ──────────────────────────────────────────────────────────

  /**
   * Register a route handler metadata entry for a controller method.
   *
   * @param {Type<unknown>} target - The controller class
   * @param {string | symbol} propertyKey - The method name
   * @param {RouteMetadata} metadata - The route configuration
   * @returns {void}
   */
  setRoute(target: Type<unknown>, propertyKey: string | symbol, metadata: RouteMetadata): void {
    const methodMeta = this.ensureMethodMetadata(target);
    methodMeta.routes.set(propertyKey, metadata);
  }

  /**
   * Get all routes registered for a controller class.
   *
   * @param {Type<unknown>} target - The controller class
   * @returns {Map<string | symbol, RouteMetadata>} Map of method name to route metadata
   */
  getRoutes(target: Type<unknown>): Map<string | symbol, RouteMetadata> {
    return this.methodMetadata.get(target)?.routes ?? new Map();
  }

  // ─── Route Parameters ────────────────────────────────────────────────

  /**
   * Register a parameter decorator for a controller method parameter.
   *
   * @param {Type<unknown>} target - The controller class
   * @param {string | symbol} propertyKey - The method name
   * @param {RouteParamMetadata} param - The parameter configuration
   * @returns {void}
   */
  setRouteParam(
    target: Type<unknown>,
    propertyKey: string | symbol,
    param: RouteParamMetadata,
  ): void {
    const methodMeta = this.ensureMethodMetadata(target);
    let params = methodMeta.params.get(propertyKey);
    if (!params) {
      params = [];
      methodMeta.params.set(propertyKey, params);
    }
    params.push(param);
  }

  /**
   * Get all parameter decorators for a controller method.
   *
   * @param {Type<unknown>} target - The controller class
   * @param {string | symbol} propertyKey - The method name
   * @returns {RouteParamMetadata[]} Array of parameter configurations
   */
  getRouteParams(target: Type<unknown>, propertyKey: string | symbol): RouteParamMetadata[] {
    return this.methodMetadata.get(target)?.params.get(propertyKey) ?? [];
  }

  // ─── Guards ──────────────────────────────────────────────────────────

  /**
   * Register method-level guards for a specific route handler.
   *
   * @param {Type<unknown>} target - The controller class
   * @param {string | symbol} propertyKey - The method name
   * @param {Type<CanActivate>[]} guards - Guard classes to register
   * @returns {void}
   */
  setMethodGuards(
    target: Type<unknown>,
    propertyKey: string | symbol,
    guards: Type<CanActivate>[],
  ): void {
    const methodMeta = this.ensureMethodMetadata(target);
    methodMeta.guards.set(propertyKey, guards);
  }

  /**
   * Get method-level guards for a specific route handler.
   *
   * @param {Type<unknown>} target - The controller class
   * @param {string | symbol} propertyKey - The method name
   * @returns {Type<CanActivate>[]} Array of registered guard classes
   */
  getMethodGuards(target: Type<unknown>, propertyKey: string | symbol): Type<CanActivate>[] {
    return this.methodMetadata.get(target)?.guards.get(propertyKey) ?? [];
  }

  /**
   * Register class-level guards that apply to all routes in a controller.
   *
   * @param {Type<unknown>} target - The controller class
   * @param {Type<CanActivate>[]} guards - Guard classes to register
   * @returns {void}
   */
  setClassGuards(target: Type<unknown>, guards: Type<CanActivate>[]): void {
    this.classGuards.set(target, guards);
  }

  /**
   * Get class-level guards for a controller.
   *
   * @param {Type<unknown>} target - The controller class
   * @returns {Type<CanActivate>[]} Array of registered guard classes
   */
  getClassGuards(target: Type<unknown>): Type<CanActivate>[] {
    return this.classGuards.get(target) ?? [];
  }

  // ─── Pipes ───────────────────────────────────────────────────────────

  /**
   * Register method-level pipes for a specific route handler.
   *
   * @param {Type<unknown>} target - The controller class
   * @param {string | symbol} propertyKey - The method name
   * @param {Type<PipeTransform>[]} pipes - Pipe classes to register
   * @returns {void}
   */
  setMethodPipes(
    target: Type<unknown>,
    propertyKey: string | symbol,
    pipes: Type<PipeTransform>[],
  ): void {
    const methodMeta = this.ensureMethodMetadata(target);
    methodMeta.pipes.set(propertyKey, pipes);
  }

  /**
   * Get method-level pipes for a specific route handler.
   *
   * @param {Type<unknown>} target - The controller class
   * @param {string | symbol} propertyKey - The method name
   * @returns {Type<PipeTransform>[]} Array of registered pipe classes
   */
  getMethodPipes(target: Type<unknown>, propertyKey: string | symbol): Type<PipeTransform>[] {
    return this.methodMetadata.get(target)?.pipes.get(propertyKey) ?? [];
  }

  /**
   * Register class-level pipes that apply to all routes in a controller.
   *
   * @param {Type<unknown>} target - The controller class
   * @param {Type<PipeTransform>[]} pipes - Pipe classes to register
   * @returns {void}
   */
  setClassPipes(target: Type<unknown>, pipes: Type<PipeTransform>[]): void {
    this.classPipes.set(target, pipes);
  }

  /**
   * Get class-level pipes for a controller.
   *
   * @param {Type<unknown>} target - The controller class
   * @returns {Type<PipeTransform>[]} Array of registered pipe classes
   */
  getClassPipes(target: Type<unknown>): Type<PipeTransform>[] {
    return this.classPipes.get(target) ?? [];
  }

  // ─── Interceptors ────────────────────────────────────────────────────

  /**
   * Register method-level interceptors for a specific route handler.
   *
   * @param {Type<unknown>} target - The controller class
   * @param {string | symbol} propertyKey - The method name
   * @param {Type<NemesisInterceptor>[]} interceptors - Interceptor classes to register
   * @returns {void}
   */
  setMethodInterceptors(
    target: Type<unknown>,
    propertyKey: string | symbol,
    interceptors: Type<NemesisInterceptor>[],
  ): void {
    const methodMeta = this.ensureMethodMetadata(target);
    methodMeta.interceptors.set(propertyKey, interceptors);
  }

  /**
   * Get method-level interceptors for a specific route handler.
   *
   * @param {Type<unknown>} target - The controller class
   * @param {string | symbol} propertyKey - The method name
   * @returns {Type<NemesisInterceptor>[]} Array of registered interceptor classes
   */
  getMethodInterceptors(
    target: Type<unknown>,
    propertyKey: string | symbol,
  ): Type<NemesisInterceptor>[] {
    return this.methodMetadata.get(target)?.interceptors.get(propertyKey) ?? [];
  }

  /**
   * Register class-level interceptors that apply to all routes in a controller.
   *
   * @param {Type<unknown>} target - The controller class
   * @param {Type<NemesisInterceptor>[]} interceptors - Interceptor classes to register
   * @returns {void}
   */
  setClassInterceptors(target: Type<unknown>, interceptors: Type<NemesisInterceptor>[]): void {
    this.classInterceptors.set(target, interceptors);
  }

  /**
   * Get class-level interceptors for a controller.
   *
   * @param {Type<unknown>} target - The controller class
   * @returns {Type<NemesisInterceptor>[]} Array of registered interceptor classes
   */
  getClassInterceptors(target: Type<unknown>): Type<NemesisInterceptor>[] {
    return this.classInterceptors.get(target) ?? [];
  }

  // ─── Clear (for testing) ─────────────────────────────────────────────

  /**
   * Reset all stored metadata. Primarily used between tests to prevent
   * metadata from leaking across test cases.
   *
   * @returns {void}
   */
  clear(): void {
    this.injectables = new WeakMap();
    this.injections = new WeakMap();
    this.modules = new WeakMap();
    this.controllers = new WeakMap();
    this.methodMetadata = new WeakMap();
    this.classGuards = new WeakMap();
    this.classPipes = new WeakMap();
    this.classInterceptors = new WeakMap();
  }
}

/** Global singleton metadata storage */
export const MetadataStorage = new MetadataStorageImpl();
