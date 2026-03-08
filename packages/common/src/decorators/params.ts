/**
 * @nemesisjs/common - Parameter Decorators
 *
 * @Body, @Query, @Param, @Headers, @Req
 * These decorators declare how controller method parameters are resolved from the request.
 */

import { PARAM_TYPE, type ParamType } from '../constants.js';
import type { PipeTransform, Type } from '../interfaces/index.js';
import { MetadataStorage } from '../metadata/metadata-storage.js';

/** Factory for creating parameter decorators */
function createParamDecorator(type: ParamType) {
  return (data?: string, ...pipes: Type<PipeTransform>[]): ParameterDecorator => {
    return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
      if (propertyKey === undefined) return;
      MetadataStorage.setRouteParam(target.constructor as Type<any>, propertyKey, {
        type,
        index: parameterIndex,
        data,
        pipes: pipes.length > 0 ? pipes : undefined,
      });
    };
  };
}

/**
 * Extracts the request body.
 * @param data - Optional property key to extract from the body
 * @example `@Body() createUserDto: CreateUserDto`
 * @example `@Body('name') name: string`
 */
export const Body = createParamDecorator(PARAM_TYPE.BODY);

/**
 * Extracts query parameters.
 * @param data - Optional specific query parameter key
 * @example `@Query() query: Record<string, string>`
 * @example `@Query('page') page: string`
 */
export const Query = createParamDecorator(PARAM_TYPE.QUERY);

/**
 * Extracts route parameters.
 * @param data - Optional specific parameter key
 * @example `@Param('id') id: string`
 */
export const Param = createParamDecorator(PARAM_TYPE.PARAM);

/**
 * Extracts request headers.
 * @param data - Optional specific header key
 * @example `@Headers('authorization') auth: string`
 */
export const Headers = createParamDecorator(PARAM_TYPE.HEADERS);

/**
 * Injects the raw Request object.
 * @example `@Req() request: Request`
 */
export const Req = createParamDecorator(PARAM_TYPE.REQUEST);
