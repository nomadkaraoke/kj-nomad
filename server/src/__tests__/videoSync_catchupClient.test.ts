import { describe, it, expect } from 'vitest';
import { VideoSyncEngine } from '../videoSyncEngine.js';
import type { WebSocket as WSWebSocket } from 'ws';

class WsMock {
  public sent: Array<Record<string, unknown>> = [];
  public readyState = 1;
  public OPEN = 1;
  send(payload: string) { this.sent.push(JSON.parse(payload)); }
}

describe('VideoSyncEngine catchUpClient', () => {
  it('preloads and schedules client-domain play at elapsed time', async () => {
    const engine = new VideoSyncEngine();
    const ws = new WsMock() as unknown as WSWebSocket;
    engine.registerClient('p1', ws, 'Player 1', 'player');

    // Simulate that engine is already playing a video (simplest path: call syncPlayVideo)
    await engine.syncPlayVideo('/api/media/test.mp4', 0);
    // Invoke catch-up with some elapsed time
    const ok = await engine.catchUpClient('p1', '/api/media/test.mp4', 23.5);
    expect(ok).toBe(true);

    const messages = (ws as unknown as WsMock).sent;
    // Expect preload and the most recent sync_play to be from catchUpClient
    const preload = messages.find((m) => m.type === 'sync_preload');
    const play = messages.reverse().find((m) => (m as any).type === 'sync_play');
    expect(preload).toBeTruthy();
    expect(play).toBeTruthy();
    expect((play as { timeDomain: string }).timeDomain).toBe('client');
    expect((play as { videoTime: number }).videoTime).toBeCloseTo(23.5, 1);

    // Per-client baseline should be stored with provided videoTime
    const baseline = engine.getClientBaseline('p1');
    expect(baseline?.videoStartSec).toBeCloseTo(23.5, 1);
  });
});


