import { describe, it, expect, vi, afterEach } from 'vitest';
import { createLogger, logger } from '../logger';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('logger', () => {
  it('includes the seed agent prefix by default', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    logger.info('Module', 'message');

    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \[绫儿] \[Module] message/);
  });

  it('supports configurable prefixes', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const prefixed = createLogger({ prefix: '[app]' });

    prefixed.warn('Module', 'message', { id: 1 });

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[app] [Module] message'), { id: 1 });
  });

  it('can be made unbranded explicitly', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    const unbranded = createLogger({ prefix: '' });

    unbranded.debug('Module', 'message');

    expect(spy.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \[Module] message/);
  });
});
