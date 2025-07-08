import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

export const VoiceInputButton = ({ 
  onVoiceInput, 
  onVoiceEnd,
  language = 'en-US',
  continuous = false,
  className = "",
  size = 'md' 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.lang = language;
      recognitionInstance.continuous = continuous;
      recognitionInstance.interimResults = false;
      recognitionInstance.maxAlternatives = 1;

      recognitionInstance.onstart = () => {
        setIsRecording(true);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
        onVoiceEnd?.();
      };

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onVoiceInput?.(transcript);
        setIsRecording(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        onVoiceEnd?.();
      };

      setRecognition(recognitionInstance);
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [language, continuous, onVoiceInput, onVoiceEnd]);

  const startRecording = () => {
    if (recognition && !isRecording) {
      try {
        recognition.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
  };

  const stopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!isSupported) {
    return (
      <button
        disabled
        className={`inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-400 cursor-not-allowed ${
          size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'
        } ${className}`}
        title="Speech recognition not supported"
      >
        <MicOff size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
      </button>
    );
  }

  return (
    <button
      onClick={toggleRecording}
      className={`inline-flex items-center justify-center rounded-full transition-all duration-200 ${
        isRecording 
          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
          : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 hover:text-purple-600'
      } ${
        size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'
      } ${className}`}
      title={isRecording ? 'Stop recording' : 'Start voice input'}
    >
      {isRecording ? (
        <Volume2 size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
      ) : (
        <Mic size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
      )}
    </button>
  );
};

export default VoiceInputButton;