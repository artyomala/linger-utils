/**
 * Express response helpers for structured API errors.
 *
 * Import this subpath only in Express applications:
 *   import { sendError, sendKnownError } from '@linger/utils/express';
 */

import type { Response } from 'express';
import { ERRORS, type ErrorCode } from './response.js';

/** Sends a custom error response. */
export function sendError(
  res: Response,
  err: { error: string; code: string },
  status = 400,
) {
  return res.status(status).json(err);
}

/** Sends a known error response from ERRORS. */
export function sendKnownError(
  res: Response,
  code: ErrorCode,
  status = 400,
) {
  return res.status(status).json(ERRORS[code]);
}
