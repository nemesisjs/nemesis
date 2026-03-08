/**
 * @nemesisjs/core - NemesisApplication
 *
 * The main application class. Created by NemesisFactory.create().
 * Holds the DI container, module graph, HTTP server adapter, and lifecycle manager.
 */

import type {
  ApplicationOptions,
  InjectionToken,
  Type,
  ILogger,
  PipeTransform,
} from '@nemesisjs/common';
import { ConsoleLogger } from '@nemesisjs/common';

import { LifecycleManager } from '../lifecycle/lifecycle-manager.js';
import { ModuleLoader } from '../module/module-loader.js';
import type { ModuleRef } from '../module/module-ref.js';
import type { NemesisApplicationInterface, ServerAdapter } from '../interfaces/index.js';

export class NemesisApplication implements NemesisApplicationInterface {
  private readonly rootModule: Type<any>;
  private readonly options: ApplicationOptions;
  private readonly logger: ILogger;
  private moduleLoader!: ModuleLoader;
  private lifecycleManager!: LifecycleManager;
  private modules!: Map<Type<any>, ModuleRef>;
  private adapter?: ServerAdapter;
  private globalPrefix: string = '';
  private globalPipes: PipeTransform[] = [];
  private initialized: boolean = false;

  constructor(rootModule: Type<any>, options: ApplicationOptions = {}) {
    this.rootModule = rootModule;
    this.options = options;
    if (options.globalPrefix) {
      this.globalPrefix = options.globalPrefix;
    }

    // Initialize the logger
    if (typeof options.logger === 'object' && 'log' in options.logger) {
      // User provided a custom logger instance
      this.logger = options.logger;
    } else if (options.logger === false) {
      // User explicitly disabled logging, provide a no-op logger
      this.logger = {
        log: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
        verbose: () => {},
      };
    } else {
      // Default to the beautiful ConsoleLogger
      this.logger = new ConsoleLogger('Nemesis');
    }
  }

  /**
   * Initialize the application: load modules, resolve DI, run lifecycle hooks.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.logger.log('Starting application initialization...');

    // Load all modules
    this.moduleLoader = new ModuleLoader(this.logger);
    this.modules = await this.moduleLoader.load(this.rootModule);

    // Create lifecycle manager
    this.lifecycleManager = new LifecycleManager();

    // Run onModuleInit hooks
    await this.lifecycleManager.callModuleInit(this.modules);

    // Run onApplicationBootstrap hooks
    await this.lifecycleManager.callBootstrap(this.modules);

    this.logger.log('Application successfully initialized');
    this.initialized = true;
  }

  /**
   * Set the HTTP server adapter.
   */
  setAdapter(adapter: ServerAdapter): void {
    this.adapter = adapter;
  }

  /**
   * Get the HTTP server adapter.
   */
  getAdapter(): ServerAdapter | undefined {
    return this.adapter;
  }

  /**
   * Start the HTTP server.
   */
  async listen(port: number, host: string = '0.0.0.0'): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.adapter) {
      throw new Error(
        'No server adapter configured. Use @nemesisjs/platform-bun to create an HTTP server.',
      );
    }

    await this.adapter.listen(port, host);
    this.logger.log(`Server listening on ${this.getUrl()}`);
  }

  /**
   * Gracefully shut down the application.
   */
  async close(): Promise<void> {
    if (this.adapter) {
      await this.adapter.close();
    }

    if (this.lifecycleManager) {
      await this.lifecycleManager.callModuleDestroy(this.modules);
      await this.lifecycleManager.callShutdown(this.modules);
    }
  }

  /**
   * Resolve a provider from any module by its token.
   * Searches the root module first, then all modules.
   */
  get<T>(token: InjectionToken<T>): T {
    // Try root module first
    const rootRef = this.modules.get(this.rootModule);
    if (rootRef?.has(token)) {
      return rootRef.get<T>(token);
    }

    // Search all modules
    for (const [, moduleRef] of this.modules) {
      if (moduleRef.has(token)) {
        return moduleRef.get<T>(token);
      }
    }

    // Try resolving from any container
    throw new Error(`Provider not found for token: ${String(token)}`);
  }

  /**
   * Get the URL the server is listening on.
   */
  getUrl(): string {
    return this.adapter?.getUrl() ?? '';
  }

  /**
   * Get the global route prefix.
   */
  getGlobalPrefix(): string {
    return this.globalPrefix;
  }

  /**
   * Set the global route prefix.
   */
  setGlobalPrefix(prefix: string): this {
    this.globalPrefix = prefix.startsWith('/') ? prefix : '/' + prefix;
    return this;
  }

  /**
   * Register global pipes.
   */
  useGlobalPipes(...pipes: PipeTransform[]): this {
    this.globalPipes.push(...pipes);
    return this;
  }

  /**
   * Get registered global pipes.
   */
  getGlobalPipes(): PipeTransform[] {
    return this.globalPipes;
  }

  /**
   * Get the module loader (for introspection).
   */
  getModuleLoader(): ModuleLoader {
    return this.moduleLoader;
  }

  /**
   * Get all loaded modules.
   */
  getModules(): Map<Type<any>, ModuleRef> {
    return this.modules;
  }

  /**
   * Get the root module class.
   */
  getRootModule(): Type<any> {
    return this.rootModule;
  }

  /**
   * Get application options.
   */
  getOptions(): ApplicationOptions {
    return this.options;
  }

  /**
   * Get the configured logger instance.
   */
  getLogger(): ILogger {
    return this.logger;
  }
}
