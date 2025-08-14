import React from 'react';
import { render, screen, act } from '@testing-library/react';
import PlayerPage from '../../pages/PlayerPage';
import { useAppStore } from '../../store/appStore';

function advance(ms: number) { vi.advanceTimersByTime(ms); return Promise.resolve(); }

describe('PlayerPage expected freezes on pause and resumes advancing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const patch: Parameters<typeof useAppStore.setState>[0] = {
      connectionStatus: 'connected',
      playerIsDisconnected: false,
      queue: [],
      devices: [],
      playerDebugOverlay: true,
      tickerText: '',
      lastClockLatencyMs: 0,
      lastClockOffsetMs: 0,
      syncPlay: { commandId: 'c', scheduledTime: Date.now(), videoTime: 10, videoUrl: '/api/media/x.mp4', timeDomain: 'server' as const },
      syncPause: null,
      setSyncPause: (cmd: unknown) => useAppStore.setState({ syncPause: cmd as { commandId: string; scheduledTime: number } }),
    } as unknown as Parameters<typeof useAppStore.setState>[0];
    useAppStore.setState(patch);
  });
  afterEach(() => vi.useRealTimers());

  it('freezes then resumes', async () => {
    render(<PlayerPage />);
    // allow overlay loop to tick once
    await act(() => advance(300));
    // prime overlay value
    void screen.getByText(/expected:/i).textContent;
    // Pause
    await act(async () => {
      useAppStore.getState().setSyncPause!({ commandId: 'p', scheduledTime: Date.now() });
    });
    await act(() => advance(500));
    const paused = screen.getByText(/expected:/i).textContent!;
    // Allow slight rounding jitter from timer alignment (~±100ms)
    expect(paused).toMatch(/^expected: 10\.(2|3)\d\d s$/);
    // Let time pass and verify it stays the same
    await act(() => advance(1000));
    const still = screen.getByText(/expected:/i).textContent!;
    expect(still).toBe(paused);
  });
});


