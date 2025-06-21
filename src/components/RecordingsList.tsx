import React, { useState, useEffect } from 'react';
import { Play, Trash2, Download, FileText, Search, Calendar, Clock } from 'lucide-react';
import { Recording } from '../types/Recording';
import { getStoredRecordings, deleteRecording, formatDuration, formatFileSize } from '../utils/storage';
import { clearAllRecordings } from '../utils/storage';

interface RecordingsListProps {
  onPlayRecording: (recording: Recording) => void;
  refreshTrigger: number;
}

const handleClearAll = async () => {
  if (window.confirm('本当に全ての録音データを削除しますか？')) {
    await clearAllRecordings();
    window.location.reload();
  }
};

export const RecordingsList: React.FC<RecordingsListProps> = ({
  onPlayRecording,
  refreshTrigger,
}) => {
  const [recordings, setRecordings] = useState<Omit<Recording, 'audioBlob'>[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'title'>('date');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecordings();
  }, [refreshTrigger]);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const storedRecordings = getStoredRecordings();
      setRecordings(storedRecordings);
    } catch (error) {
      console.error('Failed to load recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this recording?')) {
      try {
        await deleteRecording(id);
        setRecordings(prev => prev.filter(r => r.id !== id));
      } catch (error) {
        console.error('Failed to delete recording:', error);
        alert('Failed to delete recording');
      }
    }
  };

  const handleExportText = (recording: Omit<Recording, 'audioBlob'>) => {
    const blob = new Blob([recording.transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredAndSortedRecordings = recordings
    .filter(recording => 
      recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.transcription.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'duration':
          return b.duration - a.duration;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Your Recordings</h3>
        <span className="text-sm text-gray-400">
          {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search recordings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'duration' | 'title')}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="date">Sort by Date</option>
          <option value="duration">Sort by Duration</option>
          <option value="title">Sort by Title</option>
        </select>
      </div>

      {/* Recordings List */}
      {filteredAndSortedRecordings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            {searchTerm ? 'No recordings match your search' : 'No recordings yet'}
          </div>
          <div className="text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Start recording to see your audio files here'}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedRecordings.map((recording) => (
            <div
              key={recording.id}
              className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate mb-2">
                    {recording.title}
                  </h4>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{new Date(recording.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{formatDuration(recording.duration)}</span>
                    </div>
                    <span>{formatFileSize(recording.size)}</span>
                  </div>

                  {recording.transcription && (
                    <p className="text-gray-300 text-sm line-clamp-2 mb-3">
                      {recording.transcription}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onPlayRecording(recording as Recording)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title="Play recording"
                  >
                    <Play size={16} />
                  </button>
                  
                  {recording.transcription && (
                    <button
                      onClick={() => handleExportText(recording)}
                      className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      title="Export transcription"
                    >
                      <FileText size={16} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = recording.audioUrl;
                      a.download = `${recording.title}.webm`;
                      a.click();
                    }}
                    className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    title="Download audio"
                  >
                    <Download size={16} />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(recording.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    title="Delete recording"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mb-4 flex justify-end">
          <button
            onClick={handleClearAll}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
          >
            全録音データ削除
          </button>
        </div>
    </div>
  );
};