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

export interface PipelineContext {
  ctx: RequestContext;
  controllerInstance: any;
  methodKey: string;
  guards: Type<any>[];
  pipes: Type<any>[];
  interceptors: Type<any>[];
  paramMetadata: RouteParamMetadata[];
  moduleRef: ModuleRef;
}

// ─── PipelineExecutor ────────────────────────────────────────────────────────

export class PipelineExecutor {
  /**
   * Execute the full request pipeline and return a Response.
   */
  async execute(context: PipelineContext): Promise<Response> {
    const { ctx, controllerInstance, methodKey, guards, pipes, interceptors, paramMetadata, moduleRef } = context;

    try {
      // 1. Execute guards
      await this.executeGuards(guards, ctx, moduleRef);

      // 2. Resolve parameters and apply pipes
      const args = await this.resolveParameters(ctx, paramMetadata, pipes, moduleRef);

      // 3. Build the handler function (wrapped by interceptors)
      const handler = async (): Promise<any> => {
        return controllerInstance[methodKey](...args);
      };

      // 4. Execute with interceptors
      const result = await this.executeWithInterceptors(interceptors, ctx, handler, moduleRef);

      // 5. Convert result to Response
      return this.toResponse(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ─── Guards ──────────────────────────────────────────────────────────

  private async executeGuards(
    guards: Type<any>[],
    ctx: RequestContext,
    moduleRef: ModuleRef,
  ): Promise<void> {
    for (const GuardClass of guards) {
      let guard: CanActivate;
      try {
        guard = moduleRef.get(GuardClass);
      } catch {
        // Guard not in DI container; instantiate directly
        guard = new GuardClass();
      }

      const executionContext = this.createExecutionContext(ctx);
      const canActivate = await guard.canActivate(executionContext);
      if (!canActivate) {
        throw new ForbiddenException();
      }
    }
  }

  // ─── Parameter Resolution ────────────────────────────────────────────

  private async resolveParameters(
    ctx: RequestContext,
    paramMetadata: RouteParamMetadata[],
    pipes: Type<any>[],
    moduleRef: ModuleRef,
  ): Promise<any[]> {
    if (paramMetadata.length === 0) {
      // If no parameter decorators, pass the RequestContext as first arg
      return [ctx];
    }

    // Sort by index to ensure correct parameter order
    const sorted = [...paramMetadata].sort((a, b) => a.index - b.index);
    const maxIndex = sorted.length > 0 ? Math.max(...sorted.map((p) => p.index)) : -1;
    const args: any[] = new Array(maxIndex + 1).fill(undefined);

    for (const param of sorted) {
      let value = await this.extractParamValue(ctx, param);

      // Apply parameter-specific pipes
      if (param.pipes && param.pipes.length > 0) {
        value = await this.applyPipes(value, param, param.pipes, moduleRef);
      }

      // Apply method-level pipes
      if (pipes.length > 0) {
        value = await this.applyPipes(value, param, pipes, moduleRef);
      }

      args[param.index] = value;
    }

    return args;
  }

  private async extractParamValue(
    ctx: RequestContext,
    param: RouteParamMetadata,
  ): Promise<any> {
    switch (param.type) {
      case PARAM_TYPE.BODY: {
        const body = await ctx.getBody();
        return param.data ? body?.[param.data] : body;
      }
      case PARAM_TYPE.QUERY: {
        if (param.data) {
          return ctx.getQuery(param.data);
        }
        return ctx.getQueryAll();
      }
      case PARAM_TYPE.PARAM: {
        if (param.data) {
          return ctx.getParam(param.data);
        }
        return ctx.params;
      }
      case PARAM_TYPE.HEADERS: {
        if (param.data) {
          return ctx.getHeader(param.data);
        }
        return ctx.getHeaders();
      }
      case PARAM_TYPE.REQUEST:
        return ctx.request;
      default:
        return undefined;
    }
  }

  private async applyPipes(
    value: any,
    param: RouteParamMetadata,
    pipeClasses: Type<any>[],
    moduleRef: ModuleRef,
  ): Promise<any> {
    let result = value;
    for (const PipeClass of pipeClasses) {
      let pipe: PipeTransform;
      try {
        pipe = moduleRef.get(PipeClass);
      } catch {
        pipe = new PipeClass();
      }
      result = await pipe.transform(result, {
        type: param.type,
        data: param.data,
      });
    }
    return result;
  }

  // ─── Interceptors ────────────────────────────────────────────────────

  private async executeWithInterceptors(
    interceptors: Type<any>[],
    ctx: RequestContext,
    handler: () => Promise<any>,
    moduleRef: ModuleRef,
  ): Promise<any> {
    if (interceptors.length === 0) {
      return handler();
    }

    // Build interceptor chain (last interceptor wraps the handler)
    let next = handler;
    for (let i = interceptors.length - 1; i >= 0; i--) {
      const InterceptorClass = interceptors[i];
      let interceptor: NemesisInterceptor;
      try {
        interceptor = moduleRef.get(InterceptorClass);
      } catch {
        interceptor = new InterceptorClass();
      }

      const currentNext = next;
      const executionContext = this.createExecutionContext(ctx);
      next = () =>
        interceptor.intercept(executionContext, {
          handle: () => currentNext(),
        });
    }

    return next();
  }

  // ─── Response Conversion ─────────────────────────────────────────────

  private toResponse(result: any): Response {
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

  // ─── Error Handling ──────────────────────────────────────────────────

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

    // Unknown error
    console.error('[NemesisJS] Unhandled error:', error);
    const internalError = new InternalServerErrorException();
    return new Response(
      JSON.stringify({
        statusCode: 500,
        message: 'Internal Server Error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // ─── Execution Context ───────────────────────────────────────────────

  private createExecutionContext(ctx: RequestContext): any {
    return {
      getRequest: () => ctx.request,
      getResponse: () => null,
      getHandler: () => null,
      getClass: () => null,
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ctx.request,
        getResponse: () => null,
        getNext: () => null,
      }),
    };
  }
}
