/**
 * @nemesis-js/platform-bun - BunHttpServer
 *
 * Wraps Bun.serve to integrate with NemesisJS.
 * Implements the ServerAdapter interface from @nemesis-js/core.
 */

import type { Server, WebSocket } from 'bun';
import type { ServerAdapter } from '@nemesis-js/core';

export interface BunServerOptions {
  /** TLS certificate (optional) */
  tls?: {
    cert: string;
    key: string;
  };
  /** Max request body size in bytes (default: 128MB) */
  maxRequestBodySize?: number;
  /** Development mode (enables better error output) */
  development?: boolean;
}

export class BunHttpServer implements ServerAdapter {
  private server: Server<WebSocket> | null = null;
  private requestHandler: ((request: Request) => Promise<Response>) | null = null;
  private options: BunServerOptions;
  private port: number = 3000;
  private host: string = '0.0.0.0';

  constructor(options: BunServerOptions = {}) {
    this.options = options;
  }

  /**
   * Set the request handler that will be called for each incoming request.
   */
  setRequestHandler(handler: (request: Request) => Promise<Response>): void {
    this.requestHandler = handler;
  }

  /**
   * Start the Bun HTTP server.
   */
  async listen(port: number, host: string = '0.0.0.0'): Promise<void> {
    this.port = port;
    this.host = host;

    if (!this.requestHandler) {
      throw new Error('No request handler set. Call setRequestHandler() before listen().');
    }

    const handler = this.requestHandler;

    this.server = Bun.serve({
      port,
      hostname: host,
      development: this.options.development ?? false,
      maxRequestBodySize: this.options.maxRequestBodySize,
      tls: this.options.tls
        ? {
            cert: this.options.tls.cert,
            key: this.options.tls.key,
          }
        : undefined,
      fetch: async (request: Request): Promise<Response> => {
        try {
          return await handler(request);
        } catch (error) {
          console.error('[NemesisJS] Unhandled error:', error);
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
      },
    });
  }

  /**
   * Stop the server gracefully.
   */
  async close(): Promise<void> {
    if (this.server) {
      this.server.stop(true);
      this.server = null;
    }
  }

  /**
   * Get the URL the server is listening on.
   */
  getUrl(): string {
    if (this.server) {
      return `http://${this.server.hostname}:${this.server.port}`;
    }
    return `http://${this.host}:${this.port}`;
  }

  /**
   * Get the underlying Bun Server instance.
   */
  getServer(): Server<WebSocket> | null {
    return this.server;
  }
}
