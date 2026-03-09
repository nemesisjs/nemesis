/**
 * @nemesis-js/core - Error classes
 *
 * Framework-level errors for DI resolution, module loading, and lifecycle issues.
 */

/** Base class for all NemesisJS framework errors. */
export class NemesisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when a circular dependency is detected during DI resolution.
 *
 * @example
 * ServiceA depends on ServiceB which depends on ServiceA.
 */
export class CircularDependencyError extends NemesisError {
  constructor(token: string) {
    super(
      `Circular dependency detected while resolving "${token}". ` +
        `Review the dependency chain and use forwardRef() if needed.`,
    );
  }
}

/**
 * Thrown when no provider is registered for a given token.
 */
export class UnknownTokenError extends NemesisError {
  /**
   * @param {string} tokenStr - The already-stringified token name
   */
  constructor(tokenStr: string) {
    super(
      `No provider found for token "${tokenStr}". ` +
        `Make sure it is registered in the module's providers array.`,
    );
  }
}

/**
 * Thrown when a provider token exists in context but not in a specific module.
 */
export class ProviderNotFoundError extends NemesisError {
  /**
   * @param {string | symbol} token - The injection token that was not found
   * @param {string} moduleName - The module that was searched
   */
  constructor(token: string | symbol, moduleName: string) {
    const tokenStr = typeof token === 'symbol' ? token.toString() : token;
    super(
      `Provider "${tokenStr}" was not found in module "${moduleName}". ` +
        `Is it listed in providers or imported from another module?`,
    );
  }
}

/**
 * Thrown when a class decorated with @Module cannot be found.
 */
export class ModuleNotFoundError extends NemesisError {
  /**
   * @param {string} moduleName - The class name that was not found
   */
  constructor(moduleName: string) {
    super(
      `Module "${moduleName}" was not found. ` +
        `Make sure it is decorated with @Module() and imported correctly.`,
    );
  }
}

/**
 * Thrown when a provider configuration object is not valid.
 */
export class InvalidProviderError extends NemesisError {
  /**
   * @param {unknown} provider - The invalid provider value
   */
  constructor(provider: unknown) {
    super(
      `Invalid provider configuration: ${JSON.stringify(provider)}. ` +
        `A provider must be a class or an object with { provide, useClass|useValue|useFactory|useExisting }.`,
    );
  }
}

/**
 * Thrown when a constructor parameter is missing a required `@Inject` token.
 */
export class MissingInjectionTokenError extends NemesisError {
  /**
   * @param {string} className - The class with the missing token
   * @param {number} paramIndex - The zero-based parameter index
   */
  constructor(className: string, paramIndex: number) {
    super(
      `Missing injection token for parameter at index ${paramIndex} in "${className}". ` +
        `Use @Inject(token) to declare the dependency explicitly.`,
    );
  }
}
