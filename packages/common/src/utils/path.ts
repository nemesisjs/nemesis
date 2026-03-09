/**
 * @nemesis-js/common - Path utilities
 *
 * Shared path normalization helpers used by controller, HTTP method,
 * and route-collector decorators.
 */

/**
 * Normalize a route path segment: ensures a leading slash,
 * and removes any trailing slash (unless the path is the root `/`).
 *
 * @param {string} path - The raw path string to normalize
 * @returns {string} The normalized path with a leading slash and no trailing slash
 *
 * @example
 * normalizePath('users');      // '/users'
 * normalizePath('/users/');    // '/users'
 * normalizePath('/');          // '/'
 * normalizePath('');           // '/'
 */
export function normalizePath(path: string): string {
  let normalized = path;

  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * Join multiple path segments into a single normalized path.
 * Strips leading and trailing slashes from each part, then
 * joins them with `/`, and adds a leading slash to the result.
 *
 * @param {...string} parts - Path segments to join
 * @returns {string} The joined, normalized path
 *
 * @example
 * joinPaths('/api', '/users/', '/active') // '/api/users/active'
 * joinPaths('', 'users')                  // '/users'
 */
export function joinPaths(...parts: string[]): string {
  const joined = parts
    .map((p) => p.replace(/^\/+|\/+$/g, ''))
    .filter((p) => p.length > 0)
    .join('/');

  return '/' + joined;
}
