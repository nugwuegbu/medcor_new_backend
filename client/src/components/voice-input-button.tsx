import { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { audioProcessor, AudioVisualizationData } from "@/services/audio-processor";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceInputButton({ 
  onTranscript, 
  onError, 
  disabled = false,
  className 
}: VoiceInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 3;
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(finalTranscript.trim());
          // Auto-stop after final transcript
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            stopRecording();
          }, 1500);
        } else if (interimTranscript) {
          setTranscript(interimTranscript);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        // Fall back to audio recording
        if (event.error === 'not-allowed' || event.error === 'no-speech') {
          useAudioRecording();
        }
      };
      
      recognition.onend = () => {
        if (isRecording) {
          // Restart recognition if still recording
          try {
            recognition.start();
          } catch (e) {
            console.log('Recognition restart failed');
          }
        }
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Set up audio visualization
  useEffect(() => {
    if (isRecording) {
      audioProcessor.setVisualizationCallback((data: AudioVisualizationData) => {
        setAudioLevel(data.volume);
        drawVisualization(data);
      });
    }
  }, [isRecording]);

  const drawVisualization = (data: AudioVisualizationData) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw waveform
    ctx.beginPath();
    ctx.strokeStyle = data.isClipping ? '#ef4444' : '#8b5cf6';
    ctx.lineWidth = 2;
    
    const sliceWidth = width / data.waveform.length;
    let x = 0;
    
    for (let i = 0; i < data.waveform.length; i++) {
      const v = data.waveform[i] / 255.0;
      const y = v * height;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setTranscript("");
      setIsProcessing(false);
      
      // Try native speech recognition first
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          // Also start audio processor for visualization
          await audioProcessor.initialize();
          await audioProcessor.startRecording();
          return;
        } catch (e) {
          console.log('Native recognition failed, using audio recording');
        }
      }
      
      // Fallback to audio recording
      await useAudioRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      if (onError) onError(error as Error);
    }
  };

  const useAudioRecording = async () => {
    try {
      await audioProcessor.initialize();
      await audioProcessor.startRecording();
      
      // Auto-stop after 10 seconds
      timeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 10000);
    } catch (error) {
      console.error('Audio recording failed:', error);
      throw error;
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    
    setIsRecording(false);
    setIsProcessing(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    try {
      // Stop native recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      // If we have a transcript from native recognition, use it
      if (transcript) {
        onTranscript(transcript);
        setIsProcessing(false);
        audioProcessor.destroy();
        return;
      }
      
      // Otherwise, process the audio recording
      if (audioProcessor.isActive()) {
        const audioBlob = await audioProcessor.stopRecording();
        const base64Audio = await audioProcessor.convertBlobToBase64(audioBlob);
        
        // Send to backend for transcription
        const response = await fetch('/api/speech-to-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            audio: base64Audio,
            sessionId: `voice_${Date.now()}`
          })
        });
        
        const data = await response.json();
        if (data.text) {
          setTranscript(data.text);
          onTranscript(data.text);
        }
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      if (onError) onError(error as Error);
    } finally {
      setIsProcessing(false);
      audioProcessor.destroy();
    }
  };

  const handleClick = () => {
    if (disabled || isProcessing) return;
    
    if (isRecording) {
      // Stop recording
      stopRecording();
    } else {
      // Start recording
      startRecording();
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <Button
        size="sm"
        onClick={handleClick}
        className={cn(
          "relative p-2 rounded-full transition-all duration-200",
          isRecording 
            ? "bg-red-500 hover:bg-red-600 text-white scale-110 shadow-lg" 
            : isProcessing
            ? "bg-purple-500 hover:bg-purple-600 text-white animate-pulse"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        variant="ghost"
        disabled={disabled || isProcessing}
      >
        {isRecording ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
        
        {/* Audio level indicator */}
        {isRecording && (
          <div 
            className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping"
            style={{
              transform: `scale(${1 + audioLevel * 0.5})`,
              animationDuration: `${1 - audioLevel * 0.5}s`
            }}
          />
        )}
      </Button>
      
      {/* Waveform visualization */}
      {isRecording && (
        <canvas
          ref={canvasRef}
          width={100}
          height={40}
          className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white rounded shadow-lg p-1"
        />
      )}
      
      {/* Transcript preview */}
      {transcript && isRecording && (
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 text-xs whitespace-nowrap max-w-xs">
          {transcript}
        </div>
      )}
      
      {/* Processing indicator */}
      {isProcessing && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-purple-600 whitespace-nowrap">
          Processing...
        </div>
      )}
    </div>
  );
}