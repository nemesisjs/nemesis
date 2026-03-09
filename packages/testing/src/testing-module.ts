/**
 * @nemesis-js/testing - TestingModule
 *
 * Creates a test-friendly version of a NemesisJS module.
 * Supports overriding providers for mocking/stubbing.
 *
 * @example
 * ```ts
 * const module = await TestingModule.create({
 *   controllers: [UserController],
 *   providers: [
 *     { provide: 'UserService', useClass: UserService },
 *   ],
 * });
 *
 * // Override a provider
 * module.overrideProvider('UserService', { useValue: mockUserService });
 *
 * const controller = module.get(UserController);
 * ```
 */

import type {
  InjectionToken,
  ModuleMetadata,
  Provider,
  Type,
} from '@nemesis-js/common';
import { Module } from '@nemesis-js/common';
import { NemesisApplication } from '@nemesis-js/core';

export class TestingModule {
  private readonly app: NemesisApplication;

  private constructor(app: NemesisApplication) {
    this.app = app;
  }

  /**
   * Create a testing module from metadata.
   */
  static async create(metadata: ModuleMetadata): Promise<TestingModule> {
    // Create a temporary module class with the given metadata
    @Module(metadata)
    class TestModule {}

    const app = new NemesisApplication(TestModule);
    await app.initialize();

    return new TestingModule(app);
  }

  /**
   * Resolve a provider by token from the test module.
   */
  get<T>(token: InjectionToken<T>): T {
    return this.app.get<T>(token);
  }

  /**
   * Get the underlying NemesisApplication.
   */
  getApp(): NemesisApplication {
    return this.app;
  }

  /**
   * Close the testing module and run shutdown hooks.
   */
  async close(): Promise<void> {
    await this.app.close();
  }
}

/**
 * Builder pattern for creating testing modules with overrides.
 *
 * @example
 * ```ts
 * const module = await Test.createModule({
 *   controllers: [UserController],
 *   providers: [UserService],
 * })
 *   .overrideProvider(UserService, { useValue: mockService })
 *   .compile();
 * ```
 */
export class Test {
  static createModule(metadata: ModuleMetadata): TestingModuleBuilder {
    return new TestingModuleBuilder(metadata);
  }
}

export class TestingModuleBuilder {
  private readonly metadata: ModuleMetadata;
  private readonly overrides: Map<InjectionToken, Provider> = new Map();

  constructor(metadata: ModuleMetadata) {
    this.metadata = { ...metadata };
  }

  /**
   * Override a provider with a mock/stub.
   */
  overrideProvider<T>(token: InjectionToken<T>, provider: Omit<Provider<T>, 'provide'> & { useValue?: T; useClass?: Type<T>; useFactory?: (...args: any[]) => T }): this {
    this.overrides.set(token, { provide: token, ...provider } as Provider<T>);
    return this;
  }

  /**
   * Compile the testing module with all overrides applied.
   */
  async compile(): Promise<TestingModule> {
    // Apply overrides to providers
    const providers = [...(this.metadata.providers ?? [])];

    for (const [token, override] of this.overrides) {
      // Remove original provider for this token
      const index = providers.findIndex((p) => {
        if (typeof p === 'function') return p === token;
        if (typeof p === 'object' && 'provide' in p) return p.provide === token;
        return false;
      });

      if (index >= 0) {
        providers[index] = override;
      } else {
        providers.push(override);
      }
    }

    return TestingModule.create({
      ...this.metadata,
      providers,
    });
  }
}
