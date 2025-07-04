import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Calendar, Users, FileText, Phone, 
  Settings, Home, Mic, Send, Bot, User, ChevronLeft, Camera
} from 'lucide-react';
import HeyGenSdkAvatar from './heygen-sdk-avatar';
import AppointmentCalendar from './appointment-calendar';
import ChatDoctorList from './chat-doctor-list';
import UserCameraView from './user-camera-view';
import AnimatedTextOverlay from './animated-text-overlay';
import { generateChatResponse } from '../services/openai';
import { useMutation } from '@tanstack/react-query';
import { interactiveDialogue } from '../services/interactive-dialogue';

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
  const [isAvatarReady, setIsAvatarReady] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDoctorList, setShowDoctorList] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const avatarRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Voice Chat Mutation
  const voiceChatMutation = useMutation({
    mutationFn: async ({ message, language = "en" }: { message: string; language?: string }) => {
      const response = await fetch('/api/chat/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      const botMessage: Message = {
        id: Date.now().toString(),
        text: data.text || data.message,
        sender: "bot",
        timestamp: new Date(),
        avatarResponse: data.avatarResponse,
        showDoctors: data.text?.toLowerCase().includes('doctor') || data.text?.toLowerCase().includes('appointment')
      };
      setMessages(prev => [...prev, botMessage]);
      
      if (data.text?.toLowerCase().includes('doctor') || data.text?.toLowerCase().includes('appointment')) {
        setTimeout(() => {
          setShowDoctorList(true);
        }, 1500);
      }
    }
  });

  // Speech Recognition
  useEffect(() => {
    if (!isOpen || !isCameraEnabled) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      
      if (event.results[current].isFinal) {
        const userMessage: Message = {
          id: Date.now().toString(),
          text: transcript,
          sender: "user",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        
        voiceChatMutation.mutate({ message: transcript });
        
        if (transcript.toLowerCase().includes('book') || transcript.toLowerCase().includes('appointment')) {
          if (!showCalendar) {
            setShowCalendar(true);
          }
          const confirmationMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: "I'll help you book an appointment. Please select your preferred date and time.",
            sender: "bot",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, confirmationMessage]);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    recognitionRef.current = recognition;
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isOpen, isCameraEnabled]);

  // Start/Stop Recording
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  // Handle camera enable
  const handleCameraEnable = () => {
    setIsCameraEnabled(true);
    console.log('Camera permission requested');
    
    // Start interactive dialogue after camera is enabled
    setTimeout(() => {
      if (videoRef.current) {
        interactiveDialogue.startInteractiveGreeting(videoRef.current);
      }
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Full screen HeyGen Avatar background */}
      <div className="absolute inset-0">
        <HeyGenSdkAvatar 
          ref={avatarRef}
          onReady={() => setIsAvatarReady(true)}
          isVideoLoopActive={!isCameraEnabled}
        />
      </div>
      
      {/* Dark overlay for better visibility */}
      <div className="absolute inset-0 bg-black/10" />
      
      {/* Main Chat Container - Positioned at bottom */}
      <div className={`absolute ${showChatInterface ? 'inset-0' : 'bottom-8 left-8 right-8 h-[140px]'} transition-all duration-300`}>
        <div className={`relative bg-white/90 backdrop-blur-sm ${showChatInterface ? 'h-full' : 'rounded-2xl'} shadow-xl p-4 ${showChatInterface ? '' : 'rounded-2xl'} overflow-hidden`}>
          {/* Close button */}
          {!showChatInterface && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-50"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          )}
          
          {/* Header with Camera Toggle */}
          {!showChatInterface && (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Bot className="h-6 w-6 text-purple-600" />
                  <span className="text-lg font-semibold text-gray-800">AI Assistant</span>
                </div>
                
                {/* User Camera View */}
                <UserCameraView 
                  isEnabled={isCameraEnabled}
                  onPermissionRequest={handleCameraEnable}
                />
                
                <img 
                  src="/medcor-logo.png" 
                  alt="Medcor" 
                  className="h-8 object-contain"
                />
              </div>
              
              {/* Text Input and Controls */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-full outline-none text-gray-700 placeholder-gray-500 focus:bg-gray-50 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const message = e.currentTarget.value;
                      setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        text: message,
                        sender: "user",
                        timestamp: new Date()
                      }]);
                      voiceChatMutation.mutate({ message });
                      e.currentTarget.value = '';
                    }
                  }}
                />
                
                <button
                  onClick={toggleRecording}
                  className={`p-3 rounded-full transition-all ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  } text-white shadow-md hover:shadow-lg`}
                >
                  <Mic className="h-5 w-5" />
                </button>
                
                <button className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md hover:shadow-lg transition-all">
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* Chat Interface View - Within Chat Container */}
        {showChatInterface && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm z-40 rounded-lg overflow-hidden">
            {/* Back Button - Top Left Corner */}
            <button
              onClick={() => setShowChatInterface(false)}
              className="absolute top-[85px] left-[25px] flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="font-medium text-sm">Back</span>
            </button>
            
            {/* Chat Interface Content */}
            <div className="h-full flex flex-col">
              {/* Menu Section - Centered */}
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  
                  {/* Circular AI Menu */}
                  <div className="relative w-48 h-48">
                    {/* Center Circle with AI Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                    <div className="absolute inset-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-2xl flex items-center justify-center">
                    <div className="text-white text-center">
                      <MessageSquare className="h-8 w-8 mx-auto mb-1" />
                      <p className="text-xs font-medium">AI Assistant</p>
                    </div>
                  </div>
                  
                  {/* Menu Items - Circular Layout */}
                  {[
                    { icon: Calendar, label: "Book", angle: 0, action: () => { setShowCalendar(true); setSelectedMenuItem("book"); } },
                    { icon: Users, label: "Doctors", angle: 60, action: () => { setShowDoctorList(true); setSelectedMenuItem("doctors"); } },
                    { icon: FileText, label: "Records", angle: 120, action: () => setSelectedMenuItem("records") },
                    { icon: Phone, label: "Call", angle: 180, action: () => setSelectedMenuItem("call") },
                    { icon: Settings, label: "Settings", angle: 240, action: () => setSelectedMenuItem("settings") },
                    { icon: Home, label: "Home", angle: 300, action: () => setSelectedMenuItem("home") }
                  ].map((item, index) => {
                    const angleRad = (item.angle * Math.PI) / 180;
                    const x = Math.cos(angleRad) * 75;
                    const y = Math.sin(angleRad) * 75;
                    
                    return (
                      <button
                        key={index}
                        onClick={item.action}
                        className={`absolute w-14 h-14 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 flex flex-col items-center justify-center ${
                          selectedMenuItem === item.label.toLowerCase() ? 'bg-purple-100 ring-2 ring-purple-600' : ''
                        }`}
                        style={{
                          left: `calc(50% + ${x}px - 28px)`,
                          top: `calc(50% + ${y}px - 28px)`
                        }}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                  </div>
                </div>
              </div>
              
              {/* Text Input at Bottom - Same as Main Chat */}
              <div className="p-4 border-t border-gray-200 bg-white/80">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 bg-gray-100 rounded-full outline-none text-gray-700 focus:bg-gray-50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const message = e.currentTarget.value;
                        setMessages(prev => [...prev, {
                          id: Date.now().toString(),
                          text: message,
                          sender: "user",
                          timestamp: new Date()
                        }]);
                        voiceChatMutation.mutate({ message });
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={toggleRecording}
                    className={`p-3 rounded-full transition-all ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                        : 'bg-purple-600 hover:bg-purple-700'
                    } text-white shadow-md hover:shadow-lg`}
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                  <button className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md hover:shadow-lg transition-all">
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Messages and Overlays - Hidden but available */}
        <div style={{ display: 'none' }}>
          {/* Calendar Popup */}
          {showCalendar && (
            <AppointmentCalendar 
              isOpen={showCalendar}
              onClose={() => {
                setShowCalendar(false);
                setSelectedMenuItem(null);
              }}
            />
          )}
          
          {/* Doctor List Popup */}
          {showDoctorList && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm z-50 rounded-lg overflow-hidden">
              {/* Back Button for Doctor List */}
              <button
                onClick={() => {
                  setShowDoctorList(false);
                  setSelectedMenuItem(null);
                }}
                className="absolute top-[85px] left-[25px] flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="font-medium text-sm">Back</span>
              </button>
              
              <div className="h-full flex flex-col pt-32 px-6">
                <div className="bg-white rounded-lg shadow-md p-4 max-h-[60vh] overflow-hidden flex flex-col">
                  <h3 className="text-xl font-semibold mb-4">Available Doctors</h3>
                  <div className="flex-1 overflow-y-auto">
                    <ChatDoctorList 
                      onSelectDoctor={(doctor) => {
                        setShowDoctorList(false);
                        setShowCalendar(true);
                        console.log("Selected doctor:", doctor);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Messages */}
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
        </div>
        
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
            <MessageSquare className="h-8 w-8 text-white relative z-10" />
          </button>
        </div>
      </div>
      
      <AnimatedTextOverlay 
        text="Processing your request..."
        isVisible={voiceChatMutation.isPending}
      />
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}