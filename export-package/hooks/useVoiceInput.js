import { useState, useEffect, useCallback, useRef } from 'react';

export const useVoiceInput = (options = {}) => {
  const {
    language = 'en-US',
    continuous = false,
    interimResults = false,
    maxAlternatives = 1,
    onResult,
    onError,
    onStart,
    onEnd,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = maxAlternatives;

      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
        onStart?.();
      };

      recognition.onend = () => {
        setIsRecording(false);
        onEnd?.();
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript);
          onResult?.(finalTranscript, 'final');
        } else if (interimTranscript) {
          setTranscript(interimTranscript);
          onResult?.(interimTranscript, 'interim');
        }
      };

      recognition.onerror = (event) => {
        const errorMessage = `Speech recognition error: ${event.error}`;
        setError(errorMessage);
        setIsRecording(false);
        onError?.(event.error);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      setError('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [language, continuous, interimResults, maxAlternatives, onResult, onError, onStart, onEnd]);

  // Start recording
  const startRecording = useCallback(() => {
    if (!isSupported || !recognitionRef.current || isRecording) {
      return false;
    }

    try {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
      
      // Set timeout for continuous mode
      if (continuous) {
        timeoutRef.current = setTimeout(() => {
          stopRecording();
        }, 30000); // 30 seconds max
      }
      
      return true;
    } catch (error) {
      setError('Failed to start speech recognition');
      return false;
    }
  }, [isSupported, isRecording, continuous]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [isRecording]);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  // Check browser support
  const checkSupport = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return !!SpeechRecognition;
  }, []);

  return {
    isRecording,
    isSupported,
    transcript,
    error,
    startRecording,
    stopRecording,
    toggleRecording,
    resetTranscript,
    checkSupport,
  };
};

export default useVoiceInput;