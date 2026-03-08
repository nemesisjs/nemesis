/**
 * @nemesisjs/common - @Controller decorator
 *
 * Marks a class as an HTTP controller with an optional route prefix.
 */

import type { Type } from '../interfaces/index.js';
import { MetadataStorage } from '../metadata/metadata-storage.js';
import { normalizePath } from '../utils/path.js';

/**
 * Marks a class as a controller that handles HTTP requests.
 *
 * @param {string} prefix - Route prefix for all routes in this controller (e.g., '/users')
 * @returns {ClassDecorator} The class decorator function
 *
 * @example
 * ```ts
 * @Controller('/users')
 * class UserController {
 *   @Get('/')
 *   getAll(ctx: RequestContext) { ... }
 * }
 * ```
 */
export function Controller(prefix: string = '/'): ClassDecorator {
  return (target: Function) => {
    const typedTarget = target as Type<unknown>;
    // Controllers are implicitly injectable
    MetadataStorage.setInjectable(typedTarget, {});
    MetadataStorage.setController(typedTarget, {
      prefix: normalizePath(prefix),
      target: typedTarget,
    });
  };
}
