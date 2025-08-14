import { describe, it, expect } from 'vitest';
import { VideoSyncEngine } from '../videoSyncEngine.js';
import type { WebSocket as WSWebSocket } from 'ws';

class WsMock {
  public sent: Array<Record<string, unknown>> = [];
  public readyState = 1;
  public OPEN = 1;
  send(payload: string) {
    try { this.sent.push(JSON.parse(payload)); } catch { /* ignore */ }
  }
}

describe('VideoSyncEngine pause/resume baseline behavior', () => {
  it('records pausedAt and pausedAtVideoSec on pause and resumes from exact time', async () => {
    const engine = new VideoSyncEngine();
    const wsA = new WsMock() as unknown as WSWebSocket;
    engine.registerClient('c1', wsA, 'Client A', 'player');

    // Start a video
    await engine.syncPlayVideo('/api/media/test.mp4', 0);
    const startTime = Date.now();
    // Monkey-patch currentVideo.startTime to a fixed moment for deterministic math
    (engine as any)['syncState'].currentVideo.startTime = startTime;
    (engine as any)['syncState'].lastSyncCommand.videoTime = 0;

    // Pause scheduled slightly in the future
    await engine.syncPause();

    // Validate pause markers
    const cv = (engine as any)['syncState'].currentVideo as any;
    expect(typeof cv.pausedAt).toBe('number');
    expect(typeof cv.pausedAtVideoSec).toBe('number');
    // pausedAtVideoSec ≈ (pausedAt - startTime)/1000
    const approx = Math.max(0, ((cv.pausedAt as number) - startTime) / 1000);
    expect(Math.abs((cv.pausedAtVideoSec as number) - approx)).toBeLessThan(0.2);

    // Resume should schedule sync_play with videoTime === pausedAtVideoSec
    await engine.syncResume();
    const lastMsg = [...(wsA as unknown as WsMock).sent].reverse().find(m => (m as any).type === 'sync_play') as { videoTime: number } | undefined;
    expect(lastMsg).toBeTruthy();
    const resumedAt = (cv.pausedAtVideoSec as number) ?? 0;
    expect(Math.abs(((lastMsg as { videoTime: number }).videoTime) - resumedAt)).toBeLessThan(0.25);
  });
});


