import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Song {
  id: string;
  artist: string;
  title: string;
  fileName: string;
}

interface QueueEntry {
  song: Song;
  singerName: string;
  // Optional metadata for YouTube source
  source?: 'local' | 'youtube';
  download?: {
    status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
    progress?: number;
    videoId?: string;
    downloadId?: string;
    fileName?: string;
  };
}

interface DraggableQueueItemProps {
  entry: QueueEntry;
  index: number;
  onPlay: (songId: string, singerName: string) => void;
  onRemove: (songId: string) => void;
  onRetryYouTube?: (entry: QueueEntry) => void;
}

const DraggableQueueItem: React.FC<DraggableQueueItemProps> = ({
  entry,
  index,
  onPlay,
  onRemove,
  onRetryYouTube,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  const isYouTube = entry.source === 'youtube' || (entry.song.id || '').startsWith('yt_');
  const progress = entry.download?.progress;
  const status = entry.download?.status;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`queue-item-${index}`}
      className={`
        flex items-center justify-between p-4 mb-2 
        bg-white dark:bg-gray-800 rounded-lg shadow-sm border
        ${isDragging ? 'border-blue-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'}
        hover:shadow-md transition-all duration-200
      `}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center cursor-grab active:cursor-grabbing mr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="flex-shrink-0"
        >
          <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
        </svg>
      </div>

      {/* Queue Position */}
      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center text-sm font-semibold mr-4">
        {index + 1}
      </div>

      {/* Song Info */}
      <div className="flex-grow min-w-0">
        <div className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
          {entry.song.fileName}
          {isYouTube && (
            <span title="YouTube" className="inline-flex items-center text-red-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.5 6.2s-.2-1.7-.8-2.5c-.8-.8-1.7-.8-2.1-.9C17.1 2.5 12 2.5 12 2.5h0s-5.1 0-8.6.3c-.5 0-1.4.1-2.1.9-.6.8-.8 2.5-.8 2.5S0 8.2 0 10.2v1.6c0 2 .2 4 0 4s.2 1.7.8 2.5c.8.8 1.9.8 2.4.9 1.8.2 7.7.3 7.7.3s5.1 0 8.6-.3c.5 0 1.4-.1 2.1-.9.6-.8.8-2.5.8-2.5s.2-2 .2-4v-1.6c0-2-.2-4-.2-4zM9.5 13.7V7.9l6.2 2.9-6.2 2.9z" />
              </svg>
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
          Singer: {entry.singerName}
        </div>
        {isYouTube && status && (
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            {status === 'downloading' && (
              <span>Downloading... {typeof progress === 'number' ? `${Math.round(progress)}%` : ''}</span>
            )}
            {status === 'failed' && <span className="text-red-500">Download Failed</span>}
            {status === 'completed' && <span className="text-green-500">Ready</span>}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 ml-4">
        {isYouTube && status === 'failed' && (
          <button
            onClick={() => onRetryYouTube && onRetryYouTube(entry)}
            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-md transition-colors duration-200"
            title="Retry Download"
          >
            Retry
          </button>
        )}
        <button
          onClick={() => onPlay(entry.song.id, entry.singerName)}
          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md transition-colors duration-200 flex items-center space-x-1"
          title="Play Now"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>Play</span>
        </button>
        <button
          onClick={() => onRemove(entry.song.id)}
          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors duration-200 flex items-center space-x-1"
          title="Remove from Queue"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
          <span>Remove</span>
        </button>
      </div>
    </div>
  );
};

export default DraggableQueueItem;
