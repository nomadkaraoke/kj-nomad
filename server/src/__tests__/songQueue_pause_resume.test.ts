import { describe, it, expect, vi } from 'vitest';
import { resetSession, session, pausePlayback, resumePlayback, setNowPlaying } from '../songQueue.js';

describe('songQueue pause/resume baseline adjustments', () => {
  it('shifts currentSongStartTime by paused duration on resume', async () => {
    resetSession();
    const start = Date.now();
    vi.setSystemTime(start);
    setNowPlaying({ song: { id: 's1', artist: 'a', title: 't', fileName: 'f' }, singerName: 'X', queuedAt: start }, true);

    // After some time, pause
    vi.setSystemTime(start + 5000); // 5s playing
    pausePlayback();
    const pausedAt = session.pausedAt as number;
    expect(session.playbackState).toBe('paused');

    // Resume after another 3s
    vi.setSystemTime(pausedAt + 3000);
    const prevStart = session.currentSongStartTime as number;
    resumePlayback();
    // start time shifts forward by ~3000ms
    expect(session.currentSongStartTime as number).toBeCloseTo(prevStart + 3000, -2);
    expect(session.playbackState).toBe('playing');
  });
});


