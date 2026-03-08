/**
 * @nemesisjs/http - HTTP-specific errors
 */

export class RouteNotFoundError extends Error {
  constructor(method: string, path: string) {
    super(`No route found for ${method} ${path}`);
    this.name = 'RouteNotFoundError';
  }
}
