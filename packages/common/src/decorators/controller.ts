/**
 * @nemesisjs/common - @Controller decorator
 *
 * Marks a class as an HTTP controller with an optional route prefix.
 */

import type { Type } from '../interfaces/index.js';
import { MetadataStorage } from '../metadata/metadata-storage.js';

/**
 * Marks a class as a controller that handles HTTP requests.
 *
 * @param prefix - Route prefix for all routes in this controller (e.g., '/users')
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
    // Controllers are implicitly injectable
    MetadataStorage.setInjectable(target as Type<any>, {});
    MetadataStorage.setController(target as Type<any>, {
      prefix: normalizePath(prefix),
      target: target as Type<any>,
    });
  };
}

/** Normalize a route path: ensure leading slash, no trailing slash */
function normalizePath(path: string): string {
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  return path;
}
