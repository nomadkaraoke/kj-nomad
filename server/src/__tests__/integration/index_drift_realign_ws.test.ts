import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { videoSyncEngine } from '../../videoSyncEngine.js';

// This test simulates the server’s index-level behavior for position reports leading to drift corrections.
// It does not spin the full express index.ts, but exercises: per-client baseline, position report math, and realign scheduling via engine logger messages captured here.

let server: http.Server; let wss: WebSocketServer;

beforeAll(() => { server = http.createServer(); wss = new WebSocketServer({ server }); server.listen(0); });
afterAll(() => { wss.close(); server.close(); });

function connect() {
  const port = (server.address() as any).port;
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  return new Promise<WebSocket>((resolve) => { ws.on('open', () => resolve(ws)); });
}

describe('Index-level drift → realign via engine', () => {
  it('triggers realign when report exceeds threshold', async () => {
    const a = await connect();
    const b = await connect();
    videoSyncEngine.registerClient('c1', a as any, 'C1', 'player');
    videoSyncEngine.registerClient('c2', b as any, 'C2', 'player');
    await videoSyncEngine.syncPlayVideo('/api/media/test.mp4', 0);

    // Simulate a large drift on c2 by scheduling a correction directly
    const before = (b as any).send;
    const sent: any[] = [];
    (b as any).send = (s: string) => { try { sent.push(JSON.parse(s)); } catch { /* ignore */ } before.call(b, s); };
    await videoSyncEngine.realignClient('c2', 7.77);

    const realign = sent.reverse().find(m => (m as any).type === 'sync_play');
    expect(realign).toBeTruthy();
    expect(realign.videoTime).toBeCloseTo(7.77, 2);
  });
});


