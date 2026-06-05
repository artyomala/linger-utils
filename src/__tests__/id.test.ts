import { describe, it, expect } from 'vitest';
import {
  createCorrelationId,
  formatZhTime,
  isoTimestamp,
  shortId,
} from '../id';

describe('id helpers', () => {
  it('creates 16-character hex IDs', () => {
    expect(shortId()).toMatch(/^[0-9a-f]{16}$/);
  });

  it('creates stable correlation IDs', () => {
    const id = createCorrelationId('web', 'room-1');
    expect(id).toBe(createCorrelationId('web', 'room-1'));
    expect(id).toMatch(/^[0-9a-f]{16}$/);
  });

  it('creates ISO timestamps', () => {
    expect(Date.parse(isoTimestamp())).not.toBeNaN();
  });

  it('formats zh-CN compact timestamps', () => {
    expect(formatZhTime('2026-06-05T06:00:00.000Z')).toMatch(/\d{2}\/\d{2}.*\d{2}:\d{2}/);
  });
});
