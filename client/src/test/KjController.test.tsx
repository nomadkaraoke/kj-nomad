import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import KjController from '../components/KjController/KjController';

const mockSocket = {
  send: vi.fn(),
} as any;

const mockQueue = [
  { song: { id: '1', artist: 'a-ha', title: 'Take On Me', fileName: 'a-ha - Take On Me.mp4' }, singerName: 'Alice' },
  { song: { id: '2', artist: 'Queen', title: 'Bohemian Rhapsody', fileName: 'Queen - Bohemian Rhapsody.mp4' }, singerName: 'Bob' },
];

describe('KjController', () => {
  it('renders the queue and can play the next song', async () => {
    render(<KjController socket={mockSocket} queue={mockQueue} />);

    expect(screen.getByText('a-ha - Take On Me (Alice)')).toBeInTheDocument();
    expect(screen.getByText('Queen - Bohemian Rhapsody (Bob)')).toBeInTheDocument();

    const playNextButton = screen.getByText('Play Next');
    await userEvent.click(playNextButton);

    expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: 'play', payload: { songId: '1', fileName: 'a-ha - Take On Me.mp4' } }));
    expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: 'remove_from_queue', payload: { songId: '1' } }));
  });
});
