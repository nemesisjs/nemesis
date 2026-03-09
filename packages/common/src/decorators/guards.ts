/**
 * @nemesis-js/common - @UseGuards decorator
 *
 * Applies guard classes to controllers or individual route handlers.
 * Guards determine if a request should be handled.
 */

import type { CanActivate, Type } from '../interfaces/index.js';
import { MetadataStorage } from '../metadata/metadata-storage.js';

/**
 * Binds guards to the scope of the controller or method.
 * Guards are executed in the order they are listed.
 *
 * @param {...Type<CanActivate>} guards - Guard classes to apply
 * @returns {ClassDecorator & MethodDecorator} The decorator function
 *
 * @example
 * ```ts
 * // Method-level guard
 * @UseGuards(AuthGuard, RolesGuard)
 * @Get('/admin')
 * adminOnly(ctx: RequestContext) { ... }
 *
 * // Controller-level guard (applies to all methods)
 * @UseGuards(AuthGuard)
 * @Controller('/admin')
 * class AdminController { ... }
 * ```
 */
export function UseGuards(...guards: Type<CanActivate>[]): ClassDecorator & MethodDecorator {
  return (
    target: Object | Function,
    propertyKey?: string | symbol,
    _descriptor?: PropertyDescriptor,
  ) => {
    if (propertyKey !== undefined) {
      // Method-level: target is the prototype, constructor holds class metadata
      const constructor = (target as { constructor: Type<unknown> }).constructor;
      MetadataStorage.setMethodGuards(constructor, propertyKey, guards);
    } else {
      // Class-level: target is the constructor function itself
      MetadataStorage.setClassGuards(target as Type<unknown>, guards);
    }
  };
}
