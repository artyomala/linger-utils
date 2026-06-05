/**
 * Sleep, retry, and timeout helpers.
 *
 * Example:
 *   import { sleep, retry, withTimeout } from './src/retry';
 */

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface RetryOptions {
  maxAttempts?: number;
  backoffMs?: number;
  jitter?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface TimeoutOptions {
  timeoutMessage?: string;
}

/** Computes a retry delay with optional jitter. */
function getDelay(base: number, attempt: number, jitter: boolean): number {
  const delay = base * attempt;
  if (!jitter) return delay;
  return delay + Math.random() * 500;
}

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

export function withTimeout<T>(
  operation: Promise<T> | ((signal: AbortSignal) => Promise<T>),
  ms: number,
  options: TimeoutOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const promise = typeof operation === 'function' ? operation(controller.signal) : operation;
  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(options.timeoutMessage ?? `Operation timed out (${ms}ms)`));
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
