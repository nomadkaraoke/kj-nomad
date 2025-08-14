import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveTickerTemplate } from '../ticker.js';
import * as songQueue from '../songQueue.js';
import * as cloud from '../cloudConnector.js';

describe('ticker template resolution', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('replaces $ROTATION_NEXT_3 with next three singers', () => {
    vi.spyOn(songQueue, 'getSessionState').mockReturnValue({
      queue: [
        { singerName: 'Alice', song: { id: '1' }, queuedAt: Date.now() },
        { singerName: 'Bob', song: { id: '2' }, queuedAt: Date.now() },
        { singerName: 'Charlie', song: { id: '3' }, queuedAt: Date.now() },
        { singerName: 'Diana', song: { id: '4' }, queuedAt: Date.now() },
      ],
    } as unknown as ReturnType<typeof songQueue.getSessionState>);

    vi.spyOn(cloud.cloudConnector, 'getStatus').mockReturnValue({ sessionId: '1234' } as any);

    const out = resolveTickerTemplate('Next up: $ROTATION_NEXT_3');
    expect(out).toBe('Next up: Alice, Bob, Charlie');
  });

  it('replaces $TIP_URL with computed tip url from session', () => {
    vi.spyOn(songQueue, 'getSessionState').mockReturnValue({ queue: [] } as any);
    vi.spyOn(cloud.cloudConnector, 'getStatus').mockReturnValue({ sessionId: '9876' } as any);
    const out = resolveTickerTemplate('Tip here: $TIP_URL');
    expect(out).toBe('Tip here: https://tips.kjnomad.com/9876');
  });

  it('supports TIP_BASE_URL override and empty rotation gracefully', () => {
    vi.spyOn(songQueue, 'getSessionState').mockReturnValue({ queue: [] } as any);
    vi.spyOn(cloud.cloudConnector, 'getStatus').mockReturnValue({ sessionId: '5555' } as any);
    const prev = process.env.TIP_BASE_URL;
    process.env.TIP_BASE_URL = 'https://example.com/tips';
    const out = resolveTickerTemplate('Next: $ROTATION_NEXT_3 | $TIP_URL');
    expect(out).toBe('Next:  | https://example.com/tips/5555');
    process.env.TIP_BASE_URL = prev;
  });
});


