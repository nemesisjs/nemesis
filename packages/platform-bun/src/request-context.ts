/**
 * @nemesisjs/platform-bun - RequestContext
 *
 * Wraps the native Web API Request with convenience methods for
 * body parsing, query extraction, header access, and response building.
 * This is the primary interface controllers use to interact with HTTP requests.
 */

export class RequestContext {
  public readonly request: Request;
  public readonly url: URL;
  public params: Record<string, string>;
  private _body: any = undefined;
  private _bodyParsed = false;

  constructor(
    request: Request,
    params: Record<string, string> = {},
  ) {
    this.request = request;
    this.url = new URL(request.url);
    this.params = params;
  }

  // ─── Request Accessors ─────────────────────────────────────────────

  /** Get the HTTP method */
  getMethod(): string {
    return this.request.method;
  }

  /** Get the request path (without query string) */
  getPath(): string {
    return this.url.pathname;
  }

  /** Get all query parameters as a record */
  getQueryAll(): Record<string, string> {
    const query: Record<string, string> = {};
    this.url.searchParams.forEach((value, key) => {
      query[key] = value;
    });
    return query;
  }

  /** Get a specific query parameter */
  getQuery(key: string): string | null {
    return this.url.searchParams.get(key);
  }

  /** Get a specific route parameter */
  getParam(key: string): string | undefined {
    return this.params[key];
  }

  /** Get all request headers as a record */
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    this.request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  /** Get a specific header value */
  getHeader(key: string): string | null {
    return this.request.headers.get(key);
  }

  /** Parse and return the request body as JSON */
  async getBody<T = any>(): Promise<T> {
    if (!this._bodyParsed) {
      const contentType = this.request.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        try {
          this._body = await this.request.json();
        } catch {
          this._body = null;
        }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await this.request.text();
        const params = new URLSearchParams(text);
        const body: Record<string, string> = {};
        params.forEach((value, key) => {
          body[key] = value;
        });
        this._body = body;
      } else if (contentType.includes('multipart/form-data')) {
        try {
          this._body = await this.request.formData();
        } catch {
          this._body = null;
        }
      } else {
        try {
          this._body = await this.request.text();
        } catch {
          this._body = null;
        }
      }
      this._bodyParsed = true;
    }
    return this._body as T;
  }

  /** Get the raw request body as text */
  async getText(): Promise<string> {
    return this.request.text();
  }

  /** Get the raw request body as ArrayBuffer */
  async getArrayBuffer(): Promise<ArrayBuffer> {
    return this.request.arrayBuffer();
  }

  // ─── Response Builders ─────────────────────────────────────────────

  /** Create a JSON response */
  json<T = any>(data: T, status: number = 200, headers?: Record<string, string>): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  }

  /** Create a plain text response */
  text(data: string, status: number = 200, headers?: Record<string, string>): Response {
    return new Response(data, {
      status,
      headers: {
        'Content-Type': 'text/plain',
        ...headers,
      },
    });
  }

  /** Create an HTML response */
  html(data: string, status: number = 200, headers?: Record<string, string>): Response {
    return new Response(data, {
      status,
      headers: {
        'Content-Type': 'text/html',
        ...headers,
      },
    });
  }

  /** Create a redirect response */
  redirect(url: string, status: 301 | 302 | 307 | 308 = 302): Response {
    return new Response(null, {
      status,
      headers: { Location: url },
    });
  }

  /** Create a streaming response (SSE, chunked, etc.) */
  stream(
    body: ReadableStream,
    status: number = 200,
    headers?: Record<string, string>,
  ): Response {
    return new Response(body, {
      status,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        ...headers,
      },
    });
  }

  /** Create an empty response with just a status code */
  empty(status: number = 204): Response {
    return new Response(null, { status });
  }
}
