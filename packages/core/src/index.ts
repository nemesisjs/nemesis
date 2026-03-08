/**
 * @nemesisjs/core
 *
 * Core framework module: DI container, module system, application factory, and lifecycle management.
 */

// ─── Application ─────────────────────────────────────────────────────────────
export { NemesisApplication } from './application/nemesis-application.js';
export { NemesisFactory } from './application/nemesis-factory.js';

// ─── Container ───────────────────────────────────────────────────────────────
export { DIContainer } from './container/container.js';

// ─── Module ──────────────────────────────────────────────────────────────────
export { ModuleLoader } from './module/module-loader.js';
export { ModuleRef } from './module/module-ref.js';

// ─── Lifecycle ───────────────────────────────────────────────────────────────
export { LifecycleManager } from './lifecycle/lifecycle-manager.js';

// ─── Errors ──────────────────────────────────────────────────────────────────
export {
  NemesisError,
  CircularDependencyError,
  UnknownTokenError,
  ProviderNotFoundError,
  ModuleNotFoundError,
  InvalidProviderError,
  MissingInjectionTokenError,
} from './errors/index.js';

// ─── Interfaces ──────────────────────────────────────────────────────────────
export type {
  NemesisApplicationInterface,
  ServerAdapter,
  ApplicationCreateOptions,
} from './interfaces/index.js';
