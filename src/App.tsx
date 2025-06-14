import React, { useState, useEffect } from 'react';
import { Mic, AlertCircle } from 'lucide-react';
import { Recording } from './types/Recording';
import { RecordingControls } from './components/RecordingControls';
import { TranscriptionDisplay } from './components/TranscriptionDisplay';
import { RecordingsList } from './components/RecordingsList';
import { PlaybackModal } from './components/PlaybackModal';
import { useAudioRecording } from './hooks/useAudioRecording';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { saveRecording, getRecordingWithAudio } from './utils/storage';

function App() {
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [isPlaybackModalOpen, setIsPlaybackModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { recordingState, startRecording, pauseRecording, stopRecording } = useAudioRecording();
  const { transcriptionState, startListening, stopListening, isSupported } = useSpeechRecognition();

  // Start/stop transcription with recording
  useEffect(() => {
    if (recordingState.isRecording && !recordingState.isPaused) {
      startListening();
    } else {
      stopListening();
    }
  }, [recordingState.isRecording, recordingState.isPaused, startListening, stopListening]);

  const handleStartRecording = async () => {
    try {
      setError(null);
      await startRecording();
    } catch (error) {
      setError(error instanceof Error ? error.message : '録音の開始に失敗しました');
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsSaving(true);
      const audioBlob = await stopRecording();
      
      // Generate title based on transcription or timestamp
      const title = transcriptionState.transcript 
        ? transcriptionState.transcript.slice(0, 50) + '...'
        : `録音 ${new Date().toLocaleString('ja-JP')}`;

      const recording: Recording = {
        id: Date.now().toString(),
        title: title.trim(),
        audioBlob,
        audioUrl: URL.createObjectURL(audioBlob),
        transcription: transcriptionState.transcript.trim(),
        duration: recordingState.duration,
        createdAt: new Date(),
        size: audioBlob.size,
      };

      await saveRecording(recording);
      setRefreshTrigger(prev => prev + 1);
      
      // Clear transcription for next recording
      // Note: We don't clear here as the hook handles it
    } catch (error) {
      setError(error instanceof Error ? error.message : '録音の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlayRecording = async (recording: Recording) => {
    try {
      // If the recording doesn't have audioBlob, load it from storage
      let fullRecording = recording;
      if (!recording.audioBlob) {
        const loaded = await getRecordingWithAudio(recording.id);
        if (!loaded) {
          setError('録音データの読み込みに失敗しました');
          return;
        }
        fullRecording = loaded;
      }
      
      setSelectedRecording(fullRecording);
      setIsPlaybackModalOpen(true);
    } catch (error) {
      setError('録音の読み込みに失敗しました');
    }
  };

  const closePlaybackModal = () => {
    setIsPlaybackModalOpen(false);
    setSelectedRecording(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2220%22 cy=%2220%22 r=%222%22/%3E%3Ccircle cx=%2240%22 cy=%2240%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Mic className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-bold text-white">ボイスレコーダー</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            リアルタイム文字起こし機能付きの音声録音アプリ。
            音声を録音し、文字起こしして、整理して管理できます。
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-red-900/50 border border-red-700 rounded-xl p-4 flex items-center space-x-3">
              <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
              <div>
                <p className="text-red-200 font-medium">エラー</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Recording Interface */}
          <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recording Controls */}
              <div className="flex flex-col items-center justify-center">
                <RecordingControls
                  recordingState={recordingState}
                  onStartRecording={handleStartRecording}
                  onPauseRecording={pauseRecording}
                  onStopRecording={handleStopRecording}
                  disabled={isSaving}
                />
                
                {isSaving && (
                  <div className="mt-4 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-300 text-sm">録音を保存中...</p>
                  </div>
                )}
              </div>

              {/* Live Transcription */}
              <div>
                <TranscriptionDisplay
                  transcriptionState={transcriptionState}
                  isRecording={recordingState.isRecording}
                  isSupported={isSupported}
                />
              </div>
            </div>
          </div>

          {/* Recordings List */}
          <RecordingsList
            onPlayRecording={handlePlayRecording}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Playback Modal */}
        {isPlaybackModalOpen && (
          <PlaybackModal
            recording={selectedRecording}
            onClose={closePlaybackModal}
          />
        )}
      </div>

      {/* Custom Styles for Range Inputs */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default App;