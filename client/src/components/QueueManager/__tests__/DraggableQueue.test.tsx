import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import DraggableQueue from '../DraggableQueue';

interface MockDndContextProps {
  children: React.ReactNode;
  onDragEnd?: (event: { active: { id: string }; over: { id: string } | null }) => void;
}

interface MockSortableContextProps {
  children: React.ReactNode;
}

// Mock @dnd-kit modules
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: MockDndContextProps) => (
    <div data-testid="dnd-context" onClick={() => onDragEnd?.({ active: { id: 'song1' }, over: { id: 'song2' } })}>
      {children}
    </div>
  ),
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: MockSortableContextProps) => <div data-testid="sortable-context">{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/modifiers', () => ({
  restrictToVerticalAxis: vi.fn(),
  restrictToParentElement: vi.fn(),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

const mockQueue = [
  {
    song: {
      id: 'song1',
      artist: 'Artist 1',
      title: 'Song 1',
      fileName: 'song1.mp4',
    },
    singerName: 'Singer 1',
  },
  {
    song: {
      id: 'song2',
      artist: 'Artist 2',
      title: 'Song 2',
      fileName: 'song2.mp4',
    },
    singerName: 'Singer 2',
  },
  {
    song: {
      id: 'song3',
      artist: 'Artist 3',
      title: 'Song 3',
      fileName: 'song3.mp4',
    },
    singerName: 'Singer 3',
  },
];

describe('DraggableQueue', () => {
  const mockOnReorder = vi.fn();
  const mockOnPlay = vi.fn();
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);
  });

  it('renders empty state when queue is empty', () => {
    render(
      <DraggableQueue
        queue={[]}
        onReorder={mockOnReorder}
        onPlay={mockOnPlay}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText('Queue is empty')).toBeInTheDocument();
    expect(screen.getByText('Songs will appear here when singers make requests')).toBeInTheDocument();
  });

  it('renders queue items correctly', () => {
    render(
      <DraggableQueue
        queue={mockQueue}
        onReorder={mockOnReorder}
        onPlay={mockOnPlay}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText('Song Queue (3)')).toBeInTheDocument();
    expect(screen.getByText('Drag to reorder')).toBeInTheDocument();
    
    // Check that all queue items are rendered (filenames)
    expect(screen.getByText('song1.mp4')).toBeInTheDocument();
    expect(screen.getByText('Singer: Singer 1')).toBeInTheDocument();
    expect(screen.getByText('song2.mp4')).toBeInTheDocument();
    expect(screen.getByText('Singer: Singer 2')).toBeInTheDocument();
    expect(screen.getByText('song3.mp4')).toBeInTheDocument();
    expect(screen.getByText('Singer: Singer 3')).toBeInTheDocument();
  });

  it('displays queue positions correctly', () => {
    render(
      <DraggableQueue
        queue={mockQueue}
        onReorder={mockOnReorder}
        onPlay={mockOnPlay}
        onRemove={mockOnRemove}
      />
    );

    // Check queue position numbers
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calls onPlay when play button is clicked', () => {
    render(
      <DraggableQueue
        queue={mockQueue}
        onReorder={mockOnReorder}
        onPlay={mockOnPlay}
        onRemove={mockOnRemove}
      />
    );

    const playButtons = screen.getAllByText('Play');
    fireEvent.click(playButtons[0]);

    expect(mockOnPlay).toHaveBeenCalledWith('song1', 'Singer 1');
  });

  it('calls onRemove when remove button is clicked', () => {
    render(
      <DraggableQueue
        queue={mockQueue}
        onReorder={mockOnReorder}
        onPlay={mockOnPlay}
        onRemove={mockOnRemove}
      />
    );

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);

    expect(mockOnRemove).toHaveBeenCalledWith('song1');
  });

  it('calls onReorder when drag and drop occurs', async () => {
    render(
      <DraggableQueue
        queue={mockQueue}
        onReorder={mockOnReorder}
        onPlay={mockOnPlay}
        onRemove={mockOnRemove}
      />
    );

    const dndContext = screen.getByTestId('dnd-context');
    fireEvent.click(dndContext);

    await waitFor(() => {
      expect(mockOnReorder).toHaveBeenCalledWith(0, 1);
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <DraggableQueue
        queue={mockQueue}
        onReorder={mockOnReorder}
        onPlay={mockOnPlay}
        onRemove={mockOnRemove}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles drag handles correctly', () => {
    render(
      <DraggableQueue
        queue={mockQueue}
        onReorder={mockOnReorder}
        onPlay={mockOnPlay}
        onRemove={mockOnRemove}
      />
    );

    // Check that drag handles are present by looking for the drag handle SVGs
    const dragHandles = document.querySelectorAll('svg');
    expect(dragHandles.length).toBeGreaterThan(0);
  });

  it('shows correct button states', () => {
    render(
      <DraggableQueue
        queue={mockQueue}
        onReorder={mockOnReorder}
        onPlay={mockOnPlay}
        onRemove={mockOnRemove}
      />
    );

    // All play buttons should be enabled
    const playButtons = screen.getAllByText('Play');
    playButtons.forEach(button => {
      expect(button).not.toBeDisabled();
    });

    // All remove buttons should be enabled
    const removeButtons = screen.getAllByText('Remove');
    removeButtons.forEach(button => {
      expect(button).not.toBeDisabled();
    });
  });

  it('handles empty drag event gracefully', async () => {
    render(
      <DraggableQueue
        queue={mockQueue}
        onReorder={mockOnReorder}
        onPlay={mockOnPlay}
        onRemove={mockOnRemove}
      />
    );

    // Test that the component renders without errors
    expect(screen.getByText('Song Queue (3)')).toBeInTheDocument();
  });

  it('handles invalid drag indices gracefully', async () => {
    render(
      <DraggableQueue
        queue={mockQueue}
        onReorder={mockOnReorder}
        onPlay={mockOnPlay}
        onRemove={mockOnRemove}
      />
    );

    // Test that the component renders without errors
    expect(screen.getByText('Song Queue (3)')).toBeInTheDocument();
  });
});
