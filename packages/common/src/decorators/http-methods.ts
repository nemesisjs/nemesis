/**
 * @nemesisjs/common - HTTP Method Decorators
 *
 * @Get, @Post, @Put, @Delete, @Patch, @Head, @Options
 * These decorators register route metadata on controller methods.
 */

import { HTTP_METHODS, type HttpMethod } from '../constants.js';
import type { Type } from '../interfaces/index.js';
import { MetadataStorage } from '../metadata/metadata-storage.js';

/** Factory for creating HTTP method decorators */
function createMethodDecorator(method: HttpMethod) {
  return (path: string = '/'): MethodDecorator => {
    return (target: Object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) => {
      const normalizedPath = normalizePath(path);
      MetadataStorage.setRoute(target.constructor as Type<any>, propertyKey, {
        method,
        path: normalizedPath,
        propertyKey: propertyKey as string,
      });
    };
  };
}

/**
 * Routes HTTP GET requests to the specified path.
 * @example `@Get('/users/:id')`
 */
export const Get = createMethodDecorator(HTTP_METHODS.GET);

/**
 * Routes HTTP POST requests to the specified path.
 * @example `@Post('/users')`
 */
export const Post = createMethodDecorator(HTTP_METHODS.POST);

/**
 * Routes HTTP PUT requests to the specified path.
 * @example `@Put('/users/:id')`
 */
export const Put = createMethodDecorator(HTTP_METHODS.PUT);

/**
 * Routes HTTP DELETE requests to the specified path.
 * @example `@Delete('/users/:id')`
 */
export const Delete = createMethodDecorator(HTTP_METHODS.DELETE);

/**
 * Routes HTTP PATCH requests to the specified path.
 * @example `@Patch('/users/:id')`
 */
export const Patch = createMethodDecorator(HTTP_METHODS.PATCH);

/**
 * Routes HTTP HEAD requests to the specified path.
 */
export const Head = createMethodDecorator(HTTP_METHODS.HEAD);

/**
 * Routes HTTP OPTIONS requests to the specified path.
 */
export const Options = createMethodDecorator(HTTP_METHODS.OPTIONS);

/** Normalize path: ensure leading slash, no trailing slash (unless root) */
function normalizePath(path: string): string {
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  return path;
}
