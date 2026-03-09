/**
 * @nemesis-js/common - HTTP Method Decorators
 *
 * @Get, @Post, @Put, @Delete, @Patch, @Head, @Options
 * These decorators register route metadata on controller methods.
 */

import { HTTP_METHODS, type HttpMethod } from '../constants.js';
import type { Type } from '../interfaces/index.js';
import { MetadataStorage } from '../metadata/metadata-storage.js';
import { normalizePath } from '../utils/path.js';

/**
 * Factory for creating HTTP method decorators.
 *
 * @param {HttpMethod} method - The HTTP method this decorator handles
 * @returns {(path?: string) => MethodDecorator} A decorator factory for the given method
 */
function createMethodDecorator(method: HttpMethod) {
  return (path: string = '/'): MethodDecorator => {
    return (target: Object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) => {
      const normalizedPath = normalizePath(path);
      MetadataStorage.setRoute(target.constructor as Type<unknown>, propertyKey, {
        method,
        path: normalizedPath,
        propertyKey: propertyKey as string,
      });
    };
  };
}

/**
 * Routes HTTP GET requests to the specified path.
 *
 * @param {string} path - Route path (default: '/')
 * @returns {MethodDecorator} The method decorator
 * @example `@Get('/users/:id')`
 */
export const Get = createMethodDecorator(HTTP_METHODS.GET);

/**
 * Routes HTTP POST requests to the specified path.
 *
 * @param {string} path - Route path (default: '/')
 * @returns {MethodDecorator} The method decorator
 * @example `@Post('/users')`
 */
export const Post = createMethodDecorator(HTTP_METHODS.POST);

/**
 * Routes HTTP PUT requests to the specified path.
 *
 * @param {string} path - Route path (default: '/')
 * @returns {MethodDecorator} The method decorator
 * @example `@Put('/users/:id')`
 */
export const Put = createMethodDecorator(HTTP_METHODS.PUT);

/**
 * Routes HTTP DELETE requests to the specified path.
 *
 * @param {string} path - Route path (default: '/')
 * @returns {MethodDecorator} The method decorator
 * @example `@Delete('/users/:id')`
 */
export const Delete = createMethodDecorator(HTTP_METHODS.DELETE);

/**
 * Routes HTTP PATCH requests to the specified path.
 *
 * @param {string} path - Route path (default: '/')
 * @returns {MethodDecorator} The method decorator
 * @example `@Patch('/users/:id')`
 */
export const Patch = createMethodDecorator(HTTP_METHODS.PATCH);

/**
 * Routes HTTP HEAD requests to the specified path.
 *
 * @param {string} path - Route path (default: '/')
 * @returns {MethodDecorator} The method decorator
 */
export const Head = createMethodDecorator(HTTP_METHODS.HEAD);

/**
 * Routes HTTP OPTIONS requests to the specified path.
 *
 * @param {string} path - Route path (default: '/')
 * @returns {MethodDecorator} The method decorator
 */
export const Options = createMethodDecorator(HTTP_METHODS.OPTIONS);

