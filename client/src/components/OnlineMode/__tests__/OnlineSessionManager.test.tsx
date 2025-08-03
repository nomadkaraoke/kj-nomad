import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import OnlineSessionManager from '../OnlineSessionManager';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock WebSocket
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  onopen: null,
  onmessage: null,
  onclose: null,
  onerror: null
};

global.WebSocket = vi.fn(() => mockWebSocket) as unknown as typeof WebSocket;

// Mock URLSearchParams
const mockSearchParams = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [{ get: mockSearchParams }]
  };
});

describe('OnlineSessionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue('1234');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRouter = (children: React.ReactNode) => {
    return render(
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  };

  it('shows loading state initially', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          sessionId: '1234',
          status: 'active',
          hasLocalLibrary: true,
          allowYouTube: true,
          connectedClients: 0,
          playerScreens: 0
        }
      })
    });

    renderWithRouter(
      <OnlineSessionManager>
        {(_, isLoading) => {
          if (isLoading) return <div>Loading...</div>;
          return <div>Loaded</div>;
        }}
      </OnlineSessionManager>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error when no session ID is provided', async () => {
    mockSearchParams.mockReturnValue(null);

    renderWithRouter(
      <OnlineSessionManager>
        {(_, __, error) => {
          if (error) return <div>Error: {error}</div>;
          return <div>No error</div>;
        }}
      </OnlineSessionManager>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: No session ID provided')).toBeInTheDocument();
    });
  });

  it('shows error for invalid session ID format', async () => {
    mockSearchParams.mockReturnValue('abc');

    renderWithRouter(
      <OnlineSessionManager>
        {(_, __, error) => {
          if (error) return <div>Error: {error}</div>;
          return <div>No error</div>;
        }}
      </OnlineSessionManager>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Invalid session ID format. Must be 4 digits.')).toBeInTheDocument();
    });
  });

  it('fetches session data successfully', async () => {
    const mockSessionData = {
      sessionId: '1234',
      kjName: 'Test KJ',
      venue: 'Test Venue',
      status: 'active' as const,
      hasLocalLibrary: true,
      allowYouTube: true,
      connectedClients: 2,
      playerScreens: 1
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSessionData
      })
    });

    renderWithRouter(
      <OnlineSessionManager>
        {(sessionData, isLoading) => {
          if (isLoading) return <div>Loading...</div>;
          if (sessionData) {
            return (
              <div>
                <div>Session: {sessionData.sessionId}</div>
                <div>KJ: {sessionData.kjName}</div>
                <div>Venue: {sessionData.venue}</div>
                <div>Status: {sessionData.status}</div>
              </div>
            );
          }
          return <div>No session</div>;
        }}
      </OnlineSessionManager>
    );

    await waitFor(() => {
      expect(screen.getByText('Session: 1234')).toBeInTheDocument();
      expect(screen.getByText('KJ: Test KJ')).toBeInTheDocument();
      expect(screen.getByText('Venue: Test Venue')).toBeInTheDocument();
      expect(screen.getByText('Status: active')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/sessions/1234');
  });

  it('handles fetch error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithRouter(
      <OnlineSessionManager>
        {(_, __, error) => {
          if (error) return <div>Error: {error}</div>;
          return <div>No error</div>;
        }}
      </OnlineSessionManager>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    });
  });

  it('handles 404 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    renderWithRouter(
      <OnlineSessionManager>
        {(_, __, error) => {
          if (error) return <div>Error: {error}</div>;
          return <div>No error</div>;
        }}
      </OnlineSessionManager>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Session not found. Please check your session ID.')).toBeInTheDocument();
    });
  });

  it('handles API error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: false,
        error: 'Session expired'
      })
    });

    renderWithRouter(
      <OnlineSessionManager>
        {(_, __, error) => {
          if (error) return <div>Error: {error}</div>;
          return <div>No error</div>;
        }}
      </OnlineSessionManager>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Session expired')).toBeInTheDocument();
    });
  });

  it('creates WebSocket connection after successful fetch', async () => {
    const mockSessionData = {
      sessionId: '1234',
      status: 'active' as const,
      hasLocalLibrary: true,
      allowYouTube: true,
      connectedClients: 0,
      playerScreens: 0
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSessionData
      })
    });

    renderWithRouter(
      <OnlineSessionManager>
        {(_, isLoading) => {
          if (isLoading) return <div>Loading...</div>;
          return <div>Loaded</div>;
        }}
      </OnlineSessionManager>
    );

    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
    });

    // WebSocket should be created
    expect(global.WebSocket).toHaveBeenCalled();
  });

  it('validates session ID format correctly', async () => {
    // Test valid 4-digit session ID
    mockSearchParams.mockReturnValue('9876');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          sessionId: '9876',
          status: 'active',
          hasLocalLibrary: true,
          allowYouTube: true,
          connectedClients: 0,
          playerScreens: 0
        }
      })
    });

    const { rerender } = renderWithRouter(
      <OnlineSessionManager>
        {(sessionData, isLoading) => {
          if (isLoading) return <div>Loading...</div>;
          if (sessionData) return <div>Valid: {sessionData.sessionId}</div>;
          return <div>No session</div>;
        }}
      </OnlineSessionManager>
    );

    await waitFor(() => {
      expect(screen.getByText('Valid: 9876')).toBeInTheDocument();
    });

    // Test invalid session ID with letters
    mockSearchParams.mockReturnValue('12ab');
    
    rerender(
      <BrowserRouter>
        <OnlineSessionManager>
          {(_, __, error) => {
            if (error) return <div>Error: {error}</div>;
            return <div>No error</div>;
          }}
        </OnlineSessionManager>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Invalid session ID format. Must be 4 digits.')).toBeInTheDocument();
    });
  });
});
