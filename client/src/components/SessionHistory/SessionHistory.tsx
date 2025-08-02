import React from 'react';
import { useAppStore } from '../../store/appStore';
import { 
  ClockIcon, 
  PlayIcon, 
  UserIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline';

const SessionHistory: React.FC = () => {
  const { 
    sessionHistory, 
    sessionState, 
    showHistory, 
    setShowHistory, 
    replaySong 
  } = useAppStore();

  if (!showHistory) {
    return null;
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (playedAt: number, completedAt?: number) => {
    if (!completedAt) return 'In Progress';
    const duration = Math.floor((completedAt - playedAt) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleReplay = (songId: string, singerName: string) => {
    replaySong(songId, singerName);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Session History</h2>
              <div className="flex items-center space-x-4 text-blue-100">
                <div className="flex items-center space-x-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>Started: {sessionState ? formatTime(sessionState.startedAt) : 'Unknown'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MusicalNoteIcon className="w-4 h-4" />
                  <span>{sessionHistory.length} songs played</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="text-white hover:text-red-200 transition-colors text-3xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          {sessionHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <MusicalNoteIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Songs Played Yet</h3>
              <p>Songs will appear here as they are performed during this session.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessionHistory
                .slice()
                .reverse()
                .map((entry, index) => (
                  <div
                    key={`${entry.song.id}-${entry.playedAt}`}
                    className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-sm font-bold">
                            #{sessionHistory.length - index}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              {entry.song.artist} - {entry.song.title}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <UserIcon className="w-4 h-4" />
                                <span>{entry.singerName}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <ClockIcon className="w-4 h-4" />
                                <span>{formatTime(entry.playedAt)}</span>
                              </div>
                              <span>Duration: {formatDuration(entry.playedAt, entry.completedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleReplay(entry.song.id, entry.singerName)}
                          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                          title="Replay this song"
                        >
                          <PlayIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">Replay</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-slate-700 px-6 py-4 border-t border-gray-200 dark:border-slate-600">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Session started {sessionState ? formatTime(sessionState.startedAt) : 'Unknown time'}
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionHistory;