import { describe, it, expect } from 'vitest';
import { VideoSyncEngine } from '../../videoSyncEngine.js';
import type { WebSocket as WSWebSocket } from 'ws';

class WsMock { readyState=1; OPEN=1; sent:any[]=[]; send(s:string){ try{this.sent.push(JSON.parse(s));}catch{ /* ignore */ } } }

describe('Reconnect catch-up (lite)', () => {
  it('on reconnect, client receives preload then play at elapsed time', async () => {
    const engine = new VideoSyncEngine();
    const ws1 = new WsMock() as unknown as WSWebSocket;
    // second ws not used; reconnect uses wsRe below
    engine.registerClient('c-stable', ws1, 'Player', 'player');

    // Start playback
    await engine.syncPlayVideo('/api/media/test.mp4', 0);

    // Simulate time passing then a reconnect with a new socket
    const wsRe = new WsMock() as unknown as WSWebSocket;
    engine.registerClient('c-reconnect', wsRe, 'Player Re', 'player');

    // Ask engine to catch up the reconnecting client at an elapsed timestamp
    const ok = await engine.catchUpClient('c-reconnect', '/api/media/test.mp4', 15.25);
    expect(ok).toBe(true);
    const preload = (wsRe as unknown as WsMock).sent.find(m => m.type === 'sync_preload');
    const play = (wsRe as unknown as WsMock).sent.find(m => m.type === 'sync_play');
    expect(preload).toBeTruthy();
    expect(play).toBeTruthy();
    expect(play.timeDomain).toBe('client');
    expect(play.videoTime).toBeCloseTo(15.25, 2);
  });
});


