import fs from 'fs';
import path from 'path';

interface FillerSong {
  id: string;
  fileName: string;
}

let fillerPlaylist: FillerSong[] = [];
let nowPlayingIndex = -1;

const mediaDir = path.join(__dirname, '../media');

export const scanFillerMusic = () => {
  console.log('Scanning for filler music...');
  try {
    const files = fs.readdirSync(mediaDir);
    fillerPlaylist = files
      .filter(file => file.startsWith('filler-') && (file.endsWith('.mp4') || file.endsWith('.webm')))
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

export const getNextFillerSong = (): FillerSong | undefined => {
  if (fillerPlaylist.length === 0) return undefined;
  nowPlayingIndex = (nowPlayingIndex + 1) % fillerPlaylist.length;
  return fillerPlaylist[nowPlayingIndex];
};
