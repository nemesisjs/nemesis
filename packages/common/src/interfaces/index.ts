/**
 * @nemesisjs/common - Core Interfaces
 *
 * All type definitions that form the contract between NemesisJS packages.
 */

import type { HttpMethod, HttpStatusCode, ParamType, Scope } from '../constants.js';

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
export interface ClassProvider<T = any> {
  provide: InjectionToken<T>;
  useClass: Type<T>;
  scope?: Scope;
}

/** A value provider - provides a static value */
export interface ValueProvider<T = any> {
  provide: InjectionToken<T>;
  useValue: T;
}

/** A factory provider - creates values dynamically */
export interface FactoryProvider<T = any> {
  provide: InjectionToken<T>;
  useFactory: (...args: any[]) => T | Promise<T>;
  inject?: InjectionToken[];
}

/** An existing provider - aliases one token to another */
export interface ExistingProvider<T = any> {
  provide: InjectionToken<T>;
  useExisting: InjectionToken<T>;
}

/** Union of all provider types */
export type Provider<T = any> =
  | Type<T>
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>
  | ExistingProvider<T>;

// ─── Module Definitions ──────────────────────────────────────────────────────

export interface ModuleMetadata {
  /** Imported modules whose exported providers are available in this module */
  imports?: Array<Type<any> | DynamicModule>;
  /** Controller classes to register */
  controllers?: Type<any>[];
  /** Providers (services) available within this module */
  providers?: Provider[];
  /** Providers to export for use by importing modules */
  exports?: Array<InjectionToken | Provider>;
  /** If true, this module's providers are available globally */
  global?: boolean;
}

export interface DynamicModule extends ModuleMetadata {
  module: Type<any>;
}

// ─── Guard Interface ─────────────────────────────────────────────────────────

export interface ExecutionContext {
  /** Get the handler function */
  getHandler(): Function;
  /** Get the controller class */
  getClass(): Type<any>;
  /** Get the request object */
  getRequest<T = any>(): T;
  /** Get the response object */
  getResponse<T = any>(): T;
  /** Get the type of context (http, ws, rpc) */
  getType(): string;
  /** Switch to HTTP-specific context */
  switchToHttp(): HttpArgumentsHost;
}

export interface HttpArgumentsHost {
  getRequest<T = any>(): T;
  getResponse<T = any>(): T;
  getNext<T = any>(): T;
}

export interface CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}

// ─── Pipe Interface ──────────────────────────────────────────────────────────

export interface ArgumentMetadata {
  type: ParamType;
  metatype?: Type<any>;
  data?: string;
}

export interface PipeTransform<T = any, R = any> {
  transform(value: T, metadata: ArgumentMetadata): R | Promise<R>;
}

// ─── Interceptor Interface ───────────────────────────────────────────────────

export interface CallHandler<T = any> {
  handle(): Promise<T>;
}

export interface NemesisInterceptor<T = any, R = any> {
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
  pipes?: Type<PipeTransform>[];
}

export interface ControllerMetadata {
  prefix: string;
  target: Type<any>;
}

// ─── Exception Filter Interface ──────────────────────────────────────────────

export interface ExceptionFilter<T = any> {
  catch(exception: T, context: ExecutionContext): Response | Promise<Response>;
}

// ─── Application Options ────────────────────────────────────────────────────

export interface ApplicationOptions {
  /** Enable CORS */
  cors?: boolean | CorsOptions;
  /** Global prefix for all routes */
  globalPrefix?: string;
  /** Logger configuration */
  logger?: boolean | LogLevel[];
}

export interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  LOG: 'log',
  DEBUG: 'debug',
  VERBOSE: 'verbose',
} as const;

export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

// ─── Injectable Options ──────────────────────────────────────────────────────

export interface InjectableOptions {
  scope?: Scope;
}
