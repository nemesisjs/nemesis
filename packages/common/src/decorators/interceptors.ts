/**
 * @nemesisjs/common - @UseInterceptors decorator
 *
 * Applies interceptor classes to controllers or individual route handlers.
 * Interceptors wrap handler execution for cross-cutting concerns.
 */

import type { NemesisInterceptor, Type } from '../interfaces/index.js';
import { MetadataStorage } from '../metadata/metadata-storage.js';

/**
 * Binds interceptors to the scope of the controller or method.
 *
 * @param {...Type<NemesisInterceptor>} interceptors - Interceptor classes to apply
 * @returns {ClassDecorator & MethodDecorator} The decorator function
 *
 * @example
 * ```ts
 * @UseInterceptors(LoggingInterceptor, TransformInterceptor)
 * @Controller('/users')
 * class UserController { ... }
 * ```
 */
export function UseInterceptors(
  ...interceptors: Type<NemesisInterceptor>[]
): ClassDecorator & MethodDecorator {
  return (
    target: Object | Function,
    propertyKey?: string | symbol,
    _descriptor?: PropertyDescriptor,
  ) => {
    if (propertyKey !== undefined) {
      const constructor = (target as { constructor: Type<unknown> }).constructor;
      MetadataStorage.setMethodInterceptors(constructor, propertyKey, interceptors);
    } else {
      MetadataStorage.setClassInterceptors(target as Type<unknown>, interceptors);
    }
  };
}
