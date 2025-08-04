import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { type AppState } from '../store/appStore';
import OnlineSessionConnectPage from '../pages/OnlineSessionConnectPage';

// Mock the Zustand store
const mockState: AppState = {
  mode: 'online',
  socket: null,
  connectionStatus: 'idle',
  error: null,
  queue: [],
  nowPlaying: null,
  sessionState: null,
  sessionHistory: [],
  playbackState: 'stopped',
  tickerText: '',
  currentView: 'home',
  isLoading: false,
  showHistory: false,
  searchQuery: '',
  searchResults: [],
  serverInfo: { port: 8080, localIps: ['192.168.1.100'] },
  devices: [],
  onlineSessionRequiresLibrary: false,
  isSetupComplete: false,
  setIsSetupComplete: vi.fn(),
  setOnlineSessionRequiresLibrary: vi.fn(),
  checkSetupStatus: vi.fn(),
  checkServerInfo: vi.fn(),
  setServerInfo: vi.fn(),
  isSessionConnected: false,
  setIsSessionConnected: vi.fn(),
  onlineSessionId: null,
  setOnlineSessionId: vi.fn(),
  setMode: vi.fn(),
  setSocket: vi.fn(),
  setConnectionStatus: vi.fn(),
  setError: vi.fn(),
  setQueue: vi.fn(),
  addToQueue: vi.fn(),
  removeFromQueue: vi.fn(),
  setNowPlaying: vi.fn(),
  setTickerText: vi.fn(),
  setCurrentView: vi.fn(),
  setIsLoading: vi.fn(),
  setSearchQuery: vi.fn(),
  setSearchResults: vi.fn(),
  setSessionState: vi.fn(),
  setSessionHistory: vi.fn(),
  setPlaybackState: vi.fn(),
  setShowHistory: vi.fn(),
  connectToOnlineSession: vi.fn(),
  requestSong: vi.fn(),
  playNext: vi.fn(),
  pausePlayback: vi.fn(),
  resumePlayback: vi.fn(),
  stopPlayback: vi.fn(),
  restartSong: vi.fn(),
  replaySong: vi.fn(),
  skipSong: vi.fn(),
  updateTicker: vi.fn(),
  setDevices: vi.fn(),
  fetchDevices: vi.fn(),
  toggleDeviceAudio: vi.fn(),
  toggleDeviceTicker: vi.fn(),
  toggleDeviceSidebar: vi.fn(),
  toggleDeviceVideoPlayer: vi.fn(),
  identifyDevice: vi.fn(),
  disconnectDevice: vi.fn(),
};

vi.mock('../store/appStore', () => ({
  useAppStore: vi.fn((selector) => {
    if (selector) {
      return selector(mockState);
    }
    return mockState;
  }),
}));


describe('OnlineSessionConnectPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Reset state
    mockState.connectionStatus = 'idle';
    mockState.error = null;
    (mockState.connectToOnlineSession as Mock).mockClear();
  });

  it('renders the connection form correctly', () => {
    render(<OnlineSessionConnectPage />);
    expect(screen.getByText('Connect to Online Session')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Admin Key')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Connect/i })).toBeInTheDocument();
  });

  it('allows users to input session ID and admin key', () => {
    render(<OnlineSessionConnectPage />);
    const adminKeyInput = screen.getByPlaceholderText('Admin Key');

    fireEvent.change(adminKeyInput, { target: { value: 'my-secret-key' } });

    expect(adminKeyInput).toHaveValue('my-secret-key');
  });

  it('calls connectToOnlineSession with the correct credentials on submit', () => {
    render(<OnlineSessionConnectPage />);
    const adminKeyInput = screen.getByPlaceholderText('Admin Key');
    const connectButton = screen.getByRole('button', { name: /Connect/i });

    fireEvent.change(adminKeyInput, { target: { value: 'my-secret-key' } });
    fireEvent.click(connectButton);
  });

  it('disables the button and shows "Connecting..." when connection status is "connecting"', () => {
    mockState.connectionStatus = 'connecting';
    render(<OnlineSessionConnectPage />);
    const connectButton = screen.getByRole('button', { name: /Connecting.../i });
    expect(connectButton).toBeDisabled();
  });

  it('displays an error message if the connection fails', () => {
    mockState.connectionStatus = 'error';
    mockState.error = 'Invalid credentials.';
    render(<OnlineSessionConnectPage />);
    expect(screen.getByText('Invalid credentials.')).toBeInTheDocument();
  });
});
