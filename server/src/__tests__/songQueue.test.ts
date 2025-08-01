import { describe, it, expect, beforeEach } from 'vitest';
import { 
  addSongToQueue, 
  getQueue, 
  removeSongFromQueue, 
  getNextSong,
  getNowPlaying,
  resetQueue
} from '../songQueue';
import type { Song } from '../mediaLibrary';

// Mock data
const mockSong1: Song = {
  id: '1',
  artist: 'Test Artist 1',
  title: 'Test Song 1',
  fileName: 'test-song-1.mp4'
};

const mockSong2: Song = {
  id: '2',
  artist: 'Test Artist 2',
  title: 'Test Song 2',
  fileName: 'test-song-2.mp4'
};

describe('songQueue', () => {
  beforeEach(() => {
    // Reset the queue and nowPlaying state before each test
    resetQueue();
  });

  describe('addSongToQueue', () => {
    it('should add a song to the queue', () => {
      addSongToQueue(mockSong1, 'John Doe');
      const queue = getQueue();
      
      expect(queue).toHaveLength(1);
      expect(queue[0].song).toEqual(mockSong1);
      expect(queue[0].singerName).toBe('John Doe');
    });

    it('should add multiple songs to the queue in order', () => {
      addSongToQueue(mockSong1, 'John Doe');
      addSongToQueue(mockSong2, 'Jane Smith');
      
      const queue = getQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0].singerName).toBe('John Doe');
      expect(queue[1].singerName).toBe('Jane Smith');
    });

    it('should handle empty singer name', () => {
      addSongToQueue(mockSong1, '');
      const queue = getQueue();
      
      expect(queue).toHaveLength(1);
      expect(queue[0].singerName).toBe('');
    });
  });

  describe('removeSongFromQueue', () => {
    beforeEach(() => {
      addSongToQueue(mockSong1, 'John Doe');
      addSongToQueue(mockSong2, 'Jane Smith');
    });

    it('should remove a song from the queue by ID', () => {
      removeSongFromQueue('1');
      const queue = getQueue();
      
      expect(queue).toHaveLength(1);
      expect(queue[0].song.id).toBe('2');
    });

    it('should not affect queue if song ID does not exist', () => {
      removeSongFromQueue('999');
      const queue = getQueue();
      
      expect(queue).toHaveLength(2);
    });

    it('should remove all instances if there are duplicates', () => {
      // Add the same song again (edge case)
      addSongToQueue(mockSong1, 'Another Singer');
      removeSongFromQueue('1');
      
      const queue = getQueue();
      const song1Entries = queue.filter(entry => entry.song.id === '1');
      expect(song1Entries).toHaveLength(0);
    });
  });

  describe('getNextSong', () => {
    it('should return and remove the first song from queue', () => {
      addSongToQueue(mockSong1, 'John Doe');
      addSongToQueue(mockSong2, 'Jane Smith');
      
      const nextSong = getNextSong();
      const queue = getQueue();
      
      expect(nextSong?.song).toEqual(mockSong1);
      expect(nextSong?.singerName).toBe('John Doe');
      expect(queue).toHaveLength(1);
      expect(queue[0].song.id).toBe('2');
    });

    it('should return undefined when queue is empty', () => {
      const nextSong = getNextSong();
      expect(nextSong).toBeNull();
    });

    it('should update now playing state', () => {
      addSongToQueue(mockSong1, 'John Doe');
      const nextSong = getNextSong();
      const nowPlaying = getNowPlaying();
      
      expect(nowPlaying).toEqual(nextSong);
    });
  });

  describe('getQueue', () => {
    it('should return empty array when no songs are queued', () => {
      const queue = getQueue();
      expect(queue).toEqual([]);
    });

    it('should return all queued songs in order', () => {
      addSongToQueue(mockSong1, 'John Doe');
      addSongToQueue(mockSong2, 'Jane Smith');
      
      const queue = getQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0].singerName).toBe('John Doe');
      expect(queue[1].singerName).toBe('Jane Smith');
    });
  });

  describe('getNowPlaying', () => {
    it('should return null when nothing is playing', () => {
      const nowPlaying = getNowPlaying();
      expect(nowPlaying).toBeNull();
    });

    it('should return the current song after getNextSong is called', () => {
      addSongToQueue(mockSong1, 'John Doe');
      getNextSong();
      
      const nowPlaying = getNowPlaying();
      expect(nowPlaying?.song.id).toBe('1');
      expect(nowPlaying?.singerName).toBe('John Doe');
    });
  });

  describe('queue state management', () => {
    it('should maintain queue integrity across multiple operations', () => {
      // Add songs
      addSongToQueue(mockSong1, 'Singer 1');
      addSongToQueue(mockSong2, 'Singer 2');
      addSongToQueue({ ...mockSong1, id: '3' }, 'Singer 3');
      
      // Remove middle song
      removeSongFromQueue('2');
      
      // Get next song
      const next = getNextSong();
      
      const queue = getQueue();
      expect(queue).toHaveLength(1);
      expect(next?.singerName).toBe('Singer 1');
      expect(queue[0].singerName).toBe('Singer 3');
    });
  });
});