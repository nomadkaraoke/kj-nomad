import React from 'react';
import { render, screen } from '@testing-library/react';
import PlayerPage from '../../pages/PlayerPage';
import { useAppStore } from '../../store/appStore';

describe('PlayerPage basic behaviors (mocked)', () => {
  beforeEach(() => {
    // minimal store init
    const patch: Parameters<typeof useAppStore.setState>[0] = {
      socket: null,
      connectionStatus: 'connected',
      playerDebugOverlay: true,
      lastClockLatencyMs: 0,
      lastClockOffsetMs: 0,
      queue: [],
      devices: [],
      playerDeviceId: null,
      playerShowIdentify: false,
      playerIsDisconnected: false,
      tickerText: 't',
      syncPreload: null,
      syncPlay: null,
      syncPause: null,
      setSyncPreload: (cmd: unknown) => useAppStore.setState({ syncPreload: cmd as { commandId: string; videoUrl: string } }),
      setSyncPlay: (cmd: unknown) => useAppStore.setState({ syncPlay: cmd as { commandId: string; scheduledTime: number; videoTime: number; videoUrl: string; timeDomain?: 'client'|'server' } }),
      setSyncPause: (cmd: unknown) => useAppStore.setState({ syncPause: cmd as { commandId: string; scheduledTime: number } }),
      setPlayerDebugOverlay: (v: boolean) => useAppStore.setState({ playerDebugOverlay: v }),
      setPlayerConnectionId: () => {},
      setClockSyncStats: () => {},
      setQueue: () => {},
      setDevices: () => {},
      setSessionState: () => {},
      setSessionHistory: () => {},
      setPlaybackState: () => {},
      setTickerText: () => {},
      setNowPlaying: () => {},
      setSocket: () => {},
      setConnectionStatus: () => {},
      setError: () => {},
    } as unknown as Parameters<typeof useAppStore.setState>[0];
    useAppStore.setState(patch);
  });

  it('renders debug overlay with expected/self drift lines', () => {
    render(<PlayerPage />);
    expect(screen.getByText(/Local time:/i)).toBeInTheDocument();
    expect(screen.getByText(/self drift:/i)).toBeInTheDocument();
  });
});


