/**
 * 绫儿标准工具库 — 睡眠与重试
 *
 * 用法：
 *   import { sleep, retry, withTimeout } from '.../linger-utils/src/retry';
 */

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface RetryOptions {
  maxAttempts?: number;   // 最大重试次数（默认 3，最小 1）
  backoffMs?: number;     // 初始等待（默认 1000，递增）
  jitter?: boolean;       // 是否加随机抖动（默认 true）
  onRetry?: (attempt: number, error: Error) => void;  // 每次重试前回调
}

/** 带随机抖动的等待时间 */
function getDelay(base: number, attempt: number, jitter: boolean): number {
  const delay = base * attempt;
  if (!jitter) return delay;
  return delay + Math.random() * 500; // 最多 +500ms 随机
}

/** 重试（递增等待 + 可选 jitter + 回调） */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxAttempts = 3, backoffMs = 1000, jitter = true, onRetry } = options;
  const attempts = Math.max(1, maxAttempts);
  let lastError: Error;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < attempts) {
        if (onRetry) onRetry(attempt, lastError);
        await sleep(getDelay(backoffMs, attempt, jitter));
      }
    }
  }
  throw lastError!;
}

/** 为 Promise 添加超时 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`操作超时 (${ms}ms)`)), ms),
    ),
  ]);
}
