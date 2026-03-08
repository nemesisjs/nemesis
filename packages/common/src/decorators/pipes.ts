/**
 * @nemesisjs/common - @UsePipes decorator
 *
 * Applies pipe classes to controllers or individual route handlers.
 * Pipes transform and validate handler parameters.
 */

import type { PipeTransform, Type } from '../interfaces/index.js';
import { MetadataStorage } from '../metadata/metadata-storage.js';

/**
 * Binds pipes to the scope of the controller or method.
 *
 * @param {...Type<PipeTransform>} pipes - Pipe classes to apply
 * @returns {ClassDecorator & MethodDecorator} The decorator function
 *
 * @example
 * ```ts
 * @UsePipes(ValidationPipe)
 * @Post('/users')
 * createUser(@Body() dto: CreateUserDto) { ... }
 * ```
 */
export function UsePipes(...pipes: Type<PipeTransform>[]): ClassDecorator & MethodDecorator {
  return (
    target: Object | Function,
    propertyKey?: string | symbol,
    _descriptor?: PropertyDescriptor,
  ) => {
    if (propertyKey !== undefined) {
      const constructor = (target as { constructor: Type<unknown> }).constructor;
      MetadataStorage.setMethodPipes(constructor, propertyKey, pipes);
    } else {
      MetadataStorage.setClassPipes(target as Type<unknown>, pipes);
    }
  };
}
