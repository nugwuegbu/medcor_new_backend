import { useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimpleVoiceButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function SimpleVoiceButton({ onTranscript, disabled = false }: SimpleVoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        setIsProcessing(true);
        
        // Create audio blob
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          
          if (base64Audio) {
            try {
              // Send to backend
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
                onTranscript(data.text);
              }
            } catch (error) {
              console.error('Error processing audio:', error);
            }
          }
          
          setIsProcessing(false);
          setIsRecording(false);
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        };
        
        reader.readAsDataURL(audioBlob);
      };
      
      // Start recording
      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Please allow microphone access to use voice input');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  };

  const handleClick = () => {
    if (disabled || isProcessing) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={`
        relative p-2 rounded-full transition-all duration-200
        ${isRecording 
          ? "bg-red-500 hover:bg-red-600 text-white scale-110 shadow-lg animate-pulse" 
          : isProcessing
          ? "bg-purple-500 hover:bg-purple-600 text-white"
          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }
      `}
      variant="ghost"
    >
      {isProcessing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
      
      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute inset-0 rounded-full">
          <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75" />
        </div>
      )}
    </Button>
  );
}