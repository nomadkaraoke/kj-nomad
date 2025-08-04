import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { useAppStore } from '../store/appStore';
import { Navigation } from '../components/Navigation';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';

// Mock the store
vi.mock('../store/appStore');

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the connection status as disconnected', () => {
    (useAppStore as unknown as Mock).mockReturnValue({
      connectionStatus: 'disconnected',
      error: 'Error',
      serverInfo: { localIps: [], port: 0 },
      checkServerInfo: vi.fn(),
    });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <Navigation />
        </MemoryRouter>
      </ThemeProvider>
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders the connection status as connected and displays the server IP', () => {
    (useAppStore as unknown as Mock).mockReturnValue({
      connectionStatus: 'connected',
      error: null,
      serverInfo: { localIps: ['192.168.1.100'], port: 8080 },
      checkServerInfo: vi.fn(),
    });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <Navigation />
        </MemoryRouter>
      </ThemeProvider>
    );
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.100:8080')).toBeInTheDocument();
  });
});
