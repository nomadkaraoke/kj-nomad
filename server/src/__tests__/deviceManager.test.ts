import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DeviceManager } from '../deviceManager.js';

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

describe('DeviceManager', () => {
  let deviceManager: DeviceManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Create fresh DeviceManager instance for each test
    deviceManager = new DeviceManager();
    
    // Mock clearInterval for fake timers
    global.clearInterval = vi.fn();
  });

  afterEach(() => {
    deviceManager.destroy();
    vi.useRealTimers();
  });

  describe('Device Registration', () => {
    it('should register a new device correctly', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {
          canFullscreen: true,
          supportsHD: true
        }
      };
      
      const device = deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      expect(device.id).toBe('device-1');
      expect(device.ipAddress).toBe('192.168.1.100');
      expect(device.userAgent).toBe('Chrome/91.0');
      expect(device.status).toBe('connected');
      expect(device.isOnline).toBe(true);
      expect(device.name).toBe('Player 1');
      expect(device.capabilities.canFullscreen).toBe(true);
    });

    it('should use provided device name', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        name: 'Main Screen',
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      const device = deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      expect(device.name).toBe('Main Screen');
    });

    it('should assign default capabilities', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      const device = deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      expect(device.capabilities).toEqual({
        canFullscreen: true,
        supportsHD: true,
        supportsWebM: true,
        supportsMP4: true,
        audioOutputs: ['default']
      });
    });

    it('should merge provided capabilities with defaults', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {
          supportsHD: false,
          audioOutputs: ['HDMI', 'USB']
        }
      };
      
      const device = deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      expect(device.capabilities.supportsHD).toBe(false);
      expect(device.capabilities.audioOutputs).toEqual(['HDMI', 'USB']);
      expect(device.capabilities.canFullscreen).toBe(true); // default value
    });

    it('should send registration confirmation', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      expect(ws.getMessageCount()).toBe(1);
      const message = JSON.parse(ws.getLastMessage());
      expect(message.type).toBe('device_registered');
      expect(message.payload.deviceId).toBe('device-1');
      expect(message.payload.assignedName).toBe('Player 1');
    });

    it('should emit deviceConnected event', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      const eventSpy = vi.fn();
      deviceManager.on('deviceConnected', eventSpy);
      
      const device = deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      expect(eventSpy).toHaveBeenCalledWith(device);
    });

    it('should handle screen resolution information', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        screenResolution: { width: 1920, height: 1080 },
        capabilities: {}
      };
      
      const device = deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      expect(device.screenResolution).toEqual({ width: 1920, height: 1080 });
    });
  });

  describe('Device Unregistration', () => {
    it('should unregister an existing device', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      deviceManager.unregisterDevice('device-1');
      
      const device = deviceManager.getDevice('device-1');
      expect(device?.isOnline).toBe(false);
      expect(device?.status).toBe('disconnected');
    });

    it('should emit deviceDisconnected event', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      const device = deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      const eventSpy = vi.fn();
      deviceManager.on('deviceDisconnected', eventSpy);
      
      deviceManager.unregisterDevice('device-1');
      
      expect(eventSpy).toHaveBeenCalledWith(device);
    });

    it('should handle unregistering non-existent device gracefully', () => {
      expect(() => {
        deviceManager.unregisterDevice('non-existent');
      }).not.toThrow();
    });

    it('should remove device from all groups on unregistration', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      const groupId = deviceManager.createGroup('Test Group', ['device-1']);
      
      deviceManager.unregisterDevice('device-1');
      
      const group = deviceManager.getGroup(groupId);
      expect(group?.deviceIds).not.toContain('device-1');
    });

    it('should permanently delete device after timeout', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      deviceManager.unregisterDevice('device-1');
      
      // Device should still exist but be offline
      expect(deviceManager.getDevice('device-1')).toBeDefined();
      
      // Advance timers past the 5-minute timeout
      vi.advanceTimersByTime(300000);
      
      expect(deviceManager.getDevice('device-1')).toBeUndefined();
    });
  });

  describe('Device Status Updates', () => {
    it('should update device status', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      const device = deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      deviceManager.updateDeviceStatus('device-1', 'playing');
      
      expect(device.status).toBe('playing');
    });

    it('should update video data when status is playing', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      const videoData = {
        video: {
          url: 'video.mp4',
          title: 'Test Video',
          currentTime: 30,
          duration: 180,
          buffered: 0.8
        }
      };
      
      deviceManager.updateDeviceStatus('device-1', 'playing', videoData);
      
      const device = deviceManager.getDevice('device-1');
      expect(device?.currentVideo).toEqual(videoData.video);
    });

    it('should update sync stats when provided', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      const syncData = {
        syncStats: {
          clockOffset: 15,
          averageLatency: 25
        }
      };
      
      deviceManager.updateDeviceStatus('device-1', 'playing', syncData);
      
      const device = deviceManager.getDevice('device-1');
      expect(device?.syncStats).toEqual(syncData.syncStats);
    });

    it('should emit deviceStatusChanged event', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      const device = deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      const eventSpy = vi.fn();
      deviceManager.on('deviceStatusChanged', eventSpy);
      
      deviceManager.updateDeviceStatus('device-1', 'paused');
      
      expect(eventSpy).toHaveBeenCalledWith(device);
    });

    it('should handle status update for non-existent device', () => {
      expect(() => {
        deviceManager.updateDeviceStatus('non-existent', 'playing');
      }).not.toThrow();
    });

    it('should update lastActivity timestamp', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      const device = deviceManager.registerDevice('device-1', ws, deviceInfo);
      const originalActivity = device.lastActivity;
      
      // Advance time
      vi.advanceTimersByTime(5000);
      
      deviceManager.updateDeviceStatus('device-1', 'playing');
      
      expect(device.lastActivity).toBeGreaterThan(originalActivity);
    });
  });

  describe('Message Sending', () => {
    it('should send message to device successfully', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      ws.clearMessages(); // Clear registration message
      
      const message = {
        type: 'play_video',
        payload: { url: 'video.mp4' }
      };
      
      const result = deviceManager.sendToDevice('device-1', message);
      
      expect(result).toBe(true);
      expect(ws.getMessageCount()).toBe(1);
      const sentMessage = JSON.parse(ws.getLastMessage());
      expect(sentMessage).toEqual(message);
    });

    it('should fail to send to offline device', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      deviceManager.unregisterDevice('device-1');
      
      const message = { type: 'test' };
      const result = deviceManager.sendToDevice('device-1', message);
      
      expect(result).toBe(false);
    });

    it('should fail to send to non-existent device', () => {
      const message = { type: 'test' };
      const result = deviceManager.sendToDevice('non-existent', message);
      
      expect(result).toBe(false);
    });

    it('should handle WebSocket send failure', () => {
      const ws = new MockWebSocket() as any;
      ws.send = vi.fn(() => {
        throw new Error('WebSocket error');
      });
      
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      const message = { type: 'test' };
      const result = deviceManager.sendToDevice('device-1', message);
      
      expect(result).toBe(false);
      const device = deviceManager.getDevice('device-1');
      expect(device?.status).toBe('error');
    });

    it('should send to multiple devices', () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws1, deviceInfo);
      deviceManager.registerDevice('device-2', ws2, { ...deviceInfo, ipAddress: '192.168.1.101' });
      
      ws1.clearMessages();
      ws2.clearMessages();
      
      const message = { type: 'test' };
      const successCount = deviceManager.sendToDevices(['device-1', 'device-2'], message);
      
      expect(successCount).toBe(2);
      expect(ws1.getMessageCount()).toBe(1);
      expect(ws2.getMessageCount()).toBe(1);
    });

    it('should handle partial failures when sending to multiple devices', () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws1, deviceInfo);
      deviceManager.registerDevice('device-2', ws2, { ...deviceInfo, ipAddress: '192.168.1.101' });
      deviceManager.unregisterDevice('device-2'); // Make device-2 offline
      
      const message = { type: 'test' };
      const successCount = deviceManager.sendToDevices(['device-1', 'device-2'], message);
      
      expect(successCount).toBe(1);
    });

    it('should broadcast to all online devices', () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;
      const ws3 = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws1, deviceInfo);
      deviceManager.registerDevice('device-2', ws2, { ...deviceInfo, ipAddress: '192.168.1.101' });
      deviceManager.registerDevice('device-3', ws3, { ...deviceInfo, ipAddress: '192.168.1.102' });
      deviceManager.unregisterDevice('device-3'); // Make device-3 offline
      
      ws1.clearMessages();
      ws2.clearMessages();
      ws3.clearMessages();
      
      const message = { type: 'broadcast_test' };
      const successCount = deviceManager.broadcastToDevices(message);
      
      expect(successCount).toBe(2); // Only online devices
      expect(ws1.getMessageCount()).toBe(1);
      expect(ws2.getMessageCount()).toBe(1);
      expect(ws3.getMessageCount()).toBe(0); // Offline device
    });
  });

  describe('Group Management', () => {
    it('should create a new group', () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws1, deviceInfo);
      deviceManager.registerDevice('device-2', ws2, { ...deviceInfo, ipAddress: '192.168.1.101' });
      
      const groupId = deviceManager.createGroup('Test Group', ['device-1', 'device-2'], 'mirror');
      
      expect(groupId).toBeDefined();
      
      const group = deviceManager.getGroup(groupId);
      expect(group?.name).toBe('Test Group');
      expect(group?.deviceIds).toEqual(['device-1', 'device-2']);
      expect(group?.layout).toBe('mirror');
    });

    it('should create group with default layout', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      const groupId = deviceManager.createGroup('Test Group', ['device-1']);
      const group = deviceManager.getGroup(groupId);
      
      expect(group?.layout).toBe('mirror');
    });

    it('should create group with all provided device IDs (no filtering)', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      const groupId = deviceManager.createGroup('Test Group', ['device-1', 'non-existent']);
      const group = deviceManager.getGroup(groupId);
      
      // DeviceManager doesn't filter non-existent devices during group creation
      expect(group?.deviceIds).toEqual(['device-1', 'non-existent']);
    });

    it('should add device to existing group', () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws1, deviceInfo);
      deviceManager.registerDevice('device-2', ws2, { ...deviceInfo, ipAddress: '192.168.1.101' });
      
      const groupId = deviceManager.createGroup('Test Group', ['device-1']);
      const result = deviceManager.addDeviceToGroup(groupId, 'device-2');
      
      expect(result).toBe(true);
      
      const group = deviceManager.getGroup(groupId);
      expect(group?.deviceIds).toContain('device-2');
    });

    it('should return true but not duplicate device when adding existing device to group', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      const groupId = deviceManager.createGroup('Test Group', ['device-1']);
      const result = deviceManager.addDeviceToGroup(groupId, 'device-1');
      
      // DeviceManager returns true even if device is already present (just doesn't add duplicate)
      expect(result).toBe(true);
      
      const group = deviceManager.getGroup(groupId);
      expect(group?.deviceIds).toEqual(['device-1']); // No duplicate
    });

    it('should fail to add non-existent device to group', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      const groupId = deviceManager.createGroup('Test Group', ['device-1']);
      const result = deviceManager.addDeviceToGroup(groupId, 'non-existent');
      
      expect(result).toBe(false);
    });

    it('should remove device from group', () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws1, deviceInfo);
      deviceManager.registerDevice('device-2', ws2, { ...deviceInfo, ipAddress: '192.168.1.101' });
      
      const groupId = deviceManager.createGroup('Test Group', ['device-1', 'device-2']);
      const result = deviceManager.removeDeviceFromGroup(groupId, 'device-1');
      
      expect(result).toBe(true);
      
      const group = deviceManager.getGroup(groupId);
      expect(group?.deviceIds).not.toContain('device-1');
      expect(group?.deviceIds).toContain('device-2');
    });

    it('should handle removing non-existent device from group', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      const groupId = deviceManager.createGroup('Test Group', ['device-1']);
      const result = deviceManager.removeDeviceFromGroup(groupId, 'non-existent');
      
      expect(result).toBe(false);
    });

    it('should delete group', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      const groupId = deviceManager.createGroup('Test Group', ['device-1']);
      const result = deviceManager.deleteGroup(groupId);
      
      expect(result).toBe(true);
      expect(deviceManager.getGroup(groupId)).toBeUndefined();
    });

    it('should handle deleting non-existent group', () => {
      const result = deviceManager.deleteGroup('non-existent');
      expect(result).toBe(false);
    });

    it('should update group settings', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      const groupId = deviceManager.createGroup('Test Group', ['device-1']);
      const result = deviceManager.updateGroupSettings(groupId, {
        volume: 80,
        brightness: 90
      });
      
      expect(result).toBe(true);
      
      const group = deviceManager.getGroup(groupId);
      expect(group?.settings.volume).toBe(80);
      expect(group?.settings.brightness).toBe(90);
    });
  });

  describe('Group Control', () => {
    it('should send play command to group devices', () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws1, deviceInfo);
      deviceManager.registerDevice('device-2', ws2, { ...deviceInfo, ipAddress: '192.168.1.101' });
      
      const groupId = deviceManager.createGroup('Test Group', ['device-1', 'device-2']);
      
      ws1.clearMessages();
      ws2.clearMessages();
      
      const successCount = deviceManager.controlGroup(groupId, 'play');
      
      expect(successCount).toBe(2);
      expect(ws1.getMessageCount()).toBe(1);
      expect(ws2.getMessageCount()).toBe(1);
      
      const message1 = JSON.parse(ws1.getLastMessage());
      expect(message1.type).toBe('group_play');
      expect(message1.payload.groupId).toBeDefined();
    });

    it('should send control command with data', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      const groupId = deviceManager.createGroup('Test Group', ['device-1']);
      
      ws.clearMessages();
      
      const controlData = { volume: 75 };
      deviceManager.controlGroup(groupId, 'play', controlData);
      
      const message = JSON.parse(ws.getLastMessage());
      expect(message.payload.volume).toBe(75); // Data is spread directly into payload
      expect(message.payload.groupId).toBeDefined();
    });

    it('should handle control for non-existent group', () => {
      const result = deviceManager.controlGroup('non-existent', 'play');
      expect(result).toBe(0);
    });
  });

  describe('Statistics and Getters', () => {
    it('should return all devices', () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws1, deviceInfo);
      deviceManager.registerDevice('device-2', ws2, { ...deviceInfo, ipAddress: '192.168.1.101' });
      
      const devices = deviceManager.getDevices();
      expect(devices).toHaveLength(2);
      expect(devices.map(d => d.id)).toEqual(['device-1', 'device-2']);
    });

    it('should return only online devices', () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws1, deviceInfo);
      deviceManager.registerDevice('device-2', ws2, { ...deviceInfo, ipAddress: '192.168.1.101' });
      deviceManager.unregisterDevice('device-2');
      
      const onlineDevices = deviceManager.getOnlineDevices();
      expect(onlineDevices).toHaveLength(1);
      expect(onlineDevices[0].id).toBe('device-1');
    });

    it('should return specific device by id', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        name: 'Test Device',
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      const device = deviceManager.getDevice('device-1');
      expect(device?.name).toBe('Test Device');
    });

    it('should return undefined for non-existent device', () => {
      const device = deviceManager.getDevice('non-existent');
      expect(device).toBeUndefined();
    });

    it('should return all groups', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      const groupId1 = deviceManager.createGroup('Group 1', ['device-1']);
      
      // Advance time to ensure different group IDs (DeviceManager uses Date.now() for IDs)
      vi.advanceTimersByTime(1);
      
      const groupId2 = deviceManager.createGroup('Group 2', ['device-1']);
      
      const groups = deviceManager.getGroups();
      expect(groups).toHaveLength(2);
      expect(groups.map(g => g.id)).toContain(groupId1);
      expect(groups.map(g => g.id)).toContain(groupId2);
    });

    it('should return device manager stats', () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;
      const ws3 = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws1, deviceInfo);
      deviceManager.registerDevice('device-2', ws2, { ...deviceInfo, ipAddress: '192.168.1.101' });
      deviceManager.registerDevice('device-3', ws3, { ...deviceInfo, ipAddress: '192.168.1.102' });
      
      deviceManager.updateDeviceStatus('device-1', 'playing');
      deviceManager.updateDeviceStatus('device-2', 'playing');
      deviceManager.unregisterDevice('device-3');
      
      const stats = deviceManager.getStats();
      
      expect(stats.totalDevices).toBe(3);
      expect(stats.onlineDevices).toBe(2);
      expect(stats.playingDevices).toBe(2);
      expect(stats.syncQuality).toMatch(/excellent|good|fair|poor/);
    });

    it('should calculate sync quality based on average latency', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      // Set high latency (200ms falls into 'fair' category: 100 < latency <= 200)
      deviceManager.updateDeviceStatus('device-1', 'connected', {
        syncStats: {
          clockOffset: 0,
          averageLatency: 200
        }
      });
      
      const stats = deviceManager.getStats();
      expect(stats.syncQuality).toBe('fair');
      
      // Test poor quality threshold (> 200ms)
      deviceManager.updateDeviceStatus('device-1', 'connected', {
        syncStats: {
          clockOffset: 0,
          averageLatency: 250 // This should be 'poor'
        }
      });
      
      const poorStats = deviceManager.getStats();
      expect(poorStats.syncQuality).toBe('poor');
    });
  });

  describe('Heartbeat Mechanism', () => {
    it('should handle heartbeat response', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      const device = deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      const heartbeatData = {
        serverTime: Date.now() - 50,
        clientTime: Date.now()
      };
      
      deviceManager.handleHeartbeatResponse('device-1', heartbeatData);
      
      expect(device.syncStats?.averageLatency).toBeGreaterThan(0);
    });

    it('should initialize sync stats if not present', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      const device = deviceManager.registerDevice('device-1', ws, deviceInfo);
      expect(device.syncStats).toBeUndefined();
      
      const heartbeatData = {
        serverTime: Date.now() - 30,
        clientTime: Date.now()
      };
      
      deviceManager.handleHeartbeatResponse('device-1', heartbeatData);
      
      expect(device.syncStats).toBeDefined();
      expect(device.syncStats?.averageLatency).toBeGreaterThan(0);
    });

    it('should update existing sync stats with exponential moving average', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      const device = deviceManager.registerDevice('device-1', ws, deviceInfo);
      
      // First heartbeat
      deviceManager.handleHeartbeatResponse('device-1', {
        serverTime: Date.now() - 50,
        clientTime: Date.now()
      });
      
      const firstLatency = device.syncStats?.averageLatency;
      
      // Second heartbeat
      deviceManager.handleHeartbeatResponse('device-1', {
        serverTime: Date.now() - 30,
        clientTime: Date.now()
      });
      
      const secondLatency = device.syncStats?.averageLatency;
      
      expect(secondLatency).not.toBe(firstLatency);
    });

    it('should handle heartbeat response for non-existent device', () => {
      expect(() => {
        deviceManager.handleHeartbeatResponse('non-existent', {
          serverTime: Date.now(),
          clientTime: Date.now()
        });
      }).not.toThrow();
    });

    it('should send heartbeats and detect timeouts', () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      const device1 = deviceManager.registerDevice('device-1', ws1, deviceInfo);
      const device2 = deviceManager.registerDevice('device-2', ws2, { ...deviceInfo, ipAddress: '192.168.1.101' });
      
      const timeoutSpy = vi.fn();
      deviceManager.on('deviceTimeout', timeoutSpy);
      
      // Clear registration messages
      ws1.clearMessages();
      ws2.clearMessages();
      
      // Set device1's lastActivity to an old time to simulate timeout
      const oldTime = Date.now() - 70000; // 70 seconds ago (past 60 second timeout)
      device1.lastActivity = oldTime;
      
      // Advance time past heartbeat interval to trigger heartbeat check
      vi.advanceTimersByTime(30000);
      
      // The heartbeat should have detected device1 as timed out
      expect(timeoutSpy).toHaveBeenCalledWith(device1);
      expect(device1.isOnline).toBe(false);
      expect(device1.status).toBe('disconnected');
      
      // Device2 should still be online (it was registered more recently)
      expect(device2.isOnline).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle closed WebSocket connection', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      ws.close();
      
      const result = deviceManager.sendToDevice('device-1', { type: 'test' });
      expect(result).toBe(false);
    });

    it('should handle empty device lists in group operations', () => {
      const groupId = deviceManager.createGroup('Empty Group', []);
      const group = deviceManager.getGroup(groupId);
      
      expect(group?.deviceIds).toEqual([]);
      
      const successCount = deviceManager.controlGroup(groupId, 'play');
      expect(successCount).toBe(0);
    });

    it('should handle very large device counts', () => {
      const devices = [];
      for (let i = 0; i < 100; i++) {
        const ws = new MockWebSocket() as any;
        const deviceInfo = {
          ipAddress: `192.168.1.${i + 1}`,
          userAgent: 'Chrome/91.0',
          capabilities: {}
        };
        devices.push(deviceManager.registerDevice(`device-${i}`, ws, deviceInfo));
      }
      
      expect(deviceManager.getDevices()).toHaveLength(100);
      
      const message = { type: 'test' };
      const successCount = deviceManager.broadcastToDevices(message);
      expect(successCount).toBe(100);
    });
  });

  describe('Resource Cleanup', () => {
    it('should clear heartbeat interval on destroy', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      deviceManager.destroy();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should clear all devices and groups on destroy', () => {
      const ws = new MockWebSocket() as any;
      const deviceInfo = {
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0',
        capabilities: {}
      };
      
      deviceManager.registerDevice('device-1', ws, deviceInfo);
      deviceManager.createGroup('Test Group', ['device-1']);
      
      expect(deviceManager.getDevices()).toHaveLength(1);
      expect(deviceManager.getGroups()).toHaveLength(1);
      
      deviceManager.destroy();
      
      expect(deviceManager.getDevices()).toHaveLength(0);
      expect(deviceManager.getGroups()).toHaveLength(0);
    });

    it('should remove all event listeners on destroy', () => {
      const eventSpy = vi.fn();
      deviceManager.on('test', eventSpy);
      
      const removeAllListenersSpy = vi.spyOn(deviceManager, 'removeAllListeners');
      
      deviceManager.destroy();
      
      expect(removeAllListenersSpy).toHaveBeenCalled();
    });

    it('should be safe to call destroy multiple times', () => {
      expect(() => {
        deviceManager.destroy();
        deviceManager.destroy();
        deviceManager.destroy();
      }).not.toThrow();
    });
  });
});
