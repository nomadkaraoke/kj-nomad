import { Song } from './mediaLibrary';

interface QueueEntry {
  song: Song;
  singerName: string;
}

let queue: QueueEntry[] = [];

export const getQueue = () => {
  return queue;
};

export const addSongToQueue = (song: Song, singerName: string) => {
  queue.push({ song, singerName });
};

export const removeSongFromQueue = (songId: string) => {
  queue = queue.filter(entry => entry.song.id !== songId);
};

export const getNextSong = (): QueueEntry | undefined => {
  return queue.shift();
};
