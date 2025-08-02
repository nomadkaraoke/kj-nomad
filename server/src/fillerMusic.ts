import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface FillerSong {
  id: string;
  fileName: string;
}

let fillerPlaylist: FillerSong[] = [];
let nowPlayingIndex = -1;

const mediaDir = path.join(__dirname, '../media');

export const scanFillerMusic = (customDirectory?: string) => {
  const scanDir = customDirectory || mediaDir;
  console.log(`Scanning for filler music in: ${scanDir}`);
  
  try {
    // Ensure directory exists
    if (!fs.existsSync(scanDir)) {
      console.error(`Filler music directory does not exist: ${scanDir}`);
      fillerPlaylist = [];
      return;
    }

    const files = fs.readdirSync(scanDir);
    fillerPlaylist = files
      .filter(file => {
        // Filter for filler music files (start with 'filler-') and supported video extensions
        const isVideoFile = file.endsWith('.mp4') || file.endsWith('.webm');
        const isFillerFile = file.toLowerCase().startsWith('filler-');
        return isVideoFile && isFillerFile;
      })
      .map((file, index) => ({
        id: `${index}`,
        fileName: file,
      }));
    console.log(`Scan complete. Found ${fillerPlaylist.length} filler songs.`);
  } catch (error) {
    console.error('Error scanning filler music:', error);
    fillerPlaylist = [];
  }
};

export const getNextFillerSong = (): FillerSong | null => {
  if (fillerPlaylist.length === 0) return null;
  nowPlayingIndex = (nowPlayingIndex + 1) % fillerPlaylist.length;
  return fillerPlaylist[nowPlayingIndex];
};

// Helper function for testing
export const resetFillerMusic = () => {
  fillerPlaylist = [];
  nowPlayingIndex = -1;
};
