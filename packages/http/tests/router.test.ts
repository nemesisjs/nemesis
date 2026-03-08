import { describe, it, expect } from 'bun:test';
import { HttpRouter, type RouteEntry } from '../src/router/router';

function makeEntry(method: string, path: string): RouteEntry {
  return {
    method: method as any,
    path,
    handler: async () => new Response('ok'),
    guards: [],
    pipes: [],
    interceptors: [],
    controllerClass: null,
    methodKey: 'test',
  };
}

describe('@nemesisjs/http - HttpRouter', () => {
  describe('static routes', () => {
    it('should match exact static paths', () => {
      const router = new HttpRouter();
      router.addRoute(makeEntry('GET', '/'));
      router.addRoute(makeEntry('GET', '/users'));
      router.addRoute(makeEntry('GET', '/users/active'));

      expect(router.match('GET', '/')).not.toBeNull();
      expect(router.match('GET', '/users')).not.toBeNull();
      expect(router.match('GET', '/users/active')).not.toBeNull();
      expect(router.match('GET', '/posts')).toBeNull();
    });

    it('should differentiate by HTTP method', () => {
      const router = new HttpRouter();
      router.addRoute(makeEntry('GET', '/users'));
      router.addRoute(makeEntry('POST', '/users'));

      const getMatch = router.match('GET', '/users');
      const postMatch = router.match('POST', '/users');
      const putMatch = router.match('PUT', '/users');

      expect(getMatch).not.toBeNull();
      expect(getMatch!.entry.method).toBe('GET');
      expect(postMatch).not.toBeNull();
      expect(postMatch!.entry.method).toBe('POST');
      expect(putMatch).toBeNull();
    });
  });

  describe('dynamic parameters', () => {
    it('should match dynamic segments and extract params', () => {
      const router = new HttpRouter();
      router.addRoute(makeEntry('GET', '/users/:id'));

      const match = router.match('GET', '/users/42');
      expect(match).not.toBeNull();
      expect(match!.params.id).toBe('42');
    });

    it('should match nested dynamic segments', () => {
      const router = new HttpRouter();
      router.addRoute(makeEntry('GET', '/users/:userId/posts/:postId'));

      const match = router.match('GET', '/users/1/posts/99');
      expect(match).not.toBeNull();
      expect(match!.params.userId).toBe('1');
      expect(match!.params.postId).toBe('99');
    });

    it('should prefer static matches over dynamic', () => {
      const router = new HttpRouter();
      router.addRoute(makeEntry('GET', '/users/active'));
      router.addRoute(makeEntry('GET', '/users/:id'));

      const staticMatch = router.match('GET', '/users/active');
      expect(staticMatch).not.toBeNull();

      const dynamicMatch = router.match('GET', '/users/42');
      expect(dynamicMatch).not.toBeNull();
      expect(dynamicMatch!.params.id).toBe('42');
    });
  });

  describe('hasPath', () => {
    it('should return true for existing paths regardless of method', () => {
      const router = new HttpRouter();
      router.addRoute(makeEntry('GET', '/users'));

      expect(router.hasPath('/users')).toBe(true);
      expect(router.hasPath('/posts')).toBe(false);
    });
  });

  describe('getRoutes', () => {
    it('should return all registered routes', () => {
      const router = new HttpRouter();
      router.addRoute(makeEntry('GET', '/a'));
      router.addRoute(makeEntry('POST', '/b'));
      router.addRoute(makeEntry('DELETE', '/c'));

      expect(router.getRoutes()).toHaveLength(3);
    });
  });
});
