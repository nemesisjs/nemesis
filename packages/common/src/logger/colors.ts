/**
 * @nemesis-js/common - Terminal Colors
 *
 * Provides typed ANSI escape sequences for aesthetically pleasing terminal output.
 */

export const Colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // Pleasing foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Bright/Light colors for the eye-catching aesthetic
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
} as const;

/**
 * Type representing available color keys
 */
export type ColorCode = keyof typeof Colors;

/**
 * Wraps a string in the provided ANSI color sequence.
 *
 * @param {string} text - The text to colorize
 * @param {ColorCode} color - The color to apply
 * @returns {string} The colorized text
 * @example
 * colorize('Hello', 'brightCyan');
 */
export function colorize(text: string, color: ColorCode): string {
  return `${Colors[color]}${text}${Colors.reset}`;
}
