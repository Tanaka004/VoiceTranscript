import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, FileText, Download } from 'lucide-react';
import { Recording } from '../types/Recording';
import { formatDuration } from '../utils/storage';

interface PlaybackModalProps {
  recording: Recording | null;
  onClose: () => void;
}

export const PlaybackModal: React.FC<PlaybackModalProps> = ({
  recording,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (recording && audioRef.current) {
      audioRef.current.src = recording.audioUrl;
      audioRef.current.load();
    }
  }, [recording]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const skipTime = (seconds: number) => {
    if (!audioRef.current) return;
    
    const newTime = Math.max(0, Math.min(audioRef.current.duration, currentTime + seconds));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const exportTranscript = () => {
    if (!recording?.transcription) return;
    
    const blob = new Blob([recording.transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.title}-transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!recording) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">{recording.title}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {new Date(recording.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="text-gray-400" size={20} />
          </button>
        </div>

        {/* Audio Player */}
        <div className="p-6">
          <audio ref={audioRef} />
          
          {/* Progress Bar */}
          <div className="mb-6">
            <input
              type="range"
              min="0"
              max={recording.duration}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-400 mt-2">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(recording.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={() => skipTime(-10)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <SkipBack className="text-white" size={20} />
            </button>
            
            <button
              onClick={togglePlayPause}
              className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            <button
              onClick={() => skipTime(10)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <SkipForward className="text-white" size={20} />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3 mb-6">
            <Volume2 className="text-gray-400" size={16} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-3 mb-6">
            {recording.transcription && (
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <FileText size={16} />
                <span>{showTranscript ? 'Hide' : 'Show'} Transcript</span>
              </button>
            )}
            
            {recording.transcription && (
              <button
                onClick={exportTranscript}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download size={16} />
                <span>Export Text</span>
              </button>
            )}
            
            <button
              onClick={() => {
                const a = document.createElement('a');
                a.href = recording.audioUrl;
                a.download = `${recording.title}.webm`;
                a.click();
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Download size={16} />
              <span>Download Audio</span>
            </button>
          </div>

          {/* Transcript */}
          {showTranscript && recording.transcription && (
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 max-h-40 overflow-y-auto">
              <h4 className="text-white font-medium mb-3">Transcript</h4>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {recording.transcription}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};