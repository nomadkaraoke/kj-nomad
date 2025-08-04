import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SingerProfiles } from '../SingerProfiles';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock data
const mockProfiles = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-1234',
    favoriteGenres: ['Rock', 'Pop'],
    favoriteSongs: ['song1', 'song2'],
    totalSongsPerformed: 15,
    averageRating: 4.5,
    notes: 'Great singer',
    vipStatus: true,
    preferredKey: 'C',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-5678',
    favoriteGenres: ['Country', 'Blues'],
    favoriteSongs: ['song3', 'song4'],
    totalSongsPerformed: 8,
    averageRating: 4.2,
    notes: 'Loves country music',
    vipStatus: false,
    preferredKey: 'G',
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2023-02-01')
  }
];

const mockStats = {
  totalPerformances: 15,
  averageRating: 4.5,
  favoriteGenres: ['Rock', 'Pop'],
  topSongs: [
    { title: 'Sweet Caroline', artist: 'Neil Diamond', count: 3 },
    { title: 'Don\'t Stop Believin\'', artist: 'Journey', count: 2 }
  ],
  performanceHistory: []
};

describe('SingerProfiles', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('renders the singer profiles page', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockProfiles })
    });

    render(<SingerProfiles />);

    expect(screen.getByText('Singer Profiles')).toBeInTheDocument();
    expect(screen.getByText('Add New Singer')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search singers...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('displays singer count correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockProfiles })
    });

    render(<SingerProfiles />);

    await waitFor(() => {
      expect(screen.getByText('Singers (2)')).toBeInTheDocument();
    });
  });

  it('shows VIP badge for VIP singers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockProfiles })
    });

    render(<SingerProfiles />);

    await waitFor(() => {
      expect(screen.getByText('VIP')).toBeInTheDocument();
    });
  });

  it('displays singer details when profile is selected', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockProfiles })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockStats })
      });

    render(<SingerProfiles />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on John Doe
    fireEvent.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(screen.getByText(/john@example\.com/)).toBeInTheDocument();
      expect(screen.getByText(/555-1234/)).toBeInTheDocument();
      expect(screen.getByText(/Rock, Pop/)).toBeInTheDocument();
      expect(screen.getByText('Great singer')).toBeInTheDocument();
    });
  });

  it('displays performance statistics', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockProfiles })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockStats })
      });

    render(<SingerProfiles />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(screen.getByText('Performance Statistics')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument(); // Total performances
      expect(screen.getByText('4.5')).toBeInTheDocument(); // Average rating
      expect(screen.getByText('Sweet Caroline by Neil Diamond')).toBeInTheDocument();
    });
  });

  it('opens create profile form when Add New Singer is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    render(<SingerProfiles />);

    const addButton = screen.getByRole('button', { name: 'Add New Singer' });
    await act(async () => {
      fireEvent.click(addButton);
    });

    expect(screen.getByPlaceholderText('Singer Name *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByText('Create Profile')).toBeInTheDocument();
  });

  it('creates a new profile when form is submitted', async () => {
    const newProfile = {
      id: '3',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      phone: '555-9999',
      favoriteGenres: ['Jazz'],
      favoriteSongs: [],
      totalSongsPerformed: 0,
      notes: '',
      vipStatus: false,
      preferredKey: 'F',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: newProfile })
      });

    render(<SingerProfiles />);

    // Open create form
    fireEvent.click(screen.getByText('Add New Singer'));

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('Singer Name *'), {
      target: { value: 'Bob Wilson' }
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'bob@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Phone'), {
      target: { value: '555-9999' }
    });

    // Submit form
    fireEvent.click(screen.getByText('Create Profile'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/singers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Bob Wilson',
          email: 'bob@example.com',
          phone: '555-9999',
          favoriteGenres: [],
          notes: '',
          vipStatus: false,
          preferredKey: ''
        })
      });
    });
  });

  it('filters profiles based on search query', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockProfiles })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [mockProfiles[0]] })
      });

    render(<SingerProfiles />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Search for "John"
    const searchInput = screen.getByPlaceholderText('Search singers...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      // Should only show John Doe
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('toggles VIP status when button is clicked', async () => {
    const updatedProfile = { ...mockProfiles[0], vipStatus: false };

    mockFetch
      .mockResolvedValueOnce({ // For initial profile load
        ok: true,
        json: async () => ({ success: true, data: mockProfiles })
      })
      .mockResolvedValueOnce({ // For fetchStats after selection
        ok: true,
        json: async () => ({ success: true, data: mockStats })
      })
      .mockResolvedValueOnce({ // For the PUT request to update VIP status
        ok: true,
        json: async () => ({ success: true, data: updatedProfile })
      });

    render(<SingerProfiles />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select John Doe
    fireEvent.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(screen.getByText('Remove VIP')).toBeInTheDocument();
    });

    // Click VIP toggle
    await act(async () => {
      fireEvent.click(screen.getByText('Remove VIP'));
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/singers/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vipStatus: false })
      });
    });
  });

  it('handles loading state', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<SingerProfiles />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty state message when no profile is selected', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    render(<SingerProfiles />);

    await waitFor(() => {
      expect(screen.getByText('Select a singer to view their profile and statistics')).toBeInTheDocument();
    });
  });
});
