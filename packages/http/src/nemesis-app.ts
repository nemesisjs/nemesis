/**
 * @nemesisjs/http - NemesisApp
 *
 * Facade for building and running NemesisJS applications.
 * Provides a cleaner API surface and integrates HttpApplication logic.
 */

import { Type } from '@nemesisjs/common';
import { NemesisApplication } from '@nemesisjs/core';
import { createHttpApp, type HttpApplicationOptions } from './http-application.js';

export class NemesisApp {
  /**
   * Create an HTTP Application.
   *
   * @param {Type<unknown>} rootModule - The root module of the application
   * @param {HttpApplicationOptions} [options] - Configuration options (logger, cors, server, etc.)
   * @returns {Promise<NemesisApplication>} The fully configured NemesisApplication
   *
   * @example
   * ```ts
   * import { NemesisApp } from '@nemesisjs/http';
   * import { AppModule } from './app.module';
   *
   * const app = await NemesisApp.createHttp(AppModule, { logger: true });
   * await app.listen(3000);
   * ```
   */
  static async createHttp(
    rootModule: Type<unknown>,
    options?: HttpApplicationOptions,
  ): Promise<NemesisApplication> {
    return createHttpApp(rootModule, options);
  }
}
