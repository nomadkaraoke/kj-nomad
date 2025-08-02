import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WebSocket from 'ws';
import { networkInterfaces } from 'os';

// Mock dependencies before any imports
vi.mock('ws');
vi.mock('os');

// Mock fetch globally
global.fetch = vi.fn();

const mockWebSocket = vi.mocked(WebSocket);
const mockNetworkInterfaces = vi.mocked(networkInterfaces);
const mockFetch = vi.mocked(fetch);

// Import after mocks are set up
import { CloudConnector } from '../cloudConnector';

// Mock WebSocket instance
class MockWebSocketInstance {
  public onopen: ((event: any) => void) | null = null;
  public onmessage: ((event: any) => void) | null = null;
  public onclose: ((event: any) => void) | null = null;
  public onerror: ((event: any) => void) | null = null;
  
  private handlers: { [key: string]: ((event: any) => void)[] } = {};

  on(event: string, handler: (event: any) => void) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }

  send = vi.fn();
  close = vi.fn();

  // Helper methods to simulate events
  simulateOpen() {
    this.handlers['open']?.forEach(handler => handler({}));
  }

  simulateMessage(data: any) {
    this.handlers['message']?.forEach(handler => handler(data));
  }

  simulateClose() {
    this.handlers['close']?.forEach(handler => handler({}));
  }

  simulateError(error: any) {
    this.handlers['error']?.forEach(handler => handler(error));
  }
}

describe('CloudConnector', () => {
  let cloudConnector: CloudConnector;
  let mockWsInstance: MockWebSocketInstance;
  
  const defaultConfig = {
    enableCloud: true,
    cloudApiUrl: 'https://test-api.example.com',
    cloudWsUrl: 'wss://test-ws.example.com'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock console methods to suppress output during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Spy on timer functions
    vi.spyOn(global, 'setTimeout');
    vi.spyOn(global, 'setInterval');
    vi.spyOn(global, 'clearInterval');
    
    // Setup WebSocket mock
    mockWsInstance = new MockWebSocketInstance();
    mockWebSocket.mockImplementation(() => mockWsInstance as any);
    
    // Setup default network interfaces mock
    mockNetworkInterfaces.mockReturnValue({
      eth0: [
        {
          address: '192.168.1.100',
          netmask: '255.255.255.0',
          family: 'IPv4',
          mac: '01:02:03:04:05:06',
          internal: false,
          cidr: '192.168.1.100/24'
        }
      ],
      lo: [
        {
          address: '127.0.0.1',
          netmask: '255.0.0.0',
          family: 'IPv4',
          mac: '00:00:00:00:00:00',
          internal: true,
          cidr: '127.0.0.1/8'
        }
      ]
    });
    
    // Create fresh instance for each test
    cloudConnector = new CloudConnector(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with provided config', () => {
      const config = {
        enableCloud: false,
        cloudApiUrl: 'https://custom-api.com',
        cloudWsUrl: 'wss://custom-ws.com'
      };
      
      const connector = new CloudConnector(config);
      const status = connector.getStatus();
      
      expect(status.isConnected).toBe(false);
      expect(status.sessionId).toBeUndefined();
      expect(status.reconnectAttempts).toBe(0);
    });

    it('should have correct initial state', () => {
      const status = cloudConnector.getStatus();
      
      expect(status.isConnected).toBe(false);
      expect(status.sessionId).toBeUndefined();
      expect(status.reconnectAttempts).toBe(0);
      expect(status.localIP).toBe('192.168.1.100');
    });
  });

  describe('Local IP Detection', () => {
    it('should prefer IPv4 non-internal addresses', () => {
      mockNetworkInterfaces.mockReturnValue({
        lo: [
          {
            address: '127.0.0.1',
            netmask: '255.0.0.0',
            family: 'IPv4',
            mac: '00:00:00:00:00:00',
            internal: true,
            cidr: '127.0.0.1/8'
          }
        ],
        eth0: [
          {
            address: '192.168.1.50',
            netmask: '255.255.255.0',
            family: 'IPv4',
            mac: '01:02:03:04:05:06',
            internal: false,
            cidr: '192.168.1.50/24'
          }
        ]
      });
      
      const status = cloudConnector.getStatus();
      expect(status.localIP).toBe('192.168.1.50');
    });

    it('should prefer private network ranges', () => {
      mockNetworkInterfaces.mockReturnValue({
        eth0: [
          {
            address: '10.0.0.100',
            netmask: '255.0.0.0',
            family: 'IPv4',
            mac: '01:02:03:04:05:06',
            internal: false,
            cidr: '10.0.0.100/8'
          }
        ],
        wlan0: [
          {
            address: '172.16.0.50',
            netmask: '255.255.0.0',
            family: 'IPv4',
            mac: '01:02:03:04:05:07',
            internal: false,
            cidr: '172.16.0.50/16'
          }
        ]
      });
      
      const status = cloudConnector.getStatus();
      // Should return the first valid private IP found
      expect(['10.0.0.100', '172.16.0.50']).toContain(status.localIP);
    });

    it('should fallback to localhost when no suitable IP found', () => {
      mockNetworkInterfaces.mockReturnValue({
        lo: [
          {
            address: '127.0.0.1',
            netmask: '255.0.0.0',
            family: 'IPv4',
            mac: '00:00:00:00:00:00',
            internal: true,
            cidr: '127.0.0.1/8'
          }
        ]
      });
      
      const status = cloudConnector.getStatus();
      expect(status.localIP).toBe('localhost');
    });

    it('should handle empty network interfaces', () => {
      mockNetworkInterfaces.mockReturnValue({});
      
      const status = cloudConnector.getStatus();
      expect(status.localIP).toBe('localhost');
    });

    it('should handle null network interfaces', () => {
      mockNetworkInterfaces.mockReturnValue({
        eth0: null as any
      });
      
      const status = cloudConnector.getStatus();
      expect(status.localIP).toBe('localhost');
    });

    it('should skip IPv6 addresses', () => {
      mockNetworkInterfaces.mockReturnValue({
        eth0: [
          {
            address: '::1',
            netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
            family: 'IPv6',
            mac: '01:02:03:04:05:06',
            internal: true,
            cidr: '::1/128',
            scopeid: 0
          },
          {
            address: '192.168.1.100',
            netmask: '255.255.255.0',
            family: 'IPv4',
            mac: '01:02:03:04:05:06',
            internal: false,
            cidr: '192.168.1.100/24'
          }
        ]
      });
      
      const status = cloudConnector.getStatus();
      expect(status.localIP).toBe('192.168.1.100');
    });
  });

  describe('Local Broadcast Management', () => {
    it('should set local broadcast function', () => {
      const mockBroadcast = vi.fn();
      cloudConnector.setLocalBroadcast(mockBroadcast);
      
      // The broadcast function is set internally, no direct way to verify
      // This will be tested through message handling tests
      expect(mockBroadcast).toBeDefined();
    });
  });

  describe('Session Registration', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, sessionId: '1234' })
      } as Response);
    });

    it('should return false when cloud mode is disabled', async () => {
      const disabledConnector = new CloudConnector({
        ...defaultConfig,
        enableCloud: false
      });
      
      const result = await disabledConnector.registerWithSession('1234', 8080);
      
      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith('[CloudConnector] Cloud mode disabled');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should register with session successfully', async () => {
      const result = await cloudConnector.registerWithSession('1234', 8080, {
        kjName: 'Test KJ',
        venue: 'Test Venue',
        allowYouTube: true
      });
      
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.example.com/api/sessions/1234/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: '1234',
            localServerIP: '192.168.1.100',
            localServerPort: 8080,
            kjName: 'Test KJ',
            venue: 'Test Venue',
            hasLocalLibrary: true,
            allowYouTube: true
          })
        }
      );
      expect(mockWebSocket).toHaveBeenCalledWith(
        'wss://test-ws.example.com/sessions/1234/ws?type=local-server'
      );
    });

    it('should register with minimal options', async () => {
      const result = await cloudConnector.registerWithSession('5678', 3000);
      
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.example.com/api/sessions/5678/register',
        expect.objectContaining({
          body: JSON.stringify({
            sessionId: '5678',
            localServerIP: '192.168.1.100',
            localServerPort: 3000,
            kjName: undefined,
            venue: undefined,
            hasLocalLibrary: true,
            allowYouTube: false
          })
        })
      );
    });

    it('should handle registration failure - non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);
      
      const result = await cloudConnector.registerWithSession('1234', 8080);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('[CloudConnector] Registration failed:', 404, 'Not Found');
      expect(mockWebSocket).not.toHaveBeenCalled();
    });

    it('should handle registration failure - network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const result = await cloudConnector.registerWithSession('1234', 8080);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('[CloudConnector] Registration error:', expect.any(Error));
      expect(mockWebSocket).not.toHaveBeenCalled();
    });

    it('should handle JSON parsing error', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      } as unknown as Response);
      
      const result = await cloudConnector.registerWithSession('1234', 8080);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('[CloudConnector] Registration error:', expect.any(Error));
    });
  });

  describe('WebSocket Connection Management', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);
    });

    it('should connect to WebSocket relay successfully', async () => {
      const result = await cloudConnector.registerWithSession('1234', 8080);
      
      expect(result).toBe(true);
      expect(mockWebSocket).toHaveBeenCalledWith(
        'wss://test-ws.example.com/sessions/1234/ws?type=local-server'
      );
    });

    it('should handle WebSocket open event', async () => {
      await cloudConnector.registerWithSession('1234', 8080);
      
      mockWsInstance.simulateOpen();
      
      const status = cloudConnector.getStatus();
      expect(status.isConnected).toBe(true);
      expect(status.reconnectAttempts).toBe(0);
      expect(console.log).toHaveBeenCalledWith('[CloudConnector] Connected to cloud relay');
    });

    it('should handle incoming messages and broadcast locally', async () => {
      const mockLocalBroadcast = vi.fn();
      cloudConnector.setLocalBroadcast(mockLocalBroadcast);
      
      await cloudConnector.registerWithSession('1234', 8080);
      mockWsInstance.simulateOpen();
      
      const testMessage = { type: 'test', payload: { data: 'hello' } };
      mockWsInstance.simulateMessage(JSON.stringify(testMessage));
      
      expect(mockLocalBroadcast).toHaveBeenCalledWith(testMessage);
    });

    it('should handle malformed JSON messages gracefully', async () => {
      const mockLocalBroadcast = vi.fn();
      cloudConnector.setLocalBroadcast(mockLocalBroadcast);
      
      await cloudConnector.registerWithSession('1234', 8080);
      mockWsInstance.simulateOpen();
      
      mockWsInstance.simulateMessage('invalid json {');
      
      expect(console.error).toHaveBeenCalledWith('[CloudConnector] Failed to process cloud message:', expect.any(SyntaxError));
      expect(mockLocalBroadcast).not.toHaveBeenCalled();
    });

    it('should handle WebSocket close event and attempt reconnect', async () => {
      await cloudConnector.registerWithSession('1234', 8080);
      mockWsInstance.simulateOpen();
      
      expect(cloudConnector.getStatus().isConnected).toBe(true);
      
      mockWsInstance.simulateClose();
      
      expect(cloudConnector.getStatus().isConnected).toBe(false);
      expect(console.log).toHaveBeenCalledWith('[CloudConnector] Disconnected from cloud relay');
      
      // Check that reconnection is scheduled
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
    });

    it('should handle WebSocket error event', async () => {
      await cloudConnector.registerWithSession('1234', 8080);
      
      const error = new Error('WebSocket error');
      mockWsInstance.simulateError(error);
      
      expect(console.error).toHaveBeenCalledWith('[CloudConnector] WebSocket error:', error);
    });

    it('should handle connection errors during WebSocket creation', async () => {
      mockWebSocket.mockImplementation(() => {
        throw new Error('Connection failed');
      });
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);
      
      const result = await cloudConnector.registerWithSession('1234', 8080);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('[CloudConnector] Connection error:', expect.any(Error));
    });
  });

  describe('Message Sending', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);
      
      await cloudConnector.registerWithSession('1234', 8080);
      mockWsInstance.simulateOpen();
    });

    it('should send message to cloud when connected', () => {
      const message = { type: 'test', payload: { data: 'hello' } };
      
      const result = cloudConnector.sendToCloud(message);
      
      expect(result).toBe(true);
      expect(mockWsInstance.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should return false when not connected', () => {
      mockWsInstance.simulateClose();
      
      const message = { type: 'test', payload: { data: 'hello' } };
      const result = cloudConnector.sendToCloud(message);
      
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('[CloudConnector] Not connected to cloud, message dropped:', message);
      expect(mockWsInstance.send).not.toHaveBeenCalled();
    });

    it('should handle send errors gracefully', () => {
      mockWsInstance.send.mockImplementation(() => {
        throw new Error('Send failed');
      });
      
      const message = { type: 'test' };
      const result = cloudConnector.sendToCloud(message);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('[CloudConnector] Failed to send to cloud:', expect.any(Error));
    });
  });

  describe('Heartbeat Management', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);
      
      await cloudConnector.registerWithSession('1234', 8080);
      mockWsInstance.simulateOpen();
    });

    it('should start heartbeat when connected', () => {
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 30000);
    });

    it('should send ping messages during heartbeat', () => {
      // Advance time to trigger heartbeat
      vi.advanceTimersByTime(30000);
      
      expect(mockWsInstance.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(mockWsInstance.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('ping');
      expect(typeof sentMessage.timestamp).toBe('number');
    });

    it('should stop heartbeat when disconnected', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      mockWsInstance.simulateClose();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should not send heartbeat when not connected', () => {
      mockWsInstance.simulateClose();
      mockWsInstance.send.mockClear();
      
      vi.advanceTimersByTime(30000);
      
      expect(mockWsInstance.send).not.toHaveBeenCalled();
    });
  });

  describe('Reconnection Logic', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);
      
      await cloudConnector.registerWithSession('1234', 8080);
      mockWsInstance.simulateOpen();
    });

    it('should attempt reconnection with exponential backoff', () => {
      mockWsInstance.simulateClose();
      
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
      expect(console.log).toHaveBeenCalledWith('[CloudConnector] Reconnection attempt 1/5 in 5000ms');
      
      // Simulate multiple reconnection attempts
      vi.advanceTimersByTime(5000);
      mockWsInstance.simulateClose();
      
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 10000);
      expect(console.log).toHaveBeenCalledWith('[CloudConnector] Reconnection attempt 2/5 in 10000ms');
    });

    it('should stop reconnecting after max attempts', () => {
      // Simulate multiple failed reconnection attempts
      for (let i = 0; i < 5; i++) {
        mockWsInstance.simulateClose();
        vi.advanceTimersByTime(5000 * Math.pow(2, i));
      }
      
      mockWsInstance.simulateClose();
      
      expect(console.error).toHaveBeenCalledWith('[CloudConnector] Max reconnection attempts reached');
    });

    it('should reset reconnection attempts on successful connection', async () => {
      // Fail once
      mockWsInstance.simulateClose();
      expect(cloudConnector.getStatus().reconnectAttempts).toBe(1);
      
      // Reconnect successfully
      mockWsInstance.simulateOpen();
      expect(cloudConnector.getStatus().reconnectAttempts).toBe(0);
    });

    it('should cap reconnection delay at 60 seconds', () => {
      // Simulate many reconnection attempts to test delay cap
      for (let i = 0; i < 10; i++) {
        mockWsInstance.simulateClose();
        vi.advanceTimersByTime(5000 * Math.pow(2, i));
      }
      
      // The delay should be capped at 60000ms (60 seconds)
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 60000);
    });
  });

  describe('Disconnection', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);
      
      await cloudConnector.registerWithSession('1234', 8080);
      mockWsInstance.simulateOpen();
    });

    it('should disconnect cleanly', () => {
      cloudConnector.disconnect();
      
      expect(mockWsInstance.close).toHaveBeenCalled();
      expect(cloudConnector.getStatus().isConnected).toBe(false);
      expect(console.log).toHaveBeenCalledWith('[CloudConnector] Disconnected from cloud');
    });

    it('should handle disconnect when already disconnected', () => {
      cloudConnector.disconnect();
      cloudConnector.disconnect(); // Second call should not throw
      
      expect(mockWsInstance.close).toHaveBeenCalledTimes(1);
    });

    it('should stop heartbeat on disconnect', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      cloudConnector.disconnect();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Status and Mode Checking', () => {
    it('should return correct status when disconnected', () => {
      // Create a fresh connector with fresh config to ensure clean state
      const freshConfig = {
        enableCloud: true,
        cloudApiUrl: 'https://test-api.example.com',
        cloudWsUrl: 'wss://test-ws.example.com'
        // No sessionId set, should be undefined
      };
      
      const freshConnector = new CloudConnector(freshConfig);
      const status = freshConnector.getStatus();
      
      expect(status.isConnected).toBe(false);
      expect(status.sessionId).toBeUndefined();
      expect(status.reconnectAttempts).toBe(0);
      expect(status.localIP).toBe('192.168.1.100');
    });

    it('should return correct status when connected', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);
      
      await cloudConnector.registerWithSession('1234', 8080);
      mockWsInstance.simulateOpen();
      
      const status = cloudConnector.getStatus();
      
      expect(status).toEqual({
        isConnected: true,
        sessionId: '1234',
        reconnectAttempts: 0,
        localIP: '192.168.1.100'
      });
    });

    it('should return false for cloud mode when disabled', () => {
      const disabledConnector = new CloudConnector({
        ...defaultConfig,
        enableCloud: false
      });
      
      expect(disabledConnector.isCloudMode()).toBe(false);
    });

    it('should return false for cloud mode when not connected', () => {
      expect(cloudConnector.isCloudMode()).toBe(false);
    });

    it('should return true for cloud mode when enabled and connected', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);
      
      await cloudConnector.registerWithSession('1234', 8080);
      mockWsInstance.simulateOpen();
      
      expect(cloudConnector.isCloudMode()).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle registration without WebSocket connection', async () => {
      mockWebSocket.mockImplementation(() => {
        throw new Error('WebSocket creation failed');
      });
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);
      
      const result = await cloudConnector.registerWithSession('1234', 8080);
      
      expect(result).toBe(false);
    });

    it('should handle messages when no local broadcast is set', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);
      
      await cloudConnector.registerWithSession('1234', 8080);
      mockWsInstance.simulateOpen();
      
      const testMessage = { type: 'test' };
      mockWsInstance.simulateMessage(JSON.stringify(testMessage));
      
      // Should not throw error when no broadcast function is set
      expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('broadcast'));
    });

    it('should handle empty session ID during connection', () => {
      const connector = new CloudConnector(defaultConfig);
      
      // Try to connect without registering first
      const result = connector.sendToCloud({ type: 'test' });
      
      expect(result).toBe(false);
    });
  });
});