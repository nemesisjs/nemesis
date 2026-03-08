/**
 * @nemesisjs/http - RouteCollector
 *
 * Scans loaded modules for controllers and their route decorators,
 * then registers them in the HttpRouter.
 */

import {
  MetadataStorage,
  joinPaths,
  type Type,
} from '@nemesisjs/common';
import type { ModuleRef } from '@nemesisjs/core';
import { RequestContext } from '@nemesisjs/platform-bun';
import { HttpRouter, type RouteHandler } from './router.js';
import { PipelineExecutor } from '../pipeline/pipeline-executor.js';

export class RouteCollector {
  private readonly router: HttpRouter;
  private readonly pipeline: PipelineExecutor;
  private readonly globalPrefix: string;

  constructor(router: HttpRouter, pipeline: PipelineExecutor, globalPrefix: string = '') {
    this.router = router;
    this.pipeline = pipeline;
    this.globalPrefix = globalPrefix;
  }

  /**
   * Scan all modules and register controller routes.
   *
   * @param {Map<Type<unknown>, ModuleRef>} modules - Map of all loaded modules
   * @returns {void}
   */
  collectRoutes(modules: Map<Type<unknown>, ModuleRef>): void {
    for (const [, moduleRef] of modules) {
      const controllers = moduleRef.getControllers();

      for (const controllerClass of controllers) {
        this.registerController(controllerClass, moduleRef);
      }
    }
  }

  // ─── Private ─────────────────────────────────────────────────────────

  /**
   * Register all routes for a single controller class.
   *
   * @param {Type<unknown>} controllerClass - The controller class to register
   * @param {ModuleRef} moduleRef - The module that owns this controller
   * @returns {void}
   */
  private registerController(controllerClass: Type<unknown>, moduleRef: ModuleRef): void {
    const controllerMeta = MetadataStorage.getController(controllerClass);
    if (!controllerMeta) return;

    const prefix = controllerMeta.prefix;
    const routes = MetadataStorage.getRoutes(controllerClass);

    // Get class-level guards/pipes/interceptors
    const classGuards = MetadataStorage.getClassGuards(controllerClass);
    const classPipes = MetadataStorage.getClassPipes(controllerClass);
    const classInterceptors = MetadataStorage.getClassInterceptors(controllerClass);

    for (const [propertyKey, routeMeta] of routes) {
      // Build full path: globalPrefix + controllerPrefix + routePath
      const fullPath = joinPaths(this.globalPrefix, prefix, routeMeta.path);

      // Get method-level guards/pipes/interceptors
      const methodGuards = MetadataStorage.getMethodGuards(controllerClass, propertyKey);
      const methodPipes = MetadataStorage.getMethodPipes(controllerClass, propertyKey);
      const methodInterceptors = MetadataStorage.getMethodInterceptors(controllerClass, propertyKey);

      // Merge class + method level
      const guards = [...classGuards, ...methodGuards];
      const pipes = [...classPipes, ...methodPipes];
      const interceptors = [...classInterceptors, ...methodInterceptors];

      // Get parameter metadata
      const paramMetadata = MetadataStorage.getRouteParams(controllerClass, propertyKey);

      // Create the route handler
      const handler: RouteHandler = async (request: Request, params: Record<string, string>) => {
        // Resolve the controller instance from the module's container
        const controllerInstance = moduleRef.get(controllerClass);
        const ctx = new RequestContext(request, params);

        return this.pipeline.execute({
          ctx,
          controllerInstance,
          methodKey: propertyKey as string,
          guards,
          pipes,
          interceptors,
          paramMetadata,
          moduleRef,
        });
      };

      this.router.addRoute({
        method: routeMeta.method,
        path: fullPath,
        handler,
        guards,
        pipes,
        interceptors,
        controllerClass,
        methodKey: propertyKey,
      });
    }
  }
}

