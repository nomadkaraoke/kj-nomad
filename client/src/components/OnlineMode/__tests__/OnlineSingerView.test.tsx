import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import OnlineSingerView from '../OnlineSingerView';

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

describe('OnlineSingerView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue('1234');
    
    // Mock successful session fetch by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          sessionId: '1234',
          kjName: 'Test KJ',
          venue: 'Test Venue',
          status: 'active',
          hasLocalLibrary: true,
          allowYouTube: true,
          connectedClients: 2,
          playerScreens: 1
        }
      })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRouter = (component: React.ReactNode) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('renders loading state initially', () => {
    renderWithRouter(<OnlineSingerView />);
    expect(screen.getByText('Connecting to session...')).toBeInTheDocument();
  });

  it('renders session info when loaded', async () => {
    renderWithRouter(<OnlineSingerView />);

    await waitFor(() => {
      expect(screen.getByText('🎤 Request a Song')).toBeInTheDocument();
      expect(screen.getByText('Test Venue')).toBeInTheDocument();
      expect(screen.getByText('Session:')).toBeInTheDocument();
      expect(screen.getByText('1234')).toBeInTheDocument();
    });
  });

  it('shows error state when session fails to load', async () => {
    mockSearchParams.mockReturnValue(null);
    
    renderWithRouter(<OnlineSingerView />);

    await waitFor(() => {
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('No session ID provided')).toBeInTheDocument();
    });
  });

  it('renders song search interface', async () => {
    renderWithRouter(<OnlineSingerView />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search by artist or song title...')).toBeInTheDocument();
      expect(screen.getByText('Search for Songs')).toBeInTheDocument();
    });
  });

  it('handles song search input', async () => {
    renderWithRouter(<OnlineSingerView />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by artist or song title...');
      fireEvent.change(searchInput, { target: { value: 'test song' } });
      expect(searchInput).toHaveValue('test song');
    });
  });

  it('shows YouTube search hint when enabled', async () => {
    renderWithRouter(<OnlineSingerView />);

    await waitFor(() => {
      expect(screen.getByText('💡 Searches both local library and YouTube')).toBeInTheDocument();
    });
  });

  it('hides YouTube search hint when disabled', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          sessionId: '1234',
          kjName: 'Test KJ',
          venue: 'Test Venue',
          status: 'active',
          hasLocalLibrary: true,
          allowYouTube: false,
          connectedClients: 2,
          playerScreens: 1
        }
      })
    });

    renderWithRouter(<OnlineSingerView />);

    await waitFor(() => {
      expect(screen.queryByText('💡 Searches both local library and YouTube')).not.toBeInTheDocument();
    });
  });

  it('renders singer name input', async () => {
    renderWithRouter(<OnlineSingerView />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
      expect(screen.getByText('Your Name')).toBeInTheDocument();
    });
  });

  it('handles singer name input', async () => {
    renderWithRouter(<OnlineSingerView />);

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('Enter your name');
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      expect(nameInput).toHaveValue('John Doe');
    });
  });

  it('handles invalid session ID format', async () => {
    mockSearchParams.mockReturnValue('abc');
    
    renderWithRouter(<OnlineSingerView />);

    await waitFor(() => {
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('Invalid session ID format. Must be 4 digits.')).toBeInTheDocument();
    });
  });

  it('renders responsive design elements', async () => {
    renderWithRouter(<OnlineSingerView />);

    await waitFor(() => {
      // Find the main container div with min-h-screen class
      const container = document.querySelector('.min-h-screen');
      expect(container).toHaveClass('min-h-screen');
      expect(container).toHaveClass('bg-gray-900');
    });
  });

  it('shows search button state', async () => {
    renderWithRouter(<OnlineSingerView />);

    await waitFor(() => {
      const searchButton = screen.getByText('Search');
      expect(searchButton).toBeDisabled(); // Should be disabled when search query is empty
    });
  });

  it('enables search button when query is entered', async () => {
    renderWithRouter(<OnlineSingerView />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by artist or song title...');
      const searchButton = screen.getByText('Search');
      
      fireEvent.change(searchInput, { target: { value: 'test song' } });
      expect(searchButton).not.toBeDisabled();
    });
  });
});
