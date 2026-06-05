/**
 * Response helper unit tests.
 */
import { describe, it, expect } from 'vitest';
import { ok, fail, ERRORS, isSuccess, isError } from '../response';

describe('ok', () => {
  it('creates a success response', () => {
    const res = ok({ id: 1, name: 'test' });
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ id: 1, name: 'test' });
  });

  it('isSuccess returns true for ok results', () => {
    expect(isSuccess(ok('hello'))).toBe(true);
  });

  it('isError returns false for ok results', () => {
    expect(isError(ok('hello'))).toBe(false);
  });
});

describe('fail', () => {
  it('creates a failure response with error', () => {
    const res = fail('出错了');
    expect(res.success).toBe(false);
    expect(res.error).toBe('出错了');
    expect(res.code).toBeUndefined();
  });

  it('creates a failure response with error and code', () => {
    const res = fail('未登录', 'AUTH_REQUIRED');
    expect(res.code).toBe('AUTH_REQUIRED');
  });

  it('isError returns true for fail results', () => {
    expect(isError(fail('err'))).toBe(true);
  });

  it('isSuccess returns false for fail results', () => {
    expect(isSuccess(fail('err'))).toBe(false);
  });
});

describe('ERRORS', () => {
  it('has agent runtime error codes', () => {
    expect(Object.keys(ERRORS)).toHaveLength(9);
    expect(ERRORS).toHaveProperty('GATEWAY_OFFLINE');
  });

  it('each error has error and code fields', () => {
    for (const [key, val] of Object.entries(ERRORS)) {
      expect(val.error).toBeTruthy();
      expect(val.code).toBe(key);
    }
  });

  it('AUTH_REQUIRED has correct message', () => {
    expect(ERRORS.AUTH_REQUIRED.error).toBe('未登录');
  });
});

describe('discriminated union', () => {
  it('allows type narrowing with isSuccess', () => {
    const res = ok([1, 2, 3]);
    if (isSuccess(res)) {
      expect(res.data.length).toBe(3);
    }
  });

  it('allows type narrowing with isError', () => {
    const res = fail('错误', 'ERR');
    if (isError(res)) {
      expect(res.code).toBe('ERR');
    }
  });
});
