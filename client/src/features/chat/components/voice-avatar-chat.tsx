import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Bot, 
  User, 
  Play,
  Pause,
  Settings
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  audioUrl?: string;
  avatarResponse?: any;
}

interface VoiceAvatarChatProps {
  sessionId: string;
  language: string;
  userId?: number;
  avatarId?: string;
}

export default function VoiceAvatarChat({ 
  sessionId, 
  language = "en", 
  userId,
  avatarId = "heygen_avatar_nurse_default"
}: VoiceAvatarChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `Hello! I'm your AI health assistant. You can speak to me or type your questions. How can I help you today?`,
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [voiceLevel, setVoiceLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice-to-text mutation
  const speechToTextMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('language', language);
      
      const response = await apiRequest("POST", "/api/speech-to-text", formData);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.text) {
        handleSendMessage(data.text, true);
      }
    },
    onError: (error) => {
      console.error("Speech-to-text failed:", error);
    },
  });

  // Send message and get avatar response
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, isVoice }: { message: string; isVoice: boolean }) => {
      const response = await apiRequest("POST", "/api/avatar-chat", {
        message,
        sessionId,
        language,
        userId,
        avatarId,
        isVoice,
        speakerType: "nurse" // Start with nurse avatar
      });
      return response.json();
    },
    onSuccess: (data) => {
      const botMessage: Message = {
        id: Date.now().toString(),
        text: data.response,
        sender: "bot",
        timestamp: new Date(),
        audioUrl: data.audioUrl,
        avatarResponse: data.avatarResponse
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Auto-play audio response if available
      if (data.audioUrl && !isMuted) {
        playAudio(data.audioUrl);
      }
    },
    onError: (error) => {
      console.error("Chat failed:", error);
    },
  });

  // Initialize audio context for voice level visualization
  const initializeAudio = async () => {
    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    } catch (error) {
      console.error("Audio context initialization failed:", error);
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      // Check for microphone permissions
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone not supported in this browser');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      streamRef.current = stream;
      
      // Setup voice level monitoring
      if (audioContextRef.current && analyserRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        monitorVoiceLevel();
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/wav' 
        });
        speechToTextMutation.mutate(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Recording failed:", error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Microphone access denied. Please allow microphone access and try again.');
        } else if (error.name === 'NotFoundError') {
          alert('No microphone found. Please check your microphone connection.');
        } else {
          alert('Error accessing microphone: ' + error.message);
        }
      } else {
        alert('Error accessing microphone');
      }
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
    setVoiceLevel(0);
  };

  // Monitor voice level for visual feedback
  const monitorVoiceLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current || !isRecording) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setVoiceLevel(Math.min(100, (average / 128) * 100));
      
      if (isRecording) {
        requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  };

  // Play audio response
  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    setCurrentlyPlaying(audioUrl);
    
    audio.onplay = () => setCurrentlyPlaying(audioUrl);
    audio.onended = () => setCurrentlyPlaying(null);
    audio.onerror = () => setCurrentlyPlaying(null);
    
    audio.play().catch(console.error);
  };

  // Handle sending text or voice message
  const handleSendMessage = (message: string, isVoice: boolean = false) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setTextInput("");

    sendMessageMutation.mutate({ message, isVoice });
  };

  // Initialize audio context on component mount
  useEffect(() => {
    initializeAudio();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-600" />
            <span>AI Health Assistant</span>
            <Badge variant="secondary" className="text-xs">
              {language.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Badge variant="outline" className="text-xs">
              HeyGen Avatar
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Avatar Video Display */}
        <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg p-4 h-48 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <p className="text-sm text-gray-600">AI Avatar Ready</p>
            <p className="text-xs text-gray-500 mt-1">HeyGen Interactive Avatar</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.sender === "bot" && (
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-purple-600" />
                </div>
              )}
              
              <div className={`max-w-[80%] ${message.sender === "user" ? "order-1" : ""}`}>
                <div
                  className={`p-3 rounded-lg ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  {message.audioUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-6 px-2"
                      onClick={() => playAudio(message.audioUrl!)}
                      disabled={currentlyPlaying === message.audioUrl}
                    >
                      {currentlyPlaying === message.audioUrl ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                      <span className="ml-1 text-xs">Play</span>
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {message.sender === "user" && (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Level Indicator */}
        {isRecording && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="animate-pulse text-red-600">
                <Mic className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-red-600 mb-1">Recording...</div>
                <div className="w-full bg-red-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${voiceLevel}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage(textInput)}
              placeholder="Type your message or use voice..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              onClick={() => handleSendMessage(textInput)}
              disabled={!textInput.trim() || sendMessageMutation.isPending}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            className="px-3"
            disabled={speechToTextMutation.isPending}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>

        {sendMessageMutation.isPending && (
          <div className="text-center text-sm text-gray-500">
            AI is thinking...
          </div>
        )}
      </CardContent>
    </Card>
  );
}