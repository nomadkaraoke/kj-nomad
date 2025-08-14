import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PlayerPage from '../../pages/PlayerPage';
import { useAppStore } from '../../store/appStore';

describe('PlayerPage end-of-song unload and Ready UI', () => {
  beforeEach(() => {
    const patch: Parameters<typeof useAppStore.setState>[0] = {
      connectionStatus: 'connected',
      queue: [],
      devices: [],
      playerIsDisconnected: false,
      tickerText: '',
      syncPreload: null,
      syncPlay: { commandId: 'cmd', scheduledTime: Date.now(), videoTime: 0, videoUrl: '/api/media/x.mp4', timeDomain: 'server' },
      syncPause: null,
    } as unknown as Parameters<typeof useAppStore.setState>[0];
    useAppStore.setState(patch);
  });

  it('unloads media on ended and shows Ready screen', async () => {
    render(<PlayerPage />);
    const video = screen.getByTestId('video') as HTMLVideoElement;
    // Simulate that src is set (as would be by preload/play path)
    video.setAttribute('src', '/api/media/x.mp4');
    // Fire ended
    await act(async () => {
      fireEvent.ended(video);
    });
    expect(video.getAttribute('src')).toBeNull();
    expect(screen.getByText(/KJ-Nomad Ready/i)).toBeInTheDocument();
  });
});


