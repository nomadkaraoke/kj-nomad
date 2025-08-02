import { describe, it, expect, beforeEach } from 'vitest';
import { 
  addSongToQueue, 
  getQueue, 
  removeSongFromQueue, 
  getNextSong,
  getNowPlaying,
  resetQueue,
  reorderQueue,
  setNowPlaying,
  playSong,
  restartCurrentSong,
  pausePlayback,
  resumePlayback,
  stopPlayback,
  getSessionHistory,
  addToHistory,
  getSessionState,
  getPlaybackState,
  resetSession,
  session
} from '../songQueue';
import type { Song } from '../mediaLibrary';

// Mock data
const mockSong1: Song = {
  id: '1',
  artist: 'Test Artist 1',
  title: 'Test Song 1',
  fileName: 'test-song-1.mp4'
};

const mockSong2: Song = {
  id: '2',
  artist: 'Test Artist 2',
  title: 'Test Song 2',
  fileName: 'test-song-2.mp4'
};

const mockSong3: Song = {
  id: '3',
  artist: 'Test Artist 3',
  title: 'Test Song 3',
  fileName: 'test-song-3.mp4'
};

describe('songQueue', () => {
  beforeEach(() => {
    // Reset the queue and nowPlaying state before each test
    resetQueue();
  });

  describe('addSongToQueue', () => {
    it('should add a song to the queue', () => {
      addSongToQueue(mockSong1, 'John Doe');
      const queue = getQueue();
      
      expect(queue).toHaveLength(1);
      expect(queue[0].song).toEqual(mockSong1);
      expect(queue[0].singerName).toBe('John Doe');
    });

    it('should add multiple songs to the queue in order', () => {
      addSongToQueue(mockSong1, 'John Doe');
      addSongToQueue(mockSong2, 'Jane Smith');
      
      const queue = getQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0].singerName).toBe('John Doe');
      expect(queue[1].singerName).toBe('Jane Smith');
    });

    it('should handle empty singer name', () => {
      addSongToQueue(mockSong1, '');
      const queue = getQueue();
      
      expect(queue).toHaveLength(1);
      expect(queue[0].singerName).toBe('');
    });
  });

  describe('removeSongFromQueue', () => {
    beforeEach(() => {
      addSongToQueue(mockSong1, 'John Doe');
      addSongToQueue(mockSong2, 'Jane Smith');
    });

    it('should remove a song from the queue by ID', () => {
      removeSongFromQueue('1');
      const queue = getQueue();
      
      expect(queue).toHaveLength(1);
      expect(queue[0].song.id).toBe('2');
    });

    it('should not affect queue if song ID does not exist', () => {
      removeSongFromQueue('999');
      const queue = getQueue();
      
      expect(queue).toHaveLength(2);
    });

    it('should remove all instances if there are duplicates', () => {
      // Add the same song again (edge case)
      addSongToQueue(mockSong1, 'Another Singer');
      removeSongFromQueue('1');
      
      const queue = getQueue();
      const song1Entries = queue.filter(entry => entry.song.id === '1');
      expect(song1Entries).toHaveLength(0);
    });
  });

  describe('getNextSong', () => {
    it('should return and remove the first song from queue', () => {
      addSongToQueue(mockSong1, 'John Doe');
      addSongToQueue(mockSong2, 'Jane Smith');
      
      const nextSong = getNextSong();
      const queue = getQueue();
      
      expect(nextSong?.song).toEqual(mockSong1);
      expect(nextSong?.singerName).toBe('John Doe');
      expect(queue).toHaveLength(1);
      expect(queue[0].song.id).toBe('2');
    });

    it('should return undefined when queue is empty', () => {
      const nextSong = getNextSong();
      expect(nextSong).toBeNull();
    });

    it('should update now playing state', () => {
      addSongToQueue(mockSong1, 'John Doe');
      const nextSong = getNextSong();
      const nowPlaying = getNowPlaying();
      
      expect(nowPlaying).toEqual(nextSong);
    });
  });

  describe('getQueue', () => {
    it('should return empty array when no songs are queued', () => {
      const queue = getQueue();
      expect(queue).toEqual([]);
    });

    it('should return all queued songs in order', () => {
      addSongToQueue(mockSong1, 'John Doe');
      addSongToQueue(mockSong2, 'Jane Smith');
      
      const queue = getQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0].singerName).toBe('John Doe');
      expect(queue[1].singerName).toBe('Jane Smith');
    });
  });

  describe('getNowPlaying', () => {
    it('should return null when nothing is playing', () => {
      const nowPlaying = getNowPlaying();
      expect(nowPlaying).toBeNull();
    });

    it('should return the current song after getNextSong is called', () => {
      addSongToQueue(mockSong1, 'John Doe');
      getNextSong();
      
      const nowPlaying = getNowPlaying();
      expect(nowPlaying?.song.id).toBe('1');
      expect(nowPlaying?.singerName).toBe('John Doe');
    });
  });

  describe('queue state management', () => {
    it('should maintain queue integrity across multiple operations', () => {
      // Add songs
      addSongToQueue(mockSong1, 'Singer 1');
      addSongToQueue(mockSong2, 'Singer 2');
      addSongToQueue({ ...mockSong1, id: '3' }, 'Singer 3');
      
      // Remove middle song
      removeSongFromQueue('2');
      
      // Get next song
      const next = getNextSong();
      
      const queue = getQueue();
      expect(queue).toHaveLength(1);
      expect(next?.singerName).toBe('Singer 1');
      expect(queue[0].singerName).toBe('Singer 3');
    });
  });

  describe('reorderQueue', () => {
    it('should reorder queue items correctly', () => {
      addSongToQueue(mockSong1, 'John');
      addSongToQueue(mockSong2, 'Jane');
      addSongToQueue(mockSong3, 'Bob');
      
      const success = reorderQueue(0, 2); // Move first item to last
      expect(success).toBe(true);
      
      const queue = getQueue();
      expect(queue[0].singerName).toBe('Jane');
      expect(queue[1].singerName).toBe('Bob');
      expect(queue[2].singerName).toBe('John');
    });

    it('should return false for invalid indices', () => {
      addSongToQueue(mockSong1, 'John');
      
      expect(reorderQueue(-1, 0)).toBe(false);
      expect(reorderQueue(0, -1)).toBe(false);
      expect(reorderQueue(5, 0)).toBe(false);
      expect(reorderQueue(0, 5)).toBe(false);
    });

    it('should handle reordering in empty queue', () => {
      expect(reorderQueue(0, 1)).toBe(false);
    });

    it('should handle moving to same position', () => {
      addSongToQueue(mockSong1, 'John');
      addSongToQueue(mockSong2, 'Jane');
      
      const success = reorderQueue(0, 0);
      expect(success).toBe(true);
      
      const queue = getQueue();
      expect(queue[0].singerName).toBe('John');
    });
  });

  describe('setNowPlaying', () => {
    it('should set now playing without starting playback', () => {
      const entry = addSongToQueue(mockSong1, 'John');
      setNowPlaying(entry, false);
      
      const nowPlaying = getNowPlaying();
      expect(nowPlaying).toEqual(entry);
      expect(getPlaybackState()).toBe('paused');
    });

    it('should set now playing and start playback', () => {
      const entry = addSongToQueue(mockSong1, 'John');
      setNowPlaying(entry, true);
      
      const nowPlaying = getNowPlaying();
      expect(nowPlaying).toEqual(entry);
      expect(getPlaybackState()).toBe('playing');
    });

    it('should move previous song to history when starting new song', () => {
      const entry1 = addSongToQueue(mockSong1, 'John');
      const entry2 = addSongToQueue(mockSong2, 'Jane');
      
      setNowPlaying(entry1, true);
      setNowPlaying(entry2, true);
      
      const history = getSessionHistory();
      expect(history).toHaveLength(1);
      expect(history[0].song.id).toBe(mockSong1.id);
      expect(history[0].singerName).toBe('John');
      expect(history[0].completedAt).toBeDefined();
    });

    it('should use current time for playedAt if startTime is missing', () => {
      const entry = addSongToQueue(mockSong1, 'John');
      setNowPlaying(entry, true);

      // Manually clear start time to simulate edge case
      session.currentSongStartTime = undefined;

      setNowPlaying(addSongToQueue(mockSong2, 'Jane'), true);

      const history = getSessionHistory();
      expect(history).toHaveLength(1);
      expect(history[0].playedAt).toBeDefined();
    });

    it('should clear now playing when set to null', () => {
      const entry = addSongToQueue(mockSong1, 'John');
      setNowPlaying(entry, true);
      setNowPlaying(null);
      
      expect(getNowPlaying()).toBeNull();
      expect(getPlaybackState()).toBe('stopped');
    });
  });

  describe('playSong', () => {
    it('should play song from queue', () => {
      addSongToQueue(mockSong1, 'John');
      addSongToQueue(mockSong2, 'Jane');
      
      const played = playSong('2');
      
      expect(played).toBeDefined();
      expect(played?.song.id).toBe('2');
      expect(played?.singerName).toBe('Jane');
      expect(getNowPlaying()).toEqual(played);
      expect(getQueue()).toHaveLength(1); // Should remove from queue
    });

    it('should replay song from history', () => {
      // Add to queue and remove it properly first
      addSongToQueue(mockSong1, 'John');
      const entry = getNextSong(); // This removes from queue and sets nowPlaying
      expect(entry?.singerName).toBe('John');
      
      stopPlayback(); // Move to history properly
      
      // Check history has the song and queue is empty
      const history = getSessionHistory();
      expect(history).toHaveLength(1);
      expect(history[0].singerName).toBe('John');
      expect(getQueue()).toHaveLength(0);
      
      const replayed = playSong('1', 'Jane');
      
      expect(replayed).toBeDefined();
      expect(replayed?.song.id).toBe('1');
      expect(replayed?.singerName).toBe('Jane'); // New singer name
      
      const nowPlaying = getNowPlaying();
      expect(nowPlaying).toBeDefined();
      expect(nowPlaying?.song.id).toBe('1');
      expect(nowPlaying?.singerName).toBe('Jane'); // Should also have new singer name
    });

    it('should use original singer name when replaying without specifying new one', () => {
      addSongToQueue(mockSong1, 'John');
      getNextSong(); // This removes from queue and sets nowPlaying
      stopPlayback(); // Move to history properly
      
      const replayed = playSong('1');
      
      expect(replayed?.singerName).toBe('John');
    });

    it('should return null for non-existent song', () => {
      const played = playSong('999');
      expect(played).toBeNull();
    });
  });

  describe('restartCurrentSong', () => {
    it('should restart current song and update state', () => {
      const entry = addSongToQueue(mockSong1, 'John');
      setNowPlaying(entry, true);
      pausePlayback();
      
      const restarted = restartCurrentSong();
      
      expect(restarted).toEqual(entry);
      expect(getPlaybackState()).toBe('playing');
    });

    it('should return null when no song is playing', () => {
      const restarted = restartCurrentSong();
      expect(restarted).toBeNull();
    });
  });

  describe('Playback Control', () => {
    describe('pausePlayback', () => {
      it('should pause playback', () => {
        const entry = addSongToQueue(mockSong1, 'John');
        setNowPlaying(entry, true);
        
        pausePlayback();
        
        expect(getPlaybackState()).toBe('paused');
        expect(getNowPlaying()).toEqual(entry); // Song should still be loaded
      });
    });

    describe('resumePlayback', () => {
      it('should resume playback when song is loaded', () => {
        const entry = addSongToQueue(mockSong1, 'John');
        setNowPlaying(entry, true);
        pausePlayback();
        
        resumePlayback();
        
        expect(getPlaybackState()).toBe('playing');
      });

      it('should not change state when no song is loaded', () => {
        resumePlayback();
        expect(getPlaybackState()).toBe('stopped');
      });
    });

    describe('stopPlayback', () => {
      it('should stop playback and move song to history', () => {
        const entry = addSongToQueue(mockSong1, 'John');
        setNowPlaying(entry, true);
        
        stopPlayback();
        
        expect(getPlaybackState()).toBe('stopped');
        expect(getNowPlaying()).toBeNull();
        
        const history = getSessionHistory();
        expect(history).toHaveLength(1);
        expect(history[0].song.id).toBe(mockSong1.id);
      });

      it('should use current time for playedAt if startTime is missing on stop', () => {
        const entry = addSongToQueue(mockSong1, 'John');
        setNowPlaying(entry, true);

        // Manually clear start time
        session.currentSongStartTime = undefined;

        stopPlayback();

        const history = getSessionHistory();
        expect(history).toHaveLength(1);
        expect(history[0].playedAt).toBeDefined();
      });

      it('should handle stopping when no song is playing', () => {
        stopPlayback();
        expect(getPlaybackState()).toBe('stopped');
        expect(getNowPlaying()).toBeNull();
      });
    });
  });

  describe('Session History', () => {
    describe('getSessionHistory', () => {
      it('should return copy of history to prevent external modification', () => {
        const entry = addSongToQueue(mockSong1, 'John');
        setNowPlaying(entry, true);
        stopPlayback(); // Move to history properly
        
        const history1 = getSessionHistory();
        const history2 = getSessionHistory();
        
        expect(history1).toEqual(history2);
        expect(history1).not.toBe(history2); // Different objects
        
        // Modifying returned array shouldn't affect internal state
        history1.pop();
        expect(getSessionHistory()).toHaveLength(1);
      });
    });

    describe('addToHistory', () => {
      it('should manually add entry to history with default timestamp', () => {
        const entry = addSongToQueue(mockSong1, 'John');
        addToHistory(entry);
        
        const history = getSessionHistory();
        expect(history).toHaveLength(1);
        expect(history[0].song.id).toBe(mockSong1.id);
        expect(history[0].playedAt).toBeDefined();
        expect(history[0].completedAt).toBeDefined();
      });

      it('should manually add entry to history with custom timestamp', () => {
        const entry = addSongToQueue(mockSong1, 'John');
        const customTime = Date.now() - 10000;
        addToHistory(entry, customTime);
        
        const history = getSessionHistory();
        expect(history[0].playedAt).toBe(customTime);
      });
    });
  });

  describe('Session State', () => {
    describe('getSessionState', () => {
      it('should return complete session state', () => {
        const entry1 = addSongToQueue(mockSong1, 'John');
        const entry2 = addSongToQueue(mockSong2, 'Jane');
        setNowPlaying(entry1, true);
        
        const state = getSessionState();
        
        expect(state).toEqual({
          startedAt: expect.any(Number),
          queue: [entry1, entry2], // setNowPlaying doesn't remove from queue
          nowPlaying: entry1,
          playbackState: 'playing',
          history: [],
          currentSongStartTime: expect.any(Number),
          totalSongsPlayed: 1, // 1 currently playing + 0 in history
          queueLength: 2
        });
      });

      it('should calculate correct totals with history', () => {
        const entry1 = addSongToQueue(mockSong1, 'John');
        const entry2 = addSongToQueue(mockSong2, 'Jane');
        
        setNowPlaying(entry1, true);
        setNowPlaying(entry2, true); // Moves entry1 to history
        
        const state = getSessionState();
        expect(state.totalSongsPlayed).toBe(2); // 1 playing + 1 in history
        expect(state.queueLength).toBe(2); // setNowPlaying doesn't remove from queue
        expect(state.history).toHaveLength(1);
      });
    });

    describe('getPlaybackState', () => {
      it('should return correct playback states', () => {
        expect(getPlaybackState()).toBe('stopped');
        
        const entry = addSongToQueue(mockSong1, 'John');
        setNowPlaying(entry, true);
        expect(getPlaybackState()).toBe('playing');
        
        pausePlayback();
        expect(getPlaybackState()).toBe('paused');
        
        stopPlayback();
        expect(getPlaybackState()).toBe('stopped');
      });
    });
  });

  describe('Session Management', () => {
    describe('resetSession', () => {
      it('should completely reset all session data', () => {
        // Set up some data
        addSongToQueue(mockSong1, 'John');
        addSongToQueue(mockSong2, 'Jane');
        const entry = getNextSong();
        if (entry) addToHistory(entry);
        
        resetSession();
        
        expect(getQueue()).toHaveLength(0);
        expect(getNowPlaying()).toBeNull();
        expect(getSessionHistory()).toHaveLength(0);
        expect(getPlaybackState()).toBe('stopped');
        
        const state = getSessionState();
        expect(state.totalSongsPlayed).toBe(0);
        expect(state.startedAt).toBeDefined();
      });
    });

    describe('resetQueue (legacy compatibility)', () => {
      it('should work same as resetSession', () => {
        addSongToQueue(mockSong1, 'John');
        resetQueue();
        
        expect(getQueue()).toHaveLength(0);
        expect(getSessionState().startedAt).toBeDefined();
      });
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle complex queue operations', () => {
      // Add songs
      addSongToQueue(mockSong1, 'John');
      addSongToQueue(mockSong2, 'Jane');
      addSongToQueue(mockSong3, 'Bob');
      
      // Reorder
      reorderQueue(0, 2);
      
      // Play from middle
      const played = playSong('3');
      expect(played?.singerName).toBe('Bob');
      
      // Queue should now have Jane, John
      const queue = getQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0].singerName).toBe('Jane');
      expect(queue[1].singerName).toBe('John');
    });

    it('should handle playback state transitions correctly', () => {
      const entry1 = addSongToQueue(mockSong1, 'John');
      const entry2 = addSongToQueue(mockSong2, 'Jane');
      
      // Start first song
      setNowPlaying(entry1, true);
      expect(getPlaybackState()).toBe('playing');
      
      // Pause
      pausePlayback();
      expect(getPlaybackState()).toBe('paused');
      
      // Resume
      resumePlayback();
      expect(getPlaybackState()).toBe('playing');
      
      // Start second song (should move first to history)
      setNowPlaying(entry2, true);
      expect(getSessionHistory()).toHaveLength(1);
      expect(getNowPlaying()?.song.id).toBe('2');
      
      // Stop
      stopPlayback();
      expect(getSessionHistory()).toHaveLength(2);
      expect(getNowPlaying()).toBeNull();
    });

    it('should preserve queue order when using getNextSong', () => {
      addSongToQueue(mockSong1, 'John');
      addSongToQueue(mockSong2, 'Jane');
      addSongToQueue(mockSong3, 'Bob');
      
      const first = getNextSong();
      expect(first?.singerName).toBe('John');
      expect(getQueue()).toHaveLength(2);
      
      const second = getNextSong();
      expect(second?.singerName).toBe('Jane');
      expect(getQueue()).toHaveLength(1);
      
      expect(getNowPlaying()?.singerName).toBe('Jane');
    });

    it('should handle timestamp tracking correctly', () => {
      const startTime = Date.now();
      const entry = addSongToQueue(mockSong1, 'John');
      
      expect(entry.queuedAt).toBeGreaterThanOrEqual(startTime);
      
      setNowPlaying(entry, true);
      const state = getSessionState();
      expect(state.currentSongStartTime).toBeGreaterThanOrEqual(startTime);
      
      stopPlayback();
      const history = getSessionHistory();
      expect(history[0].playedAt).toBeGreaterThanOrEqual(startTime);
      expect(history[0].completedAt).toBeGreaterThanOrEqual(history[0].playedAt);
    });
  });
});