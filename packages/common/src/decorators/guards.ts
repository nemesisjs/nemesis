/**
 * @nemesisjs/common - @UseGuards decorator
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
      // Method-level
      MetadataStorage.setMethodGuards(
        (target as any).constructor as Type<any>,
        propertyKey,
        guards,
      );
    } else {
      // Class-level
      MetadataStorage.setClassGuards(target as Type<any>, guards);
    }
  };
}
