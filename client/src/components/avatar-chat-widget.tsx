import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, X, MessageSquare } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import HeyGenAvatar from "./heygen-avatar";
import HeyGenWebRTCAvatar from "./heygen-webrtc-avatar";
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
        
        // For demo purposes, convert to text placeholder
        const mockTranscription = "Hello, I would like to schedule an appointment";
        setCurrentSpeechText(mockTranscription);
        
        // Check if it's an appointment request
        if (mockTranscription.toLowerCase().includes("appointment") || mockTranscription.toLowerCase().includes("book")) {
          setShowCalendar(true);
        }
        
        handleSendMessage(mockTranscription);
        
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
    <div className="fixed bottom-4 right-4 w-80 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <MessageSquare className="h-3 w-3 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Medcor AI</h3>
            <p className="text-xs text-gray-500">Health Assistant</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* HeyGen Avatar Section - Slimmer */}
      <div className="h-36 border-b border-gray-100">
        {messages[messages.length - 1]?.avatarResponse?.sessionData ? (
          <HeyGenWebRTCAvatar 
            sessionData={messages[messages.length - 1]?.avatarResponse?.sessionData}
            isLoading={voiceChatMutation.isPending}
          />
        ) : (
          <HeyGenAvatar 
            avatarResponse={messages[messages.length - 1]?.avatarResponse}
            isLoading={voiceChatMutation.isPending}
            userSpeechText={currentSpeechText}
            isUserSpeaking={isRecording}
          />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            <p className="text-xs">Start your conversation</p>
            <p className="text-xs text-gray-400 mt-1">Ask about appointments or health questions</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[85%]">
              <div
                className={`p-2 rounded-lg ${
                  message.sender === "user"
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <p className="text-xs leading-relaxed">{message.text}</p>
                <p className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
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

      {/* Input Section */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about health or appointments..."
              className="w-full px-3 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs bg-gray-50"
              disabled={voiceChatMutation.isPending}
            />
          </div>
          
          <Button
            size="sm"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            className={`w-8 h-8 p-0 rounded-full ${
              isRecording 
                ? "bg-red-500 hover:bg-red-600" 
                : "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            }`}
            disabled={voiceChatMutation.isPending}
          >
            {isRecording ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
          </Button>
          
          <Button
            size="sm"
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || voiceChatMutation.isPending}
            className="w-8 h-8 p-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
        
        {isRecording && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
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