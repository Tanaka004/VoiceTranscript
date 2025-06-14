import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { TranscriptionState } from '../types/Recording';

interface TranscriptionDisplayProps {
  transcriptionState: TranscriptionState;
  isRecording: boolean;
  isSupported: boolean;
}

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  transcriptionState,
  isRecording,
  isSupported,
}) => {
  const { isListening, transcript, interimTranscript, confidence } = transcriptionState;

  if (!isSupported) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <VolumeX className="text-gray-400" size={20} />
          <h3 className="text-lg font-semibold text-white">Speech Recognition</h3>
        </div>
        <p className="text-gray-400">
          Speech recognition is not supported in this browser. Try using Chrome or Edge for the best experience.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 min-h-[200px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Volume2 className={`${isListening ? 'text-green-400' : 'text-gray-400'}`} size={20} />
          <h3 className="text-lg font-semibold text-white">Live Transcription</h3>
        </div>
        
        {isRecording && (
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isListening ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-sm text-gray-300">
              {isListening ? 'Listening' : 'Standby'}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Final transcript */}
        {transcript && (
          <div className="text-white leading-relaxed">
            {transcript}
          </div>
        )}

        {/* Interim transcript */}
        {interimTranscript && (
          <div className="text-gray-400 italic leading-relaxed">
            {interimTranscript}
          </div>
        )}

        {/* Placeholder when no transcript */}
        {!transcript && !interimTranscript && (
          <div className="text-gray-500 italic">
            {isRecording 
              ? "Start speaking to see live transcription..." 
              : "Transcription will appear here during recording"
            }
          </div>
        )}
      </div>

      {/* Confidence indicator */}
      {confidence > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Confidence</span>
            <span className="text-white">{Math.round(confidence * 100)}%</span>
          </div>
          <div className="mt-1 w-full bg-gray-700 rounded-full h-1">
            <div 
              className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};