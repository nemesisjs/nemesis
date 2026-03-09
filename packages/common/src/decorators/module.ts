/**
 * @nemesis-js/common - @Module decorator
 *
 * Defines a NemesisJS module with its imports, controllers, providers, and exports.
 */

import type { ModuleMetadata, Type } from '../interfaces/index.js';
import { MetadataStorage } from '../metadata/metadata-storage.js';

/**
 * Marks a class as a NemesisJS module.
 *
 * @example
 * ```ts
 * @Module({
 *   imports: [DatabaseModule],
 *   controllers: [UserController],
 *   providers: [
 *     { provide: 'UserService', useClass: UserService },
 *   ],
 *   exports: ['UserService'],
 * })
 * class UserModule {}
 * ```
 */
export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: Function) => {
    MetadataStorage.setModule(target as Type<any>, metadata);
  };
}
