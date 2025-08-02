import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Fuse from 'fuse.js';

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Song {
  id: string;
  artist: string;
  title: string;
  fileName: string;
}

let songLibrary: Song[] = [];
let fuse: Fuse<Song>;

const mediaDir = path.join(__dirname, '../media');

const parseFileName = (fileName: string): { artist: string, title: string } => {
  // A simple parser assuming "Artist - Title.mp4" format
  const [artist, titleWithExt] = fileName.split(' - ');
  if (!artist || !titleWithExt) {
    return { artist: 'Unknown', title: fileName };
  }
  const title = path.parse(titleWithExt).name;
  return { artist: artist.trim(), title: title.trim() };
};

export const scanMediaLibrary = (customDirectory?: string) => {
  const scanDir = customDirectory || mediaDir;
  console.log(`Scanning media library in: ${scanDir}`);
  
  try {
    // Ensure directory exists
    if (!fs.existsSync(scanDir)) {
      console.error(`Media directory does not exist: ${scanDir}`);
      songLibrary = [];
      fuse = new Fuse([], { keys: ['artist', 'title'], threshold: 0.4 });
      return;
    }

    const files = fs.readdirSync(scanDir);
    songLibrary = files
      .filter(file => {
        // Filter out filler music and only include supported video files
        const isVideoFile = file.endsWith('.mp4') || file.endsWith('.webm');
        const isNotFiller = !file.toLowerCase().startsWith('filler-');
        return isVideoFile && isNotFiller;
      })
      .map((file, index) => {
        const { artist, title } = parseFileName(file);
        return {
          id: `${index}`,
          artist,
          title,
          fileName: file,
        };
      });

    fuse = new Fuse(songLibrary, {
      keys: ['artist', 'title'],
      threshold: 0.4,
    });
    console.log(`Scan complete. Found ${songLibrary.length} songs.`);
  } catch (error) {
    console.error('Error scanning media library:', error);
    songLibrary = [];
  }
};

export const searchSongs = (query: string): Song[] => {
  if (!query || !query.trim()) {
    return songLibrary;
  }
  return fuse.search(query).map(result => result.item);
};

export const getSongById = (id: string): Song | undefined => {
  return songLibrary.find(song => song.id === id);
};

// Helper function for testing
export const resetMediaLibrary = () => {
  songLibrary = [];
};
