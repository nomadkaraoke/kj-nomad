import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Fuse from 'fuse.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Song {
  id: string;
  artist: string; // kept for backward-compat; will be empty string
  title: string;  // kept for backward-compat; will mirror fileName
  fileName: string;
}

let songLibrary: Song[] = [];
let fuse: Fuse<Song>;

const mediaDir = path.join(__dirname, '../media');

// Legacy parser removed: we do not infer artist/title from filenames anymore.

export const scanMediaLibrary = (customDirectory?: string): Song[] => {
  const scanDir = customDirectory || mediaDir;
  console.log(`Scanning media library in: ${scanDir}`);
  
  try {
    // Ensure directory exists
    if (!fs.existsSync(scanDir)) {
      // Throw an error that can be caught by the API layer
      throw new Error(`Media directory not found: ${scanDir}`);
    }

    const files = fs.readdirSync(scanDir);
    const supported = new Set(['.mp4', '.webm', '.avi', '.mov', '.mp3', '.m4a', '.wav', '.flac', '.ogg']);
    songLibrary = files
      .filter(file => supported.has(path.extname(file).toLowerCase()))
      .map((file, index) => ({
        id: `${index}`,
        artist: '',
        title: file, // show raw filename in UI
        fileName: file,
      }));

    // Build a simple Fuse index on fileName only for potential fuzzy matching, but we will also support substring matching
    fuse = new Fuse(songLibrary, {
      keys: ['fileName'],
      threshold: 0.3,
      ignoreLocation: true,
      distance: 200,
      minMatchCharLength: 1,
    });
    console.log(`Scan complete. Found ${songLibrary.length} songs.`);
    return songLibrary;
  } catch (error) {
    console.error('Error scanning media library:', error);
    songLibrary = [];
    fuse = new Fuse(songLibrary, {
      keys: ['fileName'],
      threshold: 0.3,
    });
    // Re-throw the error to be handled by the caller
    throw error;
  }
};

export const searchSongs = (query: string): Song[] => {
  if (!query || !query.trim()) {
    return songLibrary;
  }
  const q = query.toLowerCase();
  // Prefer fast substring match on filename; fall back to Fuse for fuzzy matches if needed
  const direct = songLibrary.filter(s => s.fileName.toLowerCase().includes(q));
  if (direct.length > 0) return direct;
  return fuse.search(query).map(result => result.item);
};

export const getSongById = (id: string): Song | undefined => {
  return songLibrary.find(song => song.id === id);
};

// Helper function for testing
export const resetMediaLibrary = () => {
  songLibrary = [];
};
