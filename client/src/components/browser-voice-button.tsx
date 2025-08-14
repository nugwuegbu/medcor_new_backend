import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BrowserVoiceButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// Extend Window interface for speech recognition
interface IWindow extends Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

export default function BrowserVoiceButton({ onTranscript, disabled = false }: BrowserVoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const isStartingRef = useRef(false);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as IWindow).SpeechRecognition || (window as IWindow).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      console.error("Speech recognition not supported in this browser");
      return;
    }

    // Create recognition instance
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening continuously
    recognition.interimResults = true; // Show results while speaking
    recognition.lang = 'en-US'; // Set language
    recognition.maxAlternatives = 1;

    // Handle results
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Update transcript display
      setTranscript(interimTranscript || finalTranscript);

      // If we have a final result, send it
      if (finalTranscript) {
        console.log("Final transcript:", finalTranscript);
        // onTranscript will handle trigger word detection
        onTranscript(finalTranscript);
        // Don't stop recording - let user click button again to stop
      }
    };

    // Handle errors
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'no-speech') {
        console.log("No speech detected - continuing to listen");
        // Restart recognition to continue listening
        setTimeout(() => {
          if (!isStartingRef.current) {
            isStartingRef.current = true;
            try {
              recognition.start();
            } catch (e) {
              console.log("Recognition already started");
            } finally {
              isStartingRef.current = false;
            }
          }
        }, 100);
      } else if (event.error === 'not-allowed') {
        alert("Please allow microphone access to use voice input");
        setIsRecording(false);
      } else if (event.error === 'aborted') {
        console.error("Speech recognition error:", event.error);
        // Restart if aborted (common when user pauses)
        if (isRecording) {
          setTimeout(() => {
            if (!isStartingRef.current) {
              isStartingRef.current = true;
              try {
                recognition.start();
              } catch (e) {
                console.log("Recognition already started");
              } finally {
                isStartingRef.current = false;
              }
            }
          }, 100);
        }
      } else {
        setIsRecording(false);
      }
    };

    // Handle end
    recognition.onend = () => {
      console.log("Recognition ended");
      // Restart if still recording (browser might auto-stop after silence)
      if (isRecording) {
        console.log("Restarting recognition to continue listening");
        setTimeout(() => {
          if (recognitionRef.current && isRecording && !isStartingRef.current) {
            isStartingRef.current = true;
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.log("Recognition already started");
            } finally {
              isStartingRef.current = false;
            }
          }
        }, 100);
      }
    };

    // Handle start
    recognition.onstart = () => {
      console.log("Recognition started");
      isStartingRef.current = false; // Reset flag when started successfully
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript]);

  const toggleRecording = () => {
    if (!isSupported) {
      alert("Speech recognition is not supported in your browser. Please use Chrome or Safari.");
      return;
    }

    if (!recognitionRef.current) return;

    if (isRecording) {
      // Stop recording
      recognitionRef.current.stop();
      setIsRecording(false);
      setTranscript("");
    } else {
      // Start recording
      setTranscript("");
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <Button
        size="sm"
        onClick={toggleRecording}
        disabled={disabled || !isSupported}
        className={`
          relative p-2 rounded-full transition-all duration-200
          ${isRecording 
            ? "bg-red-500 hover:bg-red-600 text-white scale-110 shadow-lg" 
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }
          ${!isSupported ? "opacity-50 cursor-not-allowed" : ""}
        `}
        variant="ghost"
        title={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute inset-0 rounded-full">
            <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75" />
            <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-50" />
          </div>
        )}
      </Button>

      {/* Live transcript display */}
      {isRecording && transcript && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 text-xs whitespace-nowrap max-w-xs z-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {transcript}
          </div>
        </div>
      )}
    </div>
  );
}