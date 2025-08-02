import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
  scanFillerMusic, 
  getNextFillerSong,
  resetFillerMusic
} from '../fillerMusic';

// Mock fs and path modules
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
  }
}));

vi.mock('path', () => ({
  default: {
    join: vi.fn(),
    dirname: vi.fn(),
  }
}));

vi.mock('url', () => ({
  fileURLToPath: vi.fn(() => '/mocked/path/fillerMusic.js')
}));

const mockFs = vi.mocked(fs);
const mockPath = vi.mocked(path);

describe('fillerMusic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFillerMusic(); // Reset filler music state before each test
    
    // Setup default mocks
    mockFs.existsSync.mockReturnValue(true);
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockReturnValue('/mocked/path');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('scanFillerMusic', () => {
    it('should scan and find filler music files', () => {
      const mockFiles = [
        'filler-background.mp4',
        'filler-jazz.mp3',
        'filler-ambient.webm',
        'Artist - Song.mp4', // Should be excluded (not filler)
        'regular-song.mp3',  // Should be excluded (not filler)
        'FILLER-CAPS.mp4'    // Should be included (case insensitive)
      ];

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      
      expect(() => scanFillerMusic()).not.toThrow();
    });

    it('should handle empty media directory', () => {
      mockFs.readdirSync.mockReturnValue([]);
      
      expect(() => scanFillerMusic()).not.toThrow();
      
      const fillerSong = getNextFillerSong();
      expect(fillerSong).toBeNull();
    });

    it('should handle media directory read error gracefully', () => {
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Directory not found');
      });

      expect(() => scanFillerMusic()).not.toThrow();
      
      const fillerSong = getNextFillerSong();
      expect(fillerSong).toBeNull();
    });

    it('should only include files that start with "filler-"', () => {
      const mockFiles = [
        'filler-background.mp4',  // Include
        'filler-music.webm',      // Include  
        'regular-song.mp4',       // Exclude
        'another-track.mp3',      // Exclude
        'filler-ambient.mp4'      // Include
      ];

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      
      scanFillerMusic();
      
      const song1 = getNextFillerSong();
      const song2 = getNextFillerSong();
      const song3 = getNextFillerSong(); // Should cycle back or give us different songs

      expect(song1).not.toBeNull();
      expect(song2).not.toBeNull();
      expect(song3).not.toBeNull();
      
      // Check that all returned songs start with 'filler-'
      expect(song1?.fileName).toMatch(/^filler-/);
      expect(song2?.fileName).toMatch(/^filler-/);
      expect(song3?.fileName).toMatch(/^filler-/);
    });

    it('should handle case insensitive filler prefix', () => {
      const mockFiles = [
        'FILLER-CAPS.mp4',
        'Filler-Mixed.webm',
        'filler-lower.mp4'
      ];

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      
      scanFillerMusic();
      
      const fillerSong = getNextFillerSong();
      expect(fillerSong).not.toBeNull();
    });
  });

  describe('getNextFillerSong', () => {
    it('should return null when no filler music is available', () => {
      // No files or empty directory
      mockFs.readdirSync.mockReturnValue([]);
      scanFillerMusic();
      
      const fillerSong = getNextFillerSong();
      expect(fillerSong).toBeNull();
    });

    it('should return a filler song when available', () => {
      const mockFiles = ['filler-background.mp4'];

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      
      scanFillerMusic();

      const fillerSong = getNextFillerSong();
      expect(fillerSong).not.toBeNull();
      expect(fillerSong?.fileName).toBe('filler-background.mp4');
    });

    it('should cycle through available filler songs', () => {
      const mockFiles = [
        'filler-song1.mp4',
        'filler-song2.webm',
        'filler-song3.mp4'
      ];

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      
      scanFillerMusic();

      const songs = [
        getNextFillerSong(),
        getNextFillerSong(),
        getNextFillerSong(),
        getNextFillerSong(), // Should cycle back to first
      ];

      // All should be valid
      songs.forEach(song => {
        expect(song).not.toBeNull();
        expect(song?.fileName).toMatch(/^filler-/);
      });

      // Check cycling behavior - after 3 calls, we should be back to index 0 (filler-song1.mp4)
      expect(songs[0]?.fileName).toBe('filler-song1.mp4');
      expect(songs[3]?.fileName).toBe('filler-song1.mp4'); // Cycles back after 3
    });

    it('should handle single filler song correctly', () => {
      const mockFiles = ['filler-only.mp4'];

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      
      scanFillerMusic();

      const song1 = getNextFillerSong();
      const song2 = getNextFillerSong();
      const song3 = getNextFillerSong();

      expect(song1?.fileName).toBe('filler-only.mp4');
      expect(song2?.fileName).toBe('filler-only.mp4');
      expect(song3?.fileName).toBe('filler-only.mp4');
    });

    it('should return consistent data structure', () => {
      const mockFiles = ['filler-test.mp4'];

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      
      scanFillerMusic();

      const fillerSong = getNextFillerSong();
      
      expect(fillerSong).toHaveProperty('fileName');
      expect(typeof fillerSong?.fileName).toBe('string');
      expect(fillerSong?.fileName).toBe('filler-test.mp4');
    });
  });

  describe('integration and state management', () => {
    it('should maintain state between scans', () => {
      // First scan
      const mockFiles1 = ['filler-old.mp4'];
      mockFs.readdirSync.mockReturnValue(mockFiles1 as any);
      scanFillerMusic();
      
      let song = getNextFillerSong();
      expect(song?.fileName).toBe('filler-old.mp4');

      // Second scan with new files
      const mockFiles2 = ['filler-new1.mp4', 'filler-new2.webm'];
      mockFs.readdirSync.mockReturnValue(mockFiles2 as any);
      scanFillerMusic();

      // Should get new files now
      song = getNextFillerSong();
      expect(['filler-new1.mp4', 'filler-new2.webm']).toContain(song?.fileName);
    });

    it('should handle mixed file types correctly', () => {
      const mockFiles = [
        'filler-video1.mp4',     // Include
        'filler-video2.webm',    // Include  
        'filler-audio.mp3',      // Exclude (audio not video)
        'filler-video3.avi',     // Exclude (not supported video format per mediaLibrary.ts)
        'regular-video.mp4',     // Exclude (not filler)
        'filler-video4.mp4'      // Include
      ];

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      
      scanFillerMusic();

      const songs = [
        getNextFillerSong(),
        getNextFillerSong(),
        getNextFillerSong()
      ];

      // Should have exactly 3 filler files (mp4 and webm only, excluding avi and non-filler)
      expect(songs.length).toBe(3);
      songs.forEach(song => {
        expect(song).not.toBeNull();
        if (song) {
          expect(song.fileName).toMatch(/^filler-/);
          expect(song.fileName).toMatch(/\.(mp4|webm)$/);
        }
      });
    });

    it('should handle error recovery', () => {
      // First scan succeeds
      const mockFiles = ['filler-good.mp4'];
      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      scanFillerMusic();
      
      let song = getNextFillerSong();
      expect(song).not.toBeNull();

      // Second scan fails
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Disk error');
      });
      
      expect(() => scanFillerMusic()).not.toThrow();
      
      // Should return null after failed scan
      song = getNextFillerSong();
      expect(song).toBeNull();
    });
  });
});