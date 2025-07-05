import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, X, MessageSquare, ChevronLeft, Calendar, Users, Home, Phone, Settings, FileText, MessageCircle, User } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import HeyGenAvatar from "./heygen-avatar";
import HeyGenWebRTCAvatar from "./heygen-webrtc-avatar";
import HeyGenSDKAvatar, { HeyGenSDKAvatarRef } from "./heygen-sdk-avatar";
import ChatDoctorList from "./chat-doctor-list";
import AvatarVideoLoop from "./avatar-video-loop";
import UserCameraView from "./user-camera-view";
import BrowserVoiceButton from "./browser-voice-button";
import InfoOverlay from "./info-overlay";
import { AvatarManager } from "../services/avatar-manager";
import { TaskType, TaskMode } from "@heygen/streaming-avatar";
import doctorPhoto from "@assets/isolated-shotof-happy-successful-mature-senior-physician-wearing-medical-unifrom-stethoscope-having-cheerful-facial-expression-smiling-broadly-keeping-arms-crossed-chest_1751652590767.png";
import doctorPhotoEmily from "@assets/image-professional-woman-doctor-physician-with-clipboard-writing-listening-patient-hospital-cl_1751697087292.png";
import { FaGoogle, FaApple, FaMicrosoft } from "react-icons/fa";

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

// Enhanced language detection function
function detectLanguageFromText(text: string): string {
  const turkishPatterns = /[ığüşöçĞÜŞÖÇİ]/;
  const turkishWords = [
    'merhaba', 'nasıl', 'yardım', 'teşekkür', 'lütfen', 'evet', 'hayır',
    'doktor', 'randevu', 'muayene', 'hasta', 'ağrı', 'ilaç', 'ne', 'ben',
    'sen', 'biz', 'onlar', 'bu', 'şu', 'nerede', 'ne zaman', 'nasılsın',
    'günaydın', 'iyi akşamlar', 'güle güle', 'hoşgeldin', 'sağlık',
    'ameliyat', 'tedavi', 'reçete', 'hastane', 'klinik', 'var', 'yok'
  ];
  const lowerText = text.toLowerCase();
  
  // Check for Turkish characters or common Turkish words
  if (turkishPatterns.test(text) || turkishWords.some(word => lowerText.includes(word))) {
    return 'tr';
  }
  
  // Check for Arabic patterns (basic detection)
  const arabicPattern = /[\u0600-\u06FF]/;
  if (arabicPattern.test(text)) {
    return 'ar';
  }
  
  // Default to English
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
  const [showInfoOverlay, setShowInfoOverlay] = useState(false);
  const [infoOverlayData, setInfoOverlayData] = useState<{
    title: string;
    places: any[];
  }>({ title: "", places: [] });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hoveredDoctorId, setHoveredDoctorId] = useState<number | null>(null);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HeyGenSDKAvatarRef>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const capturePhotoRef = useRef<(() => string | null) | null>(null);
  const doctorHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeakTimeRef = useRef<number>(0);

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
        setUserLocation(coords); // Save user location
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
      // Count user messages to determine if we should capture photo
      const userMessageCount = messages.filter(m => m.sender === "user").length;
      
      let userImage = null;
      
      // Capture photo every 2nd user message (0, 2, 4, 6, etc.)
      if (userMessageCount % 2 === 0 && capturePhotoRef.current) {
        console.log(`Capturing user photo for message #${userMessageCount + 1}`);
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
          language: detectLanguageFromText(message),
          userImage,
          locationWeather: userMessageCount === 0 ? locationWeather : null
        })
      });
      return await response.json();
    },
    onSuccess: async (data) => {
      // Check if the response contains a nearby search command
      if (data.message.includes("NEARBY_SEARCH:")) {
        console.log("NEARBY_SEARCH detected in response:", data.message);
        const searchType = data.message.split("NEARBY_SEARCH:")[1].trim();
        console.log("Search type extracted:", searchType);
        
        // Make API call to get nearby places
        // Use Medcor Clinic's location in Dubai Healthcare City
        const clinicLocation = {
          latitude: 25.1972, // Dubai Healthcare City coordinates
          longitude: 55.3233
        };
        
        try {
          const placesResponse = await fetch("/api/nearby-places", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              latitude: clinicLocation.latitude,
              longitude: clinicLocation.longitude,
              type: searchType,
              radius: 5000 // 5km radius
            })
          });
          
          if (placesResponse.ok) {
            const placesData = await placesResponse.json();
            
            // Show info overlay with results
            console.log("Setting overlay data with places:", placesData.places);
            setInfoOverlayData({
              title: `Nearby ${searchType}`,
              places: placesData.places.map((place: any) => ({
                ...place,
                mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " " + place.address)}`
              }))
            });
            console.log("Setting showInfoOverlay to true and minimizing avatar");
            setShowInfoOverlay(true);
            setIsMinimized(true);
            
            // Create a friendly message for the chat
            const friendlyMessage = placesData.places.length > 0
              ? `I found ${placesData.places.length} ${searchType} near our clinic. Check the details on the screen!`
              : `I couldn't find any ${searchType} within 5km of our clinic.`;
            
            const botMessage: Message = {
              id: `bot_${Date.now()}`,
              text: friendlyMessage,
              sender: "bot",
              timestamp: new Date(),
              avatarResponse: data.avatarResponse,
              showDoctors: false
            };
            setMessages(prev => [...prev, botMessage]);
          }
        } catch (error) {
          console.error("Error fetching nearby places:", error);
        }
      } else if (data.message.includes("OPEN_CHAT_INTERFACE:")) {
        console.log("OPEN_CHAT_INTERFACE detected:", data.message);
        const interfaceType = data.message.split("OPEN_CHAT_INTERFACE:")[1].split(" ")[0].trim();
        console.log("Interface type:", interfaceType);
        
        // Clean the message to remove the command
        const cleanMessage = data.message.replace(/OPEN_CHAT_INTERFACE:\w+\s*/, "");
        
        const botMessage: Message = {
          id: `bot_${Date.now()}`,
          text: cleanMessage,
          sender: "bot",
          timestamp: new Date(),
          avatarResponse: data.avatarResponse,
          showDoctors: false
        };
        setMessages(prev => [...prev, botMessage]);
        
        // Open the chat interface and navigate to the selected menu
        setShowChatInterface(true);
        setTimeout(() => {
          switch (interfaceType) {
            case "DOCTORS":
              setShowDoctorList(true);
              setSelectedMenuItem("doctors");
              break;
            case "BOOK":
              setSelectedMenuItem("book");
              break;
            case "SETTINGS":
              setSelectedMenuItem("settings");
              break;
            case "HOME":
              setShowChatInterface(false); // Go back to main chat
              setSelectedMenuItem(null);
              break;
            case "CALL":
              setSelectedMenuItem("call");
              break;
            case "RECORDS":
              setSelectedMenuItem("records");
              break;
          }
        }, 300); // Small delay to ensure animation
      } else {
        // Normal response
        const botMessage: Message = {
          id: `bot_${Date.now()}`,
          text: data.message,
          sender: "bot",
          timestamp: new Date(),
          avatarResponse: data.avatarResponse,
          showDoctors: false // Never show inline doctors
        };
        setMessages(prev => [...prev, botMessage]);
      }
      
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
    
    // Track user messages and show auth after 2 messages
    const newCount = userMessageCount + 1;
    setUserMessageCount(newCount);
    if (newCount === 2) {
      setShowAuthOverlay(true);
    }
    
    voiceChatMutation.mutate(text.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  // Memoized camera permission handler to prevent re-renders
  const handleCameraPermissionRequest = useCallback(() => {
    console.log("Camera permission requested");
    setCameraEnabled(true);
  }, []);

  // Handle doctor card hover - DISABLED to prevent repetitive speaking
  const handleDoctorHover = useCallback((doctorId: number, doctorName: string, description: string) => {
    // Temporarily disabled hover speech to prevent avatar from speaking repeatedly
    return;
    
    /* Original code commented out:
    // Only set if different doctor or not already speaking
    if (hoveredDoctorId === doctorId || isSpeaking) return;
    
    setHoveredDoctorId(doctorId);
    
    // Clear any existing timeout
    if (doctorHoverTimeoutRef.current) {
      clearTimeout(doctorHoverTimeoutRef.current);
    }
    
    // Set a delay before speaking
    doctorHoverTimeoutRef.current = setTimeout(() => {
      const now = Date.now();
      const timeSinceLastSpeak = now - lastSpeakTimeRef.current;
      
      // Only speak if at least 3 seconds have passed since last speech
      if (avatarRef.current && hoveredDoctorId === doctorId && !isSpeaking && timeSinceLastSpeak > 3000) {
        setIsSpeaking(true);
        lastSpeakTimeRef.current = now;
        
        const message = `This is ${doctorName}. ${description}`;
        avatarRef.current.speak({
          text: message,
          taskType: TaskType.TALK,
          taskMode: TaskMode.SYNC
        });
        
        // Reset speaking state after speech duration
        setTimeout(() => {
          setIsSpeaking(false);
        }, 4000); // 4 seconds for speech
      }
    }, 700); // 700ms delay before speaking
    */
  }, [hoveredDoctorId, isSpeaking]);

  const handleDoctorHoverEnd = useCallback(() => {
    // Temporarily disabled to prevent avatar issues
    return;
    
    /* Original code commented out:
    // Clear timeout if user leaves before avatar speaks
    if (doctorHoverTimeoutRef.current) {
      clearTimeout(doctorHoverTimeoutRef.current);
      doctorHoverTimeoutRef.current = null;
    }
    
    // Reset states
    setHoveredDoctorId(null);
    setIsSpeaking(false);
    
    // Stop avatar from speaking by interrupting with empty text
    if (avatarRef.current) {
      avatarRef.current.speak({
        text: " ",
        taskType: TaskType.TALK,
        taskMode: TaskMode.SYNC
      });
    }
    */
  }, []);

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
            onPermissionRequest={handleCameraPermissionRequest}
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
        {/* Avatar Container with minimize transition */}
        <div 
          className={`absolute transition-all duration-700 ease-in-out overflow-hidden ${
            isMinimized 
              ? 'top-20 right-4 w-32 h-32 rounded-full shadow-2xl z-50 cursor-pointer hover:scale-110' 
              : 'inset-0'
          }`}
          style={!isMinimized ? {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%'
          } : {}}
          onClick={() => {
            if (isMinimized) {
              setIsMinimized(false);
              setShowInfoOverlay(false);
            }
          }}>
          {isOpen && (
            <>
              {/* Always show HeyGen avatar */}
              <HeyGenSDKAvatar 
                ref={avatarRef}
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
        
        {/* White Content Area when minimized */}
        {isMinimized && (
          <div className="absolute inset-0 bg-white">
            <div className="p-6 h-full overflow-y-auto">
              {showInfoOverlay && (
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-2xl font-bold mb-4">{infoOverlayData.title}</h2>
                  <div className="space-y-4">
                    {infoOverlayData.places.map((place: any, index: number) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold">{place.name}</h3>
                            <p className="text-gray-600">{place.type}</p>
                            {place.address && <p className="text-sm text-gray-500">{place.address}</p>}
                          </div>
                          <span className="text-sm text-gray-500">{place.distance}</span>
                        </div>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                          View on Google Maps →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Info Overlay hidden when minimized since content is shown in white area */}
        
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
                    {/* Center Circle with User Account */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                    <button 
                      onClick={() => setShowAuthOverlay(true)}
                      className="absolute inset-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-white text-center">
                        <User className="h-8 w-8 mx-auto mb-1" />
                        <p className="text-xs font-medium">Account</p>
                      </div>
                    </button>
                  
                  {/* Menu Items - Circular Layout */}
                  {[
                    { icon: Calendar, label: "Book", angle: 0, action: () => { setShowCalendar(true); setSelectedMenuItem("book"); setShowChatInterface(true); } },
                    { icon: Users, label: "Doctors", angle: 60, action: () => { setShowDoctorList(true); setSelectedMenuItem("doctors"); setShowChatInterface(false); } },
                    { icon: FileText, label: "Records", angle: 120, action: () => { setSelectedMenuItem("records"); setShowChatInterface(true); } },
                    { icon: Phone, label: "Call", angle: 180, action: () => { setSelectedMenuItem("call"); setShowChatInterface(true); } },
                    { icon: Settings, label: "Settings", angle: 240, action: () => { setSelectedMenuItem("settings"); setShowChatInterface(true); } },
                    { icon: Home, label: "Home", angle: 300, action: () => { setSelectedMenuItem("home"); setShowChatInterface(false); } }
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
                      onClick={() => {
                        setShowDoctorList(false);
                        setShowChatInterface(true);
                      }}
                      className="absolute top-[80px] left-[20px] flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50 text-sm"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span className="font-medium">Back</span>
                    </button>
                    
                    {/* Small Avatar Circle in Top Right */}
                    <div className="absolute top-[75px] right-[20px] z-50">
                      <div className="relative">
                        {/* Pulsing ring to show avatar is active */}
                        <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 animate-pulse opacity-50"></div>
                        
                        {/* Avatar container - using main avatar in minimized state */}
                        <div 
                          className="relative w-20 h-20 rounded-full shadow-2xl ring-4 ring-white/70 cursor-pointer hover:scale-110 transition-transform overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600"
                          onClick={() => {
                            setShowDoctorList(false);
                            // Restore avatar to full screen
                            setIsMinimized(false);
                          }}
                        >
                          {/* Always show chat icon since we can't duplicate the avatar */}
                          <div className="w-full h-full flex items-center justify-center text-white">
                            <MessageCircle className="h-8 w-8" />
                          </div>
                        </div>
                        
                        {/* Active status indicator */}
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-md">
                          Active
                        </div>
                      </div>
                    </div>
                    
                    {/* Doctors Grid */}
                    <div className="h-full pt-36 px-4 pb-24 overflow-y-auto">
                      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Our Doctors</h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-6xl mx-auto">
                        {/* Doctor 1 */}
                        <div 
                          className="bg-white rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow cursor-pointer"
                          onMouseEnter={() => handleDoctorHover(1, "Dr. Sarah Johnson", "5 years experience in cardiology, graduated from Johns Hopkins University.")}
                          onMouseLeave={handleDoctorHoverEnd}
                        >
                          <div className="text-center">
                            <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden bg-gray-200">
                              <img 
                                src={doctorPhoto}
                                alt="Dr. Sarah Johnson"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h3 className="text-sm font-bold text-gray-800">Dr. Sarah Johnson</h3>
                            <p className="text-xs text-purple-600 font-medium mb-1">Cardiology</p>
                            <div className="flex items-center justify-center gap-1 text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span className="text-xs">+44 20 7123 4567</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Doctor 2 */}
                        <div 
                          className="bg-white rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow cursor-pointer"
                          onMouseEnter={() => handleDoctorHover(2, "Dr. Michael Chen", "7 years in orthopedics, Harvard Medical School graduate, expert in sports medicine.")}
                          onMouseLeave={handleDoctorHoverEnd}
                        >
                          <div className="text-center">
                            <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden bg-gray-200">
                              <img 
                                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face"
                                alt="Dr. Michael Chen"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h3 className="text-sm font-bold text-gray-800">Dr. Michael Chen</h3>
                            <p className="text-xs text-purple-600 font-medium mb-1">Orthopedics</p>
                            <div className="flex items-center justify-center gap-1 text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span className="text-xs">+44 20 7123 4568</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Doctor 3 */}
                        <div 
                          className="bg-white rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow cursor-pointer"
                          onMouseEnter={() => handleDoctorHover(3, "Dr. Emily Rodriguez", "10 years of pediatric experience, Stanford University alumnus, child health specialist.")}
                          onMouseLeave={handleDoctorHoverEnd}
                        >
                          <div className="text-center">
                            <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden bg-gray-200">
                              <img 
                                src={doctorPhotoEmily}
                                alt="Dr. Emily Rodriguez"
                                className="w-full h-full object-cover object-center"
                              />
                            </div>
                            <h3 className="text-sm font-bold text-gray-800">Dr. Emily Rodriguez</h3>
                            <p className="text-xs text-purple-600 font-medium mb-1">Pediatrics</p>
                            <div className="flex items-center justify-center gap-1 text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span className="text-xs">+44 20 7123 4569</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Chat and Voice Input Section at Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 max-w-4xl mx-auto">
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                          placeholder="Send your message..."
                          className="flex-1 px-4 py-2 text-sm rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => handleSendMessage(inputText)}
                          className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                        <BrowserVoiceButton
                          onTranscript={(text: string) => {
                            setInputText(text);
                            // Auto-send when user stops speaking
                            if (text.trim()) {
                              handleSendMessage(text);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Book/Appointment Page */}
                {selectedMenuItem === "book" && (
                  <div className="fixed inset-0 bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm z-50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => {
                        setSelectedMenuItem(null);
                        setShowChatInterface(true);
                      }}
                      className="absolute top-[80px] left-[20px] flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50 text-sm"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span className="font-medium">Back</span>
                    </button>
                    
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Calendar className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Book Appointment</h2>
                        <p className="text-gray-600">Appointment booking feature coming soon!</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Settings Page */}
                {selectedMenuItem === "settings" && (
                  <div className="fixed inset-0 bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm z-50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => {
                        setSelectedMenuItem(null);
                        setShowChatInterface(true);
                      }}
                      className="absolute top-[80px] left-[20px] flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50 text-sm"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span className="font-medium">Back</span>
                    </button>
                    
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Settings className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Settings</h2>
                        <p className="text-gray-600">Settings page coming soon!</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Call Page */}
                {selectedMenuItem === "call" && (
                  <div className="fixed inset-0 bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm z-50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => {
                        setSelectedMenuItem(null);
                        setShowChatInterface(true);
                      }}
                      className="absolute top-[80px] left-[20px] flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50 text-sm"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span className="font-medium">Back</span>
                    </button>
                    
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Phone className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Make a Call</h2>
                        <p className="text-gray-600">Calling feature coming soon!</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Records Page */}
                {selectedMenuItem === "records" && (
                  <div className="fixed inset-0 bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm z-50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => {
                        setSelectedMenuItem(null);
                        setShowChatInterface(true);
                      }}
                      className="absolute top-[80px] left-[20px] flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50 text-sm"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span className="font-medium">Back</span>
                    </button>
                    
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Medical Records</h2>
                        <p className="text-gray-600">Medical records feature coming soon!</p>
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
              maxHeight: '120px',
              minHeight: '30px',
            }}
          >
            <div 
              className="overflow-y-auto overflow-x-hidden px-3 py-1.5 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent"
              style={{
                maxHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.classList.add('overflow-y-scroll');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.classList.remove('overflow-y-scroll');
              }}
            >

              
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

      {/* Authentication Overlay */}
      {showAuthOverlay && (
        <div className="absolute inset-0 bg-white bg-opacity-95 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <button
              onClick={() => setShowAuthOverlay(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Your Account</h2>
              <p className="text-gray-600">Continue with your preferred provider</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => window.location.href = '/api/auth/google'}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaGoogle className="h-5 w-5 text-red-500" />
                <span className="text-gray-700 font-medium">Continue with Google</span>
              </button>

              <button
                onClick={() => window.location.href = '/api/auth/apple'}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaApple className="h-5 w-5 text-black" />
                <span className="text-gray-700 font-medium">Continue with Apple</span>
              </button>

              <button
                onClick={() => window.location.href = '/api/auth/microsoft'}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaMicrosoft className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700 font-medium">Continue with Microsoft</span>
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      )}

    </div>
  );
}