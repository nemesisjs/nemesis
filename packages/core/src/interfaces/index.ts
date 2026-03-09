/**
 * @nemesis-js/core - Internal interfaces
 */

import type { ApplicationOptions, InjectionToken, PipeTransform } from '@nemesis-js/common';

export interface NemesisApplicationInterface {
  listen(port: number, host?: string): Promise<void>;
  close(): Promise<void>;
  get<T>(token: InjectionToken<T>): T;
  getUrl(): string;
  useGlobalPipes(...pipes: PipeTransform[]): this;
  getGlobalPipes(): PipeTransform[];
  getGlobalPrefix(): string;
  getLogger(): import('@nemesis-js/common').ILogger;
}

export interface ServerAdapter {
  listen(port: number, host?: string): Promise<void>;
  close(): Promise<void>;
  getUrl(): string;
  setRequestHandler(handler: (request: Request) => Promise<Response>): void;
}

export interface ApplicationCreateOptions extends ApplicationOptions {
  /** Custom server adapter (defaults to Bun adapter) */
  adapter?: ServerAdapter;
}
