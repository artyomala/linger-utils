/**
 * Agent standard function library entry point.
 *
 * Example:
 *   import { apiFetch, createApiClient, logger, ok, ERRORS, isSuccess } from './index';
 *   import { sendError } from './src/express-response';
 */

export { apiFetch, createApiClient } from './src/fetch.js';
export type { ApiClientOptions, FetchOptions } from './src/fetch.js';

export { createLogger, logger } from './src/logger.js';
export type { Logger, LoggerOptions } from './src/logger.js';

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
