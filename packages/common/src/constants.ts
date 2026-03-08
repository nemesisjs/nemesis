/**
 * @nemesisjs/common - Constants
 * All constants use `as const` instead of enums for better tree-shaking and type safety.
 */

// ─── HTTP Status Codes ───────────────────────────────────────────────────────

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

// ─── HTTP Methods ────────────────────────────────────────────────────────────

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
} as const;

export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];

// ─── Metadata Keys ───────────────────────────────────────────────────────────
// Symbols used as keys in the MetadataStorage to avoid key collisions.

export const METADATA_KEYS = {
  INJECTABLE: Symbol('nemesis:injectable'),
  INJECT: Symbol('nemesis:inject'),
  MODULE: Symbol('nemesis:module'),
  CONTROLLER: Symbol('nemesis:controller'),
  ROUTE: Symbol('nemesis:route'),
  ROUTE_PARAMS: Symbol('nemesis:route-params'),
  GUARDS: Symbol('nemesis:guards'),
  PIPES: Symbol('nemesis:pipes'),
  INTERCEPTORS: Symbol('nemesis:interceptors'),
  MIDDLEWARE: Symbol('nemesis:middleware'),
  EXCEPTION_FILTERS: Symbol('nemesis:exception-filters'),
  SCOPE: Symbol('nemesis:scope'),
  GLOBAL_MODULE: Symbol('nemesis:global-module'),
} as const;

// ─── Injection Scopes ────────────────────────────────────────────────────────

export const SCOPE = {
  SINGLETON: 'singleton',
  TRANSIENT: 'transient',
  REQUEST: 'request',
} as const;

export type Scope = (typeof SCOPE)[keyof typeof SCOPE];

// ─── Parameter Types ─────────────────────────────────────────────────────────

export const PARAM_TYPE = {
  BODY: 'body',
  QUERY: 'query',
  PARAM: 'param',
  HEADERS: 'headers',
  REQUEST: 'request',
  RESPONSE: 'response',
  CUSTOM: 'custom',
} as const;

export type ParamType = (typeof PARAM_TYPE)[keyof typeof PARAM_TYPE];
