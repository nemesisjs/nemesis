/**
 * @nemesis-js/testing - TestClient
 *
 * HTTP test client that sends requests directly to the app's request handler
 * without requiring a real network connection. Perfect for E2E testing.
 *
 * @example
 * ```ts
 * const app = await createHttpApp(AppModule);
 * const client = new TestClient(app);
 *
 * const res = await client.get('/users');
 * expect(res.status).toBe(200);
 * expect(await res.json()).toEqual([...]);
 * ```
 */

import type { NemesisApplication } from '@nemesis-js/core';

export class TestClient {
  private readonly baseUrl: string;
  private app: NemesisApplication;

  constructor(app: NemesisApplication, baseUrl: string = 'http://localhost:3000') {
    this.app = app;
    this.baseUrl = baseUrl;
  }

  /**
   * Start the app on a random port and return the base URL.
   * Call this if you need a real server running.
   */
  async listen(): Promise<string> {
    // Use port 0 to get a random available port
    await this.app.listen(0, '127.0.0.1');
    const url = this.app.getUrl();
    return url;
  }

  /**
   * Close the app server.
   */
  async close(): Promise<void> {
    await this.app.close();
  }

  // ─── HTTP Methods ──────────────────────────────────────────────────

  async get(path: string, headers?: Record<string, string>): Promise<Response> {
    return this.request('GET', path, undefined, headers);
  }

  async post(path: string, body?: any, headers?: Record<string, string>): Promise<Response> {
    return this.request('POST', path, body, headers);
  }

  async put(path: string, body?: any, headers?: Record<string, string>): Promise<Response> {
    return this.request('PUT', path, body, headers);
  }

  async patch(path: string, body?: any, headers?: Record<string, string>): Promise<Response> {
    return this.request('PATCH', path, body, headers);
  }

  async delete(path: string, headers?: Record<string, string>): Promise<Response> {
    return this.request('DELETE', path, undefined, headers);
  }

  // ─── Core Request ──────────────────────────────────────────────────

  private async request(
    method: string,
    path: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<Response> {
    const url = this.app.getUrl()
      ? `${this.app.getUrl()}${path}`
      : `${this.baseUrl}${path}`;

    const requestHeaders: Record<string, string> = {
      ...headers,
    };

    let requestBody: string | undefined;
    if (body !== undefined) {
      requestHeaders['Content-Type'] = requestHeaders['Content-Type'] ?? 'application/json';
      requestBody = typeof body === 'string' ? body : JSON.stringify(body);
    }

    return fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
    });
  }
}
