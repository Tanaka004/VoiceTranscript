import React from 'react';
import { Mic, Square, Pause, Play } from 'lucide-react';
import { RecordingState } from '../types/Recording';

interface RecordingControlsProps {
  recordingState: RecordingState;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  recordingState,
  onStartRecording,
  onPauseRecording,
  onStopRecording,
  disabled = false,
}) => {
  const { isRecording, isPaused, duration, audioLevel } = recordingState;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Audio Level Visualizer */}
      {isRecording && (
        <div className="flex items-center space-x-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 bg-gradient-to-t transition-all duration-75 ${
                audioLevel * 20 > i
                  ? 'from-green-400 to-green-600'
                  : 'from-gray-300 to-gray-400'
              }`}
              style={{
                height: `${Math.max(4, audioLevel * 20 > i ? (i + 1) * 2 + 8 : 4)}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Timer */}
      <div className="text-3xl font-mono font-bold text-white">
        {formatTime(duration)}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-4">
        {!isRecording ? (
          <button
            onClick={onStartRecording}
            disabled={disabled}
            className="flex items-center justify-center w-16 h-16 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            <Mic size={24} />
          </button>
        ) : (
          <>
            <button
              onClick={onPauseRecording}
              className="flex items-center justify-center w-12 h-12 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>

            <button
              onClick={onStopRecording}
              className="flex items-center justify-center w-16 h-16 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <Square size={24} />
            </button>
          </>
        )}
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isPaused ? 'bg-yellow-400' : 'bg-red-400 animate-pulse'
          }`} />
          <span className="text-white font-medium">
            {isPaused ? '一時停止中' : '録音中...'}
          </span>
        </div>
      )}
    </div>
  );
};