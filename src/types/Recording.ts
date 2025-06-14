export interface Recording {
  id: string;
  title: string;
  audioBlob: Blob;
  audioUrl: string;
  transcription: string;
  duration: number;
  createdAt: Date;
  size: number;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
}

export interface TranscriptionState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
}