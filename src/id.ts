/**
 * ID and timestamp helpers.
 *
 * Example:
 *   import { shortId, createCorrelationId, isoTimestamp, formatZhTime }
 *     from './src/id';
 */

import { createHash, randomBytes } from 'crypto';

/** Generates a 16-character hex ID. */
export function shortId(): string {
  return randomBytes(8).toString('hex');
}

/** Creates a stable correlation ID from a channel and room ID. */
export function createCorrelationId(channel: string, roomId: string): string {
  return createHash('sha256')
    .update(`${channel}:${roomId}`)
    .digest('hex')
    .slice(0, 16);
}

/** Returns the current ISO timestamp. */
export function isoTimestamp(): string {
  return new Date().toISOString();
}

/** Formats a timestamp with compact zh-CN date and time fields. */
export function formatZhTime(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}
