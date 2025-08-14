import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import HomePage from '../../pages/HomePage';
import { useAppStore } from '../../store/appStore';

describe('HomePage layout after moving settings', () => {
  beforeEach(() => {
    const patch: Parameters<typeof useAppStore.setState>[0] = {
      connectionStatus: 'connected',
      queue: [],
      nowPlaying: null,
      tickerText: 'Welcome',
      sessionState: null,
      sessionHistory: [],
      devices: [],
      serverInfo: { port: 8080, localIps: ['127.0.0.1'] },
      setShowHistory: () => {},
      removeFromQueue: () => {},
      reorderQueue: () => {},
      updateTicker: () => {},
    } as unknown as Parameters<typeof useAppStore.setState>[0];
    useAppStore.setState(patch);
  });

  it('does not render Ticker or Player Screens sections on HomePage anymore', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </ThemeProvider>
    );
    const ticker = screen.queryByRole('heading', { name: /Ticker Message/i });
    const playerScreens = screen.queryByRole('heading', { name: /^Player Screens$/i });
    expect(ticker).toBeNull();
    expect(playerScreens).toBeNull();
  });
});


