/**
 * Retry helper unit tests.
 */
import { describe, it, expect } from 'vitest';
import { sleep, retry, withTimeout } from '../retry';

describe('sleep', () => {
  it('sleeps for the specified time', async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });
});

describe('retry', () => {
  it('resolves on first attempt', async () => {
    const result = await retry(async () => 'ok', { maxAttempts: 3 });
    expect(result).toBe('ok');
  });

  it('retries on failure and eventually succeeds', async () => {
    let calls = 0;
    const result = await retry(async () => {
      calls++;
      if (calls < 3) throw new Error(`fail ${calls}`);
      return 'success';
    }, { maxAttempts: 5, backoffMs: 10, jitter: false });
    expect(result).toBe('success');
    expect(calls).toBe(3);
  });

  it('throws after all attempts fail', async () => {
    await expect(retry(async () => { throw new Error('always fail'); }, {
      maxAttempts: 3, backoffMs: 10, jitter: false,
    })).rejects.toThrow('always fail');
  });

  it('handles maxAttempts=0 as 1', async () => {
    const result = await retry(async () => 'ok', { maxAttempts: 0 });
    expect(result).toBe('ok');
  });

  it('calls onRetry callback on each retry', async () => {
    let callCount = 0;
    await expect(retry(async () => { throw new Error('fail'); }, {
      maxAttempts: 2, backoffMs: 10, jitter: false,
      onRetry: (attempt, err) => { callCount++; expect(err.message).toBe('fail'); },
    })).rejects.toThrow();
    expect(callCount).toBe(1);
  });
});

describe('withTimeout', () => {
  it('resolves before timeout', async () => {
    const result = await withTimeout(Promise.resolve('ok'), 100);
    expect(result).toBe('ok');
  });

  it('rejects on timeout', async () => {
    await expect(withTimeout(sleep(200), 50)).rejects.toThrow('timed out');
  });

  it('aborts signal-aware operations on timeout', async () => {
    let aborted = false;
    await expect(withTimeout(async (signal) => new Promise((resolve) => {
      signal.addEventListener('abort', () => {
        aborted = true;
        resolve('aborted');
      });
    }), 50)).rejects.toThrow('timed out');

    expect(aborted).toBe(true);
  });
});
