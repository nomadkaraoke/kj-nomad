import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAppStore } from '../../store/appStore';
import PlayerScreenManager from './PlayerScreenManager';

vi.mock('../../store/appStore', async (orig) => {
  const actual = await orig();
  const mockStore = actual.useAppStore;
  const devices = [
    { id: 'd1', name: 'Screen 1', ipAddress: '1.1.1.1', viewport: { width: 800, height: 600 }, os: 'macOS', browser: 'Chrome', isApp: false, isOnline: true, lastActivity: Date.now(), isAudioEnabled: true, isTickerVisible: true, isSidebarVisible: false, isVideoPlayerVisible: true, syncStats: { averageLatency: 0, lastSyncError: -50 } },
    { id: 'd2', name: 'Screen 2', ipAddress: '1.1.1.2', viewport: { width: 800, height: 600 }, os: 'macOS', browser: 'Firefox', isApp: false, isOnline: true, lastActivity: Date.now(), isAudioEnabled: false, isTickerVisible: true, isSidebarVisible: false, isVideoPlayerVisible: true, syncStats: { averageLatency: 0, lastSyncError: -70 } },
  ];
  mockStore.setState({ devices, serverInfo: { port: 8080, localIps: ['127.0.0.1'] }, socket: { addEventListener: () => {}, removeEventListener: () => {} } as unknown as WebSocket });
  return actual;
});

describe('PlayerScreenManager', () => {
  it('toggles global debug overlay and shows Copy Log only with log open', async () => {
    const toggleSpy = vi.spyOn(useAppStore.getState(), 'toggleDeviceDebugOverlay');
    render(<PlayerScreenManager />);

    // Copy Log not visible initially
    expect(screen.queryByText(/Copy Log/i)).toBeNull();

    // Open log via top-right control (labelled 'log')
    fireEvent.click(screen.getByTitle(/Show Sync Log/i));
    expect(screen.getByText(/Copy Log/i)).toBeInTheDocument();

    // Toggle overlay for all devices via bug icon
    fireEvent.click(screen.getByTitle(/Toggle debug overlay on all player screens/i));
    expect(toggleSpy).toHaveBeenCalled();
  });
});


