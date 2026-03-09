/**
 * @nemesis-js/http
 *
 * HTTP server, routing, and request pipeline for NemesisJS.
 */

// ─── Main Entry Point ────────────────────────────────────────────────────────
export { createHttpApp, type HttpApplicationOptions } from './http-application.js';
export { NemesisApp } from './nemesis-app.js';

// ─── Router ──────────────────────────────────────────────────────────────────
export { HttpRouter, type RouteEntry, type RouteMatch, type RouteHandler } from './router/router.js';
export { RouteCollector } from './router/route-collector.js';

// ─── Pipeline ────────────────────────────────────────────────────────────────
export { PipelineExecutor, type PipelineContext } from './pipeline/pipeline-executor.js';

// ─── Re-exports from platform-bun for convenience ────────────────────────────
export { RequestContext } from '@nemesis-js/platform-bun';
export { BunHttpServer } from '@nemesis-js/platform-bun';
