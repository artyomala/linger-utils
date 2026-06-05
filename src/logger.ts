/**
 * Lightweight timestamped logger.
 *
 * Example:
 *   import { createLogger, logger } from '@linger/utils';
 *   logger.info('Module', 'Operation succeeded', { id: 123 });
 *   const appLogger = createLogger({ prefix: '[app]' });
 */

export interface LoggerOptions {
  prefix?: string;
}

export interface Logger {
  debug(module: string, msg: string, data?: unknown): void;
  info(module: string, msg: string, data?: unknown): void;
  warn(module: string, msg: string, data?: unknown): void;
  error(module: string, msg: string, data?: unknown): void;
}

function fmt(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function log(level: string, prefix: string, module: string, msg: string, data?: unknown): void {
  const prefixPart = prefix ? ` ${prefix}` : '';
  const line = `${fmt()}${prefixPart} [${module}] ${msg}`;
  switch (level) {
    case 'debug': console.debug(line, data ?? ''); break;
    case 'info':  console.info(line, data ?? '');  break;
    case 'warn':  console.warn(line, data ?? '');  break;
    case 'error': console.error(line, data ?? ''); break;
  }
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const prefix = options.prefix ?? '';
  return {
    debug: (module: string, msg: string, data?: unknown) => log('debug', prefix, module, msg, data),
    info:  (module: string, msg: string, data?: unknown) => log('info', prefix, module, msg, data),
    warn:  (module: string, msg: string, data?: unknown) => log('warn', prefix, module, msg, data),
    error: (module: string, msg: string, data?: unknown) => log('error', prefix, module, msg, data),
  };
}

export const logger = createLogger();
