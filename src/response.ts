/**
 * Agent standard response helpers.
 *
 * Discriminated union helpers keep success and error responses type-safe.
 *
 * Example:
 *   import { ok, fail, ERRORS } from './src/response';
 *
 *   const res = ok({ id: 123 });     // ApiOkResponse<{ id: number }>
 *   const err = fail('出错');          // ApiErrorResponse
 *
 * Express helpers live in src/express-response.ts.
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
  AUTH_REQUIRED:   { error: '未登录', code: 'AUTH_REQUIRED' } as const,
  FORBIDDEN:       { error: '无权限', code: 'FORBIDDEN' } as const,
  NOT_FOUND:       { error: '资源不存在', code: 'NOT_FOUND' } as const,
  RATE_LIMITED:    { error: '请求过于频繁', code: 'RATE_LIMITED' } as const,
  GATEWAY_OFFLINE: { error: '网关不可达', code: 'GATEWAY_OFFLINE' } as const,
  FILE_NOT_ALLOWED:{ error: '不允许操作此文件', code: 'FILE_NOT_ALLOWED' } as const,
  VALIDATION_ERROR:{ error: '参数校验失败', code: 'VALIDATION_ERROR' } as const,
  TIMEOUT:         { error: '操作超时', code: 'TIMEOUT' } as const,
  NETWORK_ERROR:   { error: '网络错误', code: 'NETWORK_ERROR' } as const,
} as const;

export type ErrorCode = keyof typeof ERRORS;
