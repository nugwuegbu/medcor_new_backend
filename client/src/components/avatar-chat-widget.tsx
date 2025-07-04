import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, X, MessageSquare, ChevronLeft, Calendar, Users, Home, Phone, Settings, FileText } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import HeyGenAvatar from "./heygen-avatar";
import HeyGenWebRTCAvatar from "./heygen-webrtc-avatar";
import HeyGenSDKAvatar from "./heygen-sdk-avatar";
import ChatDoctorList from "./chat-doctor-list";
import AvatarVideoLoop from "./avatar-video-loop";
import UserCameraView from "./user-camera-view";
import BrowserVoiceButton from "./browser-voice-button";
import { AvatarManager } from "../services/avatar-manager";
import { TaskType, TaskMode } from "@heygen/streaming-avatar";
import doctorPhoto from "@assets/isolated-shotof-happy-successful-mature-senior-physician-wearing-medical-unifrom-stethoscope-having-cheerful-facial-expression-smiling-broadly-keeping-arms-crossed-chest_1751652590767.png";

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

// Simple language detection function
function detectLanguageFromText(text: string): string {
  const turkishPatterns = /[ığüşöçĞÜŞÖÇİ]/;
  const turkishWords = ['merhaba', 'nasıl', 'yardım', 'teşekkür', 'lütfen', 'evet', 'hayır'];
  const lowerText = text.toLowerCase();
  
  if (turkishPatterns.test(text) || turkishWords.some(word => lowerText.includes(word))) {
    return 'tr';
  }
  
  return 'en';
}

export default function AvatarChatWidget({ isOpen, onClose }: AvatarChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [showCalendar, setShowCalendar] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null);
  const [showDoctorList, setShowDoctorList] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraPermissionRequested, setCameraPermissionRequested] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [locationWeather, setLocationWeather] = useState<string>("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const capturePhotoRef = useRef<(() => string | null) | null>(null);

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

  // Auto-focus input when opened and request location
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      
      // Request location permission when chat opens
      requestLocationAndWeather();
      
      // Auto-enable camera after a short delay
      setTimeout(() => {
        if (!cameraPermissionRequested) {
          console.log("Auto-enabling camera for photo capture");
          setCameraEnabled(true);
          setCameraPermissionRequested(true);
        }
      }, 2000);
    }
  }, [isOpen, cameraPermissionRequested]);
  
  // Request location and get weather (try browser first, fallback to IP)
  const requestLocationAndWeather = async () => {
    try {
      let coords = null;
      
      // Try to get browser location first
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: true
          });
        });
        coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        console.log("Got browser location:", coords);
      } catch (e) {
        console.log("Browser location denied, will use IP location");
      }
      
      // Get weather info (will use IP if no coords)
      const response = await fetch("/api/location-weather", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(coords || {})
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Location and weather data:", data);
        setLocationWeather(data.message);
      }
    } catch (error) {
      console.error("Error getting weather:", error);
    }
  };

  // Voice chat mutation
  const voiceChatMutation = useMutation({
    mutationFn: async (message: string) => {
      // Check if this is the first user message after initial greeting
      const isFirstUserMessage = messages.length === 0 || messages.length === 1;
      
      let userImage = null;
      
      // Capture photo if this is the first message and camera is available
      if (isFirstUserMessage && capturePhotoRef.current) {
        console.log("Capturing user photo for first message");
        userImage = capturePhotoRef.current();
      }
      
      const response = await fetch("/api/chat/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          sessionId,
          language: "en",
          userImage,
          locationWeather: isFirstUserMessage ? locationWeather : null
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
      
      // Make the HeyGen avatar speak the response with language detection
      if ((window as any).heygenSpeak) {
        // Detect language from response text
        const detectedLang = detectLanguageFromText(data.message);
        (window as any).heygenSpeak(data.message, detectedLang);
      }
    }
  });

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Activate HeyGen avatar on first user interaction
    setUserHasInteracted(true);

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



  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm absolute top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-600" />
          <span className="text-gray-700 text-sm">AI Assistant</span>
        </div>
        
        {/* User Camera View in center */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <UserCameraView 
            isEnabled={cameraEnabled}
            onPermissionRequest={() => {
              console.log("Camera permission requested");
              setCameraEnabled(true);
            }}
            capturePhotoRef={capturePhotoRef}
          />
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
        {/* Avatar Background - Always Active */}
        <div className="absolute inset-0">
          {isOpen && (
            <>
              {/* Always show HeyGen avatar */}
              <HeyGenSDKAvatar 
                key="single-avatar-instance"
                apiKey="Mzk0YThhNTk4OWRiNGU4OGFlZDZiYzliYzkwOTBjOGQtMTcyNjczNDQ0Mg=="
                isVisible={true}
                onMessage={(text) => {
                  console.log("Avatar message:", text);
                }}
                onReady={() => {
                  console.log("Avatar is ready");
                  setHasGreeted(true);
                  // Don't send automatic greeting - wait for user interaction
                }}
              />
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
                        className={`absolute w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform ${
                          selectedMenuItem === item.label.toLowerCase()
                            ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white scale-125 shadow-xl"
                            : "bg-white/90 hover:bg-white text-gray-700 shadow-md hover:shadow-xl hover:scale-125"
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
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <BrowserVoiceButton
                    onTranscript={(text) => {
                      handleSendMessage(text);
                    }}
                    disabled={false}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        const message = input.value;
                        setMessages(prev => [...prev, {
                          id: Date.now().toString(),
                          text: message,
                          sender: "user",
                          timestamp: new Date()
                        }]);
                        input.value = '';
                      }
                    }}
                    className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                

              </div>
              
              {/* Content Area - Hidden for now */}
              <div className="absolute bottom-0 left-0 right-0 p-6" style={{ display: showCalendar || showDoctorList ? 'block' : 'none' }}>
                

                
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
                
                {/* Show Book page */}
                {showCalendar && (
                  <div className="fixed inset-0 bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm z-50 rounded-lg overflow-hidden">
                    {/* Back Button */}
                    <button
                      onClick={() => setShowCalendar(false)}
                      className="absolute top-[85px] left-[25px] flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="font-medium text-sm">Back</span>
                    </button>
                    
                    {/* Empty Book Page */}
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        {/* Empty page content */}
                      </div>
                    </div>
                  </div>
                )}
                
                {showDoctorList && (
                  <div className="fixed inset-0 bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm z-50 rounded-lg overflow-hidden">
                    {/* Back Button */}
                    <button
                      onClick={() => setShowDoctorList(false)}
                      className="absolute top-[85px] left-[25px] flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="font-medium text-sm">Back</span>
                    </button>
                    
                    {/* Doctors Page */}
                    <div className="h-full flex items-center justify-center">
                      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
                        <div className="text-center">
                          {/* Doctor Avatar */}
                          <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden bg-gray-200 relative">
                            <img 
                              src={doctorPhoto}
                              alt="Dr. Sarah Johnson"
                              className="w-full h-full object-cover object-center"
                            />
                          </div>
                          
                          {/* Doctor Information */}
                          <h2 className="text-2xl font-bold text-gray-800 mb-2">Dr. Sarah Johnson</h2>
                          <p className="text-lg text-purple-600 font-medium mb-4">Plastic Surgery Specialist</p>
                          
                          {/* Contact Information */}
                          <div className="border-t pt-4 mt-4">
                            <div className="flex items-center justify-center gap-2 text-gray-600">
                              <Phone className="h-5 w-5" />
                              <span className="text-lg">+44 20 7123 4567</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
          
          <BrowserVoiceButton
            onTranscript={(text) => {
              handleSendMessage(text);
            }}
            disabled={voiceChatMutation.isPending}
          />
        </div>
        

      </div>


    </div>
  );
}