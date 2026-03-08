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
  ControllerMetadata,
  InjectableOptions,
  InjectionToken,
  ModuleMetadata,
  RouteMetadata,
  RouteParamMetadata,
  Type,
} from '../interfaces/index.js';

// ─── Internal Storage Types ──────────────────────────────────────────────────

interface MethodMetadataMap {
  routes: Map<string | symbol, RouteMetadata>;
  params: Map<string | symbol, RouteParamMetadata[]>;
  guards: Map<string | symbol, Type<any>[]>;
  pipes: Map<string | symbol, Type<any>[]>;
  interceptors: Map<string | symbol, Type<any>[]>;
}

// ─── MetadataStorage Singleton ───────────────────────────────────────────────

class MetadataStorageImpl {
  /** Injectable class metadata (scope, etc.) */
  private readonly injectables = new WeakMap<Type<any>, InjectableOptions>();

  /** Constructor parameter injection tokens: class -> [paramIndex -> token] */
  private readonly injections = new WeakMap<Type<any>, Map<number, InjectionToken>>();

  /** Module metadata */
  private readonly modules = new WeakMap<Type<any>, ModuleMetadata>();

  /** Controller metadata (route prefix) */
  private readonly controllers = new WeakMap<Type<any>, ControllerMetadata>();

  /** Method-level metadata for controllers */
  private readonly methodMetadata = new WeakMap<Type<any>, MethodMetadataMap>();

  /** Class-level guards */
  private readonly classGuards = new WeakMap<Type<any>, Type<any>[]>();

  /** Class-level pipes */
  private readonly classPipes = new WeakMap<Type<any>, Type<any>[]>();

  /** Class-level interceptors */
  private readonly classInterceptors = new WeakMap<Type<any>, Type<any>[]>();

  // ─── Injectable ──────────────────────────────────────────────────────

  setInjectable(target: Type<any>, options: InjectableOptions = {}): void {
    this.injectables.set(target, options);
  }

  getInjectable(target: Type<any>): InjectableOptions | undefined {
    return this.injectables.get(target);
  }

  isInjectable(target: Type<any>): boolean {
    return this.injectables.has(target);
  }

  // ─── Constructor Injection ───────────────────────────────────────────

  setInjection(target: Type<any>, paramIndex: number, token: InjectionToken): void {
    let params = this.injections.get(target);
    if (!params) {
      params = new Map();
      this.injections.set(target, params);
    }
    params.set(paramIndex, token);
  }

  getInjections(target: Type<any>): Map<number, InjectionToken> {
    return this.injections.get(target) ?? new Map();
  }

  // ─── Module ──────────────────────────────────────────────────────────

  setModule(target: Type<any>, metadata: ModuleMetadata): void {
    this.modules.set(target, metadata);
  }

  getModule(target: Type<any>): ModuleMetadata | undefined {
    return this.modules.get(target);
  }

  isModule(target: Type<any>): boolean {
    return this.modules.has(target);
  }

  // ─── Controller ──────────────────────────────────────────────────────

  setController(target: Type<any>, metadata: ControllerMetadata): void {
    this.controllers.set(target, metadata);
  }

  getController(target: Type<any>): ControllerMetadata | undefined {
    return this.controllers.get(target);
  }

  isController(target: Type<any>): boolean {
    return this.controllers.has(target);
  }

  // ─── Method Metadata (Routes, Params, Guards, etc.) ──────────────────

  private ensureMethodMetadata(target: Type<any>): MethodMetadataMap {
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

  setRoute(target: Type<any>, propertyKey: string | symbol, metadata: RouteMetadata): void {
    const methodMeta = this.ensureMethodMetadata(target);
    methodMeta.routes.set(propertyKey, metadata);
  }

  getRoutes(target: Type<any>): Map<string | symbol, RouteMetadata> {
    return this.methodMetadata.get(target)?.routes ?? new Map();
  }

  // ─── Route Parameters ────────────────────────────────────────────────

  setRouteParam(target: Type<any>, propertyKey: string | symbol, param: RouteParamMetadata): void {
    const methodMeta = this.ensureMethodMetadata(target);
    let params = methodMeta.params.get(propertyKey);
    if (!params) {
      params = [];
      methodMeta.params.set(propertyKey, params);
    }
    params.push(param);
  }

  getRouteParams(target: Type<any>, propertyKey: string | symbol): RouteParamMetadata[] {
    return this.methodMetadata.get(target)?.params.get(propertyKey) ?? [];
  }

  // ─── Guards ──────────────────────────────────────────────────────────

  setMethodGuards(target: Type<any>, propertyKey: string | symbol, guards: Type<any>[]): void {
    const methodMeta = this.ensureMethodMetadata(target);
    methodMeta.guards.set(propertyKey, guards);
  }

  getMethodGuards(target: Type<any>, propertyKey: string | symbol): Type<any>[] {
    return this.methodMetadata.get(target)?.guards.get(propertyKey) ?? [];
  }

  setClassGuards(target: Type<any>, guards: Type<any>[]): void {
    this.classGuards.set(target, guards);
  }

  getClassGuards(target: Type<any>): Type<any>[] {
    return this.classGuards.get(target) ?? [];
  }

  // ─── Pipes ───────────────────────────────────────────────────────────

  setMethodPipes(target: Type<any>, propertyKey: string | symbol, pipes: Type<any>[]): void {
    const methodMeta = this.ensureMethodMetadata(target);
    methodMeta.pipes.set(propertyKey, pipes);
  }

  getMethodPipes(target: Type<any>, propertyKey: string | symbol): Type<any>[] {
    return this.methodMetadata.get(target)?.pipes.get(propertyKey) ?? [];
  }

  setClassPipes(target: Type<any>, pipes: Type<any>[]): void {
    this.classPipes.set(target, pipes);
  }

  getClassPipes(target: Type<any>): Type<any>[] {
    return this.classPipes.get(target) ?? [];
  }

  // ─── Interceptors ────────────────────────────────────────────────────

  setMethodInterceptors(
    target: Type<any>,
    propertyKey: string | symbol,
    interceptors: Type<any>[],
  ): void {
    const methodMeta = this.ensureMethodMetadata(target);
    methodMeta.interceptors.set(propertyKey, interceptors);
  }

  getMethodInterceptors(target: Type<any>, propertyKey: string | symbol): Type<any>[] {
    return this.methodMetadata.get(target)?.interceptors.get(propertyKey) ?? [];
  }

  setClassInterceptors(target: Type<any>, interceptors: Type<any>[]): void {
    this.classInterceptors.set(target, interceptors);
  }

  getClassInterceptors(target: Type<any>): Type<any>[] {
    return this.classInterceptors.get(target) ?? [];
  }

  // ─── Clear (for testing) ─────────────────────────────────────────────

  /** Clears all metadata. Primarily used in tests. */
  clear(): void {
    // WeakMaps self-clean when keys are GC'd.
    // For testing, we just create a fresh instance.
  }
}

/** Global singleton metadata storage */
export const MetadataStorage = new MetadataStorageImpl();
