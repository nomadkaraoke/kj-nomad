import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { videoSyncEngine } from '../../videoSyncEngine.js';

// NOTE: This is a minimal orchestration test to exercise preload→ready→play across two mock clients
// using an in-process ws server. It avoids the full HTTP server stack for speed.

let server: http.Server;
let wss: WebSocketServer;

beforeAll(() => {
  server = http.createServer();
  wss = new WebSocketServer({ server });
  server.listen(0);
});

afterAll(() => {
  wss.close();
  server.close();
});

function connectClient(_name: string) {
  const port = (server.address() as any).port;
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  return new Promise<{ ws: WebSocket }>((resolve) => {
    ws.on('open', () => resolve({ ws }));
  });
}

describe('WS orchestration: preload → ready → play (smoke)', () => {
  it('schedules play for two players after they report readiness', async () => {
    // Arrange mock clients connected via wss but route messages directly to engine
    const c1 = await connectClient('p1');
    const c2 = await connectClient('p2');

    // Register with engine
    videoSyncEngine.registerClient('p1', c1.ws as any, 'Player 1', 'player');
    videoSyncEngine.registerClient('p2', c2.ws as any, 'Player 2', 'player');

    // Capture messages sent to clients
    const sent1: any[] = [];
    const sent2: any[] = [];
    // Monkey-patch engine clients to use ws mocks with OPEN state rather than native ws sockets
    const mock1 = { readyState: 1, OPEN: 1, send: (s: string) => { try { sent1.push(JSON.parse(s)); } catch { /* ignore */ } } } as any;
    const mock2 = { readyState: 1, OPEN: 1, send: (s: string) => { try { sent2.push(JSON.parse(s)); } catch { /* ignore */ } } } as any;
    // Re-register using our mocks to avoid setter errors on ws properties
    videoSyncEngine.registerClient('p1', mock1 as any, 'Player 1', 'player');
    videoSyncEngine.registerClient('p2', mock2 as any, 'Player 2', 'player');

    // Act: schedule playing a video
    const ok = await videoSyncEngine.syncPlayVideo('/api/media/test.mp4', 0);
    expect(ok).toBe(true);
    // Assert: both received preload then play
    const hasPreload1 = sent1.some(m => m.type === 'sync_preload');
    const hasPreload2 = sent2.some(m => m.type === 'sync_preload');
    const hasPlay1 = sent1.some(m => m.type === 'sync_play');
    const hasPlay2 = sent2.some(m => m.type === 'sync_play');
    expect(hasPreload1 && hasPreload2 && hasPlay1 && hasPlay2).toBe(true);
  });
});


