import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from '../store/appStore';
import PlayerPage from '../pages/PlayerPage';
import { websocketService } from '../services/websocketService';

// Mock the websocket service
vi.mock('../services/websocketService', () => ({
  websocketService: {
    connect: vi.fn(),
    send: vi.fn(),
    disconnect: vi.fn(),
    identifyAsPlayer: vi.fn(),
  },
}));

describe('PlayerPage', () => {
  beforeEach(() => {
    // Reset Zustand store before each test
    act(() => {
      useAppStore.setState({
        connectionStatus: 'connected',
        nowPlaying: null,
        tickerText: 'Test Ticker',
        queue: [],
        devices: [],
      });
    });
  });

  it('renders the connection status indicator', () => {
    render(<PlayerPage />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows "Connecting..." status', () => {
    act(() => {
      useAppStore.setState({ connectionStatus: 'connecting' });
    });
    render(<PlayerPage />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('connects as a player on mount', () => {
    render(<PlayerPage />);
    expect(websocketService.connect).toHaveBeenCalledWith('player');
  });
});
