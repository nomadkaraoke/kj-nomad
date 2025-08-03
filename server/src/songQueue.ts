import { Song } from './mediaLibrary.js';

interface QueueEntry {
  song: Song;
  singerName: string;
  queuedAt: number; // timestamp when added to queue
}

interface PlayedSong extends QueueEntry {
  playedAt: number; // timestamp when started playing
  completedAt?: number; // timestamp when finished (if completed)
}

interface CurrentSession {
  startedAt: number;
  queue: QueueEntry[];
  nowPlaying: QueueEntry | null;
  playbackState: 'playing' | 'paused' | 'stopped';
  history: PlayedSong[];
  currentSongStartTime?: number;
}

// Session state - reset only when explicitly requested
let session: CurrentSession = {
  startedAt: Date.now(),
  queue: [],
  nowPlaying: null,
  playbackState: 'stopped',
  history: [],
  currentSongStartTime: undefined
};

// Export session for testing purposes
export { session };

// Initialize session properly
const initializeSession = (): void => {
  session = {
    startedAt: Date.now(),
    queue: [],
    nowPlaying: null,
    playbackState: 'stopped',
    history: [],
    currentSongStartTime: undefined
  };
};

// === Queue Management ===
export const getQueue = (): QueueEntry[] => {
  return session.queue;
};

export const addSongToQueue = (song: Song, singerName: string): QueueEntry => {
  const entry: QueueEntry = { 
    song, 
    singerName, 
    queuedAt: Date.now() 
  };
  session.queue.push(entry);
  return entry;
};

export const removeSongFromQueue = (songId: string): boolean => {
  const originalLength = session.queue.length;
  session.queue = session.queue.filter(entry => entry.song.id !== songId);
  return session.queue.length < originalLength;
};

export const reorderQueue = (fromIndex: number, toIndex: number): boolean => {
  if (fromIndex < 0 || fromIndex >= session.queue.length ||
      toIndex < 0 || toIndex >= session.queue.length) {
    return false;
  }
  
  const [movedItem] = session.queue.splice(fromIndex, 1);
  session.queue.splice(toIndex, 0, movedItem);
  return true;
};

// === Now Playing Management ===
export const getNowPlaying = (): QueueEntry | null => {
  return session.nowPlaying;
};

export const setNowPlaying = (entry: QueueEntry | null, startPlaying: boolean = true): void => {
  // If there was a previous song playing, mark it in history
  if (session.nowPlaying && startPlaying) {
    const playedSong: PlayedSong = {
      ...session.nowPlaying,
      playedAt: session.currentSongStartTime || Date.now(),
      completedAt: Date.now()
    };
    session.history.push(playedSong);
  }

  session.nowPlaying = entry;
  session.currentSongStartTime = startPlaying ? Date.now() : undefined;
  session.playbackState = entry ? (startPlaying ? 'playing' : 'paused') : 'stopped';
};

export const getNextSong = (): QueueEntry | null => {
  const nextSong = session.queue.shift() || null;
  if (nextSong) {
    setNowPlaying(nextSong, true);
  }
  return nextSong;
};

export const playSong = (songId: string, singerName?: string): QueueEntry | null => {
  // First check if it's in the queue
  const queueIndex = session.queue.findIndex(entry => entry.song.id === songId);
  if (queueIndex !== -1) {
    const [entry] = session.queue.splice(queueIndex, 1);
    setNowPlaying(entry, true);
    return entry;
  }

  // Check if it's in history and can be replayed
  const historyEntry = session.history.find(entry => entry.song.id === songId);
  if (historyEntry) {
    const replayEntry: QueueEntry = {
      song: historyEntry.song,
      singerName: singerName || historyEntry.singerName,
      queuedAt: Date.now()
    };
    setNowPlaying(replayEntry, true);
    return replayEntry;
  }

  return null;
};

export const restartCurrentSong = (): QueueEntry | null => {
  if (session.nowPlaying) {
    session.currentSongStartTime = Date.now();
    session.playbackState = 'playing';
    return session.nowPlaying;
  }
  return null;
};

export const pausePlayback = (): void => {
  session.playbackState = 'paused';
};

export const resumePlayback = (): void => {
  if (session.nowPlaying) {
    session.playbackState = 'playing';
  }
};

export const stopPlayback = (): void => {
  if (session.nowPlaying) {
    // Mark current song as completed in history
    const playedSong: PlayedSong = {
      ...session.nowPlaying,
      playedAt: session.currentSongStartTime || Date.now(),
      completedAt: Date.now()
    };
    session.history.push(playedSong);
  }
  
  session.nowPlaying = null;
  session.playbackState = 'stopped';
  session.currentSongStartTime = undefined;
};

// === Session History ===
export const getSessionHistory = (): PlayedSong[] => {
  return [...session.history]; // Return copy to prevent external modification
};

export const addToHistory = (entry: QueueEntry, playedAt: number = Date.now()): void => {
  const playedSong: PlayedSong = {
    ...entry,
    playedAt,
    completedAt: Date.now()
  };
  session.history.push(playedSong);
};

// === Session State ===
export const getSessionState = () => {
  return {
    startedAt: session.startedAt,
    queue: session.queue,
    nowPlaying: session.nowPlaying,
    playbackState: session.playbackState,
    history: session.history,
    currentSongStartTime: session.currentSongStartTime,
    totalSongsPlayed: session.history.length + (session.nowPlaying ? 1 : 0),
    queueLength: session.queue.length
  };
};

export const getPlaybackState = (): 'playing' | 'paused' | 'stopped' => {
  return session.playbackState;
};

// === Session Management ===
export const resetSession = (): void => {
  initializeSession();
};

// Legacy compatibility - keep for existing tests
export const resetQueue = (): void => {
  resetSession();
};
