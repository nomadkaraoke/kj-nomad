import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DeviceManager } from '../deviceManager.js';
import { WebSocket as MockWebSocket } from 'ws';

// Mock WebSocket
const mockSend = vi.fn();
vi.mock('ws', () => {
  const MockWebSocket = vi.fn().mockImplementation(() => ({
    send: mockSend,
    close: vi.fn(),
    on: vi.fn(),
    readyState: 1, // Corresponds to WebSocket.OPEN
  }));

  // Assign static properties to the mock constructor
  Object.assign(MockWebSocket, {
    OPEN: 1,
    CONNECTING: 0,
    CLOSING: 2,
    CLOSED: 3,
  });

  return { WebSocket: MockWebSocket, Server: vi.fn() };
});

describe('DeviceManager', () => {
  let deviceManager: DeviceManager;

  beforeEach(() => {
    vi.useFakeTimers();
    deviceManager = new DeviceManager();
    mockSend.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    deviceManager.destroy();
  });

  it('should register a device correctly', () => {
    const ws = new MockWebSocket('ws://localhost:8080');
    const device = deviceManager.registerDevice('1', ws, {
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      viewport: { width: 1920, height: 1080 },
      os: 'test-os',
      browser: 'test-browser',
      isApp: false,
      capabilities: {},
    });

    expect(deviceManager.getDevices().length).toBe(1);
    expect(deviceManager.getDevice('1')).toBe(device);
    expect(mockSend).toHaveBeenCalledWith(expect.stringContaining('device_registered'));
  });

  it('should handle heartbeat and mark inactive devices as offline', () => {
    const ws = new MockWebSocket('ws://localhost:8080');
    deviceManager.registerDevice('1', ws, {
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      viewport: { width: 1920, height: 1080 },
      os: 'test-os',
      browser: 'test-browser',
      isApp: false,
      capabilities: {},
    });

    // Fast-forward time past the activity timeout to trigger the next heartbeat check
    vi.advanceTimersByTime(20000);

    const device = deviceManager.getDevice('1');
    expect(device?.isOnline).toBe(false);
  });

  it('should mark a device as reconnected on heartbeat response', () => {
    const ws = new MockWebSocket('ws://localhost:8080');
    deviceManager.registerDevice('1', ws, {
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      viewport: { width: 1920, height: 1080 },
      os: 'test-os',
      browser: 'test-browser',
      isApp: false,
      capabilities: {},
    });

    // Mark as offline
    vi.advanceTimersByTime(20000);
    expect(deviceManager.getDevice('1')?.isOnline).toBe(false);

    // Simulate heartbeat response
    deviceManager.handleHeartbeatResponse('1', { serverTime: Date.now(), clientTime: Date.now() });
    expect(deviceManager.getDevice('1')?.isOnline).toBe(true);
  });
});
