/**
 * fetch 单元测试（mock fetch）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from '../fetch';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('apiFetch', () => {
  it('returns data on successful JSON response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ status: 'ok', version: '1.0' }),
      text: async () => '',
    });

    const res = await apiFetch('/api/status');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toEqual({ status: 'ok', version: '1.0' });
    }
  });

  it('returns text on non-JSON response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'text/plain']]),
      text: async () => 'plain text body',
    });

    const res = await apiFetch('/api/raw');
    expect(res.success).toBe(true);
  });

  it('returns fallback message when body is not JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    });

    const res = await apiFetch('/api/notfound');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe('HTTP 404');  // JSON 解析失败时回退到 HTTP status
    }
  });

  it('parses JSON error body from server', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: '参数错误', code: 'VALIDATION_ERROR' }),
    });

    const res = await apiFetch('/api/bad');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe('参数错误');
      expect(res.code).toBe('VALIDATION_ERROR');
    }
  });

  it('parses message field from server error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ message: 'Internal error', error_code: 'INTERNAL' }),
    });

    const res = await apiFetch('/api/error');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe('Internal error');
      expect(res.code).toBe('INTERNAL');
    }
  });

  it('returns error on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('fetch failed'));

    const res = await apiFetch('/api/fail');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe('fetch failed');
    }
  });

  it('uses custom baseUrl', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({}),
      text: async () => '',
    });

    await apiFetch('/test', { baseUrl: 'http://localhost:5555' });
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:5555/test', expect.anything());
  });

  it('appends query params', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({}),
      text: async () => '',
    });

    await apiFetch('/api/search', { query: { q: 'test', page: 1 } });
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('q=test');
    expect(url).toContain('page=1');
  });

  it('supports PUT method', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({}),
      text: async () => '',
    });

    await apiFetch('/api/update', { method: 'PUT', body: { key: 'val' } });
    expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
  });

  it('times out on slow requests', async () => {
    mockFetch.mockImplementation(async (_url: string, opts: any) => {
      const signal = opts?.signal;
      return new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('The operation was aborted', 'AbortError')));
      });
    });

    const res = await apiFetch('/api/slow', { timeout: 50 });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.code).toBe('TIMEOUT');
    }
  }, 2000);
});
