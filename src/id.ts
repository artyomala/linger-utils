/**
 * 绫儿标准工具库 — ID 和时间
 *
 * 用法：
 *   import { shortId, createCorrelationId, isoTimestamp, formatZhTime }
 *     from '.../linger-utils/src/id';
 */

import { createHash, randomBytes } from 'crypto';

/** 生成 16 位 Hex 短 ID（适合 roomId / projectId） */
export function shortId(): string {
  return randomBytes(8).toString('hex');
}

/** 从 channel + roomId 生成相关 ID */
export function createCorrelationId(channel: string, roomId: string): string {
  return createHash('sha256')
    .update(`${channel}:${roomId}`)
    .digest('hex')
    .slice(0, 16);
}

/** ISO 时间戳 */
export function isoTimestamp(): string {
  return new Date().toISOString();
}

/** 中文友好时间（如 "05/14 22:04"） */
export function formatZhTime(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}
