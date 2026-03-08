/**
 * @nemesisjs/common - ConsoleLogger
 *
 * A highly aesthetic, beautifully structured default logger implementation
 * adhering to the ILogger interface. Produces neatly formatted terminal output.
 */

import { ILogger } from './logger.interface.js';
import { colorize } from './colors.js';

export class ConsoleLogger implements ILogger {
  private static readonly _PID = typeof process !== 'undefined' ? process.pid : 0;
  private readonly _context: string;

  /**
   * Initializes a new instance of the ConsoleLogger.
   *
   * @param {string} [context='Application'] - The default context prefix for logs
   */
  constructor(context: string = 'Application') {
    this._context = context;
  }

  /**
   * Logs a standard informative message.
   *
   * @param {unknown} message - The message payload
   * @param {string} [context] - Overrides the default logger context
   */
  log(message: unknown, context?: string): void {
    this._printMessage('LOG', message, context ?? this._context);
  }

  /**
   * Logs an error message, usually in red.
   *
   * @param {unknown} message - The error payload or message
   * @param {string} [trace] - Optional stack trace details
   * @param {string} [context] - Overrides the default logger context
   */
  error(message: unknown, trace?: string, context?: string): void {
    this._printMessage('ERROR', message, context ?? this._context);
    if (trace) {
      console.error(colorize(`[Stack] ${trace}`, 'red'));
    }
  }

  /**
   * Logs a warning message.
   *
   * @param {unknown} message - The warning message
   * @param {string} [context] - Overrides the default logger context
   */
  warn(message: unknown, context?: string): void {
    this._printMessage('WARN', message, context ?? this._context);
  }

  /**
   * Logs a debug level message. Useful for detailed insight during development.
   *
   * @param {unknown} message - The debug message
   * @param {string} [context] - Overrides the default logger context
   */
  debug(message: unknown, context?: string): void {
    this._printMessage('DEBUG', message, context ?? this._context);
  }

  /**
   * Logs verbose detailed messages.
   *
   * @param {unknown} message - The verbose message
   * @param {string} [context] - Overrides the default logger context
   */
  verbose(message: unknown, context?: string): void {
    this._printMessage('VERBOSE', message, context ?? this._context);
  }

  /**
   * Formats and prints the final message to stdout/stderr.
   *
   * @param {'LOG' | 'ERROR' | 'WARN' | 'DEBUG' | 'VERBOSE'} level - The log level
   * @param {unknown} message - The payload to print
   * @param {string} context - The context module name
   * @private
   */
  private _printMessage(
    level: 'LOG' | 'ERROR' | 'WARN' | 'DEBUG' | 'VERBOSE',
    message: unknown,
    context: string,
  ): void {
    const timestamp = new Date().toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const isError = level === 'ERROR';
    const outputStream = isError ? console.error : console.log;

    // Build the "Nemesis" branding and PID
    const branding = colorize(`[Nemesis] ${ConsoleLogger._PID}  - `, 'green');
    const timeStr = colorize(timestamp, 'white');

    // Build colorized level identifier
    let coloredLevel: string = level;
    switch (level) {
      case 'LOG':
        coloredLevel = colorize(level, 'brightGreen');
        break;
      case 'ERROR':
        coloredLevel = colorize(level, 'brightRed');
        break;
      case 'WARN':
        coloredLevel = colorize(level, 'brightYellow');
        break;
      case 'DEBUG':
        coloredLevel = colorize(level, 'brightMagenta');
        break;
      case 'VERBOSE':
        coloredLevel = colorize(level, 'brightCyan');
        break;
    }

    // Build the context segment `[AppModule]`
    const ctxString = colorize(`[${context}]`, 'brightYellow');

    // Format the message content
    const msgString = isError ? colorize(String(message), 'red') : colorize(String(message), 'brightGreen');

    outputStream(`${branding}${timeStr}   ${coloredLevel} ${ctxString} ${msgString}`);
  }
}
