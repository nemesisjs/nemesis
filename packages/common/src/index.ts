/**
 * @nemesisjs/common
 *
 * Core decorators, interfaces, exceptions, and constants for the NemesisJS framework.
 * Imports reflect-metadata once to enable emitDecoratorMetadata support across the framework.
 */

// Must be the first import — polyfills Reflect.defineMetadata / Reflect.getMetadata
// so that emitDecoratorMetadata: true works for implicit constructor-param injection.
import 'reflect-metadata';

// ─── Constants ───────────────────────────────────────────────────────────────
export {
  HTTP_STATUS,
  HTTP_METHODS,
  SCOPE,
  PARAM_TYPE,
  LOG_LEVELS,
  type HttpStatusCode,
  type HttpMethod,
  type Scope,
  type ParamType,
  type LogLevel,
} from './constants.js';

// ─── Interfaces ──────────────────────────────────────────────────────────────
export type {
  Type,
  Abstract,
  InjectionToken,
  ClassProvider,
  ValueProvider,
  FactoryProvider,
  ExistingProvider,
  Provider,
  ModuleMetadata,
  DynamicModule,
  ExecutionContext,
  HttpArgumentsHost,
  CanActivate,
  ArgumentMetadata,
  PipeTransform,
  CallHandler,
  NemesisInterceptor,
  NemesisMiddleware,
  OnModuleInit,
  OnModuleDestroy,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  RouteMetadata,
  RouteParamMetadata,
  ControllerMetadata,
  ExceptionFilter,
  ApplicationOptions,
  CorsOptions,
  InjectableOptions,
} from './interfaces/index.js';

// ─── Decorators ──────────────────────────────────────────────────────────────
export {
  Injectable,
  Inject,
  Module,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Head,
  Options,
  Body,
  Query,
  Param,
  Headers,
  Req,
  UseGuards,
  UsePipes,
  UseInterceptors,
} from './decorators/index.js';

// ─── Exceptions ──────────────────────────────────────────────────────────────
export {
  HttpException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  MethodNotAllowedException,
  ConflictException,
  UnprocessableEntityException,
  TooManyRequestsException,
  InternalServerErrorException,
  NotImplementedException,
  BadGatewayException,
  ServiceUnavailableException,
  GatewayTimeoutException,
} from './exceptions/index.js';

// ─── Metadata Storage ────────────────────────────────────────────────────────
export { MetadataStorage } from './metadata/metadata-storage.js';

// ─── Utilities ───────────────────────────────────────────────────────────────
export { normalizePath, joinPaths } from './utils/path.js';
// ─── Logger ──────────────────────────────────────────────────────────────────
export { type ILogger } from './logger/logger.interface.js';
export { ConsoleLogger } from './logger/console-logger.service.js';
export { Colors, colorize, type ColorCode } from './logger/colors.js';
