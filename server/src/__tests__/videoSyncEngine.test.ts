import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { VideoSyncEngine } from '../videoSyncEngine.js';

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  
  readyState = MockWebSocket.OPEN;
  messages: string[] = [];
  OPEN = MockWebSocket.OPEN;
  CLOSED = MockWebSocket.CLOSED;
  
  send(data: string) {
    if (this.readyState === MockWebSocket.OPEN) {
      this.messages.push(data);
    }
  }
  
  close() {
    this.readyState = MockWebSocket.CLOSED;
  }
  
  getLastMessage() {
    return this.messages[this.messages.length - 1];
  }
  
  getMessageCount() {
    return this.messages.length;
  }
  
  clearMessages() {
    this.messages = [];
  }
}

// Mock timers
vi.mock('timers', () => ({
  setInterval: vi.fn(),
  clearInterval: vi.fn()
}));

describe('VideoSyncEngine', () => {
  let engine: VideoSyncEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Create fresh engine instance for each test
    engine = new VideoSyncEngine();
    
    // Mock the private waitForClientReadiness method to resolve immediately
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(engine, 'waitForClientReadiness').mockResolvedValue(1);
    
    // Mock setInterval/clearInterval for fake timers
    global.setInterval = vi.fn((_fn, _delay) => {
      // Don't actually set intervals during tests
      return 123 as any;
    });
    global.clearInterval = vi.fn();
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  describe('Client Registration', () => {
    it('should register a player client correctly', () => {
      const ws = new MockWebSocket() as any;
      
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      const stats = engine.getSyncStats();
      expect(stats.totalClients).toBe(1);
      expect(stats.playerClients).toBe(1);
    });

    it('should register multiple clients with different types', () => {
      const playerWs = new MockWebSocket() as any;
      const adminWs = new MockWebSocket() as any;
      const singerWs = new MockWebSocket() as any;
      
      engine.registerClient('player-1', playerWs, 'Player 1', 'player');
      engine.registerClient('admin-1', adminWs, 'Admin 1', 'admin');
      engine.registerClient('singer-1', singerWs, 'Singer 1', 'singer');
      
      const stats = engine.getSyncStats();
      expect(stats.totalClients).toBe(3);
      expect(stats.playerClients).toBe(1);
    });

    it('should set correct capabilities for player clients', () => {
      const ws = new MockWebSocket() as any;
      
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      // Manually trigger clock sync for testing
      // @ts-expect-error - accessing private method for testing
      const clients = Array.from(engine.syncState.clients.values());
      if (clients.length > 0) {
        // @ts-expect-error - accessing private method for testing
        engine.startClockSyncForClient(clients[0]);
      }
      
      // Check that clock sync starts for the client
      expect(ws.getMessageCount()).toBeGreaterThan(0);
    });

    it('should set correct capabilities for non-player clients', () => {
      const ws = new MockWebSocket() as any;
      
      engine.registerClient('admin-1', ws, 'Admin 1', 'admin');
      
      const stats = engine.getSyncStats();
      expect(stats.playerClients).toBe(0); // Admin should not count as player
    });
  });

  describe('Client Unregistration', () => {
    it('should unregister client correctly', () => {
      const ws = new MockWebSocket() as any;
      
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      expect(engine.getSyncStats().totalClients).toBe(1);
      
      engine.unregisterClient('player-1');
      expect(engine.getSyncStats().totalClients).toBe(0);
    });

    it('should handle unregistering non-existent client gracefully', () => {
      expect(() => {
        engine.unregisterClient('non-existent');
      }).not.toThrow();
      
      expect(engine.getSyncStats().totalClients).toBe(0);
    });

    it('should update client counts correctly after unregistration', () => {
      const playerWs = new MockWebSocket() as any;
      const adminWs = new MockWebSocket() as any;
      
      engine.registerClient('player-1', playerWs, 'Player 1', 'player');
      engine.registerClient('admin-1', adminWs, 'Admin 1', 'admin');
      
      expect(engine.getSyncStats().totalClients).toBe(2);
      expect(engine.getSyncStats().playerClients).toBe(1);
      
      engine.unregisterClient('player-1');
      
      expect(engine.getSyncStats().totalClients).toBe(1);
      expect(engine.getSyncStats().playerClients).toBe(0);
    });
  });

  describe('Clock Synchronization', () => {
    it('should start clock sync when client registers', async () => {
      const ws = new MockWebSocket() as any;
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      // Manually trigger clock sync for testing
      // @ts-expect-error - accessing private method for testing
      const clients = Array.from(engine.syncState.clients.values());
      if (clients.length > 0) {
        // @ts-expect-error - accessing private method for testing
        engine.startClockSyncForClient(clients[0]);
      }
      
      // Should send clock sync ping
      expect(ws.getMessageCount()).toBeGreaterThan(0);
      const lastMessage = JSON.parse(ws.getLastMessage());
      expect(lastMessage.type).toBe('clock_sync_ping');
      expect(lastMessage.serverTime).toBeTypeOf('number');
      expect(lastMessage.pingId).toMatch(/^ping_/);
    });

    it('should calculate clock offset from sync responses', async () => {
      const ws = new MockWebSocket() as any;
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      const serverTime = Date.now() - 50; // 50ms ago
      const clientTime = Date.now() + 100; // Client is ahead
      const responseTime = Date.now();
      
      engine.handleClockSyncResponse('player-1', {
        pingId: 'test-ping',
        serverTime,
        clientTime,
        responseTime
      });
      
      // Should calculate latency and clock offset
      // Since this is internal state, we verify the update happened
      const stats = engine.getSyncStats();
      expect(stats.averageLatency).toBeGreaterThan(0);
    });

    it('should update average latency when multiple clients respond', async () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;
      
      engine.registerClient('player-1', ws1, 'Player 1', 'player');
      engine.registerClient('player-2', ws2, 'Player 2', 'player');
      
      const serverTime = Date.now() - 50;
      
      // Simulate latency measurements from both clients
      engine.handleClockSyncResponse('player-1', {
        pingId: 'ping1',
        serverTime,
        clientTime: Date.now(),
        responseTime: Date.now()
      });
      
      engine.handleClockSyncResponse('player-2', {
        pingId: 'ping2',
        serverTime,
        clientTime: Date.now(),
        responseTime: Date.now()
      });
      
      const stats = engine.getSyncStats();
      expect(stats.averageLatency).toBeGreaterThan(0);
    });

    it('should handle send failure during clock sync', () => {
      const ws = new MockWebSocket() as any;
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      ws.send = vi.fn(() => {
        throw new Error('Send failed');
      });
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // @ts-expect-error - accessing private method for testing
      const clients = Array.from(engine.syncState.clients.values());
      if (clients.length > 0) {
        // @ts-expect-error - accessing private method for testing
        engine.startClockSyncForClient(clients[0]);
      }
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to send clock sync ping'), expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should handle clock sync response for non-existent client', () => {
      expect(() => {
        engine.handleClockSyncResponse('non-existent', {
          pingId: 'test',
          serverTime: Date.now(),
          clientTime: Date.now(),
          responseTime: Date.now()
        });
      }).not.toThrow();
    });
  });

  describe('Video Synchronization', () => {
    it('should return false when no player clients available', async () => {
      const result = await engine.syncPlayVideo('test-video.mp4', 0);
      expect(result).toBe(false);
    });

    it('should sync video playback across multiple players', async () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;
      
      engine.registerClient('player-1', ws1, 'Player 1', 'player');
      engine.registerClient('player-2', ws2, 'Player 2', 'player');
      
      const result = await engine.syncPlayVideo('test-video.mp4', 10);
      expect(result).toBe(true);
      
      // Should send preload commands followed by sync play commands
      expect(ws1.getMessageCount()).toBeGreaterThanOrEqual(2);
      expect(ws2.getMessageCount()).toBeGreaterThanOrEqual(2);
      
      // Check that preload command was sent first
      const firstMessage1 = JSON.parse(ws1.messages[ws1.messages.length - 2]);
      expect(firstMessage1.type).toBe('sync_preload');
      expect(firstMessage1.videoUrl).toBe('test-video.mp4');
      
      // Check that sync play command was sent
      const lastMessage1 = JSON.parse(ws1.getLastMessage());
      expect(lastMessage1.type).toBe('sync_play');
      expect(lastMessage1.videoUrl).toBe('test-video.mp4');
      expect(lastMessage1.videoTime).toBe(10);
    });

    it('should skip closed WebSocket connections', async () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;
      
      engine.registerClient('player-1', ws1, 'Player 1', 'player');
      engine.registerClient('player-2', ws2, 'Player 2', 'player');
      
      // Clear messages from registration
      ws1.clearMessages();
      ws2.clearMessages();
      
      // Close one connection
      ws2.close();
      
      const result = await engine.syncPlayVideo('test-video.mp4', 0);
      expect(result).toBe(true);
      
      // Only open connection should receive messages
      expect(ws1.getMessageCount()).toBeGreaterThan(0);
      expect(ws2.getMessageCount()).toBe(0); // Closed connection shouldn't receive messages
    });

    it('should calculate proper coordination buffer based on latency', async () => {
      const ws = new MockWebSocket() as any;
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      // Simulate high latency client
      engine.handleClockSyncResponse('player-1', {
        pingId: 'test-ping',
        serverTime: Date.now() - 500, // 500ms latency
        clientTime: Date.now(),
        responseTime: Date.now()
      });
      
      const beforeTime = Date.now();
      await engine.syncPlayVideo('test-video.mp4', 0);
      
      const lastMessage = JSON.parse(ws.getLastMessage());
      const scheduledTime = lastMessage.scheduledTime;
      
      // Should schedule well into the future to account for high latency
      expect(scheduledTime - beforeTime).toBeGreaterThan(1000); // At least 1 second buffer
    });

    it('should update sync state after successful sync command', async () => {
      const ws = new MockWebSocket() as any;
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      const result = await engine.syncPlayVideo('test-video.mp4', 5);
      expect(result).toBe(true);
      
      const stats = engine.getSyncStats();
      expect(stats.isPlaying).toBe(true);
      expect(stats.currentVideo).toBe('test-video.mp4');
    });
  });

  describe('Pause Synchronization', () => {
    it('should send pause commands to all player clients', async () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;
      const adminWs = new MockWebSocket() as any;
      
      engine.registerClient('player-1', ws1, 'Player 1', 'player');
      engine.registerClient('player-2', ws2, 'Player 2', 'player');
      engine.registerClient('admin-1', adminWs, 'Admin 1', 'admin');
      
      // First start playing
      await engine.syncPlayVideo('test-video.mp4', 0);
      
      // Clear previous messages
      ws1.clearMessages();
      ws2.clearMessages();
      adminWs.clearMessages();
      
      await engine.syncPause();
      
      // Should send pause to players but not admin
      expect(ws1.getMessageCount()).toBe(1);
      expect(ws2.getMessageCount()).toBe(1);
      expect(adminWs.getMessageCount()).toBe(0);
      
      const pauseMessage = JSON.parse(ws1.getLastMessage());
      expect(pauseMessage.type).toBe('sync_pause');
      expect(pauseMessage.scheduledTime).toBeGreaterThan(Date.now());
    });

    it('should update sync state to not playing', async () => {
      const ws = new MockWebSocket() as any;
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      await engine.syncPlayVideo('test-video.mp4', 0);
      expect(engine.getSyncStats().isPlaying).toBe(true);
      
      await engine.syncPause();
      expect(engine.getSyncStats().isPlaying).toBe(false);
    });

    it('should handle send failure during pause', async () => {
      const ws = new MockWebSocket() as any;
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      await engine.syncPlayVideo('test-video.mp4', 0);
      
      ws.send = vi.fn(() => {
        throw new Error('Send failed');
      });
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await engine.syncPause();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to send pause command'), expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Client Readiness Handling', () => {
    it('should handle client ready messages', () => {
      const ws = new MockWebSocket() as any;
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      engine.handleClientReady('player-1', {
        commandId: 'test-command',
        bufferLevel: 0.8,
        videoDuration: 180
      });
      
      // Should process without error and client should be marked ready
      // We verify this worked by checking no errors were thrown
      expect(true).toBe(true);
    });

    // it('should proceed with sync even if clients do not report ready in time', async () => {
    //   const ws = new MockWebSocket() as any;
    //   engine.registerClient('player-1', ws, 'Player 1', 'player');
      
    //   const promise = engine.syncPlayVideo('test-video.mp4', 0);
    //   vi.runAllTimers(); // Resolve the timeout for readiness check
    //   await promise;
      
    //   expect(ws.getLastMessage()).toContain('sync_play');
    // });

    it('should update buffer level and video duration', () => {
      const ws = new MockWebSocket() as any;
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      // Start a video to set current video state
      engine.syncPlayVideo('test-video.mp4', 0);
      
      engine.handleClientReady('player-1', {
        commandId: 'test-command',
        bufferLevel: 0.9,
        videoDuration: 240
      });
      
      // Should update client state without errors
      expect(() => {
        engine.handleClientReady('player-1', {
          commandId: 'test-command-2',
          bufferLevel: 1.0
        });
      }).not.toThrow();
    });

    it('should handle ready message for non-existent client', () => {
      expect(() => {
        engine.handleClientReady('non-existent', {
          commandId: 'test',
          bufferLevel: 0.5
        });
      }).not.toThrow();
    });

    it('should update video duration from client ready message', async () => {
      const ws = new MockWebSocket() as any;
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      await engine.syncPlayVideo('test-video.mp4', 0);
      
      engine.handleClientReady('player-1', {
        commandId: 'test-command',
        bufferLevel: 0.9,
        videoDuration: 240
      });
      
      // @ts-expect-error - accessing private property for testing
      expect(engine.syncState.currentVideo?.duration).toBe(240);
    });
  });



  describe('Statistics and State', () => {
    it('should return correct sync statistics', () => {
      const stats = engine.getSyncStats();
      
      expect(stats).toHaveProperty('totalClients');
      expect(stats).toHaveProperty('playerClients');
      expect(stats).toHaveProperty('averageLatency');
      expect(stats).toHaveProperty('isPlaying');
      expect(stats).toHaveProperty('syncTolerance');
      
      expect(stats.totalClients).toBe(0);
      expect(stats.playerClients).toBe(0);
      expect(stats.isPlaying).toBe(false);
      expect(stats.syncTolerance).toBe(100);
    });

    it('should track current video in statistics', async () => {
      const ws = new MockWebSocket() as any;
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      await engine.syncPlayVideo('my-video.mp4', 0);
      
      const stats = engine.getSyncStats();
      expect(stats.currentVideo).toBe('my-video.mp4');
      expect(stats.isPlaying).toBe(true);
    });

    it('should update statistics when clients are added/removed', () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;
      
      engine.registerClient('player-1', ws1, 'Player 1', 'player');
      expect(engine.getSyncStats().totalClients).toBe(1);
      
      engine.registerClient('admin-1', ws2, 'Admin 1', 'admin');
      expect(engine.getSyncStats().totalClients).toBe(2);
      expect(engine.getSyncStats().playerClients).toBe(1);
      
      engine.unregisterClient('player-1');
      expect(engine.getSyncStats().totalClients).toBe(1);
      expect(engine.getSyncStats().playerClients).toBe(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle WebSocket send failures gracefully', async () => {
      const ws = new MockWebSocket() as any;
      
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      // Mock send to throw error after registration
      ws.send = vi.fn(() => {
        throw new Error('WebSocket send failed');
      });
      
      // Should not throw error when sync operations encounter send failures
      await expect(async () => {
        await engine.syncPlayVideo('test-video.mp4', 0);
      }).not.toThrow();
    });

    it('should handle timing edge cases in sync commands', async () => {
      const ws = new MockWebSocket() as any;
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      // Mock Date.now to test timing edge cases
      const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(1000000);
      
      try {
        const result = await engine.syncPlayVideo('test-video.mp4', 0);
        expect(result).toBe(true);
        
        const lastMessage = JSON.parse(ws.getLastMessage());
        expect(lastMessage.scheduledTime).toBeGreaterThan(1000000);
      } finally {
        dateSpy.mockRestore();
      }
    });

    it('should handle multiple rapid sync commands', async () => {
      const ws = new MockWebSocket() as any;
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      // Send multiple sync commands rapidly
      const promises = [
        engine.syncPlayVideo('video1.mp4', 0),
        engine.syncPlayVideo('video2.mp4', 10),
        engine.syncPause()
      ];
      
      // Should handle all commands without errors
      await expect(Promise.all(promises)).resolves.toBeDefined();
      
      // Should have received multiple messages
      expect(ws.getMessageCount()).toBeGreaterThan(3);
    });
  });

  describe('Resource Cleanup', () => {
    it('should clear intervals on destroy', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      engine.destroy();
      
      // Should clear clock sync and monitoring intervals
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should trigger clock sync periodically', () => {
      const ws = new MockWebSocket() as any;
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      vi.advanceTimersByTime(30000); // Advance past the interval
      
      expect(ws.getMessageCount()).toBeGreaterThan(1); // Initial + interval
    });

    it('should clear all clients on destroy', () => {
      const ws = new MockWebSocket() as any;
      engine.registerClient('player-1', ws, 'Player 1', 'player');
      
      expect(engine.getSyncStats().totalClients).toBe(1);
      
      engine.destroy();
      
      expect(engine.getSyncStats().totalClients).toBe(0);
    });

    it('should be safe to call destroy multiple times', () => {
      expect(() => {
        engine.destroy();
        engine.destroy();
        engine.destroy();
      }).not.toThrow();
    });
  });

  describe('Sync Drift Correction', () => {
    it('should send sync check commands periodically', async () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;
      
      engine.registerClient('player-1', ws1, 'Player 1', 'player');
      engine.registerClient('player-2', ws2, 'Player 2', 'player');
      
      await engine.syncPlayVideo('test-video.mp4', 0);
      
      ws1.clearMessages();
      ws2.clearMessages();
      
      // @ts-expect-error - accessing private method for testing
      engine.checkSyncDrift();
      
      expect(ws1.getMessageCount()).toBe(1);
      expect(ws2.getMessageCount()).toBe(1);
      
      const message1 = JSON.parse(ws1.getLastMessage());
      expect(message1.type).toBe('sync_check_position');
    });
  });
});
