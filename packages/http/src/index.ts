/**
 * @nemesisjs/http
 *
 * HTTP server, routing, and request pipeline for NemesisJS.
 */

// ─── Main Entry Point ────────────────────────────────────────────────────────
export { createHttpApp, type HttpApplicationOptions } from './http-application.js';

// ─── Router ──────────────────────────────────────────────────────────────────
export { HttpRouter, type RouteEntry, type RouteMatch, type RouteHandler } from './router/router.js';
export { RouteCollector } from './router/route-collector.js';

// ─── Pipeline ────────────────────────────────────────────────────────────────
export { PipelineExecutor, type PipelineContext } from './pipeline/pipeline-executor.js';

// ─── Re-exports from platform-bun for convenience ────────────────────────────
export { RequestContext } from '@nemesisjs/platform-bun';
export { BunHttpServer } from '@nemesisjs/platform-bun';
