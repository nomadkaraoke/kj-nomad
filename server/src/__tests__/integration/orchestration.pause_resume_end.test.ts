import { describe, it, expect } from 'vitest';
import { VideoSyncEngine } from '../../videoSyncEngine.js';
import type { WebSocket as WSWebSocket } from 'ws';

class WsMock {
  public sent: Array<Record<string, unknown>> = [];
  public readyState = 1;
  public OPEN = 1;
  send(payload: string) { try { this.sent.push(JSON.parse(payload)); } catch { /* ignore */ } }
}

describe('Engine orchestration: pause → resume → end', () => {
  it('sends pause schedules, resume schedules from exact time, and end clears state', async () => {
    const engine = new VideoSyncEngine();
    const a = new WsMock() as unknown as WSWebSocket;
    const b = new WsMock() as unknown as WSWebSocket;
    engine.registerClient('a', a, 'A', 'player');
    engine.registerClient('b', b, 'B', 'player');

    await engine.syncPlayVideo('/api/media/x.mp4', 0);

    // Pause
    await engine.syncPause();
    const pa = (a as unknown as WsMock).sent.reverse().find(m => (m as any).type === 'sync_pause');
    const pb = (b as unknown as WsMock).sent.reverse().find(m => (m as any).type === 'sync_pause');
    expect(pa && pb).toBeTruthy();

    // Resume
    await engine.syncResume();
    const ra = (a as unknown as WsMock).sent.reverse().find(m => (m as any).type === 'sync_play');
    const rb = (b as unknown as WsMock).sent.reverse().find(m => (m as any).type === 'sync_play');
    expect(ra && rb).toBeTruthy();
    expect((ra as any).videoTime).toBeCloseTo((rb as any).videoTime, 3);

    // End
    engine.endPlayback();
    // Internal state checks (cast to any for access)
    expect((engine as any)['syncState'].isPlaying).toBe(false);
    expect((engine as any)['syncState'].currentVideo).toBeUndefined();
  });
});


