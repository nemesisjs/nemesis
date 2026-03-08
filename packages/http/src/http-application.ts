/**
 * @nemesisjs/http - HttpApplication
 *
 * Integrates the HTTP server, router, and pipeline with NemesisApplication.
 * This is the "glue" that connects @nemesisjs/core with @nemesisjs/platform-bun.
 */

import type { ApplicationOptions, Type } from '@nemesisjs/common';
import { NemesisApplication } from '@nemesisjs/core';
import { BunHttpServer, type BunServerOptions } from '@nemesisjs/platform-bun';
import { HttpRouter } from './router/router.js';
import { RouteCollector } from './router/route-collector.js';
import { PipelineExecutor } from './pipeline/pipeline-executor.js';
import { NotFoundException, MethodNotAllowedException } from '@nemesisjs/common';

export interface HttpApplicationOptions extends ApplicationOptions {
  /** Bun server options */
  server?: BunServerOptions;
}

/**
 * Create a fully configured NemesisJS HTTP application.
 * This is the recommended way to create an HTTP app.
 *
 * @example
 * ```ts
 * import { createHttpApp } from '@nemesisjs/http';
 * import { AppModule } from './app.module';
 *
 * const app = await createHttpApp(AppModule);
 * await app.listen(3000);
 * console.log(`Server running at ${app.getUrl()}`);
 * ```
 */
export async function createHttpApp(
  rootModule: Type<any>,
  options: HttpApplicationOptions = {},
): Promise<NemesisApplication> {
  // Create and initialize the application
  const app = new NemesisApplication(rootModule, options);
  await app.initialize();

  // Set up HTTP infrastructure
  const router = new HttpRouter();
  const pipeline = new PipelineExecutor();
  const globalPrefix = options.globalPrefix ?? '';

  // Collect routes from all modules
  const routeCollector = new RouteCollector(router, pipeline, globalPrefix);
  routeCollector.collectRoutes(app.getModules());

  // Create Bun HTTP server
  const server = new BunHttpServer(options.server);

  // CORS handling
  const corsOptions = options.cors;

  // Set the request handler
  server.setRequestHandler(async (request: Request): Promise<Response> => {
    // Handle CORS preflight
    if (corsOptions && request.method === 'OPTIONS') {
      return buildCorsResponse(corsOptions, request);
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Match route
    const match = router.match(method, path);

    if (!match) {
      // Check if path exists but method isn't allowed
      if (router.hasPath(path)) {
        const error = new MethodNotAllowedException();
        return new Response(
          JSON.stringify({ statusCode: 405, message: 'Method Not Allowed' }),
          { status: 405, headers: { 'Content-Type': 'application/json' } },
        );
      }

      const error = new NotFoundException(`Cannot ${method} ${path}`);
      return new Response(
        JSON.stringify({ statusCode: 404, message: `Cannot ${method} ${path}` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Execute route handler
    let response = await match.entry.handler(request, match.params);

    // Add CORS headers if enabled
    if (corsOptions) {
      response = addCorsHeaders(response, corsOptions, request);
    }

    return response;
  });

  // Attach the adapter
  app.setAdapter(server);

  return app;
}

// ─── CORS Helpers ────────────────────────────────────────────────────────────

function buildCorsResponse(
  cors: boolean | import('@nemesisjs/common').CorsOptions,
  request: Request,
): Response {
  const opts = cors === true ? {} : cors;
  const origin = resolveOrigin(opts.origin, request);

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': opts.methods?.join(', ') ?? 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'Access-Control-Allow-Headers':
        opts.allowedHeaders?.join(', ') ??
        request.headers.get('Access-Control-Request-Headers') ??
        '',
      ...(opts.credentials ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
      ...(opts.maxAge ? { 'Access-Control-Max-Age': String(opts.maxAge) } : {}),
    },
  });
}

function addCorsHeaders(
  response: Response,
  cors: boolean | import('@nemesisjs/common').CorsOptions,
  request: Request,
): Response {
  const opts = cors === true ? {} : cors;
  const origin = resolveOrigin(opts.origin, request);

  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', origin);
  if (opts.exposedHeaders) {
    newHeaders.set('Access-Control-Expose-Headers', opts.exposedHeaders.join(', '));
  }
  if (opts.credentials) {
    newHeaders.set('Access-Control-Allow-Credentials', 'true');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

function resolveOrigin(
  origin: string | string[] | boolean | undefined,
  request: Request,
): string {
  if (origin === true || origin === undefined) {
    return request.headers.get('Origin') ?? '*';
  }
  if (origin === false) return '';
  if (typeof origin === 'string') return origin;
  if (Array.isArray(origin)) {
    const reqOrigin = request.headers.get('Origin') ?? '';
    return origin.includes(reqOrigin) ? reqOrigin : origin[0];
  }
  return '*';
}
