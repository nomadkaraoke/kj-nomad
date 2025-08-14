import { describe, it, expect } from 'vitest';
import { VideoSyncEngine } from '../videoSyncEngine.js';
import type { WebSocket as WSWebSocket } from 'ws';

class WsMock {
  public sent: Array<Record<string, unknown>> = [];
  public readyState = 1;
  public OPEN = 1;
  send(payload: string) { this.sent.push(JSON.parse(payload)); }
}

describe('VideoSyncEngine realignClient', () => {
  it('schedules per-client sync_play to desired time with cooldown', async () => {
    const engine = new VideoSyncEngine();
    const ws = new WsMock() as unknown as WSWebSocket;
    engine.registerClient('p1', ws, 'Player 1', 'player');
    await engine.syncPlayVideo('/api/media/test.mp4', 10);

    const ok1 = await engine.realignClient('p1', 12.345);
    expect(ok1).toBe(true);
    const last = (ws as unknown as WsMock).sent.at(-1) as any;
    expect(last.type).toBe('sync_play');
    expect((last as { videoTime: number }).videoTime).toBeCloseTo(12.345, 3);

    // Cooldown should block immediate subsequent realign
    const ok2 = await engine.realignClient('p1', 15);
    expect(ok2).toBe(false);
  });
});


