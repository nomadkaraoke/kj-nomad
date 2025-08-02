/**
 * Device Manager
 * Manages multiple player screens and provides control interface for KJs
 */

import { EventEmitter } from 'events';
import { WebSocket as WSWebSocket } from 'ws';

export interface PlayerDevice {
  id: string;
  name: string;
  ipAddress: string;
  userAgent: string;
  screenResolution?: {
    width: number;
    height: number;
  };
  connectionTime: number;
  lastActivity: number;
  status: 'connected' | 'disconnected' | 'playing' | 'paused' | 'buffering' | 'error';
  isOnline: boolean;
  capabilities: {
    canFullscreen: boolean;
    supportsHD: boolean;
    supportsWebM: boolean;
    supportsMP4: boolean;
    audioOutputs: string[];
  };
  currentVideo?: {
    url: string;
    title: string;
    currentTime: number;
    duration: number;
    buffered: number; // 0-1
  };
  syncStats?: {
    clockOffset: number;
    averageLatency: number;
    lastSyncError?: number; // ms off from ideal
  };
  ws: WSWebSocket;
}

export interface DeviceGroup {
  id: string;
  name: string;
  deviceIds: string[];
  layout: 'mirror' | 'extended' | 'independent';
  settings: {
    volume: number;
    brightness?: number;
    fullscreen: boolean;
  };
}

export interface DeviceManagerStats {
  totalDevices: number;
  onlineDevices: number;
  playingDevices: number;
  averageLatency: number;
  syncQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export class DeviceManager extends EventEmitter {
  private devices: Map<string, PlayerDevice> = new Map();
  private groups: Map<string, DeviceGroup> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly ACTIVITY_TIMEOUT = 60000; // 1 minute

  constructor() {
    super();
    this.startHeartbeat();
  }

  /**
   * Register a new player device
   */
  registerDevice(
    id: string, 
    ws: WSWebSocket, 
    deviceInfo: {
      name?: string;
      ipAddress: string;
      userAgent: string;
      screenResolution?: { width: number; height: number };
      capabilities: Partial<PlayerDevice['capabilities']>;
    }
  ): PlayerDevice {
    const device: PlayerDevice = {
      id,
      name: deviceInfo.name || `Player ${this.devices.size + 1}`,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      screenResolution: deviceInfo.screenResolution,
      connectionTime: Date.now(),
      lastActivity: Date.now(),
      status: 'connected',
      isOnline: true,
      capabilities: {
        canFullscreen: true,
        supportsHD: true,
        supportsWebM: true,
        supportsMP4: true,
        audioOutputs: ['default'],
        ...deviceInfo.capabilities
      },
      ws
    };

    this.devices.set(id, device);
    
    console.log(`[DeviceManager] Registered device: ${device.name} (${device.ipAddress})`);
    
    // Send device registration confirmation
    this.sendToDevice(id, {
      type: 'device_registered',
      payload: {
        deviceId: id,
        assignedName: device.name,
        serverTime: Date.now()
      }
    });

    // Emit device connected event
    this.emit('deviceConnected', device);
    
    return device;
  }

  /**
   * Unregister a device
   */
  unregisterDevice(id: string): void {
    const device = this.devices.get(id);
    if (device) {
      device.isOnline = false;
      device.status = 'disconnected';
      
      console.log(`[DeviceManager] Unregistered device: ${device.name}`);
      
      // Remove from groups
      this.removeDeviceFromAllGroups(id);
      
      // Emit device disconnected event
      this.emit('deviceDisconnected', device);
      
      // Remove after a delay (keep for historical data)
      setTimeout(() => {
        this.devices.delete(id);
      }, 300000); // 5 minutes
    }
  }

  /**
   * Update device status
   */
  updateDeviceStatus(id: string, status: PlayerDevice['status'], data?: any): void {
    const device = this.devices.get(id);
    if (!device) return;

    device.status = status;
    device.lastActivity = Date.now();

    if (status === 'playing' && data?.video) {
      device.currentVideo = data.video;
    }

    if (data?.syncStats) {
      device.syncStats = data.syncStats;
    }

    this.emit('deviceStatusChanged', device);
  }

  /**
   * Send command to a specific device
   */
  sendToDevice(deviceId: string, message: any): boolean {
    const device = this.devices.get(deviceId);
    if (!device || !device.isOnline || device.ws.readyState !== device.ws.OPEN) {
      return false;
    }

    try {
      device.ws.send(JSON.stringify(message));
      device.lastActivity = Date.now();
      return true;
    } catch (error) {
      console.error(`[DeviceManager] Failed to send to device ${device.name}:`, error);
      this.updateDeviceStatus(deviceId, 'error');
      return false;
    }
  }

  /**
   * Send command to multiple devices
   */
  sendToDevices(deviceIds: string[], message: any): number {
    let successCount = 0;
    for (const deviceId of deviceIds) {
      if (this.sendToDevice(deviceId, message)) {
        successCount++;
      }
    }
    return successCount;
  }

  /**
   * Send command to all online devices
   */
  broadcastToDevices(message: any): number {
    const onlineDevices = Array.from(this.devices.values())
      .filter(d => d.isOnline)
      .map(d => d.id);
    
    return this.sendToDevices(onlineDevices, message);
  }

  /**
   * Create a device group
   */
  createGroup(name: string, deviceIds: string[], layout: DeviceGroup['layout'] = 'mirror'): string {
    const groupId = `group_${Date.now()}`;
    
    const group: DeviceGroup = {
      id: groupId,
      name,
      deviceIds: [...deviceIds],
      layout,
      settings: {
        volume: 80,
        fullscreen: false
      }
    };

    this.groups.set(groupId, group);
    
    console.log(`[DeviceManager] Created group: ${name} with ${deviceIds.length} devices`);
    this.emit('groupCreated', group);
    
    return groupId;
  }

  /**
   * Add device to group
   */
  addDeviceToGroup(groupId: string, deviceId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group || !this.devices.has(deviceId)) {
      return false;
    }

    if (!group.deviceIds.includes(deviceId)) {
      group.deviceIds.push(deviceId);
      this.emit('groupUpdated', group);
    }
    
    return true;
  }

  /**
   * Remove device from group
   */
  removeDeviceFromGroup(groupId: string, deviceId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    const index = group.deviceIds.indexOf(deviceId);
    if (index !== -1) {
      group.deviceIds.splice(index, 1);
      this.emit('groupUpdated', group);
      return true;
    }
    
    return false;
  }

  /**
   * Remove device from all groups
   */
  private removeDeviceFromAllGroups(deviceId: string): void {
    for (const group of this.groups.values()) {
      this.removeDeviceFromGroup(group.id, deviceId);
    }
  }

  /**
   * Delete a group
   */
  deleteGroup(groupId: string): boolean {
    const deleted = this.groups.delete(groupId);
    if (deleted) {
      this.emit('groupDeleted', groupId);
    }
    return deleted;
  }

  /**
   * Control group playback
   */
  controlGroup(groupId: string, command: 'play' | 'pause' | 'stop' | 'mute' | 'unmute', data?: any): number {
    const group = this.groups.get(groupId);
    if (!group) return 0;

    const message = {
      type: `group_${command}`,
      payload: {
        groupId,
        ...data
      }
    };

    return this.sendToDevices(group.deviceIds, message);
  }

  /**
   * Update group settings
   */
  updateGroupSettings(groupId: string, settings: Partial<DeviceGroup['settings']>): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    group.settings = { ...group.settings, ...settings };
    
    // Apply settings to all devices in group
    const message = {
      type: 'group_settings_updated',
      payload: {
        groupId,
        settings: group.settings
      }
    };

    this.sendToDevices(group.deviceIds, message);
    this.emit('groupUpdated', group);
    
    return true;
  }

  /**
   * Get all devices
   */
  getDevices(): PlayerDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get online devices only
   */
  getOnlineDevices(): PlayerDevice[] {
    return Array.from(this.devices.values()).filter(d => d.isOnline);
  }

  /**
   * Get device by ID
   */
  getDevice(id: string): PlayerDevice | undefined {
    return this.devices.get(id);
  }

  /**
   * Get all groups
   */
  getGroups(): DeviceGroup[] {
    return Array.from(this.groups.values());
  }

  /**
   * Get group by ID
   */
  getGroup(id: string): DeviceGroup | undefined {
    return this.groups.get(id);
  }

  /**
   * Get device manager statistics
   */
  getStats(): DeviceManagerStats {
    const allDevices = this.getDevices();
    const onlineDevices = this.getOnlineDevices();
    const playingDevices = onlineDevices.filter(d => d.status === 'playing');
    
    // Calculate average latency
    const devicesWithLatency = onlineDevices.filter(d => d.syncStats?.averageLatency);
    const averageLatency = devicesWithLatency.length > 0
      ? devicesWithLatency.reduce((sum, d) => sum + (d.syncStats?.averageLatency || 0), 0) / devicesWithLatency.length
      : 0;

    // Determine sync quality
    let syncQuality: DeviceManagerStats['syncQuality'] = 'excellent';
    if (averageLatency > 200) syncQuality = 'poor';
    else if (averageLatency > 100) syncQuality = 'fair';
    else if (averageLatency > 50) syncQuality = 'good';

    return {
      totalDevices: allDevices.length,
      onlineDevices: onlineDevices.length,
      playingDevices: playingDevices.length,
      averageLatency,
      syncQuality
    };
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      
      for (const device of this.devices.values()) {
        if (!device.isOnline) continue;
        
        // Check if device has been inactive too long
        if (now - device.lastActivity > this.ACTIVITY_TIMEOUT) {
          console.log(`[DeviceManager] Device ${device.name} inactive, marking offline`);
          device.isOnline = false;
          device.status = 'disconnected';
          this.emit('deviceTimeout', device);
          continue;
        }

        // Send heartbeat
        this.sendToDevice(device.id, {
          type: 'heartbeat',
          payload: { serverTime: now }
        });
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Handle heartbeat response from device
   */
  handleHeartbeatResponse(deviceId: string, data: { serverTime: number; clientTime: number }): void {
    const device = this.devices.get(deviceId);
    if (!device) return;

    device.lastActivity = Date.now();
    
    // Update sync stats with heartbeat timing
    const roundTripTime = Date.now() - data.serverTime;
    const latency = roundTripTime / 2;
    
    if (!device.syncStats) {
      device.syncStats = {
        clockOffset: 0,
        averageLatency: latency
      };
    } else {
      // Exponential moving average
      device.syncStats.averageLatency = (device.syncStats.averageLatency * 0.8) + (latency * 0.2);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.devices.clear();
    this.groups.clear();
    this.removeAllListeners();
    
    console.log('[DeviceManager] Destroyed');
  }
}

// Export singleton instance
export const deviceManager = new DeviceManager();