import { Song } from './mediaLibrary.js';
import { singerProfileManager } from './singerProfiles.js';

export type Priority = 'normal' | 'high' | 'vip';
export type QueueMode = 'fifo' | 'rotation' | 'priority';

export interface AdvancedQueueEntry {
  id: string;
  song: Song;
  singerName: string;
  singerId?: string;
  priority: Priority;
  queuedAt: number;
  estimatedWaitTime?: number;
  rotationGroup?: string;
}

export interface QueueSettings {
  mode: QueueMode;
  maxSongsPerSinger: number;
  vipSkipLimit: number; // How many songs VIP can skip ahead
  rotationEnabled: boolean;
  fairPlayEnabled: boolean;
  autoPromoteRegulars: boolean; // Promote regular singers after X songs
  autoPromoteThreshold: number;
}

export interface QueueStats {
  totalEntries: number;
  vipEntries: number;
  highPriorityEntries: number;
  normalEntries: number;
  averageWaitTime: number;
  longestWaitTime: number;
  singerCounts: Record<string, number>;
  rotationGroups: Record<string, number>;
}

class AdvancedQueueManager {
  private queue: AdvancedQueueEntry[] = [];
  private settings: QueueSettings = {
    mode: 'rotation',
    maxSongsPerSinger: 3,
    vipSkipLimit: 5,
    rotationEnabled: true,
    fairPlayEnabled: true,
    autoPromoteRegulars: false,
    autoPromoteThreshold: 5
  };
  private rotationIndex = 0;
  private singerLastPlayed: Map<string, number> = new Map();

  /**
   * Add a song to the queue with intelligent positioning
   */
  public addToQueue(
    song: Song, 
    singerName: string, 
    options: {
      priority?: Priority;
      singerId?: string;
      skipRotation?: boolean;
    } = {}
  ): AdvancedQueueEntry {
    const entry: AdvancedQueueEntry = {
      id: this.generateId(),
      song,
      singerName,
      singerId: options.singerId,
      priority: this.determinePriority(singerName, options.priority, options.singerId),
      queuedAt: Date.now(),
      rotationGroup: this.getRotationGroup(singerName)
    };

    // Calculate estimated wait time
    entry.estimatedWaitTime = this.calculateWaitTime(entry);

    // Insert at appropriate position based on queue mode and priority
    const insertPosition = this.calculateInsertPosition(entry, options.skipRotation);
    this.queue.splice(insertPosition, 0, entry);

    console.log(`[AdvancedQueue] Added ${singerName} - ${song.title} (${entry.priority}) at position ${insertPosition}`);
    
    return entry;
  }

  /**
   * Remove entry from queue
   */
  public removeFromQueue(entryId: string): boolean {
    const originalLength = this.queue.length;
    this.queue = this.queue.filter(entry => entry.id !== entryId);
    return this.queue.length < originalLength;
  }

  /**
   * Get next song based on queue mode and rotation
   */
  public getNextSong(): AdvancedQueueEntry | null {
    if (this.queue.length === 0) return null;

    let nextEntry: AdvancedQueueEntry | null = null;

    switch (this.settings.mode) {
      case 'fifo':
        nextEntry = this.queue.shift() || null;
        break;
      case 'priority':
        nextEntry = this.getNextByPriority();
        break;
      case 'rotation':
        nextEntry = this.getNextByRotation();
        break;
    }

    if (nextEntry) {
      this.singerLastPlayed.set(nextEntry.singerName, Date.now());
      console.log(`[AdvancedQueue] Next song: ${nextEntry.singerName} - ${nextEntry.song.title}`);
    }

    return nextEntry;
  }

  /**
   * Reorder queue entries
   */
  public reorderQueue(fromIndex: number, toIndex: number): boolean {
    if (fromIndex < 0 || fromIndex >= this.queue.length ||
        toIndex < 0 || toIndex >= this.queue.length) {
      return false;
    }

    const [movedItem] = this.queue.splice(fromIndex, 1);
    this.queue.splice(toIndex, 0, movedItem);
    
    // Recalculate wait times
    this.recalculateWaitTimes();
    
    return true;
  }

  /**
   * Promote entry to higher priority
   */
  public promoteEntry(entryId: string, newPriority: Priority): boolean {
    const entry = this.queue.find(e => e.id === entryId);
    if (!entry) return false;

    const oldPriority = entry.priority;
    entry.priority = newPriority;

    // Reposition based on new priority
    this.queue = this.queue.filter(e => e.id !== entryId);
    const newPosition = this.calculateInsertPosition(entry);
    this.queue.splice(newPosition, 0, entry);

    console.log(`[AdvancedQueue] Promoted ${entry.singerName} from ${oldPriority} to ${newPriority}`);
    
    this.recalculateWaitTimes();
    return true;
  }

  /**
   * Get queue with calculated positions and wait times
   */
  public getQueue(): AdvancedQueueEntry[] {
    return this.queue.map((entry, index) => ({
      ...entry,
      estimatedWaitTime: this.calculateWaitTime(entry, index)
    }));
  }

  /**
   * Get queue statistics
   */
  public getQueueStats(): QueueStats {
    const stats: QueueStats = {
      totalEntries: this.queue.length,
      vipEntries: this.queue.filter(e => e.priority === 'vip').length,
      highPriorityEntries: this.queue.filter(e => e.priority === 'high').length,
      normalEntries: this.queue.filter(e => e.priority === 'normal').length,
      averageWaitTime: 0,
      longestWaitTime: 0,
      singerCounts: {},
      rotationGroups: {}
    };

    // Calculate wait time statistics using current positions
    const waitTimes = this.queue.map((entry, index) => this.calculateWaitTime(entry, index));
    if (waitTimes.length > 0) {
      stats.averageWaitTime = waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length;
      stats.longestWaitTime = Math.max(...waitTimes);
    }

    // Count singers and rotation groups
    this.queue.forEach(entry => {
      stats.singerCounts[entry.singerName] = (stats.singerCounts[entry.singerName] || 0) + 1;
      if (entry.rotationGroup) {
        stats.rotationGroups[entry.rotationGroup] = (stats.rotationGroups[entry.rotationGroup] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Update queue settings
   */
  public updateSettings(newSettings: Partial<QueueSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    // Reorder queue if mode changed
    if (newSettings.mode) {
      this.reorderByMode();
    }
    
    console.log(`[AdvancedQueue] Settings updated:`, this.settings);
  }

  /**
   * Get current settings
   */
  public getSettings(): QueueSettings {
    return { ...this.settings };
  }

  /**
   * Clear the queue
   */
  public clearQueue(): void {
    this.queue = [];
    this.rotationIndex = 0;
    this.singerLastPlayed.clear();
    console.log(`[AdvancedQueue] Queue cleared`);
  }

  /**
   * Get singers who haven't performed recently (for rotation)
   */
  public getAvailableSingers(): string[] {
    const recentThreshold = Date.now() - (10 * 60 * 1000); // 10 minutes
    const recentSingers = new Set(
      Array.from(this.singerLastPlayed.entries())
        .filter(([_, lastPlayed]) => lastPlayed > recentThreshold)
        .map(([singer, _]) => singer)
    );

    return this.queue
      .map(entry => entry.singerName)
      .filter((singer, index, arr) => arr.indexOf(singer) === index) // unique
      .filter(singer => !recentSingers.has(singer));
  }

  // Private methods

  private generateId(): string {
    return `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private determinePriority(singerName: string, requestedPriority?: Priority, singerId?: string): Priority {
    // Check if singer has VIP status in profile
    if (singerId) {
      const profile = singerProfileManager.getProfile(singerId);
      if (profile?.vipStatus) {
        return 'vip';
      }
    }

    // Auto-promote regular singers if enabled
    if (this.settings.autoPromoteRegulars) {
      const singerCount = this.queue.filter(e => e.singerName === singerName).length;
      if (singerCount >= this.settings.autoPromoteThreshold - 1) { // -1 because we're adding this entry
        return 'high';
      }
    }

    return requestedPriority || 'normal';
  }

  private getRotationGroup(singerName: string): string {
    // Simple rotation grouping - could be enhanced with more sophisticated logic
    return singerName.charAt(0).toUpperCase();
  }

  private calculateInsertPosition(entry: AdvancedQueueEntry, skipRotation = false): number {
    if (this.queue.length === 0) return 0;

    switch (this.settings.mode) {
      case 'fifo':
        return this.queue.length;
      
      case 'priority':
        return this.calculatePriorityPosition(entry);
      
      case 'rotation':
        return skipRotation ? this.calculatePriorityPosition(entry) : this.calculateRotationPosition(entry);
      
      default:
        return this.queue.length;
    }
  }

  private calculatePriorityPosition(entry: AdvancedQueueEntry): number {
    const priorityOrder = { vip: 3, high: 2, normal: 1 };
    const entryPriority = priorityOrder[entry.priority];

    for (let i = 0; i < this.queue.length; i++) {
      const queuePriority = priorityOrder[this.queue[i].priority];
      if (entryPriority > queuePriority) {
        return i;
      }
    }

    return this.queue.length;
  }

  private calculateRotationPosition(entry: AdvancedQueueEntry): number {
    if (!this.settings.rotationEnabled) {
      return this.calculatePriorityPosition(entry);
    }

    // VIP can skip ahead within limits
    if (entry.priority === 'vip') {
      return Math.min(this.settings.vipSkipLimit, this.queue.length);
    }

    // Find position that maintains fair rotation
    const singerCounts = new Map<string, number>();
    this.queue.forEach(queueEntry => {
      singerCounts.set(queueEntry.singerName, (singerCounts.get(queueEntry.singerName) || 0) + 1);
    });

    const currentSingerCount = singerCounts.get(entry.singerName) || 0;

    // If singer has too many songs, place at end
    if (currentSingerCount >= this.settings.maxSongsPerSinger) {
      return this.queue.length;
    }

    // Find fair position based on rotation
    for (let i = 0; i < this.queue.length; i++) {
      const queueSingerCount = singerCounts.get(this.queue[i].singerName) || 0;
      if (currentSingerCount <= queueSingerCount) {
        return i;
      }
    }

    return this.queue.length;
  }

  private getNextByPriority(): AdvancedQueueEntry | null {
    // Find highest priority entry
    const priorityOrder = { vip: 3, high: 2, normal: 1 };
    let highestPriority = 0;
    let selectedIndex = -1;

    for (let i = 0; i < this.queue.length; i++) {
      const priority = priorityOrder[this.queue[i].priority];
      if (priority > highestPriority) {
        highestPriority = priority;
        selectedIndex = i;
      }
    }

    return selectedIndex >= 0 ? this.queue.splice(selectedIndex, 1)[0] : null;
  }

  private getNextByRotation(): AdvancedQueueEntry | null {
    if (!this.settings.fairPlayEnabled) {
      return this.queue.shift() || null;
    }

    // Find next singer who hasn't played recently
    const availableSingers = this.getAvailableSingers();
    
    if (availableSingers.length > 0) {
      // Find first entry from available singers
      for (let i = 0; i < this.queue.length; i++) {
        if (availableSingers.includes(this.queue[i].singerName)) {
          return this.queue.splice(i, 1)[0];
        }
      }
    }

    // Fallback to first in queue
    return this.queue.shift() || null;
  }

  private calculateWaitTime(entry: AdvancedQueueEntry, position?: number): number {
    const pos = position !== undefined ? position : this.queue.indexOf(entry);
    if (pos < 0) return 0;

    // Estimate 4 minutes per song
    const avgSongDuration = 4 * 60 * 1000; // 4 minutes in milliseconds
    return pos * avgSongDuration;
  }

  private recalculateWaitTimes(): void {
    this.queue.forEach((entry, index) => {
      entry.estimatedWaitTime = this.calculateWaitTime(entry, index);
    });
  }

  private reorderByMode(): void {
    const entries = [...this.queue];
    this.queue = [];

    entries.forEach(entry => {
      const position = this.calculateInsertPosition(entry);
      this.queue.splice(position, 0, entry);
    });

    this.recalculateWaitTimes();
  }
}

// Export singleton instance
export const advancedQueueManager = new AdvancedQueueManager();
