/**
 * @nemesis-js/common - Constants
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

// ─── Log Levels ──────────────────────────────────────────────────────────────

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  LOG: 'log',
  DEBUG: 'debug',
  VERBOSE: 'verbose',
} as const;

export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];
