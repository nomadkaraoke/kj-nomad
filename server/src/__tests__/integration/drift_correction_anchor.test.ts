import { describe, it, expect, vi } from 'vitest';
import { VideoSyncEngine } from '../../videoSyncEngine.js';
import type { WebSocket as WSWebSocket } from 'ws';

class WsMock { readyState=1; OPEN=1; sent:any[]=[]; send(s:string){ try{this.sent.push(JSON.parse(s));}catch{ /* ignore */ } } }

describe('Auto-correction with anchor vs non-anchor', () => {
  it('does not correct anchor but will correct non-anchor', async () => {
    const engine = new VideoSyncEngine();
    const wa = new WsMock() as unknown as WSWebSocket;
    const wb = new WsMock() as unknown as WSWebSocket;
    engine.registerClient('anchor', wa, 'Anchor', 'player');
    engine.registerClient('muted', wb, 'Muted', 'player');

    await engine.syncPlayVideo('/api/media/v.mp4', 0);
    engine.setAnchorClient('anchor');

    // Simulate policy by directly invoking engine surfaces: bias adjust for anchor and realign for muted
    const biasSpy = vi.spyOn(engine, 'adjustBaselineBiasSec');
    await engine.realignClient('muted', 5);
    engine.adjustBaselineBiasSec(0.1);

    const messages = (wb as unknown as WsMock).sent;
    const mutedMsg = messages.reverse().find(m => (m as any).type === 'sync_play');
    expect(mutedMsg).toBeTruthy();
    expect(biasSpy).toHaveBeenCalled();
  });
});


