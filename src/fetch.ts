/**
 * Agent standard HTTP helpers that return structured API responses.
 *
 * Example:
 *   import { apiFetch, createApiClient } from './src/fetch';
 *   const res = await apiFetch('/api/gateway/status');
 *   if (res.success) { handleData(res.data); }
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

export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_BASE_URL = process.env.AGENT_STDLIB_GATEWAY_URL || 'http://127.0.0.1:18789';

function buildUrl(baseUrl: string | undefined, path: string, query?: Record<string, string | number>): string {
  const url = baseUrl ? new URL(path, baseUrl) : new URL(path, DEFAULT_BASE_URL);
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, String(v));
  return url.toString();
}

function resolveContentType(body: BodyType, headers: Record<string, string>): string | undefined {
  if (Object.keys(headers).some(key => key.toLowerCase() === 'content-type')) return;
  if (body instanceof FormData) return;
  if (typeof body === 'string') return 'text/plain';
  if (body != null) return 'application/json';
}

/** Extracts structured error details from an HTTP error response. */
async function extractError(res: Response): Promise<{ error: string; code?: string }> {
  try {
    const text = await res.text();
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
    headers = {}, baseUrl, query,
  } = options;

  let url: string;
  try {
    url = buildUrl(baseUrl, path, query);
  } catch (err) {
    return fail(
      err instanceof Error ? err.message : 'Invalid URL',
      'INVALID_URL',
    );
  }

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

export function createApiClient(defaults: ApiClientOptions) {
  return function clientFetch<T = unknown>(
    path: string,
    options: FetchOptions = {},
  ): Promise<ApiResponse<T>> {
    return apiFetch<T>(path, {
      ...options,
      timeout: options.timeout ?? defaults.timeout,
      baseUrl: options.baseUrl ?? defaults.baseUrl,
      headers: { ...defaults.headers, ...options.headers },
    });
  };
}
