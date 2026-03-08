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
      MetadataStorage.setMethodPipes(
        (target as any).constructor as Type<any>,
        propertyKey,
        pipes,
      );
    } else {
      MetadataStorage.setClassPipes(target as Type<any>, pipes);
    }
  };
}
