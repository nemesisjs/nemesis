/**
 * @nemesisjs/common - @Injectable and @Inject decorators
 *
 * These decorators work WITHOUT emitDecoratorMetadata.
 * @Injectable marks a class as available for DI.
 * @Inject(token) explicitly declares constructor dependencies by parameter index.
 */

import type { InjectableOptions, InjectionToken, Type } from '../interfaces/index.js';
import { MetadataStorage } from '../metadata/metadata-storage.js';

/**
 * Marks a class as injectable (can be managed by the DI container).
 *
 * @param {InjectableOptions} [options] - Optional configuration (e.g., scope)
 * @returns {ClassDecorator} The class decorator function
 *
 * @example
 * ```ts
 * @Injectable()
 * class UserService {
 *   constructor(@Inject('UserRepo') private repo: UserRepository) {}
 * }
 * ```
 */
export function Injectable(options?: InjectableOptions): ClassDecorator {
  return (target: Function) => {
    MetadataStorage.setInjectable(target as Type<any>, options ?? {});
  };
}

/**
 * Declares a constructor dependency by injection token.
 * This replaces the need for emitDecoratorMetadata — you explicitly
 * tell the container what to inject at each parameter position.
 *
 * @param {InjectionToken} token - The injection token for this parameter
 * @returns {ParameterDecorator} The parameter decorator function
 *
 * @example
 * ```ts
 * @Injectable()
 * class UserService {
 *   constructor(
 *     @Inject('UserRepo') private repo: UserRepository,
 *     @Inject('Logger') private logger: Logger,
 *   ) {}
 * }
 * ```
 */
export function Inject(token: InjectionToken): ParameterDecorator {
  return (target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) => {
    MetadataStorage.setInjection(target as Type<any>, parameterIndex, token);
  };
}
