/**
 * @nemesisjs/core - Error classes
 *
 * Framework-level errors for DI resolution, module loading, and lifecycle issues.
 */

export class NemesisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class CircularDependencyError extends NemesisError {
  constructor(token: string) {
    super(
      `Circular dependency detected while resolving "${token}". ` +
        `Review the dependency chain and use forwardRef() if needed.`,
    );
  }
}

export class UnknownTokenError extends NemesisError {
  constructor(token: string | symbol) {
    const tokenStr = typeof token === 'symbol' ? token.toString() : token;
    super(
      `No provider found for token "${tokenStr}". ` +
        `Make sure it is registered in the module's providers array.`,
    );
  }
}

export class ProviderNotFoundError extends NemesisError {
  constructor(token: string | symbol, moduleName: string) {
    const tokenStr = typeof token === 'symbol' ? token.toString() : token;
    super(
      `Provider "${tokenStr}" was not found in module "${moduleName}". ` +
        `Is it listed in providers or imported from another module?`,
    );
  }
}

export class ModuleNotFoundError extends NemesisError {
  constructor(moduleName: string) {
    super(
      `Module "${moduleName}" was not found. ` +
        `Make sure it is decorated with @Module() and imported correctly.`,
    );
  }
}

export class InvalidProviderError extends NemesisError {
  constructor(provider: any) {
    super(
      `Invalid provider configuration: ${JSON.stringify(provider)}. ` +
        `A provider must be a class or an object with { provide, useClass|useValue|useFactory|useExisting }.`,
    );
  }
}

export class MissingInjectionTokenError extends NemesisError {
  constructor(className: string, paramIndex: number) {
    super(
      `Missing injection token for parameter at index ${paramIndex} in "${className}". ` +
        `Use @Inject(token) to declare the dependency explicitly.`,
    );
  }
}
