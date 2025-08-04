import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { useAppStore } from '../store/appStore';
import PlayerScreenManager from '../components/KjController/PlayerScreenManager';

// Mock the store
vi.mock('../store/appStore');

const mockDevice = {
  id: 'device-1',
  name: 'Screen 1',
  ipAddress: '192.168.1.100',
  viewport: { width: 1920, height: 1080 },
  os: 'Test OS',
  browser: 'Test Browser',
  isApp: false,
  isOnline: true,
  lastActivity: Date.now(),
  isAudioEnabled: true,
  isTickerVisible: true,
  isSidebarVisible: false,
  isVideoPlayerVisible: true,
};

describe('PlayerScreenManager', () => {
  const mockFetchDevices = vi.fn();
  const mockToggleDeviceAudio = vi.fn();
  const mockToggleDeviceTicker = vi.fn();
  const mockToggleDeviceSidebar = vi.fn();
  const mockToggleDeviceVideoPlayer = vi.fn();
  const mockIdentifyDevice = vi.fn();
  const mockDisconnectDevice = vi.fn();
  const mockCheckServerInfo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppStore as unknown as Mock).mockReturnValue({
      devices: [],
      fetchDevices: mockFetchDevices,
      toggleDeviceAudio: mockToggleDeviceAudio,
      toggleDeviceTicker: mockToggleDeviceTicker,
      toggleDeviceSidebar: mockToggleDeviceSidebar,
      toggleDeviceVideoPlayer: mockToggleDeviceVideoPlayer,
      identifyDevice: mockIdentifyDevice,
      disconnectDevice: mockDisconnectDevice,
      serverInfo: { port: 8080, localIps: ['192.168.1.18'] },
      checkServerInfo: mockCheckServerInfo,
    });
  });

  it('renders no screens connected message', () => {
    render(<PlayerScreenManager />);
    expect(screen.getByText('No Player Screens Connected')).toBeInTheDocument();
  });

  it('renders a connected device', () => {
    (useAppStore as unknown as Mock).mockReturnValue({
      devices: [mockDevice],
      fetchDevices: mockFetchDevices,
      toggleDeviceAudio: mockToggleDeviceAudio,
      toggleDeviceTicker: mockToggleDeviceTicker,
      toggleDeviceSidebar: mockToggleDeviceSidebar,
      toggleDeviceVideoPlayer: mockToggleDeviceVideoPlayer,
      identifyDevice: mockIdentifyDevice,
      disconnectDevice: mockDisconnectDevice,
      serverInfo: { port: 8080, localIps: ['192.168.1.18'] },
      checkServerInfo: mockCheckServerInfo,
    });

    render(<PlayerScreenManager />);
    expect(screen.getByText('Screen 1')).toBeInTheDocument();
    expect(screen.getByText('1920x1080 - Test Browser on Test OS')).toBeInTheDocument();
  });

  it('calls toggleDeviceAudio when audio button is clicked', () => {
    (useAppStore as unknown as Mock).mockReturnValue({
      devices: [mockDevice],
      fetchDevices: mockFetchDevices,
      toggleDeviceAudio: mockToggleDeviceAudio,
      toggleDeviceTicker: mockToggleDeviceTicker,
      toggleDeviceSidebar: mockToggleDeviceSidebar,
      toggleDeviceVideoPlayer: mockToggleDeviceVideoPlayer,
      identifyDevice: mockIdentifyDevice,
      disconnectDevice: mockDisconnectDevice,
      serverInfo: { port: 8080, localIps: ['192.168.1.18'] },
      checkServerInfo: mockCheckServerInfo,
    });

    render(<PlayerScreenManager />);
    const audioButton = screen.getByTitle('Mute Audio');
    fireEvent.click(audioButton);
    expect(mockToggleDeviceAudio).toHaveBeenCalledWith('device-1');
  });

  it('calls toggleDeviceTicker when ticker button is clicked', () => {
    (useAppStore as unknown as Mock).mockReturnValue({
      devices: [mockDevice],
      fetchDevices: mockFetchDevices,
      toggleDeviceAudio: mockToggleDeviceAudio,
      toggleDeviceTicker: mockToggleDeviceTicker,
      toggleDeviceSidebar: mockToggleDeviceSidebar,
      toggleDeviceVideoPlayer: mockToggleDeviceVideoPlayer,
      identifyDevice: mockIdentifyDevice,
      disconnectDevice: mockDisconnectDevice,
      serverInfo: { port: 8080, localIps: ['192.168.1.18'] },
      checkServerInfo: mockCheckServerInfo,
    });

    render(<PlayerScreenManager />);
    const tickerButton = screen.getByTitle('Hide Ticker');
    fireEvent.click(tickerButton);
    expect(mockToggleDeviceTicker).toHaveBeenCalledWith('device-1');
  });

  it('calls toggleDeviceSidebar when sidebar button is clicked', () => {
    (useAppStore as unknown as Mock).mockReturnValue({
      devices: [mockDevice],
      fetchDevices: mockFetchDevices,
      toggleDeviceAudio: mockToggleDeviceAudio,
      toggleDeviceTicker: mockToggleDeviceTicker,
      toggleDeviceSidebar: mockToggleDeviceSidebar,
      toggleDeviceVideoPlayer: mockToggleDeviceVideoPlayer,
      identifyDevice: mockIdentifyDevice,
      disconnectDevice: mockDisconnectDevice,
      serverInfo: { port: 8080, localIps: ['192.168.1.18'] },
      checkServerInfo: mockCheckServerInfo,
    });

    render(<PlayerScreenManager />);
    const sidebarButton = screen.getByTitle('Show Sidebar');
    fireEvent.click(sidebarButton);
    expect(mockToggleDeviceSidebar).toHaveBeenCalledWith('device-1');
  });

  it('calls toggleDeviceVideoPlayer when video button is clicked', () => {
    (useAppStore as unknown as Mock).mockReturnValue({
      devices: [mockDevice],
      fetchDevices: mockFetchDevices,
      toggleDeviceAudio: mockToggleDeviceAudio,
      toggleDeviceTicker: mockToggleDeviceTicker,
      toggleDeviceSidebar: mockToggleDeviceSidebar,
      toggleDeviceVideoPlayer: mockToggleDeviceVideoPlayer,
      identifyDevice: mockIdentifyDevice,
      disconnectDevice: mockDisconnectDevice,
      serverInfo: { port: 8080, localIps: ['192.168.1.18'] },
      checkServerInfo: mockCheckServerInfo,
    });

    render(<PlayerScreenManager />);
    const videoButton = screen.getByTitle('Hide Video Player');
    fireEvent.click(videoButton);
    expect(mockToggleDeviceVideoPlayer).toHaveBeenCalledWith('device-1');
  });

  it('calls identifyDevice when identify button is clicked', () => {
    (useAppStore as unknown as Mock).mockReturnValue({
      devices: [mockDevice],
      fetchDevices: mockFetchDevices,
      toggleDeviceAudio: mockToggleDeviceAudio,
      toggleDeviceTicker: mockToggleDeviceTicker,
      toggleDeviceSidebar: mockToggleDeviceSidebar,
      toggleDeviceVideoPlayer: mockToggleDeviceVideoPlayer,
      identifyDevice: mockIdentifyDevice,
      disconnectDevice: mockDisconnectDevice,
      serverInfo: { port: 8080, localIps: ['192.168.1.18'] },
      checkServerInfo: mockCheckServerInfo,
    });

    render(<PlayerScreenManager />);
    const identifyButton = screen.getByTitle('Identify Screen');
    fireEvent.click(identifyButton);
    expect(mockIdentifyDevice).toHaveBeenCalledWith('device-1');
  });

  it('calls disconnectDevice when disconnect button is clicked', () => {
    (useAppStore as unknown as Mock).mockReturnValue({
      devices: [mockDevice],
      fetchDevices: mockFetchDevices,
      toggleDeviceAudio: mockToggleDeviceAudio,
      toggleDeviceTicker: mockToggleDeviceTicker,
      toggleDeviceSidebar: mockToggleDeviceSidebar,
      toggleDeviceVideoPlayer: mockToggleDeviceVideoPlayer,
      identifyDevice: mockIdentifyDevice,
      disconnectDevice: mockDisconnectDevice,
      serverInfo: { port: 8080, localIps: ['192.168.1.18'] },
      checkServerInfo: mockCheckServerInfo,
    });

    render(<PlayerScreenManager />);
    const disconnectButton = screen.getByTitle('Disconnect Screen');
    fireEvent.click(disconnectButton);
    expect(mockDisconnectDevice).toHaveBeenCalledWith('device-1');
  });
});
