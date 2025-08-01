import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SingerView from './SingerView';
import type { MockWebSocket } from '../../types/common';

const mockSocket: MockWebSocket = {
  send: vi.fn(),
};

const mockSongs = [
  { id: '1', artist: 'a-ha', title: 'Take On Me', fileName: 'a-ha - Take On Me.mp4' },
  { id: '2', artist: 'Queen', title: 'Bohemian Rhapsody', fileName: 'Queen - Bohemian Rhapsody.mp4' },
];

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    json: () => Promise.resolve(mockSongs),
    text: () => Promise.resolve(''),
    clone: function() { return this; }
  } as Response)
) as typeof fetch;

describe('SingerView', () => {
  it('renders the component and displays the song list', async () => {
    render(<SingerView socket={mockSocket} />);

    expect(screen.getByText('Singer Request View')).toBeInTheDocument();
    
    await waitFor(() => {
        expect(screen.getByText('a-ha - Take On Me')).toBeInTheDocument();
        expect(screen.getByText('Queen - Bohemian Rhapsody')).toBeInTheDocument();
    });
  });
});
