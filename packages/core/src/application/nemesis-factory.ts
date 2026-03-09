/**
 * @nemesis-js/core - NemesisFactory
 *
 * The entry point for creating NemesisJS applications.
 *
 * @example
 * ```ts
 * import { NemesisFactory } from '@nemesis-js/core';
 * import { AppModule } from './app.module';
 *
 * const app = await NemesisFactory.create(AppModule);
 * await app.listen(3000);
 * ```
 */

import type { ApplicationOptions, Type } from '@nemesis-js/common';
import { NemesisApplication } from './nemesis-application.js';

export class NemesisFactory {
  /**
   * Create a new NemesisJS application from a root module.
   * Initializes the DI container, loads all modules, and runs lifecycle hooks.
   */
  static async create(
    rootModule: Type<any>,
    options: ApplicationOptions = {},
  ): Promise<NemesisApplication> {
    const app = new NemesisApplication(rootModule, options);
    await app.initialize();
    return app;
  }
}
