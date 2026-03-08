import { describe, it, expect } from 'bun:test';
import {
  Injectable,
  Inject,
  Module,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  MetadataStorage,
} from '../src/index';

describe('@nemesisjs/common - Decorators', () => {
  describe('@Injectable', () => {
    it('should mark a class as injectable', () => {
      @Injectable()
      class TestService {}

      expect(MetadataStorage.isInjectable(TestService)).toBe(true);
    });

    it('should store injectable options', () => {
      @Injectable({ scope: 'transient' })
      class TransientService {}

      const options = MetadataStorage.getInjectable(TransientService);
      expect(options).toBeDefined();
      expect(options?.scope).toBe('transient');
    });
  });

  describe('@Inject', () => {
    it('should store injection tokens for constructor parameters', () => {
      @Injectable()
      class MyService {
        constructor(
          @Inject('DepA') public depA: any,
          @Inject('DepB') public depB: any,
        ) {}
      }

      const injections = MetadataStorage.getInjections(MyService);
      expect(injections.size).toBe(2);
      expect(injections.get(0)).toBe('DepA');
      expect(injections.get(1)).toBe('DepB');
    });

    it('should support symbol tokens', () => {
      const TOKEN = Symbol('MyToken');

      @Injectable()
      class SymbolService {
        constructor(@Inject(TOKEN) public dep: any) {}
      }

      const injections = MetadataStorage.getInjections(SymbolService);
      expect(injections.get(0)).toBe(TOKEN);
    });
  });

  describe('@Module', () => {
    it('should store module metadata', () => {
      @Injectable()
      class SomeService {}

      @Module({
        providers: [SomeService],
        exports: [SomeService],
      })
      class TestModule {}

      expect(MetadataStorage.isModule(TestModule)).toBe(true);
      const meta = MetadataStorage.getModule(TestModule);
      expect(meta).toBeDefined();
      expect(meta?.providers).toHaveLength(1);
      expect(meta?.exports).toHaveLength(1);
    });
  });

  describe('@Controller', () => {
    it('should store controller metadata with prefix', () => {
      @Controller('/users')
      class UserController {}

      expect(MetadataStorage.isController(UserController)).toBe(true);
      const meta = MetadataStorage.getController(UserController);
      expect(meta?.prefix).toBe('/users');
    });

    it('should normalize prefix (add leading slash)', () => {
      @Controller('items')
      class ItemController {}

      const meta = MetadataStorage.getController(ItemController);
      expect(meta?.prefix).toBe('/items');
    });

    it('should default to root prefix', () => {
      @Controller()
      class RootController {}

      const meta = MetadataStorage.getController(RootController);
      expect(meta?.prefix).toBe('/');
    });
  });

  describe('HTTP Method Decorators', () => {
    it('@Get should store route metadata', () => {
      @Controller('/test')
      class TestController {
        @Get('/hello')
        hello() {}
      }

      const routes = MetadataStorage.getRoutes(TestController);
      expect(routes.size).toBe(1);
      const route = routes.get('hello');
      expect(route).toBeDefined();
      expect(route?.method).toBe('GET');
      expect(route?.path).toBe('/hello');
    });

    it('@Post should store route metadata', () => {
      @Controller('/test2')
      class Test2Controller {
        @Post('/create')
        create() {}
      }

      const routes = MetadataStorage.getRoutes(Test2Controller);
      const route = routes.get('create');
      expect(route?.method).toBe('POST');
      expect(route?.path).toBe('/create');
    });

    it('should handle root path', () => {
      @Controller('/test3')
      class Test3Controller {
        @Get('/')
        root() {}
      }

      const routes = MetadataStorage.getRoutes(Test3Controller);
      const route = routes.get('root');
      expect(route?.path).toBe('/');
    });
  });

  describe('Parameter Decorators', () => {
    it('@Body should store param metadata', () => {
      @Controller('/params')
      class ParamsController {
        @Post('/')
        create(@Body() body: any) {}
      }

      const params = MetadataStorage.getRouteParams(ParamsController, 'create');
      expect(params).toHaveLength(1);
      expect(params[0].type).toBe('body');
      expect(params[0].index).toBe(0);
    });

    it('@Param should store param metadata with data key', () => {
      @Controller('/params2')
      class Params2Controller {
        @Get('/:id')
        findOne(@Param('id') id: string) {}
      }

      const params = MetadataStorage.getRouteParams(Params2Controller, 'findOne');
      expect(params).toHaveLength(1);
      expect(params[0].type).toBe('param');
      expect(params[0].data).toBe('id');
    });

    it('@Query should store param metadata', () => {
      @Controller('/params3')
      class Params3Controller {
        @Get('/')
        findAll(@Query('page') page: string) {}
      }

      const params = MetadataStorage.getRouteParams(Params3Controller, 'findAll');
      expect(params).toHaveLength(1);
      expect(params[0].type).toBe('query');
      expect(params[0].data).toBe('page');
    });
  });

  describe('@UseGuards', () => {
    it('should store class-level guards', () => {
      class AuthGuard {
        canActivate() {
          return true;
        }
      }

      @UseGuards(AuthGuard)
      @Controller('/guarded')
      class GuardedController {
        @Get('/')
        protected() {}
      }

      const guards = MetadataStorage.getClassGuards(GuardedController);
      expect(guards).toHaveLength(1);
      expect(guards[0]).toBe(AuthGuard);
    });

    it('should store method-level guards', () => {
      class RolesGuard {
        canActivate() {
          return true;
        }
      }

      @Controller('/guarded2')
      class Guarded2Controller {
        @UseGuards(RolesGuard)
        @Get('/admin')
        admin() {}
      }

      const guards = MetadataStorage.getMethodGuards(Guarded2Controller, 'admin');
      expect(guards).toHaveLength(1);
      expect(guards[0]).toBe(RolesGuard);
    });
  });
});
