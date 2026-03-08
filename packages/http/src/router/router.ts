/**
 * @nemesisjs/http - HttpRouter
 *
 * Trie-based HTTP router for efficient route matching.
 * Supports static paths, dynamic parameters (:id), and wildcards (*).
 * O(depth) matching performance regardless of total route count.
 */

import type { HttpMethod } from '@nemesisjs/common';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RouteEntry {
  method: HttpMethod;
  path: string;
  handler: RouteHandler;
  guards: any[];
  pipes: any[];
  interceptors: any[];
  controllerClass: any;
  methodKey: string | symbol;
}

export type RouteHandler = (request: Request, params: Record<string, string>) => Promise<Response>;

export interface RouteMatch {
  entry: RouteEntry;
  params: Record<string, string>;
}

// ─── Trie Node ───────────────────────────────────────────────────────────────

interface TrieNode {
  /** Static children: segment -> node */
  children: Map<string, TrieNode>;
  /** Dynamic parameter child (e.g., :id) */
  paramChild: { name: string; node: TrieNode } | null;
  /** Wildcard child (*) */
  wildcardChild: TrieNode | null;
  /** Route handlers by HTTP method */
  handlers: Map<string, RouteEntry>;
}

function createTrieNode(): TrieNode {
  return {
    children: new Map(),
    paramChild: null,
    wildcardChild: null,
    handlers: new Map(),
  };
}

// ─── HttpRouter ──────────────────────────────────────────────────────────────

export class HttpRouter {
  private readonly root: TrieNode = createTrieNode();
  private readonly routes: RouteEntry[] = [];

  /**
   * Register a route in the router.
   */
  addRoute(entry: RouteEntry): void {
    this.routes.push(entry);
    const segments = this.splitPath(entry.path);
    let node = this.root;

    for (const segment of segments) {
      if (segment.startsWith(':')) {
        // Dynamic parameter
        const paramName = segment.slice(1);
        if (!node.paramChild) {
          node.paramChild = { name: paramName, node: createTrieNode() };
        }
        node = node.paramChild.node;
      } else if (segment === '*') {
        // Wildcard
        if (!node.wildcardChild) {
          node.wildcardChild = createTrieNode();
        }
        node = node.wildcardChild;
      } else {
        // Static segment
        let child = node.children.get(segment);
        if (!child) {
          child = createTrieNode();
          node.children.set(segment, child);
        }
        node = child;
      }
    }

    node.handlers.set(entry.method, entry);
  }

  /**
   * Match an incoming request to a registered route.
   * Returns null if no route matches.
   */
  match(method: string, path: string): RouteMatch | null {
    const segments = this.splitPath(path);
    const params: Record<string, string> = {};
    const result = this.matchNode(this.root, segments, 0, params);

    if (!result) return null;

    const entry = result.handlers.get(method as HttpMethod);
    if (!entry) return null;

    return { entry, params };
  }

  /**
   * Check if any route is registered for a given path (any method).
   * Useful for returning 405 vs 404.
   */
  hasPath(path: string): boolean {
    const segments = this.splitPath(path);
    const params: Record<string, string> = {};
    const result = this.matchNode(this.root, segments, 0, params);
    return result !== null && result.handlers.size > 0;
  }

  /**
   * Get all registered routes (for debugging/introspection).
   */
  getRoutes(): RouteEntry[] {
    return [...this.routes];
  }

  // ─── Private ─────────────────────────────────────────────────────────

  private matchNode(
    node: TrieNode,
    segments: string[],
    index: number,
    params: Record<string, string>,
  ): TrieNode | null {
    // Base case: all segments matched
    if (index === segments.length) {
      return node.handlers.size > 0 ? node : null;
    }

    const segment = segments[index];

    // 1. Try static match first (highest priority)
    const staticChild = node.children.get(segment);
    if (staticChild) {
      const result = this.matchNode(staticChild, segments, index + 1, params);
      if (result) return result;
    }

    // 2. Try parameter match
    if (node.paramChild) {
      const prevValue = params[node.paramChild.name];
      params[node.paramChild.name] = segment;
      const result = this.matchNode(node.paramChild.node, segments, index + 1, params);
      if (result) return result;
      // Backtrack
      if (prevValue !== undefined) {
        params[node.paramChild.name] = prevValue;
      } else {
        delete params[node.paramChild.name];
      }
    }

    // 3. Try wildcard match (lowest priority, matches remaining segments)
    if (node.wildcardChild) {
      params['*'] = segments.slice(index).join('/');
      return node.wildcardChild.handlers.size > 0 ? node.wildcardChild : null;
    }

    return null;
  }

  private splitPath(path: string): string[] {
    return path
      .split('/')
      .filter((s) => s.length > 0);
  }
}
