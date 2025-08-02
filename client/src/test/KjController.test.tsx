import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import KjController from '../components/KjController/KjController';
import type { MockWebSocket } from '../types/common';

const mockSocket: MockWebSocket = {
  send: vi.fn(),
};

const mockQueue = [
  { song: { id: '1', artist: 'a-ha', title: 'Take On Me', fileName: 'a-ha - Take On Me.mp4' }, singerName: 'Alice' },
  { song: { id: '2', artist: 'Queen', title: 'Bohemian Rhapsody', fileName: 'Queen - Bohemian Rhapsody.mp4' }, singerName: 'Bob' },
];

describe('KjController', () => {
  it('renders the queue and can play the next song', async () => {
    render(<KjController socket={mockSocket} queue={mockQueue} />);

    // Check for the new format used by DraggableQueue
    expect(screen.getByText('a-ha - Take On Me')).toBeInTheDocument();
    expect(screen.getByText('Singer: Alice')).toBeInTheDocument();
    expect(screen.getByText('Queen - Bohemian Rhapsody')).toBeInTheDocument();
    expect(screen.getByText('Singer: Bob')).toBeInTheDocument();

    const playNextButton = screen.getByText('▶️ Play Next Song');
    await userEvent.click(playNextButton);

    expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: 'play', payload: { songId: '1', fileName: 'a-ha - Take On Me.mp4', singer: 'Alice' } }));
    expect(mockSocket.send).toHaveBeenCalledTimes(1);
  });
});
