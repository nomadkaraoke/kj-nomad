import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanMediaLibrary, searchSongs, getSongById } from './mediaLibrary';

// Mock the fs module
vi.mock('fs', () => ({
  default: {
    readdirSync: vi.fn(),
  }
}));

import fs from 'fs';

const mockFiles = [
  'a-ha - Take On Me.mp4',
  'Queen - Bohemian Rhapsody.mp4',
  'filler-1.mp4',
  'not-a-song.txt'
];

describe('mediaLibrary', () => {
  beforeEach(() => {
    // Reset the mock before each test
    vi.mocked(fs.readdirSync).mockClear();
  });

  it('should scan the media library and create a song list', () => {
    vi.mocked(fs.readdirSync).mockReturnValue(mockFiles);
    scanMediaLibrary();
    // Should be 2 songs, ignoring the filler and txt file
    expect(searchSongs('')).toHaveLength(2);
  });

  it('should search for songs using fuzzy search', () => {
    vi.mocked(fs.readdirSync).mockReturnValue(mockFiles);
    scanMediaLibrary();
    const results = searchSongs('aha');
    expect(results).toHaveLength(1);
    expect(results[0].artist).toBe('a-ha');
  });

  it('should return all songs when the search query is empty', () => {
    vi.mocked(fs.readdirSync).mockReturnValue(mockFiles);
    scanMediaLibrary();
    const results = searchSongs('');
    expect(results).toHaveLength(2);
  });

  it('should get a song by its ID', () => {
    vi.mocked(fs.readdirSync).mockReturnValue(mockFiles);
    scanMediaLibrary();
    const song = getSongById('0'); // 'a-ha - Take On Me.mp4' should be the first song
    expect(song?.artist).toBe('a-ha');
  });
});
