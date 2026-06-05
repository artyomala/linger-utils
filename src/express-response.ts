/**
 * 绫儿标准工具库 — Express 错误响应
 *
 * 只在 Express 项目中使用，非 Express 项目不需要引入此文件。
 *
 * 用法：
 *   import { sendError, sendKnownError } from '.../linger-utils/src/express-response';
 */

import type { Response } from 'express';
import { ERRORS, type ErrorCode } from './response';

/** 发送自定义错误响应 */
export function sendError(
  res: Response,
  err: { error: string; code: string },
  status = 400,
) {
  return res.status(status).json(err);
}

/** 从 ERRORS 取错误并发送 */
export function sendKnownError(
  res: Response,
  code: ErrorCode,
  status = 400,
) {
  return res.status(status).json(ERRORS[code]);
}
