/**
 * 绫儿标准工具库 — 统一 HTTP 请求
 *
 * 用法：
 *   import { apiFetch } from '.../linger-utils/src/fetch';
 *   const res = await apiFetch('/api/gateway/status');
 *   if (res.success) { console.log(res.data); }
 */

import type { ApiResponse } from './response.js';
import { fail } from './response.js';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type BodyType = Record<string, unknown> | string | FormData | null | undefined;

export interface FetchOptions {
  method?: HttpMethod;
  body?: BodyType;
  timeout?: number;
  headers?: Record<string, string>;
  baseUrl?: string;
  query?: Record<string, string | number>;
}

const DEFAULT_BASE_URL = 'http://127.0.0.1:18789';
const DEFAULT_TIMEOUT = 10000;

function buildUrl(base: string, path: string, query?: Record<string, string | number>): string {
  if (!query) return new URL(path, base).toString();
  const url = new URL(path, base);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, String(v));
  return url.toString();
}

function resolveContentType(body: BodyType, headers: Record<string, string>): string | undefined {
  if (headers['Content-Type']) return;
  if (body instanceof FormData) return;
  if (typeof body === 'string') return 'text/plain';
  if (body != null) return 'application/json';
}

/** 从 HTTP 错误响应中提取结构化错误信息 */
async function extractError(res: Response): Promise<{ error: string; code?: string }> {
  try {
    const text = await res.text();
    // 尝试解析 JSON 错误体
    const parsed = JSON.parse(text);
    if (parsed.error || parsed.message) {
      return {
        error: String(parsed.error || parsed.message).slice(0, 200),
        code: parsed.code || parsed.error_code || undefined,
      };
    }
    return { error: text.slice(0, 200) };
  } catch {
    return { error: `HTTP ${res.status}` };
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const {
    method = 'GET', body, timeout = DEFAULT_TIMEOUT,
    headers = {}, baseUrl = DEFAULT_BASE_URL, query,
  } = options;

  const url = buildUrl(baseUrl, path, query);
  const contentType = resolveContentType(body, headers);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let bodyRaw: BodyInit | undefined;
  if (body instanceof FormData || typeof body === 'string') bodyRaw = body;
  else if (body != null) bodyRaw = JSON.stringify(body);

  try {
    const res = await fetch(url, {
      method,
      headers: { ...(contentType ? { 'Content-Type': contentType } : {}), ...headers },
      body: bodyRaw,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errInfo = await extractError(res);
      return fail(errInfo.error, errInfo.code);
    }

    const ctype = res.headers.get('content-type') || '';
    if (ctype.includes('application/json')) {
      return { success: true, data: (await res.json()) as T };
    }
    return { success: true, data: (await res.text()) as unknown as T };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return fail('请求超时', 'TIMEOUT');
    }
    return fail(err instanceof Error ? err.message : '网络错误', 'NETWORK_ERROR');
  } finally {
    clearTimeout(timer);
  }
}
