import React from 'react';
import { render, screen, act } from '@testing-library/react';
import PlayerPage from '../../pages/PlayerPage';
import { useAppStore } from '../../store/appStore';

function advance(ms: number) { vi.advanceTimersByTime(ms); return Promise.resolve(); }

describe('Two PlayerPage instances start together within tolerance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const patch: Parameters<typeof useAppStore.setState>[0] = {
      connectionStatus: 'connected',
      playerIsDisconnected: false,
      queue: [],
      devices: [],
      tickerText: '',
      lastClockLatencyMs: 0,
      lastClockOffsetMs: 0,
      syncPreload: null,
      syncPlay: null,
      syncPause: null,
      setSyncPlay: (cmd: unknown) => useAppStore.setState({ syncPlay: cmd as { commandId: string; scheduledTime: number; videoTime: number; videoUrl: string; timeDomain?: 'client'|'server' } }),
    } as unknown as Parameters<typeof useAppStore.setState>[0];
    useAppStore.setState(patch);
  });
  afterEach(() => vi.useRealTimers());

  it('both seek to the same start time when schedule fires', async () => {
    render(<>
      <PlayerPage />
      <PlayerPage />
    </>);

    const v1 = () => screen.getAllByTestId('video')[0] as HTMLVideoElement;
    const v2 = () => screen.getAllByTestId('video')[1] as HTMLVideoElement;

    // Schedule play 800ms ahead
    const scheduled = Date.now() + 800;
    const startAt = 12.34;
    // Seed src to allow currentTime to be set in JSDOM
    v1().setAttribute('src', '/api/media/x.mp4');
    v2().setAttribute('src', '/api/media/x.mp4');
    await act(async () => {
      useAppStore.getState().setSyncPlay!({ commandId: 'cmd', scheduledTime: scheduled, videoTime: startAt, videoUrl: '/api/media/x.mp4', timeDomain: 'server' });
    });

    await act(() => advance(900));

    expect(v1().currentTime).toBeCloseTo(startAt, 2);
    expect(v2().currentTime).toBeCloseTo(startAt, 2);
    // within 10ms tolerance (identical here due to mock)
    expect(Math.abs(v1().currentTime - v2().currentTime)).toBeLessThan(0.01);
  });
});


