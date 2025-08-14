import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';

import DraggableQueueItem from './DraggableQueueItem';

interface Song {
  id: string;
  artist: string;
  title: string;
  fileName: string;
}

interface QueueEntry {
  song: Song;
  singerName: string;
  source?: 'local' | 'youtube';
  download?: { status?: string; progress?: number; videoId?: string; fileName?: string };
}

interface DraggableQueueProps {
  queue: QueueEntry[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onPlay: (songId: string, singerName: string) => void;
  onRemove: (songId: string) => void;
  onRetryYouTube?: (entry: QueueEntry) => void;
  className?: string;
}

const DraggableQueue: React.FC<DraggableQueueProps> = ({
  queue,
  onReorder,
  onPlay,
  onRemove,
  onRetryYouTube,
  className = '',
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = queue.findIndex((item) => item.song.id === active.id);
      const newIndex = queue.findIndex((item) => item.song.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  if (queue.length === 0) {
    return (
      <div className={`${className} text-center py-12`}>
        <div className="text-gray-400 dark:text-gray-500">
          <svg
            className="mx-auto h-12 w-12 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zM9 10l12-3"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Queue is empty
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Songs will appear here when singers make requests
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Song Queue ({queue.length})
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Drag to reorder
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext
          items={queue.map((item) => item.song.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {queue.map((entry, index) => (
              <DraggableQueueItem
                key={entry.song.id}
                entry={entry}
                index={index}
                onPlay={onPlay}
                onRemove={onRemove}
                onRetryYouTube={onRetryYouTube}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default DraggableQueue;
