import React from 'react';
import { render, screen, act } from '@testing-library/react';
import PlayerPage from '../../pages/PlayerPage';
import { useAppStore } from '../../store/appStore';

function advance(ms: number) {
  vi.advanceTimersByTime(ms);
  return Promise.resolve();
}

describe('PlayerPage scheduled play/pause/resume (timer-based)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const patch: Parameters<typeof useAppStore.setState>[0] = {
      connectionStatus: 'connected',
      queue: [],
      devices: [],
      playerDeviceId: null,
      playerShowIdentify: false,
      playerIsDisconnected: false,
      playerDebugOverlay: false,
      tickerText: '',
      lastClockLatencyMs: 0,
      lastClockOffsetMs: 0,
      syncPreload: null,
      syncPlay: null,
      syncPause: null,
      setSyncPreload: (cmd: unknown) => useAppStore.setState({ syncPreload: cmd as { commandId: string; videoUrl: string } }),
      setSyncPlay: (cmd: unknown) => useAppStore.setState({ syncPlay: cmd as { commandId: string; scheduledTime: number; videoTime: number; videoUrl: string; timeDomain?: 'client'|'server' } }),
      setSyncPause: (cmd: unknown) => useAppStore.setState({ syncPause: cmd as { commandId: string; scheduledTime: number } }),
    } as unknown as Parameters<typeof useAppStore.setState>[0];
    useAppStore.setState(patch);
  });
  afterEach(() => vi.useRealTimers());

  it('honors scheduled play and pause without unloading media', async () => {
    render(<PlayerPage />);
    const set = useAppStore.getState();

    // Schedule sync_play 1s in the future
    const now = Date.now();
    await act(async () => {
      set.setSyncPlay({ commandId: 'x', scheduledTime: now + 1000, videoTime: 5, videoUrl: '/api/media/x.mp4', timeDomain: 'server' });
    });
    // Ensure the video element has a src so currentTime mutations apply in JSDOM
    const videoEl = screen.getByTestId('video') as HTMLVideoElement;
    videoEl.setAttribute('src', '/api/media/x.mp4');
    // Let schedule fire
    await act(() => advance(1100));

    const video = screen.getByTestId('video') as HTMLVideoElement;
    // After schedule, currentTime should be set to videoTime (mocked play is no-op)
    expect(video.currentTime).toBeCloseTo(5, 1);

    // Schedule a pause; ensure we do not clear src
    await act(async () => {
      set.setSyncPause({ commandId: 'p', scheduledTime: now + 1500 });
    });
    await act(() => advance(500));
    expect(video.paused).toBe(true);
    expect(video.getAttribute('src')).not.toBeNull();
  });
});


