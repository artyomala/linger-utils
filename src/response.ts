/**
 * Structured API response helpers.
 *
 * Discriminated union helpers keep success and error responses type-safe.
 *
 * Example:
 *   import { ok, fail, ERRORS } from '@linger/utils';
 *
 *   const res = ok({ id: 123 });     // ApiOkResponse<{ id: number }>
 *   const err = fail('Something went wrong'); // ApiErrorResponse
 *
 * Express helpers are available from '@linger/utils/express'.
 */

export type ApiOkResponse<T> = { success: true; data: T };
export type ApiErrorResponse = { success: false; error: string; code?: string; status?: number };
export type ApiResponse<T = unknown> = ApiOkResponse<T> | ApiErrorResponse;

export function ok<T>(data: T): ApiOkResponse<T> {
  return { success: true, data };
}

export function fail(error: string, code?: string): ApiErrorResponse {
  return { success: false, error, code };
}

export function isSuccess<T>(res: ApiResponse<T>): res is ApiOkResponse<T> {
  return res.success === true;
}

export function isError<T>(res: ApiResponse<T>): res is ApiErrorResponse {
  return res.success === false;
}

export const ERRORS = {
  AUTH_REQUIRED:   { error: 'Authentication required', code: 'AUTH_REQUIRED' } as const,
  FORBIDDEN:       { error: 'Forbidden', code: 'FORBIDDEN' } as const,
  NOT_FOUND:       { error: 'Resource not found', code: 'NOT_FOUND' } as const,
  RATE_LIMITED:    { error: 'Too many requests', code: 'RATE_LIMITED' } as const,
  FILE_NOT_ALLOWED:{ error: 'File operation is not allowed', code: 'FILE_NOT_ALLOWED' } as const,
  VALIDATION_ERROR:{ error: 'Validation failed', code: 'VALIDATION_ERROR' } as const,
  TIMEOUT:         { error: 'Operation timed out', code: 'TIMEOUT' } as const,
  NETWORK_ERROR:   { error: 'Network error', code: 'NETWORK_ERROR' } as const,
} as const;

export type ErrorCode = keyof typeof ERRORS;
