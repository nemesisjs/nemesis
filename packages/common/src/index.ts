/**
 * @nemesisjs/common
 *
 * Core decorators, interfaces, exceptions, and constants for the NemesisJS framework.
 * This package has zero runtime dependencies.
 */

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

