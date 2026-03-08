/**
 * @nemesisjs/platform-bun - RequestContext
 *
 * Wraps the native Web API `Request` object with convenience methods
 * for accessing route params, query strings, body, and building responses.
 *
 * @class RequestContext
 * @classdesc HTTP request/response context object passed to every route handler.
 */

import type { HttpStatusCode } from '@nemesisjs/common';

export class RequestContext {
  /** @private Underlying native Request object */
  private readonly _request: Request;

  /** @private Parsed route parameters (e.g., { id: '42' } for /:id) */
  private readonly _params: Record<string, string>;

  /** @private Cached decoded URL with query string */
  private readonly _url: URL;

  /** @private Cached body — loaded lazily on first `getBody()` call */
  private _body: unknown = undefined;

  /** @private Flag indicating if the body has been parsed */
  private _bodyParsed: boolean = false;

  /**
   * @param {Request} request - The native Web API request
   * @param {Record<string, string>} params - Route path parameters
   */
  constructor(request: Request, params: Record<string, string> = {}) {
    this._request = request;
    this._params = params;
    this._url = new URL(request.url);
  }

  // ─── Request Metadata ────────────────────────────────────────────────

  /**
   * The HTTP method of the request.
   *
   * @returns {string} e.g., 'GET', 'POST'
   */
  get method(): string {
    return this._request.method;
  }

  /**
   * The full request URL including query string.
   *
   * @returns {string} The full URL
   */
  get url(): string {
    return this._request.url;
  }

  /**
   * The request path without query string.
   *
   * @returns {string} e.g., '/users/42'
   */
  get path(): string {
    return this._url.pathname;
  }

  /**
   * The raw native Request object.
   *
   * @returns {Request} The original Fetch API request
   */
  get request(): Request {
    return this._request;
  }

  // ─── Route Parameters ────────────────────────────────────────────────

  /**
   * Get all route path parameters.
   *
   * @returns {Record<string, string>} Object of parameter names to values
   */
  getParams(): Record<string, string> {
    return this._params;
  }

  /**
   * Get a specific route path parameter.
   *
   * @param {string} key - The parameter name (e.g., 'id' for /:id)
   * @returns {string | undefined} The parameter value, or undefined if not found
   */
  getParam(key: string): string | undefined {
    return this._params[key];
  }

  // ─── Query String ────────────────────────────────────────────────────

  /**
   * Get all query string parameters.
   *
   * @returns {URLSearchParams} The URL search params
   */
  getQuery(): URLSearchParams {
    return this._url.searchParams;
  }

  /**
   * Get a specific query string parameter.
   *
   * @param {string} key - The query parameter name
   * @returns {string | null} The value, or null if not present
   */
  getQueryParam(key: string): string | null {
    return this._url.searchParams.get(key);
  }

  // ─── Headers ─────────────────────────────────────────────────────────

  /**
   * Get the value of a request header.
   *
   * @param {string} name - The header name (case-insensitive)
   * @returns {string | null} The header value, or null if absent
   */
  getHeader(name: string): string | null {
    return this._request.headers.get(name);
  }

  /**
   * Get all request headers.
   *
   * @returns {Headers} The Fetch API Headers object
   */
  getHeaders(): Headers {
    return this._request.headers;
  }

  // ─── Body ────────────────────────────────────────────────────────────

  /**
   * Parse and return the request body as the given type.
   * The body is cached; subsequent calls return the same parsed value.
   * The caller is responsible for validating the shape of `T`.
   *
   * @template T - The expected body shape
   * @returns {Promise<T>} The parsed JSON body
   * @throws {SyntaxError} When the body is not valid JSON
   */
  async getBody<T = unknown>(): Promise<T> {
    if (!this._bodyParsed) {
      this._body = await this._request.json();
      this._bodyParsed = true;
    }
    return this._body as T;
  }

  /**
   * Return the raw request body as text.
   *
   * @returns {Promise<string>} The body text
   */
  async getText(): Promise<string> {
    return this._request.text();
  }

  // ─── Response Helpers ────────────────────────────────────────────────

  /**
   * Create a JSON response.
   *
   * @param {unknown} data - The data to serialize as JSON
   * @param {HttpStatusCode} [status=200] - HTTP status code
   * @returns {Response} The JSON response
   */
  json(data: unknown, status: HttpStatusCode = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Create a plain text response.
   *
   * @param {string} text - The response body
   * @param {HttpStatusCode} [status=200] - HTTP status code
   * @returns {Response} The text response
   */
  text(text: string, status: HttpStatusCode = 200): Response {
    return new Response(text, {
      status,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  /**
   * Create a redirect response.
   *
   * @param {string} url - The redirect destination
   * @param {HttpStatusCode} [status=302] - The redirect status code (301 or 302)
   * @returns {Response} The redirect response
   */
  redirect(url: string, status: HttpStatusCode = 302): Response {
    return Response.redirect(url, status);
  }

  /**
   * Create a 204 No Content response.
   *
   * @returns {Response} An empty response
   */
  noContent(): Response {
    return new Response(null, { status: 204 });
  }
}
