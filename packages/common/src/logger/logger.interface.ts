/**
 * @nemesis-js/common - ILogger
 *
 * Defines the contract for logging within the NemesisJS framework.
 */

export interface ILogger {
  /**
   * Write a 'log' level message.
   *
   * @param {any} message - The message to log
   * @param {string} [context] - Optional context (e.g., class name)
   */
  log(message: any, context?: string): void;

  /**
   * Write an 'error' level message.
   *
   * @param {any} message - The message to log
   * @param {string} [trace] - Optional stack trace or additional error info
   * @param {string} [context] - Optional context
   */
  error(message: any, trace?: string, context?: string): void;

  /**
   * Write a 'warn' level message.
   *
   * @param {any} message - The message to log
   * @param {string} [context] - Optional context
   */
  warn(message: any, context?: string): void;

  /**
   * Write a 'debug' level message.
   *
   * @param {any} message - The message to log
   * @param {string} [context] - Optional context
   */
  debug?(message: any, context?: string): void;

  /**
   * Write a 'verbose' level message.
   *
   * @param {any} message - The message to log
   * @param {string} [context] - Optional context
   */
  verbose?(message: any, context?: string): void;
}
