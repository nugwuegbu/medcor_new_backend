import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, X, MessageSquare } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import HeyGenAvatar from "./heygen-avatar";
import HeyGenWebRTCAvatar from "./heygen-webrtc-avatar";
import HeyGenSDKAvatar from "./heygen-sdk-avatar";
import AppointmentCalendar from "./appointment-calendar";
import ChatDoctorList from "./chat-doctor-list";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  avatarResponse?: any;
  showDoctors?: boolean;
}

interface AvatarChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AvatarChatWidget({ isOpen, onClose }: AvatarChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [currentSpeechText, setCurrentSpeechText] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Voice chat mutation
  const voiceChatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch("/api/chat/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          sessionId,
          language: "en"
        })
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const botMessage: Message = {
        id: `bot_${Date.now()}`,
        text: data.message,
        sender: "bot",
        timestamp: new Date(),
        avatarResponse: data.avatarResponse,
        showDoctors: data.showDoctors
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Make the HeyGen avatar speak the response
      if ((window as any).heygenSpeak) {
        (window as any).heygenSpeak(data.message);
      }
    }
  });

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      text: text.trim(),
      sender: "user", 
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    
    voiceChatMutation.mutate(text.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Convert audio to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          
          if (base64Audio) {
            try {
              // Send to backend for speech-to-text
              const response = await fetch('/api/speech-to-text', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ audio: base64Audio })
              });
              
              const data = await response.json();
              const transcription = data.text || "Sorry, I couldn't understand that";
              
              setCurrentSpeechText(transcription);
              handleSendMessage(transcription);
            } catch (error) {
              console.error("Speech-to-text error:", error);
              setCurrentSpeechText("Error processing speech");
            }
          }
        };
        
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setCurrentSpeechText("Listening...");
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-gray-600" />
          <span className="text-gray-700 font-medium">AI Assistant</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-purple-600 font-bold text-lg">medcor</span>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Full Screen Avatar Background with Message Overlay */}
      <div className="flex-1 relative">
        {/* Avatar Background - Always Visible */}
        <div className="absolute inset-0">
          <HeyGenSDKAvatar 
            apiKey="Mzk0YThhNTk4OWRiNGU4OGFlZDZiYzliYzkwOTBjOGQtMTcyNjczNDQ0Mg=="
            isVisible={true}
            onMessage={(text) => {
              console.log("Avatar message:", text);
            }}
          />
        </div>
        
        {/* Messages Overlay */}
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 pt-20 pb-2 space-y-3">
            {messages.length === 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 max-w-[85%] mx-auto mt-8">
                <p className="text-gray-800 font-medium">Hello! How can I assist you today?</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] ${message.sender === "user" ? "mr-2" : "ml-2"}`}>
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.sender === "user"
                        ? "bg-white text-gray-800"
                        : "bg-white/90 backdrop-blur-sm text-gray-800"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  </div>
                  {message.showDoctors && message.sender === "bot" && (
                    <div className="mt-2">
                      <ChatDoctorList onSelectDoctor={(doctor) => {
                        handleSendMessage(`I want to book an appointment with Dr. ${doctor.name}`);
                      }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Send your message..."
            className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-500"
            disabled={voiceChatMutation.isPending}
          />
          
          <Button
            size="sm"
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || voiceChatMutation.isPending}
            className="p-2 text-purple-600 hover:bg-purple-100 rounded-full transition-colors"
            variant="ghost"
          >
            <Send className="h-5 w-5" />
          </Button>
          
          <Button
            size="sm"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            className={`p-2 rounded-full transition-colors ${
              isRecording 
                ? "text-red-600 bg-red-100" 
                : "text-gray-600 hover:bg-gray-200"
            }`}
            variant="ghost"
            disabled={voiceChatMutation.isPending}
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>
        
        {isRecording && (
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Recording...
          </div>
        )}
      </div>

      {/* Appointment Calendar Modal */}
      <AppointmentCalendar
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        onAppointmentBooked={(appointment) => {
          const confirmationMessage: Message = {
            id: Date.now().toString(),
            text: `Great! Your appointment has been confirmed for ${appointment.appointmentDate} at ${appointment.appointmentTime}. You will receive email and WhatsApp confirmations shortly.`,
            sender: "bot",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, confirmationMessage]);
          setShowCalendar(false);
        }}
      />
    </div>
  );
}