import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SingerView from '../components/SingerView/SingerView';

const mockSocket = {
  send: vi.fn(),
} as any;

const mockSongs = [
  { id: '1', artist: 'a-ha', title: 'Take On Me', fileName: 'a-ha - Take On Me.mp4' },
  { id: '2', artist: 'Queen', title: 'Bohemian Rhapsody', fileName: 'Queen - Bohemian Rhapsody.mp4' },
];

describe('SingerView', () => {
    beforeEach(() => {
        global.fetch = vi.fn((url) => {
            const query = new URLSearchParams(url.toString().split('?')[1]).get('q');
            const songs = query ? mockSongs.filter(s => s.artist.toLowerCase().includes(query.toLowerCase()) || s.title.toLowerCase().includes(query.toLowerCase())) : mockSongs;
            return Promise.resolve({
                json: () => Promise.resolve(songs),
            })
        }) as any;
    });

  it('renders the component and displays the song list', async () => {
    render(<SingerView socket={mockSocket} />);
    expect(screen.getByText('Singer Request View')).toBeInTheDocument();
    await waitFor(() => {
        expect(screen.getByText('a-ha - Take On Me')).toBeInTheDocument();
        expect(screen.getByText('Queen - Bohemian Rhapsody')).toBeInTheDocument();
    });
  });

  it('filters the song list when searching', async () => {
    render(<SingerView socket={mockSocket} />);
    const searchInput = screen.getByPlaceholderText('Search for a song...');
    await userEvent.type(searchInput, 'Queen');
    await waitFor(() => {
        expect(screen.queryByText('a-ha - Take On Me')).not.toBeInTheDocument();
        expect(screen.getByText('Queen - Bohemian Rhapsody')).toBeInTheDocument();
    });
  });

  it('sends a request_song message when a song is requested', async () => {
    render(<SingerView socket={mockSocket} />);
    const nameInput = screen.getByPlaceholderText('Your Name');
    await userEvent.type(nameInput, 'Alice');
    const requestButtons = await screen.findAllByText('Request');
    await userEvent.click(requestButtons[0]);
    expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: 'request_song', payload: { songId: '1', singerName: 'Alice' } }));
  });
});
