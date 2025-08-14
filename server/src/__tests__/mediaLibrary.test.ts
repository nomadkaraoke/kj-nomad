import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
  scanMediaLibrary, 
  searchSongs, 
  getSongById,
  resetMediaLibrary
} from '../mediaLibrary.js';

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
    parse: vi.fn(),
    extname: vi.fn(),
    dirname: vi.fn(),
  }
}));

vi.mock('url', () => ({
  fileURLToPath: vi.fn(() => '/mocked/path/mediaLibrary.js')
}));

const mockFs = vi.mocked(fs);
const mockPath = vi.mocked(path);

describe('mediaLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMediaLibrary(); // Reset media library state before each test
    
    // Setup default mocks
    mockFs.existsSync.mockReturnValue(true);
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockReturnValue('/mocked/path');
    mockPath.extname.mockImplementation((filePath) => {
      const ext = filePath.split('.').pop();
      return ext ? `.${ext}` : '';
    });
    mockPath.parse.mockImplementation((filePath) => {
      const ext = mockPath.extname(filePath);
      const name = filePath.replace(ext, '');
      return {
        root: '',
        dir: '',
        base: filePath,
        ext,
        name
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('scanMediaLibrary', () => {
    it('should scan and list media files correctly (raw filenames)', () => {
      const mockFiles = [
        'Artist 1 - Song 1.mp4',
        'Artist 2 - Song 2.webm',
        'filler-music.mp3',
        'Artist 3 - Song 3.mp4',
        'not-a-video.txt', // Should be filtered out
        '.hidden-file.mp4'
      ];

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      
      // Mock path.parse for each file
      mockPath.parse
        .mockReturnValueOnce({ name: 'Song 1', ext: '.mp4' } as any)
        .mockReturnValueOnce({ name: 'Song 2', ext: '.webm' } as any)
        .mockReturnValueOnce({ name: 'Song 3', ext: '.mp4' } as any);

      scanMediaLibrary();

      expect(mockFs.readdirSync).toHaveBeenCalled();
      
      // Test that songs can be searched after scanning
      const allSongs = searchSongs('');
      expect(allSongs).toHaveLength(5);
      
      const firstSong = allSongs[0];
      expect(firstSong.fileName).toBe('Artist 1 - Song 1.mp4');
    });

    it('should handle files without any naming convention', () => {
      const mockFiles = [
        'Song Without Artist.mp4',
        'Invalid Format File.mp4'
      ];

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      mockPath.parse
        .mockReturnValueOnce({ name: 'Song Without Artist.mp4', ext: '.mp4' } as any)
        .mockReturnValueOnce({ name: 'Invalid Format File.mp4', ext: '.mp4' } as any);

      scanMediaLibrary();

      const allSongs = searchSongs('');
      expect(allSongs).toHaveLength(2);
      
      expect(allSongs[0].fileName).toBeDefined();
    });

    it('should handle empty media directory', () => {
      mockFs.readdirSync.mockReturnValue([]);
      
      scanMediaLibrary();
      
      const allSongs = searchSongs('');
      expect(allSongs).toHaveLength(0);
    });

    it('should throw an error for a non-existent media directory', () => {
      mockFs.existsSync.mockReturnValue(false);

      // Expect the function to throw an error
      expect(() => scanMediaLibrary('non-existent-dir')).toThrow('Media directory not found: non-existent-dir');
      
      // Ensure the library remains empty
      const allSongs = searchSongs('');
      expect(allSongs).toHaveLength(0);
    });

    it('should throw an error on media directory read error', () => {
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Directory not found');
      });

      // Expect the function to throw an error
      expect(() => scanMediaLibrary()).toThrow('Directory not found');
      
      // Ensure the library remains empty
      const allSongs = searchSongs('');
      expect(allSongs).toHaveLength(0);
    });

    it('should include filler files too (no special naming required)', () => {
      const mockFiles = [
        'filler-background.mp4',
        'filler-music.mp3', 
        'Artist - Song.mp4',
        'filler-ambient.webm'
      ];

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      mockPath.parse.mockReturnValue({ name: 'Song', ext: '.mp4' } as any);

      scanMediaLibrary();

      const allSongs = searchSongs('');
      expect(allSongs).toHaveLength(4); // All supported media files included
    });

    it('should include common audio and video formats', () => {
      const mockFiles = [
        'Artist - Song.mp4',   // Include
        'Artist - Song.webm',  // Include
        'Artist - Song.mp3',   // Include
        'Artist - Song.wav',   // Include
        'Artist - Song.avi',   // Include
      ];

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      mockPath.parse
        .mockReturnValueOnce({ name: 'Song', ext: '.mp4' } as any)
        .mockReturnValueOnce({ name: 'Song', ext: '.webm' } as any);

      scanMediaLibrary();

      const allSongs = searchSongs('');
      expect(allSongs).toHaveLength(5);
    });
  });

  describe('searchSongs', () => {
    beforeEach(() => {
      // Setup a mock library
      const mockFiles = [
        'Taylor Swift - Shake It Off.mp4',
        'Ed Sheeran - Perfect.mp4', 
        'Adele - Rolling in the Deep.mp4',
        'The Beatles - Hey Jude.mp4'
      ];

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      mockPath.parse
        .mockReturnValueOnce({ name: 'Shake It Off', ext: '.mp4' } as any)
        .mockReturnValueOnce({ name: 'Perfect', ext: '.mp4' } as any)
        .mockReturnValueOnce({ name: 'Rolling in the Deep', ext: '.mp4' } as any)
        .mockReturnValueOnce({ name: 'Hey Jude', ext: '.mp4' } as any);

      scanMediaLibrary();
    });

    it('should return all songs when query is empty', () => {
      const results = searchSongs('');
      expect(results).toHaveLength(4);
    });

    it('should return all songs when query is whitespace', () => {
      const results = searchSongs('   ');
      expect(results).toHaveLength(4);
    });

    it('should find songs by substring of filename', () => {
      const results = searchSongs('Taylor Swift');
      expect(results).toHaveLength(1);
      expect(results[0].fileName).toMatch(/Taylor Swift/i);
    });

    it('should find by partial title in filename', () => {
      const results = searchSongs('Perfect');
      expect(results).toHaveLength(1);
      expect(results[0].fileName).toMatch(/Perfect/i);
    });

    it('should perform fuzzy search', () => {
      const results = searchSongs('shakeitoff'); // No spaces, different case
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find partial matches', () => {
      const results = searchSongs('Beat'); // Should find "The Beatles"
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(song => /Beat/i.test(song.fileName))).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const results = searchSongs('NonExistentArtist');
      expect(results).toHaveLength(0);
    });

    it('should be case insensitive', () => {
      const lowerCase = searchSongs('taylor swift');
      const upperCase = searchSongs('TAYLOR SWIFT');
      const mixedCase = searchSongs('Taylor swift');
      
      expect(lowerCase).toHaveLength(1);
      expect(upperCase).toHaveLength(1);
      expect(mixedCase).toHaveLength(1);
      expect(lowerCase[0].id).toBe(upperCase[0].id);
    });
  });

  describe('getSongById', () => {
    beforeEach(() => {
      const mockFiles = ['Artist - Song.mp4'];
      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      mockPath.parse.mockReturnValue({ name: 'Song', ext: '.mp4' } as any);
      scanMediaLibrary();
    });

    it('should return song when ID exists', () => {
      const song = getSongById('0');
      expect(song).toBeDefined();
      expect(song?.id).toBe('0');
      expect(song?.artist).toBe('');
      expect(song?.title).toBe('Artist - Song.mp4');
    });

    it('should return undefined when ID does not exist', () => {
      const song = getSongById('999');
      expect(song).toBeUndefined();
    });

    it('should return undefined when ID is empty', () => {
      const song = getSongById('');
      expect(song).toBeUndefined();
    });

    it('should handle string ID lookup correctly', () => {
      const song = getSongById('0');
      expect(song).toBeDefined();
      
      // Ensure it's doing string comparison, not numeric
      const notFound = getSongById('0.0');
      expect(notFound).toBeUndefined();
    });
  });

  describe('integration', () => {
    it('should maintain consistency between search and getSongById', () => {
      const mockFiles = [
        'Artist 1 - Song 1.mp4',
        'Artist 2 - Song 2.mp4'
      ];

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      mockPath.parse
        .mockReturnValueOnce({ name: 'Song 1', ext: '.mp4' } as any)
        .mockReturnValueOnce({ name: 'Song 2', ext: '.mp4' } as any);

      scanMediaLibrary();

      const allSongs = searchSongs('');
      expect(allSongs).toHaveLength(2);

      // Verify each song can be retrieved by ID
      allSongs.forEach(song => {
        const retrieved = getSongById(song.id);
        expect(retrieved).toEqual(song);
      });
    });

    it('should handle re-scanning and maintain new state', () => {
      // First scan
      mockFs.readdirSync.mockReturnValueOnce(['Song1.mp4'] as any);
      mockPath.parse.mockReturnValueOnce({ name: 'Song1', ext: '.mp4' } as any);
      scanMediaLibrary();
      
      let songs = searchSongs('');
      expect(songs).toHaveLength(1);

      // Second scan with different files
      mockFs.readdirSync.mockReturnValueOnce(['Song2.mp4', 'Song3.mp4'] as any);
      mockPath.parse
        .mockReturnValueOnce({ name: 'Song2', ext: '.mp4' } as any)
        .mockReturnValueOnce({ name: 'Song3', ext: '.mp4' } as any);
      scanMediaLibrary();

      songs = searchSongs('');
      expect(songs).toHaveLength(2);
      expect(getSongById('0')).toBeDefined(); // Should have new IDs
    });
  });
});
