/**
 * @nemesis-js/common - Core Interfaces
 *
 * All type definitions that form the contract between NemesisJS packages.
 */

import type { HttpMethod, ParamType, Scope, LogLevel } from '../constants.js';
import type { ILogger } from '../logger/logger.interface.js';

// ─── Utility Types ───────────────────────────────────────────────────────────

/** Represents a constructable class type */
export interface Type<T = any> {
  new (...args: any[]): T;
}

/** Abstract class type (for interface-like tokens) */
export interface Abstract<T = any> {
  prototype: T;
}

/** Injection token: can be a string, symbol, or class reference */
export type InjectionToken<T = any> = string | symbol | Type<T> | Abstract<T>;

// ─── Provider Definitions ────────────────────────────────────────────────────

/** A simple class provider - the class itself is both token and implementation */
export interface ClassProvider<T = unknown> {
  provide: InjectionToken<T>;
  useClass: Type<T>;
  scope?: Scope;
}

/** A value provider - provides a static value */
export interface ValueProvider<T = unknown> {
  provide: InjectionToken<T>;
  useValue: T;
}

/** A factory provider - creates values dynamically */
export interface FactoryProvider<T = unknown> {
  provide: InjectionToken<T>;
  useFactory: (...args: unknown[]) => T | Promise<T>;
  inject?: InjectionToken[];
}

/** An existing provider - aliases one token to another */
export interface ExistingProvider<T = unknown> {
  provide: InjectionToken<T>;
  useExisting: InjectionToken<T>;
}

/** Union of all provider types */
export type Provider<T = unknown> =
  | Type<T>
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>
  | ExistingProvider<T>;

// ─── Module Definitions ──────────────────────────────────────────────────────

export interface ModuleMetadata {
  /** Imported modules whose exported providers are available in this module */
  imports?: Array<Type<unknown> | DynamicModule>;
  /** Controller classes to register */
  controllers?: Type<unknown>[];
  /** Providers (services) available within this module */
  providers?: Provider[];
  /** Providers to export for use by importing modules */
  exports?: Array<InjectionToken | Provider>;
  /** If true, this module's providers are available globally */
  global?: boolean;
}

export interface DynamicModule extends ModuleMetadata {
  module: Type<unknown>;
}

// ─── Guard Interface ─────────────────────────────────────────────────────────

export interface ExecutionContext {
  /** Get the handler function */
  getHandler(): Function;
  /** Get the controller class */
  getClass(): Type<unknown>;
  /** Get the request object */
  getRequest<T = unknown>(): T;
  /** Get the response object */
  getResponse<T = unknown>(): T;
  /** Get the type of context (http, ws, rpc) */
  getType(): string;
  /** Switch to HTTP-specific context */
  switchToHttp(): HttpArgumentsHost;
}

export interface HttpArgumentsHost {
  getRequest<T = unknown>(): T;
  getResponse<T = unknown>(): T;
  getNext<T = unknown>(): T;
}

export interface CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}

// ─── Pipe Interface ──────────────────────────────────────────────────────────

export interface ArgumentMetadata {
  type: ParamType;
  metatype?: Type<unknown>;
  data?: string;
  target?: Type<unknown>;
  methodKey?: string | symbol;
  parameterIndex?: number;
}

export interface PipeTransform<T = unknown, R = unknown> {
  transform(value: T, metadata: ArgumentMetadata): R | Promise<R>;
}

// ─── Interceptor Interface ───────────────────────────────────────────────────

export interface CallHandler<T = unknown> {
  handle(): Promise<T>;
}

export interface NemesisInterceptor<T = unknown, R = unknown> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Promise<R>;
}

// ─── Middleware Interface ────────────────────────────────────────────────────

export interface NemesisMiddleware {
  use(request: Request, next: () => Promise<Response>): Promise<Response>;
}

// ─── Lifecycle Hooks ─────────────────────────────────────────────────────────

export interface OnModuleInit {
  onModuleInit(): void | Promise<void>;
}

export interface OnModuleDestroy {
  onModuleDestroy(): void | Promise<void>;
}

export interface OnApplicationBootstrap {
  onApplicationBootstrap(): void | Promise<void>;
}

export interface OnApplicationShutdown {
  onApplicationShutdown(signal?: string): void | Promise<void>;
}

// ─── Route Metadata ──────────────────────────────────────────────────────────

export interface RouteMetadata {
  method: HttpMethod;
  path: string;
  propertyKey: string | symbol;
}

export interface RouteParamMetadata {
  type: ParamType;
  index: number;
  data?: string;
  metatype?: Type<unknown>;
  pipes?: Type<PipeTransform>[];
}

export interface ControllerMetadata {
  prefix: string;
  target: Type<unknown>;
}

// ─── Exception Filter Interface ──────────────────────────────────────────────

export interface ExceptionFilter<T = unknown> {
  catch(exception: T, context: ExecutionContext): Response | Promise<Response>;
}

// ─── Application Options ────────────────────────────────────────────────────

export interface ApplicationOptions {
  /** Enable CORS */
  cors?: boolean | CorsOptions;
  /** Global prefix for all routes */
  globalPrefix?: string;
  /** Logger configuration */
  logger?: boolean | LogLevel[] | ILogger;
}

export interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

// ─── Injectable Options ──────────────────────────────────────────────────────

export interface InjectableOptions {
  scope?: Scope;
}

// ─── Re-export log level type for backwards compat ───────────────────────────
export type { LogLevel } from '../constants.js';

// ─── Logger Re-exports ───────────────────────────────────────────────────────
export type { ILogger } from '../logger/logger.interface.js';
