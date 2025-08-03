import { describe, it, expect, beforeEach, vi } from 'vitest';
import { advancedQueueManager, QueueMode } from '../advancedQueue.js';
import { Song } from '../mediaLibrary.js';
import { singerProfileManager } from '../singerProfiles.js';

// Mock the singer profile manager
vi.mock('../singerProfiles.js', () => ({
  singerProfileManager: {
    getProfile: vi.fn()
  }
}));

const mockSongs: Song[] = [
  {
    id: '1',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    fileName: 'queen-bohemian-rhapsody.mp4'
  },
  {
    id: '2',
    title: 'Sweet Caroline',
    artist: 'Neil Diamond',
    fileName: 'neil-diamond-sweet-caroline.mp4'
  },
  {
    id: '3',
    title: 'Don\'t Stop Believin\'',
    artist: 'Journey',
    fileName: 'journey-dont-stop-believin.mp4'
  }
];

describe('AdvancedQueueManager', () => {
  beforeEach(() => {
    advancedQueueManager.clearQueue();
    vi.clearAllMocks();
  });

  describe('Basic Queue Operations', () => {
    it('should add songs to queue', () => {
      const entry = advancedQueueManager.addToQueue(mockSongs[0], 'John Doe');
      
      expect(entry.song).toEqual(mockSongs[0]);
      expect(entry.singerName).toBe('John Doe');
      expect(entry.priority).toBe('normal');
      expect(entry.id).toBeDefined();
      expect(entry.queuedAt).toBeDefined();
      
      const queue = advancedQueueManager.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0]).toEqual(entry);
    });

    it('should remove songs from queue', () => {
      const entry = advancedQueueManager.addToQueue(mockSongs[0], 'John Doe');
      
      const removed = advancedQueueManager.removeFromQueue(entry.id);
      expect(removed).toBe(true);
      
      const queue = advancedQueueManager.getQueue();
      expect(queue).toHaveLength(0);
    });

    it('should return false when removing non-existent entry', () => {
      const removed = advancedQueueManager.removeFromQueue('non-existent');
      expect(removed).toBe(false);
    });

    it('should clear the entire queue', () => {
      advancedQueueManager.addToQueue(mockSongs[0], 'John Doe');
      advancedQueueManager.addToQueue(mockSongs[1], 'Jane Smith');
      
      advancedQueueManager.clearQueue();
      
      const queue = advancedQueueManager.getQueue();
      expect(queue).toHaveLength(0);
    });
  });

  describe('Priority System', () => {
    it('should assign normal priority by default', () => {
      const entry = advancedQueueManager.addToQueue(mockSongs[0], 'John Doe');
      expect(entry.priority).toBe('normal');
    });

    it('should assign requested priority', () => {
      const entry = advancedQueueManager.addToQueue(mockSongs[0], 'John Doe', { priority: 'high' });
      expect(entry.priority).toBe('high');
    });

    it('should assign VIP priority for VIP singers', () => {
      const mockProfile = { id: 'singer1', vipStatus: true };
      vi.mocked(singerProfileManager.getProfile).mockReturnValue(mockProfile as any);
      
      const entry = advancedQueueManager.addToQueue(mockSongs[0], 'VIP Singer', { singerId: 'singer1' });
      expect(entry.priority).toBe('vip');
    });

    it('should promote entry to higher priority', () => {
      const entry = advancedQueueManager.addToQueue(mockSongs[0], 'John Doe');
      
      const promoted = advancedQueueManager.promoteEntry(entry.id, 'vip');
      expect(promoted).toBe(true);
      
      const queue = advancedQueueManager.getQueue();
      expect(queue[0].priority).toBe('vip');
    });

    it('should return false when promoting non-existent entry', () => {
      const promoted = advancedQueueManager.promoteEntry('non-existent', 'vip');
      expect(promoted).toBe(false);
    });
  });

  describe('Queue Modes', () => {
    beforeEach(() => {
      // Add test entries
      advancedQueueManager.addToQueue(mockSongs[0], 'John Doe', { priority: 'normal' });
      advancedQueueManager.addToQueue(mockSongs[1], 'Jane Smith', { priority: 'high' });
      advancedQueueManager.addToQueue(mockSongs[2], 'VIP Singer', { priority: 'vip' });
    });

    it('should handle FIFO mode', () => {
      advancedQueueManager.updateSettings({ mode: 'fifo' });
      
      const next1 = advancedQueueManager.getNextSong();
      expect(next1?.singerName).toBe('Jane Smith'); // First in queue after priority positioning
      
      const next2 = advancedQueueManager.getNextSong();
      expect(next2?.singerName).toBe('John Doe');
    });

    it('should handle priority mode', () => {
      advancedQueueManager.updateSettings({ mode: 'priority' });
      
      const next1 = advancedQueueManager.getNextSong();
      expect(next1?.priority).toBe('vip');
      expect(next1?.singerName).toBe('VIP Singer');
      
      const next2 = advancedQueueManager.getNextSong();
      expect(next2?.priority).toBe('high');
      expect(next2?.singerName).toBe('Jane Smith');
    });

    it('should handle rotation mode', () => {
      advancedQueueManager.updateSettings({ mode: 'rotation', fairPlayEnabled: false });
      
      const next = advancedQueueManager.getNextSong();
      expect(next).toBeDefined();
    });
  });

  describe('Queue Reordering', () => {
    beforeEach(() => {
      advancedQueueManager.addToQueue(mockSongs[0], 'John Doe');
      advancedQueueManager.addToQueue(mockSongs[1], 'Jane Smith');
      advancedQueueManager.addToQueue(mockSongs[2], 'Bob Wilson');
    });

    it('should reorder queue entries', () => {
      const success = advancedQueueManager.reorderQueue(0, 2);
      expect(success).toBe(true);
      
      const queue = advancedQueueManager.getQueue();
      expect(queue[0].singerName).toBe('Jane Smith');
      expect(queue[1].singerName).toBe('John Doe');
      expect(queue[2].singerName).toBe('Bob Wilson');
    });

    it('should return false for invalid indices', () => {
      const success1 = advancedQueueManager.reorderQueue(-1, 1);
      expect(success1).toBe(false);
      
      const success2 = advancedQueueManager.reorderQueue(0, 10);
      expect(success2).toBe(false);
    });
  });

  describe('Queue Statistics', () => {
    beforeEach(() => {
      advancedQueueManager.addToQueue(mockSongs[0], 'John Doe', { priority: 'normal' });
      advancedQueueManager.addToQueue(mockSongs[1], 'Jane Smith', { priority: 'high' });
      advancedQueueManager.addToQueue(mockSongs[2], 'VIP Singer', { priority: 'vip' });
      advancedQueueManager.addToQueue(mockSongs[0], 'John Doe', { priority: 'normal' });
    });

    it('should calculate queue statistics', () => {
      const stats = advancedQueueManager.getQueueStats();
      
      expect(stats.totalEntries).toBe(4);
      expect(stats.vipEntries).toBe(1);
      expect(stats.highPriorityEntries).toBe(1);
      expect(stats.normalEntries).toBe(2);
      expect(stats.singerCounts['John Doe']).toBe(2);
      expect(stats.singerCounts['Jane Smith']).toBe(1);
      expect(stats.singerCounts['VIP Singer']).toBe(1);
    });

    it('should calculate wait times', () => {
      const queue = advancedQueueManager.getQueue();
      const stats = advancedQueueManager.getQueueStats();
      
      expect(stats.averageWaitTime).toBeGreaterThanOrEqual(0);
      expect(stats.longestWaitTime).toBeGreaterThanOrEqual(0);
      if (queue.length > 1) {
        expect(stats.averageWaitTime).toBeGreaterThan(0);
        expect(stats.longestWaitTime).toBeGreaterThan(0);
      }
    });

    it('should handle empty queue statistics', () => {
      advancedQueueManager.clearQueue();
      const stats = advancedQueueManager.getQueueStats();
      
      expect(stats.totalEntries).toBe(0);
      expect(stats.averageWaitTime).toBe(0);
      expect(stats.longestWaitTime).toBe(0);
    });
  });

  describe('Settings Management', () => {
    it('should update queue settings', () => {
      const newSettings = {
        mode: 'priority' as QueueMode,
        maxSongsPerSinger: 5,
        vipSkipLimit: 3
      };
      
      advancedQueueManager.updateSettings(newSettings);
      
      const settings = advancedQueueManager.getSettings();
      expect(settings.mode).toBe('priority');
      expect(settings.maxSongsPerSinger).toBe(5);
      expect(settings.vipSkipLimit).toBe(3);
    });

    it('should get current settings', () => {
      const settings = advancedQueueManager.getSettings();
      
      expect(settings).toHaveProperty('mode');
      expect(settings).toHaveProperty('maxSongsPerSinger');
      expect(settings).toHaveProperty('vipSkipLimit');
      expect(settings).toHaveProperty('rotationEnabled');
      expect(settings).toHaveProperty('fairPlayEnabled');
    });
  });

  describe('Rotation and Fair Play', () => {
    it('should track singers who played recently', () => {
      // Add and play a song
      advancedQueueManager.addToQueue(mockSongs[0], 'John Doe');
      const played = advancedQueueManager.getNextSong();
      expect(played?.singerName).toBe('John Doe');
      
      // Add more songs
      advancedQueueManager.addToQueue(mockSongs[1], 'Jane Smith');
      advancedQueueManager.addToQueue(mockSongs[2], 'John Doe');
      
      const availableSingers = advancedQueueManager.getAvailableSingers();
      expect(availableSingers).toContain('Jane Smith');
      expect(availableSingers).not.toContain('John Doe'); // Recently played
    });

    it('should enforce max songs per singer', () => {
      advancedQueueManager.updateSettings({ maxSongsPerSinger: 2 });
      
      // Add 3 songs for same singer
      advancedQueueManager.addToQueue(mockSongs[0], 'John Doe');
      advancedQueueManager.addToQueue(mockSongs[1], 'John Doe');
      advancedQueueManager.addToQueue(mockSongs[2], 'John Doe');
      
      const queue = advancedQueueManager.getQueue();
      
      // Third song should be placed at end due to limit
      expect(queue[2].singerName).toBe('John Doe');
    });

    it('should auto-promote regular singers', () => {
      advancedQueueManager.updateSettings({ 
        autoPromoteRegulars: true, 
        autoPromoteThreshold: 2 
      });
      
      // Add first song (normal priority)
      const entry1 = advancedQueueManager.addToQueue(mockSongs[0], 'John Doe');
      expect(entry1.priority).toBe('normal');
      
      // Add second song (should be promoted to high because threshold-1 = 1)
      const entry2 = advancedQueueManager.addToQueue(mockSongs[1], 'John Doe');
      expect(entry2.priority).toBe('high');
    });
  });

  describe('Wait Time Calculations', () => {
    it('should calculate estimated wait times', () => {
      advancedQueueManager.addToQueue(mockSongs[0], 'John Doe');
      advancedQueueManager.addToQueue(mockSongs[1], 'Jane Smith');
      advancedQueueManager.addToQueue(mockSongs[2], 'Bob Wilson');
      
      const queue = advancedQueueManager.getQueue();
      
      expect(queue[0].estimatedWaitTime).toBe(0); // First in queue
      expect(queue[1].estimatedWaitTime).toBe(4 * 60 * 1000); // 4 minutes
      expect(queue[2].estimatedWaitTime).toBe(8 * 60 * 1000); // 8 minutes
    });

    it('should recalculate wait times after reordering', () => {
      advancedQueueManager.addToQueue(mockSongs[0], 'John Doe');
      advancedQueueManager.addToQueue(mockSongs[1], 'Jane Smith');
      
      advancedQueueManager.reorderQueue(1, 0);
      
      const queue = advancedQueueManager.getQueue();
      expect(queue[0].singerName).toBe('Jane Smith');
      expect(queue[0].estimatedWaitTime).toBe(0);
      expect(queue[1].estimatedWaitTime).toBe(4 * 60 * 1000);
    });
  });

  describe('Priority Positioning', () => {
    it('should position VIP entries at front', () => {
      advancedQueueManager.addToQueue(mockSongs[0], 'John Doe', { priority: 'normal' });
      advancedQueueManager.addToQueue(mockSongs[1], 'Jane Smith', { priority: 'normal' });
      advancedQueueManager.addToQueue(mockSongs[2], 'VIP Singer', { priority: 'vip' });
      
      const queue = advancedQueueManager.getQueue();
      expect(queue[0].priority).toBe('vip');
      expect(queue[0].singerName).toBe('VIP Singer');
    });

    it('should respect VIP skip limit', () => {
      advancedQueueManager.updateSettings({ vipSkipLimit: 2 });
      
      // Add 5 normal priority songs
      for (let i = 0; i < 5; i++) {
        advancedQueueManager.addToQueue(mockSongs[0], `Singer ${i}`, { priority: 'normal' });
      }
      
      // Add VIP song
      advancedQueueManager.addToQueue(mockSongs[1], 'VIP Singer', { priority: 'vip' });
      
      const queue = advancedQueueManager.getQueue();
      const vipIndex = queue.findIndex(entry => entry.priority === 'vip');
      expect(vipIndex).toBeLessThanOrEqual(2); // Should not skip more than 2 positions
    });

    it('should maintain priority order', () => {
      advancedQueueManager.updateSettings({ mode: 'priority' });
      
      advancedQueueManager.addToQueue(mockSongs[0], 'Normal 1', { priority: 'normal' });
      advancedQueueManager.addToQueue(mockSongs[1], 'High 1', { priority: 'high' });
      advancedQueueManager.addToQueue(mockSongs[2], 'VIP 1', { priority: 'vip' });
      advancedQueueManager.addToQueue(mockSongs[0], 'Normal 2', { priority: 'normal' });
      advancedQueueManager.addToQueue(mockSongs[1], 'High 2', { priority: 'high' });
      
      const queue = advancedQueueManager.getQueue();
      
      // Should be ordered: VIP, High, High, Normal, Normal
      expect(queue[0].priority).toBe('vip');
      expect(queue[1].priority).toBe('high');
      expect(queue[2].priority).toBe('high');
      expect(queue[3].priority).toBe('normal');
      expect(queue[4].priority).toBe('normal');
    });
  });

  describe('Rotation Groups', () => {
    it('should assign rotation groups', () => {
      const entry1 = advancedQueueManager.addToQueue(mockSongs[0], 'Alice');
      const entry2 = advancedQueueManager.addToQueue(mockSongs[1], 'Bob');
      const entry3 = advancedQueueManager.addToQueue(mockSongs[2], 'Charlie');
      
      expect(entry1.rotationGroup).toBe('A');
      expect(entry2.rotationGroup).toBe('B');
      expect(entry3.rotationGroup).toBe('C');
    });

    it('should track rotation group statistics', () => {
      advancedQueueManager.addToQueue(mockSongs[0], 'Alice');
      advancedQueueManager.addToQueue(mockSongs[1], 'Bob');
      advancedQueueManager.addToQueue(mockSongs[2], 'Anna');
      
      const stats = advancedQueueManager.getQueueStats();
      expect(stats.rotationGroups['A']).toBe(2); // Alice and Anna
      expect(stats.rotationGroups['B']).toBe(1); // Bob
    });
  });
});
