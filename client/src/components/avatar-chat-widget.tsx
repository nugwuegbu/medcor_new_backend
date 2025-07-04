import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, X, MessageSquare, ChevronLeft } from "lucide-react";
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
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [showChatInterface, setShowChatInterface] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleMessageExpanded = (messageId: string) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMessages(newExpanded);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace) + '...';
  };

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
        {/* Avatar Background - Always Active but Hidden when Chat Interface is shown */}
        <div className={`absolute inset-0 ${showChatInterface ? 'invisible' : 'visible'}`}>
          {isOpen && (
            <HeyGenSDKAvatar 
              key="single-avatar-instance"
              apiKey="Mzk0YThhNTk4OWRiNGU4OGFlZDZiYzliYzkwOTBjOGQtMTcyNjczNDQ0Mg=="
              isVisible={true}
              onMessage={(text) => {
                console.log("Avatar message:", text);
              }}
            />
          )}
        </div>
        
        {/* Chat Interface View - Within Chat Container */}
        {showChatInterface && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm z-40 rounded-lg overflow-hidden">
            {/* Back Button */}
            <button
              onClick={() => setShowChatInterface(false)}
              className="absolute top-4 left-4 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow z-50"
            >
              <ChevronLeft className="h-6 w-6 text-purple-600" />
            </button>
            
            {/* Chat Interface Content */}
            <div className="h-full flex flex-col p-6 pt-16">
              <div className="flex-1 overflow-y-auto space-y-4">
                <h2 className="text-xl font-bold text-center text-gray-800 mb-2">Advanced Chat Mode</h2>
                <p className="text-center text-gray-600 text-sm mb-4">Microphone is still active. Speak or type to continue.</p>
                
                {/* Visual indicator that mic is active */}
                {isRecording && (
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                        <Mic className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-red-400 rounded-full animate-ping"></div>
                    </div>
                  </div>
                )}
                
                {/* Messages Container */}
                <div className="flex-1 space-y-3">
                  {messages.map(message => (
                    <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender === "user" 
                          ? "bg-purple-600 text-white" 
                          : "bg-white shadow-md text-gray-800"
                      }`}>
                        <p className="text-sm">{message.text}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Quick actions at bottom */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button 
                    onClick={() => {
                      const message = "I want to book an appointment";
                      setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        text: message,
                        sender: "user",
                        timestamp: new Date()
                      }]);
                    }}
                    className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    Book Appointment
                  </button>
                  <button 
                    onClick={() => {
                      const message = "Show me available doctors";
                      setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        text: message,
                        sender: "user",
                        timestamp: new Date()
                      }]);
                    }}
                    className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    View Doctors
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Animated Button on Chest Area */}
        <div className={`absolute left-1/2 top-[68%] transform -translate-x-1/2 -translate-y-1/2 z-30 ${showChatInterface ? 'hidden' : ''}`}>
          <button
            className="relative w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-110 animate-float"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = `translate(${Math.random() * 20 - 10}px, ${Math.random() * 20 - 10}px) scale(1.1)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0) scale(1)';
            }}
            onClick={() => {
              setShowChatInterface(true);
            }}
          >
            <div className="absolute inset-0 rounded-full bg-white opacity-25 animate-ping"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </button>
        </div>
        
        {/* Messages Overlay - Medcor Purple Rectangle - Wide and positioned above input */}
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-[95%] max-w-[700px] z-20">
          <div 
            className="relative bg-purple-600/10 border border-purple-600 rounded-lg backdrop-blur-sm transition-all duration-300"
            style={{
              maxHeight: '60px',
              minHeight: '30px',
            }}
          >
            <div 
              className="overflow-y-auto overflow-x-hidden px-3 py-1.5 space-y-1 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent"
              style={{
                maxHeight: '60px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.classList.add('overflow-y-scroll');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.classList.remove('overflow-y-scroll');
              }}
            >
              {messages.length === 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center">
                  <p className="text-gray-800 font-medium text-sm">Hello! How can I assist you today?</p>
                </div>
              )}
              
              {messages.map((message, index) => {
                // Calculate opacity - most recent messages are fully visible
                const totalMessages = messages.length;
                const messagePosition = totalMessages - index - 1;
                const opacity = messagePosition === 0 ? 1 : Math.max(0.4, 1 - (messagePosition * 0.2));
                
                return (
                  <div
                    key={message.id}
                    className={`transition-all duration-500 ${
                      message.sender === "user" ? "text-right" : "text-left"
                    }`}
                    style={{ opacity }}
                  >
                    <div
                      className={`inline-block max-w-[85%] px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                        message.sender === "user"
                          ? "bg-blue-100/90 text-gray-800"
                          : "bg-white/90 text-gray-800 shadow-sm hover:shadow-md"
                      }`}
                      onClick={() => message.text.length > 50 && toggleMessageExpanded(message.id)}
                    >
                      <p className="text-xs leading-snug break-words">
                        {expandedMessages.has(message.id) 
                          ? message.text 
                          : truncateText(message.text)}
                      </p>
                      {message.text.length > 50 && (
                        <p className="text-[10px] mt-1 text-purple-600 font-medium">
                          {expandedMessages.has(message.id) ? 'Click to collapse' : 'Click to read more'}
                        </p>
                      )}
                      <p className="text-[10px] mt-0.5 opacity-60">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {message.showDoctors && message.sender === "bot" && (
                      <div className="mt-2 inline-block max-w-[85%]">
                        <ChatDoctorList onSelectDoctor={(doctor) => {
                          handleSendMessage(`I want to book an appointment with Dr. ${doctor.name}`);
                        }} />
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
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