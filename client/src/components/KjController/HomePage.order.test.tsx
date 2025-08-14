import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import HomePage from '../../pages/HomePage';
import { useAppStore } from '../../store/appStore';

describe('HomePage layout order', () => {
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

  it('renders Player Screens section after Ticker Message', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </ThemeProvider>
    );
    const ticker = screen.getByRole('heading', { name: /Ticker Message/i });
    const playerScreens = screen.getByRole('heading', { name: /^Player Screens$/i });
    expect(ticker.compareDocumentPosition(playerScreens) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});


