import { describe, it, expect } from 'bun:test';
import { Injectable, Inject } from '@nemesis-js/common';
import { DIContainer, CircularDependencyError, UnknownTokenError, MissingInjectionTokenError } from '../src/index';

describe('@nemesis-js/core - DIContainer', () => {
  describe('register and resolve', () => {
    it('should register and resolve a class provider', () => {
      const container = new DIContainer();

      @Injectable()
      class SimpleService {
        getValue() { return 42; }
      }

      container.register(SimpleService);
      const instance = container.get(SimpleService);
      expect(instance).toBeInstanceOf(SimpleService);
      expect(instance.getValue()).toBe(42);
    });

    it('should return the same singleton instance', () => {
      const container = new DIContainer();

      @Injectable()
      class SingletonService {}

      container.register(SingletonService);
      const a = container.get(SingletonService);
      const b = container.get(SingletonService);
      expect(a).toBe(b); // Same reference
    });

    it('should resolve value providers', () => {
      const container = new DIContainer();
      const config = { port: 3000, host: 'localhost' };

      container.register({ provide: 'CONFIG', useValue: config });
      const resolved = container.get('CONFIG');
      expect(resolved).toEqual(config);
      expect(resolved).toBe(config); // Same reference
    });

    it('should resolve factory providers', () => {
      const container = new DIContainer();

      container.register({
        provide: 'TIMESTAMP',
        useFactory: () => Date.now(),
      });

      const ts = container.get('TIMESTAMP');
      expect(typeof ts).toBe('number');
    });

    it('should resolve factory providers with injected dependencies', () => {
      const container = new DIContainer();

      container.register({ provide: 'DB_URL', useValue: 'postgres://localhost/test' });
      container.register({
        provide: 'DB_CONNECTION',
        useFactory: (url: string) => ({ url, connected: true }),
        inject: ['DB_URL'],
      });

      const conn = container.get<{ url: string; connected: boolean }>('DB_CONNECTION');
      expect(conn.url).toBe('postgres://localhost/test');
      expect(conn.connected).toBe(true);
    });

    it('should resolve class provider with explicit token', () => {
      const container = new DIContainer();

      @Injectable()
      class MyRepo {}

      container.register({ provide: 'MyRepo', useClass: MyRepo });
      const instance = container.get('MyRepo');
      expect(instance).toBeInstanceOf(MyRepo);
    });

    it('should resolve existing (alias) providers', () => {
      const container = new DIContainer();

      container.register({ provide: 'ORIGINAL', useValue: 'hello' });
      container.register({ provide: 'ALIAS', useExisting: 'ORIGINAL' });

      expect(container.get('ALIAS')).toBe('hello');
    });
  });

  describe('constructor injection', () => {
    it('should resolve constructor dependencies via @Inject', () => {
      const container = new DIContainer();

      @Injectable()
      class Repository {
        findAll() { return ['item1', 'item2']; }
      }

      @Injectable()
      class Service {
        constructor(@Inject('Repository') public readonly repo: Repository) {}
      }

      container.register({ provide: 'Repository', useClass: Repository });
      container.register({ provide: 'Service', useClass: Service });

      const service = container.get<Service>('Service');
      expect(service).toBeInstanceOf(Service);
      expect(service.repo).toBeInstanceOf(Repository);
      expect(service.repo.findAll()).toEqual(['item1', 'item2']);
    });

    it('should resolve multi-level dependencies', () => {
      const container = new DIContainer();

      @Injectable()
      class Database {
        query() { return 'result'; }
      }

      @Injectable()
      class Repository {
        constructor(@Inject('Database') public readonly db: Database) {}
      }

      @Injectable()
      class Service {
        constructor(@Inject('Repository') public readonly repo: Repository) {}
      }

      container.register({ provide: 'Database', useClass: Database });
      container.register({ provide: 'Repository', useClass: Repository });
      container.register({ provide: 'Service', useClass: Service });

      const service = container.get<Service>('Service');
      expect(service.repo.db.query()).toBe('result');
    });
  });

  describe('error handling', () => {
    it('should throw UnknownTokenError for unregistered tokens', () => {
      const container = new DIContainer();
      expect(() => container.get('NonExistent')).toThrow(UnknownTokenError);
    });

    it('should throw CircularDependencyError for circular deps', () => {
      const container = new DIContainer();

      @Injectable()
      class A {
        constructor(@Inject('B') public b: any) {}
      }

      @Injectable()
      class B {
        constructor(@Inject('A') public a: any) {}
      }

      container.register({ provide: 'A', useClass: A });
      container.register({ provide: 'B', useClass: B });

      expect(() => container.get('A')).toThrow(CircularDependencyError);
    });

    it('should throw MissingInjectionTokenError when @Inject is missing', () => {
      const container = new DIContainer();

      @Injectable()
      class BadService {
        constructor(public dep: any) {} // Missing @Inject!
      }

      container.register({ provide: 'BadService', useClass: BadService });
      expect(() => container.get('BadService')).toThrow(MissingInjectionTokenError);
    });
  });

  describe('container operations', () => {
    it('should check if a token is registered', () => {
      const container = new DIContainer();
      container.register({ provide: 'TOKEN', useValue: 'test' });

      expect(container.has('TOKEN')).toBe(true);
      expect(container.has('OTHER')).toBe(false);
    });

    it('should clear all providers', () => {
      const container = new DIContainer();
      container.register({ provide: 'A', useValue: 1 });
      container.register({ provide: 'B', useValue: 2 });

      container.clear();
      expect(container.has('A')).toBe(false);
      expect(container.has('B')).toBe(false);
    });
  });
});
