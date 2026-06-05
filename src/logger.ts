/**
 * 绫儿标准工具库 — 日志
 *
 * 用法：
 *   import { logger } from '~/.openclaw/workspace/skills/linger-utils/src/logger';
 *   logger.info('Module', '操作成功', { id: 123 });
 */

const LOG_PREFIX = '[绫儿]';

function fmt(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function log(level: string, module: string, msg: string, data?: unknown): void {
  const line = `${fmt()} ${LOG_PREFIX} [${module}] ${msg}`;
  switch (level) {
    case 'debug': console.debug(line, data ?? ''); break;
    case 'info':  console.info(line, data ?? '');  break;
    case 'warn':  console.warn(line, data ?? '');  break;
    case 'error': console.error(line, data ?? ''); break;
  }
}

export const logger = {
  debug: (module: string, msg: string, data?: unknown) => log('debug', module, msg, data),
  info:  (module: string, msg: string, data?: unknown) => log('info', module, msg, data),
  warn:  (module: string, msg: string, data?: unknown) => log('warn', module, msg, data),
  error: (module: string, msg: string, data?: unknown) => log('error', module, msg, data),
};
