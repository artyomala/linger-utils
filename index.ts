/**
 * 绫儿标准工具库 — 统一导出入口
 *
 * 用法：
 *   import { apiFetch, logger, ok, ERRORS, isSuccess } from '@linger/utils';
 *   import { sendError } from '@linger/utils/express';
 */

export { apiFetch } from './src/fetch.js';
export type { FetchOptions } from './src/fetch.js';

export { logger } from './src/logger.js';

export {
  resolvePath,
  tryReadFile,
  tryWriteFile,
  backupFile,
  simpleDiff,
  listBackups,
} from './src/fs.js';

export {
  shortId,
  createCorrelationId,
  isoTimestamp,
  formatZhTime,
} from './src/id.js';

export { sleep, retry, withTimeout } from './src/retry.js';
export type { RetryOptions } from './src/retry.js';

export { ok, fail, ERRORS, isSuccess, isError } from './src/response.js';
export type { ApiResponse, ApiOkResponse, ApiErrorResponse, ErrorCode } from './src/response.js';
