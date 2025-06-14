import { useState, useEffect, useRef, useCallback } from 'react';
import { TranscriptionState } from '../types/Recording';

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

  const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  const initRecognition = useCallback(() => {
    if (!isSupported) return null;

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
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0;

        if (result.isFinal) {
          finalTranscript += transcript + ' ';
          maxConfidence = Math.max(maxConfidence, confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscriptionState(prev => ({
        ...prev,
        transcript: prev.transcript + finalTranscript,
        interimTranscript,
        confidence: maxConfidence || prev.confidence,
      }));
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Handle specific error cases
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone access and try again.');
      } else if (event.error === 'no-speech') {
        // Automatically restart on no-speech error if not manually stopped
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
        interimTranscript: '',
      }));

      // Automatically restart if not manually stopped
      if (!isManualStop.current && transcriptionState.isListening) {
        setTimeout(() => {
          if (recognitionRef.current && !isManualStop.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error('Failed to restart recognition:', error);
            }
          }
        }, 100);
      }
    };

    return recognition;
  }, [isSupported, transcriptionState.isListening]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      console.warn('Speech recognition not supported');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = initRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      isManualStop.current = false;
      
      setTranscriptionState(prev => ({
        ...prev,
        transcript: '',
        interimTranscript: '',
        confidence: 0,
      }));

      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
    }
  }, [isSupported, initRecognition]);

  const stopListening = useCallback(() => {
    isManualStop.current = true;
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    transcriptionState,
    startListening,
    stopListening,
    clearTranscript,
    isSupported,
  };
};