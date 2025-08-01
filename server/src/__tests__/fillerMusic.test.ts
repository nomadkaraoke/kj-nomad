import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { scanFillerMusic, getNextFillerSong, resetFillerMusic } from '../fillerMusic';

// Mock fs module
vi.mock('fs');
vi.mock('path');

const mockFs = vi.mocked(fs);
const mockPath = vi.mocked(path);

describe('fillerMusic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFillerMusic(); // Reset filler music state before each test
    
    // Setup path mocks
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.parse.mockImplementation((filePath) => ({
      root: '',
      dir: '',
      base: filePath,
      ext: path.extname(filePath),
      name: filePath.replace(path.extname(filePath), '')
    }));
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
      
      // Should return null when no filler music available
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
        'filler-music1.mp4',   // Include
        'filler-music2.mp3',   // Include
        'background-filler.mp4', // Exclude (doesn't start with filler)
        'music-filler.mp3',    // Exclude (doesn't start with filler)
        'Artist - Song.mp4'    // Exclude (doesn't start with filler)
      ];

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      scanFillerMusic();

      // Test by getting multiple filler songs to see what's available
      const song1 = getNextFillerSong();
      const song2 = getNextFillerSong();
      const song3 = getNextFillerSong(); // Should cycle back or give us different songs

      expect(song1).not.toBeNull();
      expect(song2).not.toBeNull();
      // We have 2 filler files, so we should get valid songs
    });

    it('should handle case insensitive filler prefix', () => {
      const mockFiles = [
        'filler-music.mp4',
        'Filler-Music.mp4',
        'FILLER-MUSIC.mp4'
      ];

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      
      expect(() => scanFillerMusic()).not.toThrow();
      
      const fillerSong = getNextFillerSong();
      expect(fillerSong).not.toBeNull();
    });
  });

  describe('getNextFillerSong', () => {
    it('should return null when no filler music is available', () => {
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
        'filler-song2.mp4',
        'filler-song3.mp4'
      ];
      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      scanFillerMusic();

      // Get multiple songs to test cycling
      const songs = [];
      for (let i = 0; i < 6; i++) { // Get more than available to test cycling
        songs.push(getNextFillerSong());
      }

      // All should be valid
      songs.forEach(song => {
        expect(song).not.toBeNull();
        expect(song?.fileName).toMatch(/^filler-/);
      });

      // Should have some variety (not all the same song)
      const uniqueFiles = new Set(songs.map(song => song?.fileName));
      expect(uniqueFiles.size).toBeGreaterThan(1);
    });

    it('should handle single filler song correctly', () => {
      const mockFiles = ['filler-only.mp4'];
      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      scanFillerMusic();

      // Should return the same song multiple times
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
      mockFs.readdirSync.mockReturnValueOnce(['filler-old.mp4'] as any);
      scanFillerMusic();
      
      let song = getNextFillerSong();
      expect(song?.fileName).toBe('filler-old.mp4');

      // Second scan with new files
      mockFs.readdirSync.mockReturnValueOnce(['filler-new1.mp4', 'filler-new2.mp4'] as any);
      scanFillerMusic();

      song = getNextFillerSong();
      expect(song?.fileName).toMatch(/^filler-new/);
    });

    it('should handle mixed file types correctly', () => {
      const mockFiles = [
        'filler-video.mp4',
        'filler-audio.mp3', 
        'filler-webm.webm',
        'filler-other.avi',   // Should still be included
        'not-filler.mp4',     // Should be excluded
        'filler-.mp4'         // Edge case: just "filler-"
      ];

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      scanFillerMusic();

      // Get several songs to see what was included
      const songs = [];
      for (let i = 0; i < 10; i++) {
        const song = getNextFillerSong();
        if (song && !songs.some(s => s.fileName === song.fileName)) {
          songs.push(song);
        }
      }

      // Should have multiple filler files (excluding non-filler ones)
      expect(songs.length).toBeGreaterThanOrEqual(3);
      songs.forEach(song => {
        expect(song.fileName).toMatch(/^filler-/);
      });
    });

    it('should handle error recovery', () => {
      // First scan succeeds
      mockFs.readdirSync.mockReturnValueOnce(['filler-good.mp4'] as any);
      scanFillerMusic();
      
      let song = getNextFillerSong();
      expect(song).not.toBeNull();

      // Second scan fails
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Scan failed');
      });
      scanFillerMusic();

      // Should return null after failed scan
      song = getNextFillerSong();
      expect(song).toBeNull();
    });
  });
});