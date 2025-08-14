import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import KjController from '../components/KjController/KjController';
import type { MockWebSocket } from '../types/common';

const mockSocket: MockWebSocket = {
  send: vi.fn(),
};

const mockQueue = [
  { song: { id: '1', artist: '', title: 'a-ha - Take On Me.mp4', fileName: 'a-ha - Take On Me.mp4' }, singerName: 'Alice', queuedAt: Date.now() },
  { song: { id: '2', artist: '', title: 'Queen - Bohemian Rhapsody.mp4', fileName: 'Queen - Bohemian Rhapsody.mp4' }, singerName: 'Bob', queuedAt: Date.now() + 1 },
];

describe('KjController', () => {
  it('renders the queue and can play the next song', async () => {
    render(<KjController socket={mockSocket} queue={mockQueue} />);

    expect(screen.getByText(/a-ha - Take On Me$/i)).toBeInTheDocument();
    expect(screen.getByText(/Alice/i)).toBeInTheDocument();
    expect(screen.getByText(/Queen - Bohemian Rhapsody$/i)).toBeInTheDocument();
    expect(screen.getByText(/Bob/i)).toBeInTheDocument();

    const playNextButton = screen.getByText('▶️ Play Next Song');
    await userEvent.click(playNextButton);

    expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: 'play', payload: { songId: '1', fileName: 'a-ha - Take On Me.mp4', singer: 'Alice' } }));
    expect(mockSocket.send).toHaveBeenCalledTimes(1);
  });
});
