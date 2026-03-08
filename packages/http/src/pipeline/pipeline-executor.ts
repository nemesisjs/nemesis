/**
 * @nemesisjs/http - PipelineExecutor
 *
 * Executes the full request lifecycle:
 * 1. Guards (canActivate)
 * 2. Parameter resolution (Body, Query, Param, Headers) + Pipes
 * 3. Interceptors (before)
 * 4. Handler execution
 * 5. Interceptors (after)
 * 6. Exception handling
 */

import {
  type CanActivate,
  type ExecutionContext,
  type NemesisInterceptor,
  type PipeTransform,
  type RouteParamMetadata,
  type Type,
  HttpException,
  ForbiddenException,
  InternalServerErrorException,
  PARAM_TYPE,
} from '@nemesisjs/common';
import type { ModuleRef } from '@nemesisjs/core';
import type { RequestContext } from '@nemesisjs/platform-bun';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Context object passed to `PipelineExecutor.execute()` */
export interface PipelineContext {
  /** The request context for this invocation */
  ctx: RequestContext;
  /** The resolved controller instance */
  controllerInstance: unknown;
  /** The name of the handler method to invoke */
  methodKey: string;
  /** Guard classes to run before the handler */
  guards: Type<CanActivate>[];
  /** Pipe classes to apply to parameters */
  pipes: Type<PipeTransform>[];
  /** Interceptor classes to wrap the handler */
  interceptors: Type<NemesisInterceptor>[];
  /** Parameter metadata from `@Body`, `@Param`, etc. decorators */
  paramMetadata: RouteParamMetadata[];
  /** The module reference, used for DI resolution of guards/pipes/interceptors */
  moduleRef: ModuleRef;
  /** Global pipe instances */
  globalPipes?: PipeTransform[];
}

// ─── Helper Types ─────────────────────────────────────────────────────────────

/** Shape of the controller instance for dynamic method invocation */
type ControllerInstance = Record<string, (...args: unknown[]) => unknown>;

// ─── PipelineExecutor ────────────────────────────────────────────────────────

/**
 * @class PipelineExecutor
 * @classdesc Orchestrates the full request lifecycle: guard checks, parameter
 * resolution, pipe transformation, interceptor wrapping, handler execution,
 * and error serialization.
 */
export class PipelineExecutor {
  /**
   * Execute the full request pipeline and return a Response.
   *
   * @param {PipelineContext} context - All data needed to process this request
   * @returns {Promise<Response>} The HTTP response
   */
  async execute(context: PipelineContext): Promise<Response> {
    const {
      ctx,
      controllerInstance,
      methodKey,
      guards,
      pipes,
      interceptors,
      paramMetadata,
      moduleRef,
      globalPipes = [],
    } = context;

    try {
      // 1. Execute guards
      await this.executeGuards(guards, ctx, moduleRef);

      // 2. Resolve parameters and apply pipes
      const args = await this.resolveParameters(ctx, paramMetadata, pipes, globalPipes, moduleRef, context);

      // 3. Build the handler function (wrapped by interceptors)
      const handler = async (): Promise<unknown> => {
        const instance = controllerInstance as ControllerInstance;
        return instance[methodKey](...args);
      };

      // 4. Execute with interceptors
      const result = await this.executeWithInterceptors(interceptors, ctx, handler, moduleRef);

      // 5. Convert result to Response
      return this.toResponse(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ─── Private: DI Resolution ──────────────────────────────────────────

  /**
   * Try to resolve a class from the module's DI container.
   * Falls back to direct instantiation if the class is not registered.
   *
   * @template T - The type of the resolved instance
   * @param {Type<T>} targetClass - The class to resolve
   * @param {ModuleRef} moduleRef - The module's container to check first
   * @returns {T} The resolved or directly instantiated instance
   */
  private resolveFromContainer<T>(targetClass: Type<T>, moduleRef: ModuleRef): T {
    try {
      return moduleRef.get<T>(targetClass);
    } catch {
      return new targetClass();
    }
  }

  // ─── Private: Guards ─────────────────────────────────────────────────

  /**
   * Execute all guards for the current request. Throws `ForbiddenException`
   * if any guard returns false.
   *
   * @param {Type<CanActivate>[]} guards - Guard classes to execute
   * @param {RequestContext} ctx - The current request context
   * @param {ModuleRef} moduleRef - Module for DI resolution
   * @returns {Promise<void>}
   * @throws {ForbiddenException} When any guard denies access
   */
  private async executeGuards(
    guards: Type<CanActivate>[],
    ctx: RequestContext,
    moduleRef: ModuleRef,
  ): Promise<void> {
    for (const GuardClass of guards) {
      const guard = this.resolveFromContainer<CanActivate>(GuardClass, moduleRef);
      const executionContext = this.createExecutionContext(ctx);
      const canActivate = await guard.canActivate(executionContext);

      if (!canActivate) {
        throw new ForbiddenException();
      }
    }
  }

  // ─── Private: Parameter Resolution ──────────────────────────────────

  /**
   * Resolve all handler parameters from the request, applying pipes to each.
   * If no parameter decorators are present, the `RequestContext` is passed as the first arg.
   *
   * @param {RequestContext} ctx - The current request context
   * @param {RouteParamMetadata[]} paramMetadata - Registered parameter decorators
   * @param {Type<PipeTransform>[]} pipes - Method-level pipe classes
   * @param {PipeTransform[]} globalPipes - Global pipe instances
   * @param {ModuleRef} moduleRef - Module for DI resolution
   * @returns {Promise<unknown[]>} Resolved and transformed argument array
   */
  private async resolveParameters(
    ctx: RequestContext,
    paramMetadata: RouteParamMetadata[],
    pipes: Type<PipeTransform>[],
    globalPipes: PipeTransform[],
    moduleRef: ModuleRef,
    context: PipelineContext,
  ): Promise<unknown[]> {
    if (paramMetadata.length === 0) {
      // If no parameter decorators, pass the RequestContext as first arg
      return [ctx];
    }

    // Sort by index to ensure correct parameter order
    const sorted = [...paramMetadata].sort((a, b) => a.index - b.index);
    const maxIndex = Math.max(...sorted.map((p) => p.index));
    const args: unknown[] = new Array(maxIndex + 1).fill(undefined);

    for (const param of sorted) {
      let value: unknown = await this.extractParamValue(ctx, param);

      // Apply global pipe instances
      if (globalPipes && globalPipes.length > 0) {
        value = await this.applyPipeInstances(value, param, globalPipes, context);
      }

      // Apply class & method-level pipe classes
      if (pipes.length > 0) {
        value = await this.applyPipes(value, param, pipes, moduleRef, context);
      }

      // Apply parameter-specific pipe classes
      if (param.pipes && param.pipes.length > 0) {
        value = await this.applyPipes(value, param, param.pipes, moduleRef, context);
      }

      args[param.index] = value;
    }

    return args;
  }

  /**
   * Extract a single parameter value from the request based on its decorator type.
   *
   * @param {RequestContext} ctx - The current request context
   * @param {RouteParamMetadata} param - The parameter descriptor
   * @returns {Promise<unknown>} The extracted value
   */
  private async extractParamValue(
    ctx: RequestContext,
    param: RouteParamMetadata,
  ): Promise<unknown> {
    switch (param.type) {
      case PARAM_TYPE.BODY: {
        const body = await ctx.getBody<Record<string, unknown>>();
        return param.data !== undefined ? body?.[param.data] : body;
      }
      case PARAM_TYPE.QUERY: {
        if (param.data) {
          return ctx.getQueryParam(param.data);
        }
        return ctx.getQuery();
      }
      case PARAM_TYPE.PARAM: {
        if (param.data) {
          return ctx.getParam(param.data);
        }
        return ctx.getParams();
      }
      case PARAM_TYPE.HEADERS: {
        if (param.data) {
          return ctx.getHeader(param.data);
        }
        return ctx.getHeaders();
      }
      case PARAM_TYPE.REQUEST:
        return ctx;
      default:
        return undefined;
    }
  }

  /**
   * Apply a series of pipe classes to a parameter value.
   *
   * @param {unknown} value - The raw parameter value
   * @param {RouteParamMetadata} param - The parameter descriptor (for metadata)
   * @param {Type<PipeTransform>[]} pipeClasses - Pipe classes to apply in order
   * @param {ModuleRef} moduleRef - Module for DI resolution
   * @returns {Promise<unknown>} The transformed value
   */
  private async applyPipes(
    value: unknown,
    param: RouteParamMetadata,
    pipeClasses: Type<PipeTransform>[],
    moduleRef: ModuleRef,
    context: PipelineContext,
  ): Promise<unknown> {
    let result: unknown = value;
    for (const PipeClass of pipeClasses) {
      const pipe = this.resolveFromContainer<PipeTransform>(PipeClass, moduleRef);
      result = await pipe.transform(result, {
        type: param.type,
        metatype: param.metatype,
        data: param.data,
        target: (context.controllerInstance as any).constructor as Type<unknown>,
        methodKey: context.methodKey,
        parameterIndex: param.index,
      });
    }
    return result;
  }

  /**
   * Apply a series of pipe instances to a parameter value.
   *
   * @param {unknown} value - The raw parameter value
   * @param {RouteParamMetadata} param - The parameter descriptor (for metadata)
   * @param {PipeTransform[]} pipes - Pipe instances to apply in order
   * @param {PipelineContext} context - Pipeline context constraints
   * @returns {Promise<unknown>} The transformed value
   */
  private async applyPipeInstances(
    value: unknown,
    param: RouteParamMetadata,
    pipes: PipeTransform[],
    context: PipelineContext,
  ): Promise<unknown> {
    let result: unknown = value;
    for (const pipe of pipes) {
      result = await pipe.transform(result, {
        type: param.type,
        metatype: param.metatype,
        data: param.data,
        target: (context.controllerInstance as any).constructor as Type<unknown>,
        methodKey: context.methodKey,
        parameterIndex: param.index,
      });
    }
    return result;
  }

  // ─── Private: Interceptors ───────────────────────────────────────────

  /**
   * Wrap the handler function with interceptors and execute the chain.
   *
   * @param {Type<NemesisInterceptor>[]} interceptors - Interceptor classes to apply
   * @param {RequestContext} ctx - The current request context
   * @param {() => Promise<unknown>} handler - The core handler function
   * @param {ModuleRef} moduleRef - Module for DI resolution
   * @returns {Promise<unknown>} The result after all interceptors and the handler
   */
  private async executeWithInterceptors(
    interceptors: Type<NemesisInterceptor>[],
    ctx: RequestContext,
    handler: () => Promise<unknown>,
    moduleRef: ModuleRef,
  ): Promise<unknown> {
    if (interceptors.length === 0) {
      return handler();
    }

    // Build interceptor chain (last interceptor wraps the handler)
    let next = handler;
    for (let i = interceptors.length - 1; i >= 0; i--) {
      const InterceptorClass = interceptors[i];
      const interceptor = this.resolveFromContainer<NemesisInterceptor>(
        InterceptorClass,
        moduleRef,
      );

      const currentNext = next;
      const executionContext = this.createExecutionContext(ctx);
      next = () =>
        interceptor.intercept(executionContext, {
          handle: () => currentNext(),
        });
    }

    return next();
  }

  // ─── Private: Response Conversion ────────────────────────────────────

  /**
   * Convert any handler return value into a `Response` object.
   *
   * @param {unknown} result - The value returned by the handler
   * @returns {Response} An appropriate HTTP Response
   */
  private toResponse(result: unknown): Response {
    if (result instanceof Response) {
      return result;
    }

    if (result === undefined || result === null) {
      return new Response(null, { status: 204 });
    }

    if (typeof result === 'string') {
      return new Response(result, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Default: JSON response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ─── Private: Error Handling ─────────────────────────────────────────

  /**
   * Serialize an error into an appropriate HTTP error response.
   * Uses `HttpException` for known exceptions; returns 500 for unknown ones.
   *
   * @param {unknown} error - The caught error value
   * @returns {Response} The serialized error response
   */
  private handleError(error: unknown): Response {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      const body =
        typeof response === 'string'
          ? JSON.stringify({ statusCode: error.getStatus(), message: response })
          : JSON.stringify({ statusCode: error.getStatus(), ...response });

      return new Response(body, {
        status: error.getStatus(),
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Unknown error — log and return 500
    const internalError = new InternalServerErrorException();
    return new Response(
      JSON.stringify({
        statusCode: internalError.getStatus(),
        message: 'Internal Server Error',
      }),
      {
        status: internalError.getStatus(),
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // ─── Private: Execution Context ──────────────────────────────────────

  /**
   * Create an `ExecutionContext` from the current request, as required by guards
   * and interceptors.
   *
   * @param {RequestContext} ctx - The current request context
   * @returns {ExecutionContext} A minimal execution context implementation
   */
  private createExecutionContext(ctx: RequestContext): ExecutionContext {
    return {
      getRequest: <T = unknown>() => ctx.request as T,
      getResponse: <T = unknown>() => null as T,
      getHandler: () => () => undefined,
      getClass: () => Object as unknown as Type<unknown>,
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: <T = unknown>() => ctx.request as T,
        getResponse: <T = unknown>() => null as T,
        getNext: <T = unknown>() => null as T,
      }),
    };
  }
}
