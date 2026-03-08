/**
 * @nemesisjs/common - Parameter Decorators
 *
 * @Body, @Query, @Param, @Headers, @Req
 * These decorators declare how controller method parameters are resolved from the request.
 */

import { PARAM_TYPE, type ParamType } from '../constants.js';
import type { PipeTransform, Type } from '../interfaces/index.js';
import { MetadataStorage } from '../metadata/metadata-storage.js';

/**
 * Factory for creating parameter decorators.
 *
 * @param {ParamType} type - The parameter source type (body, query, param, etc.)
 * @returns {(data?: string, ...pipes: Type<PipeTransform>[]) => ParameterDecorator} The decorator factory
 */
function createParamDecorator(type: ParamType) {
  return (data?: string, ...pipes: Type<PipeTransform>[]): ParameterDecorator => {
    return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
      if (propertyKey === undefined) return;
      const constructor = (target as { constructor: Type<unknown> }).constructor;
      
      // Attempt to infer the parameter metatype via TypeScript reflection (only available
      // when reflect-metadata is loaded with emitDecoratorMetadata: true).
      const paramTypes =
        typeof (Reflect as any).getMetadata === 'function'
          ? (Reflect as any).getMetadata('design:paramtypes', target, propertyKey)
          : undefined;
      const metatype = paramTypes ? paramTypes[parameterIndex] : undefined;

      MetadataStorage.setRouteParam(constructor, propertyKey, {
        type,
        index: parameterIndex,
        data,
        metatype,
        pipes: pipes.length > 0 ? pipes : undefined,
      });
    };
  };
}

/**
 * Extracts the request body.
 *
 * @param {string} [data] - Optional property key to extract from the body
 * @param {...Type<PipeTransform>} pipes - Optional pipe classes to apply
 * @returns {ParameterDecorator} The parameter decorator
 *
 * @example `@Body() createUserDto: CreateUserDto`
 * @example `@Body('name') name: string`
 */
export const Body = createParamDecorator(PARAM_TYPE.BODY);

/**
 * Extracts query parameters.
 *
 * @param {string} [data] - Optional specific query parameter key
 * @param {...Type<PipeTransform>} pipes - Optional pipe classes to apply
 * @returns {ParameterDecorator} The parameter decorator
 *
 * @example `@Query() query: Record<string, string>`
 * @example `@Query('page') page: string`
 */
export const Query = createParamDecorator(PARAM_TYPE.QUERY);

/**
 * Extracts route parameters.
 *
 * @param {string} [data] - Optional specific parameter key
 * @param {...Type<PipeTransform>} pipes - Optional pipe classes to apply
 * @returns {ParameterDecorator} The parameter decorator
 *
 * @example `@Param('id') id: string`
 */
export const Param = createParamDecorator(PARAM_TYPE.PARAM);

/**
 * Extracts request headers.
 *
 * @param {string} [data] - Optional specific header key
 * @param {...Type<PipeTransform>} pipes - Optional pipe classes to apply
 * @returns {ParameterDecorator} The parameter decorator
 *
 * @example `@Headers('authorization') auth: string`
 */
export const Headers = createParamDecorator(PARAM_TYPE.HEADERS);

/**
 * Injects the raw Request object.
 *
 * @returns {ParameterDecorator} The parameter decorator
 * @example `@Req() request: Request`
 */
export const Req = createParamDecorator(PARAM_TYPE.REQUEST);
