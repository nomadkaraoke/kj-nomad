import { describe, it, expect } from 'vitest';
import { addSongToQueue, getQueue, getNextSong, removeSongFromQueue, resetQueue } from './songQueue';

const song1 = { id: '1', artist: 'a-ha', title: 'Take On Me', fileName: 'a-ha - Take On Me.mp4' };
const song2 = { id: '2', artist: 'Queen', title: 'Bohemian Rhapsody', fileName: 'Queen - Bohemian Rhapsody.mp4' };

describe('songQueue', () => {
  it('should add a song to the queue', () => {
    resetQueue(); // Better cleanup
    addSongToQueue(song1, 'Alice');
    expect(getQueue()).toHaveLength(1);
    expect(getQueue()[0]).toEqual(
      expect.objectContaining({
        song: song1, 
        singerName: 'Alice',
        queuedAt: expect.any(Number)
      })
    );
  });

  it('should remove a song from the queue', () => {
    resetQueue(); // Better cleanup
    addSongToQueue(song1, 'Alice');
    addSongToQueue(song2, 'Bob');
    removeSongFromQueue('1');
    expect(getQueue()).toHaveLength(1);
    expect(getQueue()[0].song.id).toBe('2');
  });

  it('should get the next song from the queue', () => {
    resetQueue(); // Better cleanup
    addSongToQueue(song1, 'Alice');
    addSongToQueue(song2, 'Bob');
    const nextSong = getNextSong();
    expect(nextSong?.song.id).toBe('1');
    expect(getQueue()).toHaveLength(1);
  });

  it('should return null when getting the next song from an empty queue', () => {
    resetQueue(); // Better cleanup
    const nextSong = getNextSong();
    expect(nextSong).toBe(null);
  });
});
