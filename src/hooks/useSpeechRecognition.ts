import { useState, useEffect, useRef, useCallback } from 'react';
import { TranscriptionState } from '../types/Recording';
import { saveRecording } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';

// Extend the Window interface to include webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export const useSpeechRecognition = () => {
  const [transcriptionState, setTranscriptionState] = useState<TranscriptionState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    confidence: 0,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isManualStop = useRef(false);
  const recId = useRef<string>(uuidv4());

  const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  // 初回のみインスタンス生成＆イベント登録
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setTranscriptionState(prev => ({ ...prev, isListening: true }));
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let confidence = 0;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
          confidence = result[0].confidence;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscriptionState(prev => ({
        ...prev,
        transcript: prev.transcript + finalTranscript,
        interimTranscript,
        confidence: confidence || prev.confidence,
      }));

      // 保存頻度を下げたい場合はdebounce等を検討
      saveRecording({
        id: recId.current,
        title: 'リアルタイム文字起こし',
        createdAt: new Date(),
        duration: 0,
        transcription: finalTranscript || interimTranscript,
        audioBlob: new Blob(),
        audioUrl: '',
        size: 0
      });
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);

      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone access and try again.');
      } else if (event.error === 'no-speech') {
        // 自動再開
        if (!isManualStop.current && transcriptionState.isListening) {
          setTimeout(() => {
            if (recognitionRef.current && !isManualStop.current) {
              try {
                recognitionRef.current.start();
              } catch (error) {
                console.error('Failed to restart recognition:', error);
              }
            }
          }, 1000);
        }
      }
    };

    recognition.onend = () => {
      setTranscriptionState(prev => ({
        ...prev,
        isListening: false,
      }));
      // ★自動再開
      if (!isManualStop.current) {
        setTimeout(() => {
          if (recognitionRef.current && !isManualStop.current) {
            try {
              recognitionRef.current.start();
              setTranscriptionState(prev => ({
                ...prev,
                isListening: true,
              }));
            } catch (error) {
              console.error('Failed to restart recognition:', error);
            }
          }
        }, 100);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      console.warn('Speech recognition not supported');
      return;
    }

    try {
      isManualStop.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    isManualStop.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscriptionState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      confidence: 0,
    }));
  }, []);

  return {
    transcriptionState,
    startListening,
    stopListening,
    clearTranscript,
    isSupported,
  };
};