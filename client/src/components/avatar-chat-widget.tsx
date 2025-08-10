import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Mic, MicOff, Send, X, MessageSquare, ChevronLeft, Calendar, Users, Smile, Phone, Settings, FileText, MessageCircle, User, Bot, Upload, UserCheck, Scissors, Circle, Heart, Volume2, Crown, Mail, Lock, Eye, EyeOff, LogIn, LogOut, Paperclip, Download } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import HeyGenAvatar from "./heygen-avatar";
import HeyGenWebRTCAvatar from "./heygen-webrtc-avatar";
import HeyGenSDKAvatar, { HeyGenSDKAvatarRef } from "./heygen-sdk-avatar";
import ChatDoctorList from "./chat-doctor-list";
import AvatarVideoLoop from "./avatar-video-loop";
import UserCameraView from "./user-camera-view";
import BrowserVoiceButton from "./browser-voice-button";
import InfoOverlay from "./info-overlay";
import FaceAnalysisWidgetInline from "./face-analysis-widget-inline";
import HairAnalysisWidget from "./hair-analysis-widget";
import SkinAnalysisWidget from "./skin-analysis-widget";
import LipsAnalysisWidget from "./lips-analysis-widget";
import VoiceSkincareWidget from "./voice-skincare-tips";
import HairExtensionWidget from "./hair-extension-widget";
import VoiceIcon from "./ui/voice-icon";
import { AvatarManager } from "../services/avatar-manager";
import { TaskType, TaskMode } from "@heygen/streaming-avatar";
import doctorPhoto from "@assets/isolated-shotof-happy-successful-mature-senior-physician-wearing-medical-unifrom-stethoscope-having-cheerful-facial-expression-smiling-broadly-keeping-arms-crossed-chest_1751652590767.png";
import doctorEmilyPhoto from "@assets/image-professional-woman-doctor-physician-with-clipboard-writing-listening-patient-hospital-cl_1751701299986.png";
import { FaGoogle, FaApple, FaMicrosoft } from "react-icons/fa";
import { videoStreamRef, ensureCameraReady } from "../utils/camera-manager";
import { useAuth } from "@/hooks/useAuth";

// Perfect Corp YCE SDK types
declare global {
  interface Window {
    YCE?: {
      init: (options: any) => void;
      isInitialized: () => boolean;
      captureImage: () => Promise<any>;
      destroy: () => void;
    };
  }
}

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

// Login form validation schema
const clinicLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type ClinicLoginForm = z.infer<typeof clinicLoginSchema>;

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



// Custom Lips Icon Component
const LipsIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 18c4 0 8-2 8-6 0-2-2-4-8-4s-8 2-8 4c0 4 4 6 8 6z" />
    <path d="M12 14c2 0 4-1 4-2s-2-2-4-2-4 1-4 2 2 2 4 2z" />
  </svg>
);

function AvatarChatWidget({ isOpen, onClose }: AvatarChatWidgetProps) {
  // Early return for closed widget
  if (!isOpen) {
    return null;
  }

  // Initialize toast hook
  const { toast } = useToast();
  
  // Authentication hook
  const { user, isAuthenticated, login, logout } = useAuth();

  // State definitions
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [doctorsInputText, setDoctorsInputText] = useState("");
  const [recordsInputText, setRecordsInputText] = useState("");
  const [sessionId] = useState(() => `session_${Date.now()}`);

  const [showCalendar, setShowCalendar] = useState(false);
  const [showBookingCalendar, setShowBookingCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null);
  const [showDoctorList, setShowDoctorList] = useState(false);
  const [showRecordsList, setShowRecordsList] = useState(false);
  const [showAdminPage, setShowAdminPage] = useState(false);
  const [showFacePage, setShowFacePage] = useState(false);
  const [showHairPage, setShowHairPage] = useState(false);
  const [showSkinPage, setShowSkinPage] = useState(false);
  const [showLipsPage, setShowLipsPage] = useState(false);
  const [showVoiceTipsPage, setShowVoiceTipsPage] = useState(false);
  const [showHairExtensionWidget, setShowHairExtensionWidget] = useState(false);
  const [faceAnalysisCameraActive, setFaceAnalysisCameraActive] = useState(false);
  const [faceAnalysisLoading, setFaceAnalysisLoading] = useState(false);
  const [faceAnalysisResult, setFaceAnalysisResult] = useState<any>(null);
  const [faceAnalysisError, setFaceAnalysisError] = useState<string | null>(null);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraPermissionRequested, setCameraPermissionRequested] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  const [analysisStreamReady, setAnalysisStreamReady] = useState(false);
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
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarPosition, setAvatarPosition] = useState({ x: null as number | null, y: null as number | null });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingFormData, setBookingFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    reason: '',
    doctorId: 1,
    selectedDate: null as Date | null
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordFormData, setRecordFormData] = useState({
    diagnosis: '',
    files: [] as File[]
  });
  const [uploadingRecord, setUploadingRecord] = useState(false);
  const fileInputRecordsRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HeyGenSDKAvatarRef>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const capturePhotoRef = useRef<(() => string | null) | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const doctorHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeakTimeRef = useRef<number>(0);
  const avatarContainerRef = useRef<HTMLDivElement>(null);
  const faceAnalysisCameraRef = useRef<HTMLVideoElement>(null);

  // Fix for floating purple AI avatar bug (July 29, 2025)
  // Remove any simple avatar circles that appear when the menu is open
  useEffect(() => {
    if (showChatInterface) {
      // Use a MutationObserver to detect and remove any floating avatar elements
      const observer = new MutationObserver((mutations) => {
        // Look for any elements that might be floating purple AI avatars
        const selectors = [
          '.simple-avatar-circle',
          '.floating-avatar',
          '[class*="simple-avatar"]',
          '[class*="floating-ai"]',
          // Look for purple circular elements with AI text
          'div[style*="purple"][style*="rounded-full"]:has-text("AI")',
          'div[style*="gradient"]:has-text("AI")',
          // Look for any element with specific styling patterns
          'div.absolute.w-16.h-16.rounded-full.bg-purple-600',
          'div.absolute.w-16.h-16.rounded-full.bg-gradient',
        ];
        
        selectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              // Check if element contains "AI" text and is not part of the main menu
              if (el.textContent?.includes('AI') && 
                  !el.closest('.chat-widget-container') &&
                  el.classList.contains('rounded-full')) {
                el.remove();
                console.log('Removed floating purple AI avatar element');
              }
            });
          } catch (e) {
            // Ignore selector errors
          }
        });
      });

      // Start observing the document body for added nodes
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      return () => {
        observer.disconnect();
      };
    }
  }, [showChatInterface]);

  // Login form setup
  const loginForm = useForm<ClinicLoginForm>({
    resolver: zodResolver(clinicLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: ClinicLoginForm) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Login failed");
      }
      return result;
    },
    onSuccess: (data) => {
      if (data.success) {
        localStorage.setItem("medcor_token", data.token);
        login(data.token, data.user);
        setShowAuthOverlay(false);
        setLoginError(null);
        // Just show success toast and close modal - no redirect
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.user?.first_name || 'User'}!`,
        });
        // Reset auth tab to login for next time
        setAuthTab('login');
      }
    },
    onError: (error: any) => {
      setLoginError(error.message || "Login failed. Please try again.");
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const handleLoginSubmit = (data: ClinicLoginForm) => {
    setLoginError(null);
    loginMutation.mutate(data);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle mouse events for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Get chat widget container bounds
      const chatWidget = document.querySelector('.chat-widget-container');
      if (!chatWidget) return;
      
      const widgetRect = chatWidget.getBoundingClientRect();
      
      // Calculate new position relative to widget
      const newX = e.clientX - widgetRect.left - dragOffset.x;
      const newY = e.clientY - widgetRect.top - dragOffset.y;
      
      // Avatar dimensions (96px for w-24 h-24)
      const avatarSize = 96;
      
      // Keep avatar within chat widget bounds
      const boundedX = Math.max(0, Math.min(widgetRect.width - avatarSize, newX));
      const boundedY = Math.max(0, Math.min(widgetRect.height - avatarSize, newY));
      
      setAvatarPosition({ x: boundedX, y: boundedY });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.classList.remove('dragging');
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset.x, dragOffset.y]);

  const handleAvatarMouseDown = (e: React.MouseEvent) => {
    if (!showDoctorList && !showHairPage && !showLipsPage && !isMinimized) return; // Only allow dragging in circular mode
    
    const rect = avatarContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    document.body.classList.add('dragging');
    e.preventDefault();
  };

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
            
            // Add to messages list
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
        
        // Add to messages list
        setMessages(prev => [...prev, botMessage]);
        
        // Open the chat interface and navigate to doctors
        if (interfaceType === "DOCTORS") {
          setShowChatInterface(true);
          setTimeout(() => {
            setShowDoctorList(true);
            setSelectedMenuItem("doctors");
          }, 300); // Small delay to ensure animation
        }
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
        
        // Add to messages list
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

  // Fetch medical records function
  const fetchMedicalRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const token = localStorage.getItem('medcor_token');
      const djangoUrl = import.meta.env.VITE_DJANGO_URL || 'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000';
      
      const response = await fetch(`${djangoUrl}/api/medical-records/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMedicalRecords(data);
      } else {
        console.error('Failed to fetch medical records');
        setMedicalRecords([]);
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      setMedicalRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  // Smart keyword detection function
  const detectIntentAndRedirect = (text: string) => {
    const normalizedText = text.toLowerCase();
    
    // Booking/Appointment keywords
    const bookingKeywords = ['book', 'appointment', 'schedule', 'reserve', 'meet', 'visit', 'consultation'];
    if (bookingKeywords.some(keyword => normalizedText.includes(keyword))) {
      setShowChatInterface(false);
      setShowBookingCalendar(true);
      setSelectedMenuItem("book");
      setSelectedDate(null);
      setBookingFormData(prev => ({ ...prev, selectedDate: null }));
      return true;
    }
    
    // Doctor keywords
    const doctorKeywords = ['doctor', 'physician', 'specialist', 'medical staff', 'healthcare provider', 'dr.', 'dr '];
    if (doctorKeywords.some(keyword => normalizedText.includes(keyword))) {
      setShowDoctorList(true);
      setSelectedMenuItem("doctors");
      setShowChatInterface(false);
      setIsMinimized(true);
      return true;
    }
    
    // Records keywords
    const recordsKeywords = ['record', 'history', 'medical record', 'document', 'report', 'upload'];
    if (recordsKeywords.some(keyword => normalizedText.includes(keyword))) {
      setShowRecordsList(true);
      setSelectedMenuItem("records");
      setShowChatInterface(false);
      setIsMinimized(true);
      return true;
    }
    
    // Face analysis keywords
    const faceKeywords = ['face', 'facial', 'face analysis', 'face scan', 'facial recognition'];
    if (faceKeywords.some(keyword => normalizedText.includes(keyword))) {
      setShowFacePage(true);
      setSelectedMenuItem("face");
      setShowChatInterface(true);
      setShowDoctorList(false);
      setShowRecordsList(false);
      setShowAdminPage(false);
      setShowBookingCalendar(false);
      setIsMinimized(false);
      setCameraEnabled(true);
      setCameraPermissionRequested(true);
      return true;
    }
    
    // Hair analysis keywords
    const hairKeywords = ['hair', 'hair analysis', 'hair scan', 'hair health', 'scalp', 'hair care'];
    if (hairKeywords.some(keyword => normalizedText.includes(keyword))) {
      setShowHairPage(true);
      setSelectedMenuItem("hair");
      setIsMinimized(false);
      setShowChatInterface(false);
      setStreamReady(true);
      setAnalysisStreamReady(true);
      return true;
    }
    
    // Skin analysis keywords
    const skinKeywords = ['skin', 'skin analysis', 'skin scan', 'skin health', 'skincare', 'complexion'];
    if (skinKeywords.some(keyword => normalizedText.includes(keyword))) {
      setShowSkinPage(true);
      setSelectedMenuItem("skin");
      setIsMinimized(false);
      setShowChatInterface(false);
      setStreamReady(true);
      setAnalysisStreamReady(true);
      return true;
    }
    
    // Lips analysis keywords
    const lipsKeywords = ['lips', 'lip analysis', 'lip scan', 'lip health', 'lip care'];
    if (lipsKeywords.some(keyword => normalizedText.includes(keyword))) {
      setShowLipsPage(true);
      setSelectedMenuItem("lips");
      setIsMinimized(false);
      setShowChatInterface(false);
      setStreamReady(true);
      setAnalysisStreamReady(true);
      return true;
    }
    
    // Hair Extension keywords
    const hairExtensionKeywords = ['hair extension', 'hair extensions', 'hair piece', 'hair augmentation'];
    if (hairExtensionKeywords.some(keyword => normalizedText.includes(keyword))) {
      setShowHairExtensionWidget(true);
      setSelectedMenuItem("hair-extension");
      return true;
    }
    
    // Admin keywords
    const adminKeywords = ['admin', 'administrator', 'management', 'backend', 'admin panel'];
    if (adminKeywords.some(keyword => normalizedText.includes(keyword))) {
      setShowAdminPage(true);
      setSelectedMenuItem("admin");
      setShowChatInterface(false);
      setIsMinimized(true);
      return true;
    }
    
    // Call keywords
    const callKeywords = ['call', 'phone', 'telephone', 'contact', 'speak to someone'];
    if (callKeywords.some(keyword => normalizedText.includes(keyword))) {
      setSelectedMenuItem("call");
      // Add call functionality here
      return true;
    }
    
    return false; // No intent detected
  };

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
    
    // Check for intent and redirect before sending to AI
    const wasRedirected = detectIntentAndRedirect(text.trim());
    
    if (wasRedirected) {
      // Add a bot message indicating redirection
      const botMessage: Message = {
        id: `bot_${Date.now()}`,
        text: "I understand you want to access that feature. I'm redirecting you now.",
        sender: "bot",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Make avatar speak the redirection message
      if (avatarRef.current) {
        avatarRef.current.speak({
          text: "I understand you want to access that feature. I'm redirecting you now.",
          taskType: TaskType.TALK,
          taskMode: TaskMode.SYNC
        });
      }
      
      return; // Don't send to AI if redirected
    }
    
    // Track user messages and show auth after 2 messages
    const newCount = userMessageCount + 1;
    setUserMessageCount(newCount);
    if (newCount === 2) {
      setShowAuthOverlay(true);
    }
    
    voiceChatMutation.mutate(text.trim());
  };

  const handleDoctorsSendMessage = async (text: string) => {
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
    setDoctorsInputText("");
    
    // Check for intent and redirect before sending to AI
    const wasRedirected = detectIntentAndRedirect(text.trim());
    
    if (wasRedirected) {
      // Add a bot message indicating redirection
      const botMessage: Message = {
        id: `bot_${Date.now()}`,
        text: "I understand you want to access that feature. I'm redirecting you now.",
        sender: "bot",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Make avatar speak the redirection message
      if (avatarRef.current) {
        avatarRef.current.speak({
          text: "I understand you want to access that feature. I'm redirecting you now.",
          taskType: TaskType.TALK,
          taskMode: TaskMode.SYNC
        });
      }
      
      return; // Don't send to AI if redirected
    }
    
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
  // Centralized camera management utility - FIXED VERSION
  const ensureCameraReady = useCallback(async (): Promise<MediaStream> => {
    const { ensureCameraReady: cameraManager } = await import('../utils/camera-manager');
    return cameraManager();
  }, []);

  const handleCameraPermissionRequest = useCallback(() => {
    console.log("Camera permission requested");
    setCameraEnabled(true);
  }, []);

  // Face analysis handlers
  const handleStartFaceAnalysis = useCallback(async () => {
    try {
      console.log('Starting Perfect Corp YCE SDK face analysis...');
      setFaceAnalysisLoading(true);
      setFaceAnalysisError(null);
      setFaceAnalysisResult(null);
      
      // Initialize YCE SDK if not already initialized
      if (window.YCE && !window.YCE.isInitialized()) {
        console.log('Initializing YCE SDK...');
        
        const options = {
          apiKey: import.meta.env.VITE_YCE_API_KEY || import.meta.env.REACT_APP_YCE_API_KEY,
          accountId: import.meta.env.VITE_YCE_ACCOUNT_ID || import.meta.env.REACT_APP_YCE_ACCOUNT_ID,
          email: import.meta.env.VITE_YCE_EMAIL || import.meta.env.REACT_APP_YCE_EMAIL,
          mode: 'ui',
          container: faceAnalysisCameraRef.current,
          onReady: () => {
            console.log('YCE SDK ready');
            setFaceAnalysisCameraActive(true);
          },
          onImageCaptured: (imageData: any) => {
            console.log('YCE SDK image captured:', imageData);
            setFaceAnalysisResult(imageData);
          },
          ui: {
            theme: 'light',
            showInstructions: true,
          },
          capture: {
            faceQuality: true,
            resolution: { width: 640, height: 480 }
          }
        };
        
        window.YCE.init(options);
        console.log('YCE SDK initialized with options:', options);
      } else if (window.YCE && window.YCE.isInitialized()) {
        console.log('YCE SDK already initialized');
        setFaceAnalysisCameraActive(true);
      } else {
        console.log('YCE SDK not available, using fallback camera');
        
        // Fallback to regular camera
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          } 
        });
        
        if (faceAnalysisCameraRef.current) {
          faceAnalysisCameraRef.current.srcObject = stream;
          setFaceAnalysisCameraActive(true);
        }
      }
    } catch (error) {
      console.error('Face analysis initialization error:', error);
      setFaceAnalysisError("Camera access denied or not available");
    } finally {
      setFaceAnalysisLoading(false);
    }
  }, []);

  const handleTakeFacePhoto = useCallback(async () => {
    if (!faceAnalysisCameraRef.current || !faceAnalysisCameraActive) {
      console.log('Face photo capture skipped - camera not active');
      return;
    }
    
    try {
      console.log('Starting Perfect Corp YCE SDK face analysis...');
      setFaceAnalysisLoading(true);
      setFaceAnalysisError(null);
      
      // Use Perfect Corp YCE SDK
      if (window.YCE && window.YCE.isInitialized()) {
        console.log('Using YCE SDK for face analysis');
        
        // Capture image using YCE SDK
        const result = await window.YCE.captureImage();
        console.log('YCE SDK analysis result:', result);
        
        if (result && result.success) {
          setFaceAnalysisResult(result.data);
        } else {
          throw new Error('YCE SDK analysis failed');
        }
      } else {
        console.log('YCE SDK not available, using canvas capture');
        
        // Fallback to canvas capture
        const canvas = document.createElement('canvas');
        const video = faceAnalysisCameraRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error("Could not get canvas context");
        }
        
        ctx.drawImage(video, 0, 0);
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        
        console.log('Image captured, base64 length:', imageBase64.length);
        
        // Send to backend for analysis with YCE API
        const response = await fetch('/api/face-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageBase64 })
        });
        
        const data = await response.json();
        console.log('Perfect Corp API response:', data);
        
        if (data.success) {
          setFaceAnalysisResult(data.result);
        } else {
          setFaceAnalysisError(data.error || 'Analysis failed');
        }
      }
    } catch (error) {
      console.error('Face analysis error:', error);
      setFaceAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setFaceAnalysisLoading(false);
    }
  }, [faceAnalysisCameraActive]);

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
  
  // Debug - Log current states
  // Remove frequent logging to prevent re-render flickering
  // console.log('🟡 Widget render - Current states:', {
  //   showChatInterface,
  //   showDoctorList,
  //   showRecordsList,
  //   showAdminPage,
  //   showBookingCalendar,
  //   showFacePage,
  //   isMinimized,
  //   selectedMenuItem
  // });
  
  // If doctor list is being shown during booking, show contained within chat widget
  if (showDoctorList && !showChatInterface) {
    return (
      <div className="chat-widget-container fixed bottom-4 right-4 w-[380px] h-[600px] bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50">
        {/* Back Button */}
        <button
          onClick={() => {
            setShowDoctorList(false);
            setShowChatInterface(true);
            setIsMinimized(false);
            setSelectedMenuItem("");
            // Reset avatar position when going back
            setAvatarPosition({ x: null, y: null });
          }}
          className="absolute top-4 left-4 flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="font-medium text-sm">Back</span>
        </button>
        

        
        {/* Main Content Area - Shows doctors within chat bounds */}
        <div className="flex-1 pt-16 px-4 pb-4 overflow-y-auto">
          <div className="opacity-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">Our Doctors</h2>
            <div className="space-y-3">
            {/* Doctor 1 */}
            <div 
              className="bg-white rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={async () => {
                if (bookingFormData.selectedDate) {
                  setShowDoctorList(false);
                  setBookingFormData(prev => ({ ...prev, doctorId: 1 }));
                  setShowBookingForm(true);
                  setShowChatInterface(true);
                  
                  // Process doctor selection with booking assistant
                  try {
                    const response = await fetch('/api/booking-assistant/select-doctor', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        sessionId: sessionId,
                        doctorId: 1
                      })
                    });
                    
                    const assistantStep = await response.json();
                    
                    // Add assistant message to chat
                    const assistantMessage = {
                      id: Date.now().toString(),
                      text: assistantStep.message,
                      sender: 'bot' as const,
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                    
                    // Make avatar speak the message
                    if (avatarRef.current) {
                      avatarRef.current.speak(assistantStep.message);
                    }
                  } catch (error) {
                    console.error('Failed to process doctor selection with assistant:', error);
                  }
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  <img 
                    src={doctorPhoto}
                    alt="Dr. Sarah Johnson"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-800 truncate">Dr. Sarah Johnson</h3>
                  <p className="text-xs text-purple-600 font-medium">Cardiology</p>
                  <div className="flex items-center gap-1 text-gray-600 mt-1" style={{ fontSize: '10px' }}>
                    <Phone className="h-2.5 w-2.5" />
                    <span>+44 20 7123 4567</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Doctor 2 */}
            <div 
              className="bg-white rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={async () => {
                if (bookingFormData.selectedDate) {
                  setShowDoctorList(false);
                  setBookingFormData(prev => ({ ...prev, doctorId: 2 }));
                  setShowBookingForm(true);
                  setShowChatInterface(true);
                  
                  // Process doctor selection with booking assistant
                  try {
                    const response = await fetch('/api/booking-assistant/select-doctor', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        sessionId: sessionId,
                        doctorId: 2
                      })
                    });
                    
                    const assistantStep = await response.json();
                    
                    // Add assistant message to chat
                    const assistantMessage = {
                      id: (Date.now() + 1).toString(),
                      text: assistantStep.message,
                      sender: 'bot' as const,
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                    
                    // Make avatar speak the message
                    if (avatarRef.current) {
                      avatarRef.current.speak(assistantStep.message);
                    }
                  } catch (error) {
                    console.error('Failed to process doctor 2 selection:', error);
                  }
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  <img 
                    src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face"
                    alt="Dr. Michael Chen"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-800 truncate">Dr. Michael Chen</h3>
                  <p className="text-xs text-purple-600 font-medium">Orthopedics</p>
                  <div className="flex items-center gap-1 text-gray-600 mt-1" style={{ fontSize: '10px' }}>
                    <Phone className="h-2.5 w-2.5" />
                    <span>+44 20 7123 4568</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Doctor 3 */}
            <div 
              className="bg-white rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={async () => {
                if (bookingFormData.selectedDate) {
                  setShowDoctorList(false);
                  setBookingFormData(prev => ({ ...prev, doctorId: 3 }));
                  setShowBookingForm(true);
                  setShowChatInterface(true);
                  
                  // Process doctor selection with booking assistant
                  try {
                    const response = await fetch('/api/booking-assistant/select-doctor', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        sessionId: sessionId,
                        doctorId: 3
                      })
                    });
                    
                    const assistantStep = await response.json();
                    
                    // Add assistant message to chat
                    const assistantMessage = {
                      id: (Date.now() + 2).toString(),
                      text: assistantStep.message,
                      sender: 'bot' as const,
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                    
                    // Make avatar speak the message
                    if (avatarRef.current) {
                      avatarRef.current.speak(assistantStep.message);
                    }
                  } catch (error) {
                    console.error('Failed to process doctor 3 selection:', error);
                  }
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  <img 
                    src={doctorEmilyPhoto}
                    alt="Dr. Emily Rodriguez"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-800 truncate">Dr. Emily Rodriguez</h3>
                  <p className="text-xs text-purple-600 font-medium">Pediatrics</p>
                  <div className="flex items-center gap-1 text-gray-600 mt-1" style={{ fontSize: '10px' }}>
                    <Phone className="h-2.5 w-2.5" />
                    <span>+44 20 7123 4569</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        
        {/* Mini Chat Widget at bottom of doctor list */}
        {messages.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border border-purple-200 z-50 max-h-24">
            <div className="h-full flex flex-col">
              <div className="bg-purple-600 text-white px-2 py-1 rounded-t-lg flex justify-between items-center">
                <span className="text-xs font-medium">Assistant</span>
                <button 
                  onClick={() => setMessages([])}
                  className="text-white hover:text-gray-200 text-xs"
                >
                  ×
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                {messages.slice(-1).map((msg, index) => (
                  <div
                    key={index}
                    className="text-xs text-gray-700"
                  >
                    <p>{msg.text.length > 60 ? msg.text.substring(0, 60) + '...' : msg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Chat Input at bottom of doctor list */}
        <div className="absolute bottom-4 left-4 right-4 z-50">
          <div className="flex items-center gap-2 bg-white border border-purple-200 rounded-full px-4 py-2 shadow-lg">
            <input
              ref={inputRef}
              type="text"
              value={doctorsInputText}
              onChange={(e) => setDoctorsInputText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && doctorsInputText.trim()) {
                  handleSendMessage(doctorsInputText.trim());
                  setDoctorsInputText('');
                }
              }}
              placeholder="Ask about doctors or appointments..."
              className="flex-1 outline-none text-sm"
            />
            <BrowserVoiceButton 
              onTranscript={(transcript) => {
                setDoctorsInputText(transcript);
                handleSendMessage(transcript);
                setDoctorsInputText('');
              }}
            />
            <button
              onClick={() => {
                if (doctorsInputText.trim()) {
                  handleSendMessage(doctorsInputText.trim());
                  setDoctorsInputText('');
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Chat Widget - only show when no specific analysis pages are active */}
      {!showFacePage && !showHairPage && !showLipsPage && !showBookingCalendar && !showAuthOverlay && !showProfilePage && !showMedicalRecordsPage && !showVoiceTipsPage && !showHairExtensionWidget && (
      <div className="chat-widget-container fixed bottom-4 right-4 w-full max-w-[380px] h-full max-h-[600px] sm:w-[380px] sm:h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 animate-glow-border mx-4 my-4 sm:mx-0 sm:my-0" style={{ right: '16px', left: 'auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm absolute top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-600" />
          <span className="text-gray-700 text-sm">
            {isAuthenticated && user?.first_name 
              ? `Welcome, ${user.first_name}!` 
              : 'AI Assistant'}
          </span>
        </div>
        
        {/* User Camera View in center - Hide when Face Analysis, Hair Analysis, or Lips Analysis is open */}
        {!showFacePage && !showHairPage && !showLipsPage && (
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <UserCameraView 
              isEnabled={cameraEnabled}
              onPermissionRequest={handleCameraPermissionRequest}
              capturePhotoRef={capturePhotoRef}
              videoStreamRef={videoStreamRef}
              streamReady={streamReady}
            />
          </div>
        )}
        
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
        {/* Avatar Container - Adapts for chat, doctors view, and minimized state */}
        {!showRecordsList && !showChatInterface && !showFacePage && !showSkinPage && !showVoiceTipsPage && !showHairExtensionWidget && (
        <div 
          ref={avatarContainerRef}
          className={`absolute ${isDragging ? '' : 'transition-all duration-700 ease-in-out'} ${
            showDoctorList || showHairPage || showLipsPage
              ? 'w-24 h-24 rounded-full overflow-hidden shadow-2xl z-[60] hover:scale-105 ring-4 ring-purple-600'
              : isMinimized 
                ? 'w-32 h-32 rounded-full overflow-hidden shadow-2xl z-50 hover:scale-110' 
                : 'inset-0 overflow-hidden'
          }`}
          style={{
            ...(showDoctorList || showHairPage || showLipsPage || isMinimized ? {
              cursor: isDragging ? 'grabbing' : 'grab',
              left: avatarPosition.x !== null ? `${avatarPosition.x}px` : 'auto',
              top: avatarPosition.y !== null ? `${avatarPosition.y}px` : '75px',
              right: avatarPosition.x !== null ? 'auto' : '25px',
              userSelect: isDragging ? 'none' : 'auto',
              opacity: 1
            } : {
              opacity: 1
            })
          }}
          onMouseDown={handleAvatarMouseDown}
          onClick={(e) => {
            // Only handle click if not dragging
            if (isDragging || (e.target as HTMLElement).closest('.drag-handle')) return;
            
            if (isMinimized) {
              setIsMinimized(false);
              setShowInfoOverlay(false);
            } else if (showDoctorList) {
              setShowDoctorList(false);
              setShowChatInterface(true);
              setIsMinimized(false);
              setSelectedMenuItem("");
              // Reset avatar position when going back from doctor list
              setAvatarPosition({ x: null, y: null });
            } else if (showRecordsList) {
              setShowRecordsList(false);
              setShowChatInterface(true);
              setIsMinimized(false);
              setSelectedMenuItem("");
              // Reset avatar position when going back from records list
              setAvatarPosition({ x: null, y: null });
            } else if (showHairPage) {
              setShowHairPage(false);
              setShowChatInterface(true);
              setIsMinimized(false);
              setSelectedMenuItem("");
              // Reset avatar position when going back from hair page
              setAvatarPosition({ x: null, y: null });
            } else if (showLipsPage) {
              setShowLipsPage(false);
              setShowChatInterface(true);
              setIsMinimized(false);
              setSelectedMenuItem("");
              // Reset avatar position when going back from lips page
              setAvatarPosition({ x: null, y: null });
            }
          }}>
          {isOpen && !showDoctorList && !showRecordsList && !showHairPage && !showLipsPage && !showChatInterface && (
            <>
              {/* Show HeyGen avatar when NOT in specific list views or chat interface menu */}
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
        )}
        
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
        
        {/* Chat Interface View - Separate from Face Analysis */}
        {showChatInterface && !showFacePage && !showAdminPage && (
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
              {/* Menu Section - Centered with Top Margin */}
              <div className="flex-1 flex items-center justify-center pt-16">
                <div className="flex flex-col items-center gap-4">
                  
                  {/* Circular AI Menu - Expanded */}
                  <div className="relative w-80 h-80">
                    {/* Center Circle with User Account - Larger */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                    <button 
                      onClick={() => setShowAuthOverlay(true)}
                      className="absolute inset-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-white text-center">
                        <User className="h-8 w-8 mx-auto mb-1" />
                        <p className="text-xs font-medium">Account</p>
                      </div>
                    </button>
                  
                  {/* Menu Items - Circular Layout with More Space - 9 Icons */}
                  {[
                    { icon: Calendar, label: "Book", angle: 0, action: () => { 
                      setShowChatInterface(false);
                      setShowBookingCalendar(true); 
                      setSelectedMenuItem("book");
                      // Reset selected date when opening calendar
                      setSelectedDate(null);
                      setBookingFormData(prev => ({ ...prev, selectedDate: null }));
                    } },
                    { icon: Users, label: "Doctors", angle: 40, action: () => { 
                      setShowDoctorList(true); 
                      setSelectedMenuItem("doctors");
                      setShowChatInterface(false);
                      setIsMinimized(true);
                    } },
                    { icon: FileText, label: "Records", angle: 80, action: () => { 
                      if (!isAuthenticated) {
                        setShowAuthOverlay(true);
                        return;
                      }
                      setShowRecordsList(true); 
                      setSelectedMenuItem("records"); 
                      setShowChatInterface(false);
                      setIsMinimized(true);
                    } },
                    { icon: Phone, label: "Call", angle: 120, action: () => setSelectedMenuItem("call") },
                    { icon: isAuthenticated ? User : LogIn, label: isAuthenticated ? "Profile" : "Login", angle: 160, action: () => { 
                      if (isAuthenticated) {
                        // Show profile page for authenticated users
                        setShowProfilePage(true);
                        setSelectedMenuItem("profile");
                        setShowChatInterface(false);
                        setIsMinimized(false);
                        
                        // Reset ALL other conflicting states
                        setShowDoctorList(false);
                        setShowRecordsList(false);
                        setShowBookingCalendar(false);
                        setShowFacePage(false);
                        setShowHairPage(false);
                        setShowSkinPage(false);
                        setShowLipsPage(false);
                        setShowVoiceTipsPage(false);
                        setShowBookingForm(false);
                        setShowAdminPage(false);
                      } else {
                        // Show auth overlay for login
                        setShowAuthOverlay(true);
                      }
                    } },
                    { icon: Smile, label: "Face", angle: 200, action: () => { 
                      console.log('🔴 Face button clicked - Setting states synchronously');
                      
                      if (!isAuthenticated) {
                        setShowAuthOverlay(true);
                        return;
                      }
                      
                      // Set Face page state first
                      setShowFacePage(true); 
                      setSelectedMenuItem("face");
                      
                      // Keep chat interface open for Face Analysis
                      setShowChatInterface(true);
                      
                      // Reset other conflicting states
                      setShowDoctorList(false);
                      setShowRecordsList(false);
                      setShowAdminPage(false);
                      setShowBookingCalendar(false);
                      setIsMinimized(false);
                      
                      // Enable camera for face analysis
                      setCameraEnabled(true);
                      setCameraPermissionRequested(true);
                      console.log('🔴 Camera enabled for face analysis');
                      
                      console.log('🔴 Face states set - showFacePage: true, showChatInterface: true');
                    } },
                    { icon: Scissors, label: "Hair", angle: 240, action: async () => { 
                      console.log("🎬 Hair Analysis button clicked (minimized menu)");
                      
                      if (!isAuthenticated) {
                        setShowAuthOverlay(true);
                        return;
                      }
                      
                      try {
                        // Ensure camera is ready first
                        const stream = await ensureCameraReady();
                        console.log("🎬 Camera stream ready:", stream);
                        
                        // Validate stream has active tracks
                        if (!stream || !stream.getTracks || stream.getTracks().length === 0) {
                          throw new Error("Invalid camera stream - no active tracks");
                        }
                        
                        // Force update the shared stream reference
                        videoStreamRef.current = stream;
                        
                        // Update UI states immediately
                        setShowHairPage(true); 
                        setSelectedMenuItem("hair"); 
                        setIsMinimized(false); 
                        setShowChatInterface(false);
                        setStreamReady(true);
                        setAnalysisStreamReady(true);
                        
                        console.log("🎬 Hair Analysis page activated from minimized menu");
                        console.log("🎬 Hair Analysis videoStreamRef status:", {
                          hasRef: !!videoStreamRef.current,
                          hasGetTracks: videoStreamRef.current?.getTracks,
                          trackCount: videoStreamRef.current?.getTracks?.()?.length || 0
                        });
                        
                      } catch (err) {
                        console.error("🎬 Hair Analysis camera setup failed:", err);
                        
                        // Show error message to user
                        const errorMessage: Message = {
                          id: `error_${Date.now()}`,
                          text: "Camera access is required for hair analysis. Please enable camera permission and try again.",
                          sender: "bot",
                          timestamp: new Date()
                        };
                        setMessages(prev => [...prev, errorMessage]);
                      }
                    } },
                    { icon: LipsIcon, label: "Lips", angle: 280, action: async () => { 
                      console.log("💋 Lips Analysis button clicked (minimized menu)");
                      
                      if (!isAuthenticated) {
                        setShowAuthOverlay(true);
                        return;
                      }
                      
                      try {
                        // First ensure camera is ready before showing UI
                        setAnalysisStreamReady(false); // Reset first
                        
                        // Ensure camera is ready first
                        console.log("💋 Ensuring camera is ready for lips analysis...");
                        const stream = await ensureCameraReady();
                        console.log("💋 Camera stream ready:", stream);
                        
                        // Validate stream has active tracks
                        if (!stream || !stream.getTracks || stream.getTracks().length === 0) {
                          throw new Error("Invalid camera stream - no active tracks");
                        }
                        
                        // Force update the shared stream reference
                        videoStreamRef.current = stream;
                        
                        // Update UI states immediately
                        setShowLipsPage(true); 
                        setSelectedMenuItem("lips"); 
                        setIsMinimized(false); 
                        setShowChatInterface(false);
                        setStreamReady(true);
                        setAnalysisStreamReady(true);
                        
                        console.log("💋 Lips Analysis page activated from minimized menu");
                        console.log("💋 Lips Analysis videoStreamRef status:", {
                          hasRef: !!videoStreamRef.current,
                          hasGetTracks: videoStreamRef.current?.getTracks,
                          trackCount: videoStreamRef.current?.getTracks?.()?.length || 0
                        });
                        
                      } catch (err) {
                        console.error("💋 Lips Analysis camera setup failed:", err);
                        
                        // Show error message to user
                        const errorMessage: Message = {
                          id: `error_${Date.now()}`,
                          text: "Camera access is required for lips analysis. Please enable camera permission and try again.",
                          sender: "bot",
                          timestamp: new Date()
                        };
                        setMessages(prev => [...prev, errorMessage]);
                      }
                    } },
                    { icon: Heart, label: "Skin", angle: 320, action: async () => { 
                      console.log("🌟 Skin Analysis button clicked - DIRECT TEST");
                      
                      if (!isAuthenticated) {
                        setShowAuthOverlay(true);
                        return;
                      }
                      
                      try {
                        console.log("🌟 Setting skin analysis states...");
                        
                        // First ensure camera is ready before showing UI
                        setAnalysisStreamReady(false); // Reset first
                        
                        // Try to get camera first
                        try {
                          const stream = await ensureCameraReady();
                          if (stream) {
                            videoStreamRef.current = stream;
                            console.log("🌟 Camera stream ready for skin analysis");
                            
                            // Only update UI states after camera is ready
                            setShowSkinPage(true); 
                            setSelectedMenuItem("skin"); 
                            setIsMinimized(false); 
                            setShowChatInterface(false);
                            setStreamReady(true);
                            
                            // Small delay to ensure stream is properly set
                            setTimeout(() => {
                              setAnalysisStreamReady(true);
                            }, 100);
                          } else {
                            throw new Error("Camera stream not available");
                          }
                        } catch (cameraErr) {
                          console.error("🌟 Camera error:", cameraErr);
                          // Show error message instead of broken UI
                          const errorMessage = {
                            id: Date.now().toString(),
                            text: "Camera access is required for skin analysis. Please allow camera permissions and try again.",
                            sender: 'bot' as const,
                            timestamp: new Date()
                          };
                          setMessages(prev => [...prev, errorMessage]);
                          return; // Don't proceed without camera
                        }
                        
                        console.log("🌟 Skin Analysis page activated successfully");
                        
                      } catch (err) {
                        console.error("🌟 Skin Analysis setup failed:", err);
                      }
                    } },
                    { icon: Crown, label: "Hair Extension", angle: 360, action: () => { 
                      console.log("👑 Hair Extension button clicked");
                      if (!isAuthenticated) {
                        setShowAuthOverlay(true);
                        return;
                      }
                      try {
                        setShowHairExtensionWidget(true);
                        setSelectedMenuItem("hair-extension"); 
                        setShowChatInterface(false);
                        setIsMinimized(false);
                      } catch (error) {
                        console.error("Error opening Hair Extension:", error);
                      }
                    } }
                  ].map((item, index) => {
                    const angleRad = (item.angle * Math.PI) / 180;
                    const x = Math.cos(angleRad) * 130; // Increased to 130 for proper circle edge positioning
                    const y = Math.sin(angleRad) * 130; // Increased to 130 for proper circle edge positioning
                    
                    const isSpecialIcon = ["hair", "skin", "lips", "doctors", "hair extension"].includes(item.label.toLowerCase());
                    
                    return (
                      <div
                        key={index}
                        className="absolute group"
                        style={{
                          left: `calc(50% + ${x}px - 32px)`,
                          top: `calc(50% + ${y}px - 32px)`,
                        }}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                            {item.label}
                          </div>
                          {/* Tooltip Arrow */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                        
                        <button
                          onClick={item.action}
                          className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-200 ${
                            selectedMenuItem === item.label.toLowerCase().replace(' ', '-')
                              ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white scale-105 shadow-xl"
                              : isSpecialIcon 
                                ? "bg-white/90 hover:bg-white text-gray-700 shadow-md hover:shadow-lg hover:scale-105"
                                : "bg-white/90 hover:bg-white text-gray-700 shadow-md hover:shadow-lg hover:scale-105"
                          }`}
                          style={{
                            transform: 'translateZ(0)', // Force hardware acceleration for stable rendering
                            backfaceVisibility: 'hidden' // Prevent flickering during transitions
                          }}
                        >
                          <item.icon className={`h-7 w-7 transition-transform duration-200 ${isSpecialIcon ? "hover:scale-105" : ""}`} />
                          <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                        </button>
                      </div>
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
                        handleSendMessage(message);
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
                        handleSendMessage(message);
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
              <div className="absolute bottom-0 left-0 right-0 p-6" style={{ display: showCalendar || showDoctorList || showRecordsList ? 'block' : 'none' }}>
                

                
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
                
                {showDoctorList && !showChatInterface && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm z-50">
                    {/* Back Button */}
                    <button
                      onClick={() => {
                        setShowDoctorList(false);
                      }}
                      className="absolute top-[85px] left-[25px] flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="font-medium text-sm">Back</span>
                    </button>
                    

                    
                    {/* Main Content Area - Shows doctors clearly */}
                    <div className="h-full pt-32 px-6 pb-24 overflow-y-auto relative">
                      {/* Always show doctors clearly */}
                      <div className="opacity-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Our Doctors</h2>
                        <div className="grid grid-cols-3 gap-2 max-w-4xl mx-auto">
                        {/* Doctor 1 */}
                        <div 
                          className="bg-white rounded-lg shadow-md p-2 hover:shadow-lg transition-shadow cursor-pointer"
                          onMouseEnter={() => handleDoctorHover(1, "Dr. Sarah Johnson", "5 years experience in cardiology, graduated from Johns Hopkins University.")}
                          onMouseLeave={handleDoctorHoverEnd}
                          onClick={async () => {
                            if (bookingFormData.selectedDate) {
                              setShowDoctorList(false);
                              setBookingFormData(prev => ({ ...prev, doctorId: 1 }));
                              setShowBookingForm(true);
                              
                              // Process doctor selection with booking assistant
                              try {
                                const response = await fetch('/api/booking-assistant/select-doctor', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    sessionId: sessionId,
                                    doctorId: 1
                                  })
                                });
                                
                                const assistantStep = await response.json();
                                console.log('Doctor selected with assistant:', assistantStep);
                                
                                // Add assistant message to chat
                                const assistantMessage = {
                                  id: Date.now().toString(),
                                  text: assistantStep.message,
                                  sender: 'bot' as const,
                                  timestamp: new Date()
                                };
                                setMessages(prev => [...prev, assistantMessage]);
                                
                                // Make avatar speak the message
                                if (avatarRef.current) {
                                  avatarRef.current.speak(assistantStep.message);
                                }
                              } catch (error) {
                                console.error('Failed to process doctor selection with assistant:', error);
                              }
                            }
                          }}
                        >
                          <div className="text-center">
                            <div className="w-14 h-14 rounded-full mx-auto mb-1.5 overflow-hidden bg-gray-200">
                              <img 
                                src={doctorPhoto}
                                alt="Dr. Sarah Johnson"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h3 className="text-sm font-bold text-gray-800">Dr. Sarah Johnson</h3>
                            <p className="text-xs text-purple-600 font-medium">Cardiology</p>
                            <div className="flex items-center justify-center gap-1 text-gray-600 mt-1" style={{ fontSize: '10px' }}>
                              <Phone className="h-2.5 w-2.5" />
                              <span>+44 20 7123 4567</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Doctor 2 */}
                        <div 
                          className="bg-white rounded-lg shadow-md p-2 hover:shadow-lg transition-shadow cursor-pointer"
                          onMouseEnter={() => handleDoctorHover(2, "Dr. Michael Chen", "7 years in orthopedics, Harvard Medical School graduate, expert in sports medicine.")}
                          onMouseLeave={handleDoctorHoverEnd}
                          onClick={async () => {
                            if (bookingFormData.selectedDate) {
                              setShowDoctorList(false);
                              setBookingFormData(prev => ({ ...prev, doctorId: 2 }));
                              setShowBookingForm(true);
                              
                              // Process doctor selection with booking assistant
                              try {
                                const response = await fetch('/api/booking-assistant/select-doctor', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    sessionId: sessionId,
                                    doctorId: 2
                                  })
                                });
                                
                                const assistantStep = await response.json();
                                console.log('Doctor 2 selected with assistant:', assistantStep);
                                
                                // Add assistant message to chat
                                const assistantMessage = {
                                  id: (Date.now() + 1).toString(),
                                  text: assistantStep.message,
                                  sender: 'bot' as const,
                                  timestamp: new Date()
                                };
                                setMessages(prev => [...prev, assistantMessage]);
                                
                                // Make avatar speak the message
                                if (avatarRef.current) {
                                  avatarRef.current.speak(assistantStep.message);
                                }
                              } catch (error) {
                                console.error('Failed to process doctor 2 selection:', error);
                              }
                            }
                          }}
                        >
                          <div className="text-center">
                            <div className="w-14 h-14 rounded-full mx-auto mb-1.5 overflow-hidden bg-gray-200">
                              <img 
                                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face"
                                alt="Dr. Michael Chen"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h3 className="text-sm font-bold text-gray-800">Dr. Michael Chen</h3>
                            <p className="text-xs text-purple-600 font-medium">Orthopedics</p>
                            <div className="flex items-center justify-center gap-1 text-gray-600 mt-1" style={{ fontSize: '10px' }}>
                              <Phone className="h-2.5 w-2.5" />
                              <span>+44 20 7123 4568</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Doctor 3 */}
                        <div 
                          className="bg-white rounded-lg shadow-md p-2 hover:shadow-lg transition-shadow cursor-pointer"
                          onMouseEnter={() => handleDoctorHover(3, "Dr. Emily Rodriguez", "10 years of pediatric experience, Stanford University alumnus, child health specialist.")}
                          onMouseLeave={handleDoctorHoverEnd}
                          onClick={async () => {
                            if (bookingFormData.selectedDate) {
                              setShowDoctorList(false);
                              setBookingFormData(prev => ({ ...prev, doctorId: 3 }));
                              setShowBookingForm(true);
                              
                              // Process doctor selection with booking assistant
                              try {
                                const response = await fetch('/api/booking-assistant/select-doctor', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    sessionId: sessionId,
                                    doctorId: 3
                                  })
                                });
                                
                                const assistantStep = await response.json();
                                console.log('Doctor 3 selected with assistant:', assistantStep);
                                
                                // Add assistant message to chat
                                const assistantMessage = {
                                  id: (Date.now() + 2).toString(),
                                  text: assistantStep.message,
                                  sender: 'bot' as const,
                                  timestamp: new Date()
                                };
                                setMessages(prev => [...prev, assistantMessage]);
                                
                                // Make avatar speak the message
                                if (avatarRef.current) {
                                  avatarRef.current.speak(assistantStep.message);
                                }
                              } catch (error) {
                                console.error('Failed to process doctor 3 selection:', error);
                              }
                            }
                          }}
                        >
                          <div className="text-center">
                            <div className="w-14 h-14 rounded-full mx-auto mb-1.5 overflow-hidden bg-gray-200">
                              <img 
                                src={doctorEmilyPhoto}
                                alt="Dr. Emily Rodriguez"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h3 className="text-sm font-bold text-gray-800">Dr. Emily Rodriguez</h3>
                            <p className="text-xs text-purple-600 font-medium">Pediatrics</p>
                            <div className="flex items-center justify-center gap-1 text-gray-600 mt-1" style={{ fontSize: '10px' }}>
                              <Phone className="h-2.5 w-2.5" />
                              <span>+44 20 7123 4569</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      </div>
                      
                      {/* Mini Chat Widget for Doctor Page */}
                      {messages.length > 0 && (
                        <div className="fixed bottom-4 right-4 w-52 h-32 bg-white rounded-lg shadow-lg border border-purple-200 z-50">
                          <div className="h-full flex flex-col">
                            {/* Compact Chat Header */}
                            <div className="bg-purple-600 text-white p-1 rounded-t-lg flex justify-between items-center">
                              <span className="text-xs font-medium">Assistant</span>
                              <button 
                                onClick={() => setMessages([])}
                                className="text-white hover:text-gray-200 text-xs"
                              >
                                ×
                              </button>
                            </div>
                            
                            {/* Last 2 Messages Only */}
                            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                              {messages.slice(-2).map((msg, index) => (
                                <div
                                  key={index}
                                  className={`p-1 rounded text-[10px] ${
                                    msg.sender === 'user' 
                                      ? 'bg-purple-100 ml-auto max-w-[80%]' 
                                      : 'bg-gray-100 mr-auto max-w-[80%]'
                                  }`}
                                >
                                  <p>{msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text}</p>
                                </div>
                              ))}
                            </div>
                            
                            {/* Mini Reply Buttons */}
                            <div className="p-1 border-t">
                              <div className="flex gap-1">
                                <button 
                                  className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded hover:bg-purple-200"
                                  onClick={() => handleDoctorsSendMessage("Continue")}
                                >
                                  Continue
                                </button>
                                <button 
                                  className="text-[9px] bg-gray-100 text-gray-700 px-1 py-0.5 rounded hover:bg-gray-200"
                                  onClick={() => handleDoctorsSendMessage("Help")}
                                >
                                  Help
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    

                  </div>
                )}
                
                {/* Records View */}
                {showRecordsList && (
                  <div className="fixed inset-0 bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm z-50 rounded-lg overflow-hidden flex flex-col">
                    {/* Header with Back Button */}
                    <div className="bg-white shadow-md p-4">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            setShowRecordsList(false);
                            setShowChatInterface(true);
                            setRecordFormData({ diagnosis: '', files: [] });
                          }}
                          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5" />
                          <span className="font-medium">Back</span>
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Medical Records
                        </h2>
                        <div className="w-20" />
                      </div>
                    </div>
                    
                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto p-6">
                      {/* Upload Form */}
                      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload New Record</h3>
                        
                        <div className="space-y-4">
                          {/* Diagnosis Field */}
                          <div>
                            <Label htmlFor="diagnosis" className="text-sm font-medium text-gray-700">
                              Diagnosis / Medical Notes
                            </Label>
                            <Textarea
                              id="diagnosis"
                              value={recordFormData.diagnosis}
                              onChange={(e) => setRecordFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                              placeholder="Enter diagnosis or medical notes..."
                              className="mt-1 w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          
                          {/* File Upload Area */}
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Medical Files</Label>
                            <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors">
                              <input
                                ref={fileInputRecordsRef}
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  setRecordFormData(prev => ({ ...prev, files: [...prev.files, ...files] }));
                                }}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => fileInputRecordsRef.current?.click()}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                              >
                                <Upload className="h-4 w-4" />
                                <span>Choose Files</span>
                              </button>
                              <p className="text-xs text-gray-500 mt-2">PDF, JPG, PNG, DOC files up to 10MB</p>
                            </div>
                            
                            {/* Display selected files */}
                            {recordFormData.files.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {recordFormData.files.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm text-gray-700">{file.name}</span>
                                      <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRecordFormData(prev => ({
                                          ...prev,
                                          files: prev.files.filter((_, i) => i !== index)
                                        }));
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Submit Button */}
                          <Button
                            onClick={async () => {
                              if (!recordFormData.diagnosis.trim()) {
                                toast({
                                  title: "Missing Information",
                                  description: "Please enter diagnosis or medical notes",
                                  variant: "destructive"
                                });
                                return;
                              }
                              
                              setUploadingRecord(true);
                              try {
                                const formData = new FormData();
                                formData.append('patient', user?.id?.toString() || '');
                                formData.append('date', new Date().toISOString().split('T')[0]);
                                formData.append('diagnosis', recordFormData.diagnosis);
                                
                                // Append files
                                recordFormData.files.forEach(file => {
                                  formData.append('uploaded_files', file);
                                });
                                
                                const token = localStorage.getItem('medcor_token');
                                const djangoUrl = import.meta.env.VITE_DJANGO_URL || 'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000';
                                
                                const response = await fetch(`${djangoUrl}/api/medical-records/`, {
                                  method: 'POST',
                                  headers: {
                                    'Authorization': `Bearer ${token}`
                                  },
                                  body: formData
                                });
                                
                                if (response.ok) {
                                  toast({
                                    title: "Success",
                                    description: "Medical record uploaded successfully"
                                  });
                                  setRecordFormData({ diagnosis: '', files: [] });
                                  // Refresh records list
                                  fetchMedicalRecords();
                                } else {
                                  throw new Error('Failed to upload record');
                                }
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to upload medical record",
                                  variant: "destructive"
                                });
                              } finally {
                                setUploadingRecord(false);
                              }
                            }}
                            disabled={uploadingRecord || !recordFormData.diagnosis.trim()}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            {uploadingRecord ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Record
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Records List */}
                      <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Medical Records</h3>
                        
                        {recordsLoading ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                          </div>
                        ) : medicalRecords.length > 0 ? (
                          <div className="space-y-3">
                            {medicalRecords.map((record) => (
                              <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-800">Record ID: {record.record_id}</p>
                                    <p className="text-sm text-gray-600 mt-1">Date: {new Date(record.date).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-700 mt-2">{record.diagnosis}</p>
                                    {record.files && record.files.length > 0 && (
                                      <div className="flex items-center gap-2 mt-2">
                                        <Paperclip className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm text-gray-600">{record.files.length} file(s) attached</span>
                                      </div>
                                    )}
                                  </div>
                                  {record.files && record.files.length > 0 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        // Download files logic
                                        toast({
                                          title: "Download",
                                          description: "Downloading files..."
                                        });
                                      }}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">No medical records found</p>
                            <p className="text-sm text-gray-500 mt-1">Upload your first medical record above</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Upload Section */}
                      <div className="bg-white rounded-lg shadow-lg p-6 mt-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload New Record</h3>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <div className="space-y-3">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  setUploadingRecord(true);
                                  
                                  try {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('record_id', `MR${Date.now()}`);
                                    formData.append('date', new Date().toISOString().split('T')[0]);
                                    formData.append('diagnosis', 'Uploaded medical document');

                                    const response = await fetch('/api/medical-records', {
                                      method: 'POST',
                                      body: formData,
                                    });

                                    if (response.ok) {
                                      const uploadResult = await response.json();
                                      
                                      // Refresh the records list
                                      fetchMedicalRecords();
                                      
                                      // Show success toast
                                      toast({
                                        title: "Upload Successful! ✅",
                                        description: `${file.name} has been uploaded to your medical records. Our AI will analyze it for insights.`,
                                        variant: "default"
                                      });

                                      console.log('Medical record uploaded:', uploadResult);
                                      
                                      // Add a message to chat about the upload
                                      const uploadMessage = {
                                        id: Date.now().toString(),
                                        text: `Medical record "${file.name}" uploaded successfully. The document is now part of your health profile.`,
                                        sender: 'bot' as const,
                                        timestamp: new Date()
                                      };
                                      setMessages(prev => [...prev, uploadMessage]);

                                    } else {
                                      const errorData = await response.json();
                                      throw new Error(errorData.message || 'Upload failed');
                                    }

                                  } catch (error) {
                                    console.error('File upload error:', error);
                                    
                                    // Show error toast
                                    toast({
                                      title: "Upload Failed ❌",
                                      description: error instanceof Error ? error.message : "Failed to upload the file. Please check your connection and try again.",
                                      variant: "destructive"
                                    });
                                  } finally {
                                    setUploadingRecord(false);
                                  }
                                }}
                              />
                              <div className="flex flex-col items-center">
                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-gray-600 font-medium">Click to upload</p>
                              </div>
                            </label>
                            <p className="text-gray-600 mt-3 text-xs text-center">
                              Upload your medical documents or photos<br />
                              (PDF, JPEG, PNG, DOC)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Chat Input with Microphone for Records Page */}
                    <div className="bg-gradient-to-t from-gray-100 to-transparent p-6">
                      <div className="relative max-w-2xl mx-auto">
                        <input
                          type="text"
                          value={recordsInputText}
                          onChange={(e) => setRecordsInputText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && recordsInputText.trim()) {
                              handleSendMessage(recordsInputText);
                              setRecordsInputText('');
                            }
                          }}
                          placeholder="Send your message..."
                          className="w-full px-6 py-4 pr-24 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                        />
                        
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                          <BrowserVoiceButton
                            onTranscript={(transcript) => {
                              setRecordsInputText(transcript);
                              handleSendMessage(transcript);
                              setRecordsInputText('');
                            }}
                          />
                          <button
                            onClick={() => {
                              if (recordsInputText.trim()) {
                                handleSendMessage(recordsInputText);
                                setRecordsInputText('');
                              }
                            }}
                            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all hover:scale-110 shadow-md"
                          >
                            <Send size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
      {/* Profile Page View - Chat Widget Container */}
      {showProfilePage && user && (
          <div className="chat-widget-container fixed bottom-4 right-4 w-[380px] h-[600px] bg-gradient-to-br from-blue-900/95 via-purple-900/95 to-blue-900/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm absolute top-0 left-0 right-0 z-50">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">My Profile</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-purple-200 font-bold text-lg">medcor</span>
                <Button
                  onClick={() => {
                    setShowProfilePage(false);
                    setShowChatInterface(true);
                    setSelectedMenuItem(null);
                  }}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 p-1 h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Profile Content */}
            <div className="flex-1 overflow-y-auto mt-16 p-6">
              <div className="space-y-6">
                {/* Profile Avatar */}
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                </div>
                
                {/* User Info */}
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <label className="text-purple-200 text-xs font-medium">Full Name</label>
                    <p className="text-white mt-1">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : user.username || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <label className="text-purple-200 text-xs font-medium">Email</label>
                    <p className="text-white mt-1">{user.email || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <label className="text-purple-200 text-xs font-medium">Username</label>
                    <p className="text-white mt-1">{user.username || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <label className="text-purple-200 text-xs font-medium">Role</label>
                    <p className="text-white mt-1 capitalize">{user.role || 'Patient'}</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <label className="text-purple-200 text-xs font-medium">Account Status</label>
                    <p className="text-white mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        user.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>
                
                {/* Logout Button */}
                <Button
                  onClick={() => {
                    logout();
                    setShowProfilePage(false);
                    setShowChatInterface(true);
                    setSelectedMenuItem(null);
                    toast({
                      title: "Logged Out",
                      description: "You have been successfully logged out",
                    });
                  }}
                  className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Admin Page View - Chat Widget Container */}
        {showAdminPage && (
          <div className="chat-widget-container fixed bottom-4 right-4 w-[380px] h-[600px] bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm absolute top-0 left-0 right-0 z-50">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">Admin Portal</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-purple-200 font-bold text-lg">medcor</span>
                <Button variant="ghost" size="sm" onClick={() => {
                  setShowAdminPage(false);
                  setSelectedMenuItem(null);
                  setShowChatInterface(true);
                }} className="p-0 text-white hover:bg-white/20">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => {
                setShowAdminPage(false);
                setSelectedMenuItem(null);
                setShowChatInterface(true);
              }}
              className="absolute top-[85px] left-[25px] flex items-center gap-1 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-md shadow-md hover:bg-white/30 transition-all transform hover:scale-105 z-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="font-medium text-sm">Back</span>
            </button>
            
            {/* Admin Content */}
            <div className="flex-1 pt-24 pb-6 px-6 overflow-y-auto">
              <div className="w-full">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20">
                  {/* Logo/Header */}
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      <UserCheck className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-1">Admin Login</h2>
                    <p className="text-white/70 text-xs">Healthcare Portal</p>
                  </div>

                  {/* Login Form */}
                  <form className="space-y-4" onSubmit={async (e) => {
                    e.preventDefault();
                    
                    try {
                      // Get form data
                      const formData = new FormData(e.currentTarget);
                      const email = formData.get('email') as string;
                      const password = formData.get('password') as string;

                      // Show loading toast
                      const loadingToast = toast({
                        title: "Signing In",
                        description: "Verifying your credentials...",
                        variant: "default"
                      });

                      // Simulate API call (replace with actual admin authentication)
                      const response = await fetch('/api/auth/admin-login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                      });

                      // Dismiss loading toast
                      loadingToast.dismiss();

                      if (response.ok) {
                        const data = await response.json();
                        
                        // Show success toast
                        toast({
                          title: "Login Successful! ✅",
                          description: `Welcome back, ${data.user?.name || 'Admin'}! You now have access to the healthcare management portal.`,
                          variant: "default"
                        });

                        // Store auth data (if needed)
                        if (data.token) {
                          localStorage.setItem('adminToken', data.token);
                          localStorage.setItem('adminUser', JSON.stringify(data.user));
                        }

                        // Close admin page and return to chat
                        setTimeout(() => {
                          setShowAdminPage(false);
                          setSelectedMenuItem(null);
                          setShowChatInterface(true);
                        }, 1500);

                      } else {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Invalid credentials');
                      }

                    } catch (error) {
                      console.error('Admin login error:', error);
                      
                      // Show error toast
                      toast({
                        title: "Login Failed ❌",
                        description: error instanceof Error ? error.message : "Invalid email or password. Please check your credentials and try again.",
                        variant: "destructive"
                      });
                    }
                  }}>
                    <div>
                      <label className="block text-xs font-medium text-white/90 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        defaultValue="admin@medcor.ai"
                        required
                        className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm"
                        placeholder="admin@medcor.ai"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-white/90 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        defaultValue="admin123"
                        required
                        className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm"
                        placeholder="Enter password"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-3 h-3 text-purple-400 bg-white/10 border-white/20 rounded focus:ring-purple-400 focus:ring-1"
                        />
                        <span className="ml-2 text-xs text-white/70">Remember</span>
                      </label>
                      
                      <button
                        type="button"
                        className="text-xs text-purple-300 hover:text-purple-200 transition-colors"
                      >
                        Forgot?
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg text-sm"
                    >
                      Sign In
                    </button>
                  </form>

                  {/* Quick Stats */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-white font-bold text-sm">25</div>
                        <div className="text-white/60 text-xs">Patients</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-white font-bold text-sm">6</div>
                        <div className="text-white/60 text-xs">Doctors</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
                
{/* Regular Chat Interface Content */}
{!showFacePage && !showAdminPage && !showDoctorList && !showRecordsList && !showBookingCalendar && !showSkinPage && !showLipsPage && !showHairPage && !showVoiceTipsPage && (
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
                            { icon: Calendar, label: "Book", angle: 0, action: () => { 
                              setShowChatInterface(false);
                              setShowBookingCalendar(true); 
                              setSelectedMenuItem("book");
                              setSelectedDate(null);
                              setBookingFormData(prev => ({ ...prev, selectedDate: null }));
                            } },
                            { icon: Users, label: "Doctors", angle: 51, action: () => { 
                              if (!isAuthenticated) {
                                setShowAuthOverlay(true);
                                return;
                              }
                              setShowDoctorList(true); 
                              setSelectedMenuItem("doctors");
                              setShowChatInterface(false);
                              setIsMinimized(true);
                            } },
                            { icon: FileText, label: "Records", angle: 102, action: () => { 
                              if (!isAuthenticated) {
                                setShowAuthOverlay(true);
                                return;
                              }
                              setShowRecordsList(true); 
                              setSelectedMenuItem("records"); 
                            } },
                            { icon: Phone, label: "Call", angle: 153, action: () => setSelectedMenuItem("call") },
                            { icon: UserCheck, label: "Admin", angle: 204, action: () => { 
                              console.log("🔥 ADMIN BUTTON CLICKED - Starting admin process");
                              console.log("🔥 Before state change - showAdminPage:", false);
                              
                              // Complete state reset for admin page
                              setShowAdminPage(true);
                              setSelectedMenuItem("admin");
                              setShowChatInterface(false);
                              setIsMinimized(false);
                              
                              // Reset ALL other conflicting states
                              setShowDoctorList(false);
                              setShowRecordsList(false);
                              setShowBookingCalendar(false);
                              setShowFacePage(false);
                              setShowHairPage(false);
                              setShowSkinPage(false);
                              setShowLipsPage(false);
                              setShowVoiceTipsPage(false);
                              setShowBookingForm(false);
                              
                              console.log("🔥 After state change - showAdminPage should be true");
                              
                              // Debug timeout to check state
                              setTimeout(() => {
                                console.log("🔥 1 second later - checking if admin page is visible");
                              }, 1000);
                            } },
                            { icon: Smile, label: "Face", angle: 255, action: () => { 
                              console.log('🔴 Face button clicked - Setting states synchronously');
                              
                              // Set Face page state first
                              setShowFacePage(true); 
                              setSelectedMenuItem("face");
                              
                              // Keep chat interface open for Face Analysis
                              setShowChatInterface(true);
                              
                              // Reset other conflicting states
                              setShowDoctorList(false);
                              setShowRecordsList(false);
                              setShowAdminPage(false);
                              setShowBookingCalendar(false);
                              setIsMinimized(false);
                              
                              console.log('🔴 Face states set - showFacePage: true, showChatInterface: true');
                            } },
                            { icon: Scissors, label: "Hair", angle: 306, action: async () => { 
                              console.log("🎬 Hair Analysis button clicked");
                              
                              try {
                                // Ensure camera is ready first
                                console.log("🎬 Ensuring camera is ready for hair analysis...");
                                const stream = await ensureCameraReady();
                                console.log("🎬 Camera stream ready:", stream);
                                
                                // Validate stream has active tracks
                                if (!stream || !stream.getTracks || stream.getTracks().length === 0) {
                                  throw new Error("Invalid camera stream - no active tracks");
                                }
                                
                                // Force update the shared stream reference
                                videoStreamRef.current = stream;
                                
                                // Small delay to ensure videoStreamRef is properly set
                                setTimeout(() => {
                                  // Update UI states
                                  setShowHairPage(true); 
                                  setSelectedMenuItem("hair"); 
                                  setIsMinimized(false); 
                                  setShowChatInterface(false);
                                  setStreamReady(true);
                                  
                                  console.log("🎬 Hair Analysis page activated successfully");
                                }, 100);
                                
                              } catch (err) {
                                console.error("🎬 Hair Analysis camera setup failed:", err);
                                
                                // Show error message to user
                                const errorMessage: Message = {
                                  id: `error_${Date.now()}`,
                                  text: "Camera access is required for hair analysis. Please enable camera permission and try again.",
                                  sender: "bot",
                                  timestamp: new Date()
                                };
                                setMessages(prev => [...prev, errorMessage]);
                              }
                            } },
                            { icon: LipsIcon, label: "Lips", angle: 280, action: async () => { 
                              console.log("💋 Lips Analysis button clicked");
                              
                              try {
                                // Ensure camera is ready first
                                console.log("💋 Ensuring camera is ready for lips analysis...");
                                const stream = await ensureCameraReady();
                                console.log("💋 Camera stream ready:", stream);
                                
                                // Validate stream has active tracks
                                if (!stream || !stream.getTracks || stream.getTracks().length === 0) {
                                  throw new Error("Invalid camera stream - no active tracks");
                                }
                                
                                // Force update the shared stream reference
                                videoStreamRef.current = stream;
                                
                                // Small delay to ensure videoStreamRef is properly set
                                setTimeout(() => {
                                  // Update UI states
                                  setShowLipsPage(true); 
                                  setSelectedMenuItem("lips"); 
                                  setIsMinimized(false); 
                                  setShowChatInterface(false);
                                  setStreamReady(true);
                                  
                                  console.log("💋 Lips Analysis page activated successfully");
                                }, 100);
                                
                              } catch (err) {
                                console.error("💋 Lips Analysis camera setup failed:", err);
                                
                                // Show error message to user
                                const errorMessage: Message = {
                                  id: `error_${Date.now()}`,
                                  text: "Camera access is required for lips analysis. Please enable camera permission and try again.",
                                  sender: "bot",
                                  timestamp: new Date()
                                };
                                setMessages(prev => [...prev, errorMessage]);
                              }
                            } }
                          ].map((item, index) => {
                            const angleRad = (item.angle * Math.PI) / 180;
                            const x = Math.cos(angleRad) * 75;
                            const y = Math.sin(angleRad) * 75;
                            
                            return (
                              <div
                                key={index}
                                className="absolute group"
                                style={{
                                  left: `calc(50% + ${x}px - 28px)`,
                                  top: `calc(50% + ${y}px - 28px)`,
                                }}
                              >
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                  <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                    {item.label}
                                  </div>
                                  {/* Tooltip Arrow */}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                </div>
                                
                                <button
                                  onClick={item.action}
                                  className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-200 ${
                                    selectedMenuItem === item.label.toLowerCase().replace(' ', '-')
                                      ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white scale-105 shadow-xl"
                                      : "bg-white/90 hover:bg-white text-gray-700 shadow-md hover:shadow-lg hover:scale-105"
                                  }`}
                                  style={{
                                    transform: 'translateZ(0)',
                                    backfaceVisibility: 'hidden'
                                  }}
                                >
                                  <item.icon className="h-7 w-7 transition-transform duration-200" />
                                  <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Face Analysis View - Separate container with higher z-index */}
      {showFacePage && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm z-50 rounded-lg overflow-hidden">
            {/* Back Button */}
            <button
              onClick={() => {
                setShowFacePage(false);
                setSelectedMenuItem(null);
              }}
              className="absolute top-[85px] left-[25px] flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="font-medium text-sm">Back</span>
            </button>
            
            {/* Face Analysis Content */}
            <div className="h-full flex flex-col justify-center items-center p-6 pt-24">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-purple-700 mb-4">MEDCOR Face Analysis</h2>
                <p className="text-gray-600 mb-6">Powered by Perfect Corp technology</p>
                
                {/* Face Analysis Component */}
                <FaceAnalysisWidgetInline
                  isOpen={true}
                  onClose={() => {
                    setShowFacePage(false);
                    setSelectedMenuItem(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

      {/* Hair Analysis View - Full chat widget structure */}
      {showHairPage && (
          <div className="chat-widget-container fixed bottom-4 right-4 w-[380px] h-[600px] bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50">
            {/* Header - Hair Analysis (No User Camera) */}
            <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm absolute top-0 left-0 right-0 z-50">
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700 text-sm">Hair Analysis</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-purple-600 font-bold text-lg">medcor</span>
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => {
                setShowHairPage(false);
                setSelectedMenuItem(null);
                setAnalysisStreamReady(false); // Reset analysis stream state
              }}
              className="absolute top-[85px] left-[25px] flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="font-medium text-sm">Back</span>
            </button>
            
            {/* Hair Analysis Content */}
            <div className="flex-1 pt-16">
              {(analysisStreamReady && videoStreamRef.current && videoStreamRef.current.getTracks && videoStreamRef.current.getTracks().length > 0) ? (
                <HairAnalysisWidget 
                  onClose={onClose}
                  videoStream={videoStreamRef.current}
                  capturePhotoRef={capturePhotoRef}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Initializing camera...</p>
                    <p className="text-gray-500 text-xs mt-2">Setting up camera stream for hair analysis</p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input at Bottom */}
            <div className="p-4 border-t border-gray-200 bg-white/80">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 pr-24 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && inputText.trim()) {
                      handleSendMessage(inputText);
                      setInputText('');
                    }
                  }}
                />
                
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <BrowserVoiceButton
                    onTranscript={(transcript) => {
                      setInputText(transcript);
                      handleSendMessage(transcript);
                      setInputText('');
                    }}
                  />
                  <button
                    onClick={() => {
                      if (inputText.trim()) {
                        handleSendMessage(inputText);
                        setInputText('');
                      }
                    }}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all hover:scale-110 shadow-md"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skin Analysis View - Full chat widget structure */}
        {showSkinPage && (
          <div className="chat-widget-container fixed bottom-4 right-4 w-[380px] h-[600px] bg-gradient-to-br from-pink-100/95 to-purple-100/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50">
            {/* Header - Skin Analysis (No User Camera) */}
            <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm absolute top-0 left-0 right-0 z-50">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-600" />
                <span className="text-gray-700 text-sm">Skin Analysis</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-purple-600 font-bold text-lg">medcor</span>
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => {
                setShowSkinPage(false);
                setSelectedMenuItem(null);
                setAnalysisStreamReady(false); // Reset analysis stream state
              }}
              className="absolute top-[85px] left-[25px] flex items-center gap-1 px-4 py-2 bg-pink-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-pink-700 transition-all transform hover:scale-105 z-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="font-medium text-sm">Back</span>
            </button>
            
            {/* Skin Analysis Content */}
            <div className="flex-1 pt-16">
              {(analysisStreamReady && videoStreamRef.current && videoStreamRef.current.getTracks && videoStreamRef.current.getTracks().length > 0) ? (
                <SkinAnalysisWidget 
                  onClose={onClose}
                  videoStream={videoStreamRef.current}
                  capturePhotoRef={capturePhotoRef}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Initializing camera...</p>
                    <p className="text-gray-500 text-xs mt-2">Setting up camera stream for skin analysis</p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input at Bottom */}
            <div className="p-4 border-t border-gray-200 bg-white/80">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 pr-24 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && inputText.trim()) {
                      handleSendMessage(inputText);
                      setInputText('');
                    }
                  }}
                />
                
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <BrowserVoiceButton
                    onTranscript={(transcript) => {
                      setInputText(transcript);
                      handleSendMessage(transcript);
                      setInputText('');
                    }}
                  />
                  <button
                    onClick={() => {
                      if (inputText.trim()) {
                        handleSendMessage(inputText);
                        setInputText('');
                      }
                    }}
                    className="p-3 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition-all hover:scale-110 shadow-md"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lips Analysis View - Full chat widget structure */}
        {showLipsPage && (
          <div className="chat-widget-container fixed bottom-4 right-4 w-[380px] h-[600px] bg-gradient-to-br from-pink-100/95 to-purple-100/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50">
            {/* Header - Lips Analysis (No User Camera) */}
            <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm absolute top-0 left-0 right-0 z-50">
              <div className="flex items-center gap-2">
                <LipsIcon className="h-4 w-4 text-pink-600" />
                <span className="text-gray-700 text-sm">Lips Analysis</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-purple-600 font-bold text-lg">medcor</span>
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => {
                setShowLipsPage(false);
                setSelectedMenuItem(null);
                setAnalysisStreamReady(false); // Reset analysis stream state
              }}
              className="absolute top-[85px] left-[25px] flex items-center gap-1 px-4 py-2 bg-pink-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-pink-700 transition-all transform hover:scale-105 z-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="font-medium text-sm">Back</span>
            </button>
            
            {/* Lips Analysis Content */}
            <div className="flex-1 pt-16">
              {(analysisStreamReady && videoStreamRef.current && videoStreamRef.current.getTracks && videoStreamRef.current.getTracks().length > 0) ? (
                <LipsAnalysisWidget 
                  onClose={onClose}
                  videoStream={videoStreamRef.current}
                  hasVideoStream={videoStreamRef.current && videoStreamRef.current.getTracks && videoStreamRef.current.getTracks().length > 0}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Initializing camera...</p>
                    <p className="text-gray-500 text-xs mt-2">Setting up camera stream for lips analysis</p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input at Bottom */}
            <div className="p-4 border-t border-gray-200 bg-white/80">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 pr-24 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && inputText.trim()) {
                      handleSendMessage(inputText);
                      setInputText('');
                    }
                  }}
                />
                
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <BrowserVoiceButton
                    onTranscript={(transcript) => {
                      setInputText(transcript);
                      handleSendMessage(transcript);
                      setInputText('');
                    }}
                  />
                  <button
                    onClick={() => {
                      if (inputText.trim()) {
                        handleSendMessage(inputText);
                        setInputText('');
                      }
                    }}
                    className="p-3 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition-all hover:scale-110 shadow-md"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
      {/* Booking Calendar View */}
      {showBookingCalendar && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm z-50 rounded-lg overflow-hidden flex flex-col">
            {/* Back Button */}
            <button
              onClick={() => {
                setShowBookingCalendar(false);
                // Reset selected date when closing calendar
                setSelectedDate(null);
                setBookingFormData(prev => ({ ...prev, selectedDate: null }));
              }}
              className="absolute top-4 left-4 flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="font-medium text-sm">Back</span>
            </button>
            
            {/* Calendar Content */}
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="bg-white rounded-2xl shadow-lg p-4 w-full max-w-sm">
                <h3 className="text-base font-semibold text-gray-800 mb-3 text-center">Book an Appointment</h3>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Week Days */}
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={index} className="text-center text-xs text-gray-500 font-medium py-1">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar Days */}
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - new Date().getDay() + 1;
                    const isToday = day === new Date().getDate();
                    const isSelectable = day >= new Date().getDate();
                    
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (isSelectable && day > 0 && day <= 31) {
                            const newDate = new Date();
                            newDate.setDate(day);
                            setSelectedDate(newDate);
                          }
                        }}
                        disabled={!isSelectable || day <= 0 || day > 31}
                        className={`
                          h-8 w-8 rounded-md text-xs font-medium transition-all
                          ${day <= 0 || day > 31 ? 'invisible' : ''}
                          ${isToday ? 'bg-yellow-600 text-white font-bold' : ''}
                          ${selectedDate?.getDate() === day && !isToday ? 'bg-purple-200 text-purple-800' : ''}
                          ${isSelectable && day > 0 && day <= 31 && !isToday && selectedDate?.getDate() !== day ? 'hover:bg-gray-100' : ''}
                          ${!isSelectable && day > 0 && day <= 31 ? 'text-gray-300 cursor-not-allowed' : ''}
                        `}
                      >
                        {day > 0 && day <= 31 ? day : ''}
                      </button>
                    );
                  })}
                </div>
                
                {/* Selected Date */}
                {selectedDate && (
                  <div className="mt-3 p-2 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-700">
                      Selected: {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                )}
                
                {/* Book Button */}
                <button
                  onClick={async () => {
                    if (selectedDate) {
                      // Store selected date first
                      setBookingFormData(prev => ({ ...prev, selectedDate }));
                      
                      // Initialize booking assistant
                      try {
                        const response = await fetch('/api/booking-assistant/initialize', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            sessionId: sessionId,
                            selectedDate: selectedDate.toISOString().split('T')[0]
                          })
                        });
                        
                        const assistantStep = await response.json();
                        console.log('Booking assistant initialized:', assistantStep);
                        
                        // Add assistant message to chat
                        const assistantMessage = {
                          id: Date.now().toString(),
                          text: assistantStep.message,
                          sender: 'bot' as const,
                          timestamp: new Date()
                        };
                        setMessages(prev => [...prev, assistantMessage]);
                        
                        // Make avatar speak the message
                        if (avatarRef.current) {
                          avatarRef.current.speak(assistantStep.message);
                        }
                        
                        // Navigate to doctor selection after initialization
                        setShowBookingCalendar(false);
                        setShowChatInterface(false);
                        setShowDoctorList(true);
                        setSelectedMenuItem('doctors');
                        // Force page to show doctors view
                        setIsMinimized(true);
                        
                      } catch (error) {
                        console.error('Failed to initialize booking assistant:', error);
                        // Even if API fails, show doctor list
                        setShowBookingCalendar(false);
                        setShowChatInterface(false);
                        setShowDoctorList(true);
                        setSelectedMenuItem('doctors');
                        // Force page to show doctors view
                        setIsMinimized(true);
                      }
                    }
                  }}
                  disabled={!selectedDate}
                  className={`
                    w-full mt-3 py-2 rounded-full font-medium transition-all text-sm
                    ${selectedDate 
                      ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  Select Doctor
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Booking Form View */}
        {showBookingForm && showChatInterface && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm z-50 rounded-lg overflow-hidden flex flex-col">
            {/* Back Button */}
            <button
              onClick={() => {
                setShowBookingForm(false);
                setShowChatInterface(true);
              }}
              className="absolute top-4 left-4 flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="font-medium text-sm">Back</span>
            </button>
            
            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-3 pt-16">
              <div className="bg-white rounded-lg shadow-lg p-3 w-full max-w-full">
                <h3 className="text-base font-semibold text-gray-800 mb-3 text-center">Book Appointment</h3>
                
                {/* Selected Date & Doctor Info */}
                <div className="mb-3 p-2 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-700">
                    Date: {bookingFormData.selectedDate?.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-xs text-purple-700">
                    Doctor: {bookingFormData.doctorId === 1 ? 'Dr. Sarah Johnson' : 
                            bookingFormData.doctorId === 2 ? 'Dr. Michael Chen' : 
                            'Dr. Emily Rodriguez'}
                  </p>
                </div>
                
                {/* Form Fields */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={bookingFormData.patientName}
                      onChange={(e) => setBookingFormData(prev => ({ ...prev, patientName: e.target.value }))}
                      placeholder="Your full name"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={bookingFormData.patientEmail}
                      onChange={(e) => setBookingFormData(prev => ({ ...prev, patientEmail: e.target.value }))}
                      placeholder="your.email@example.com"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={bookingFormData.patientPhone}
                      onChange={(e) => setBookingFormData(prev => ({ ...prev, patientPhone: e.target.value }))}
                      placeholder="+1 234 567 8900"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
                    <textarea
                      value={bookingFormData.reason}
                      onChange={(e) => setBookingFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Brief description of your concern"
                      rows={2}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>
                </div>
                
                {/* Voice Input Note */}
                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 text-center">
                    💡 You can also fill this form by speaking to our AI assistant
                  </p>
                </div>
                
                {/* Submit Button */}
                <button
                  onClick={async () => {
                    try {
                      // Show loading toast
                      const loadingToast = toast({
                        title: "Booking Appointment",
                        description: "Please wait while we confirm your appointment...",
                        variant: "default"
                      });

                      // Confirm appointment with booking assistant
                      const response = await fetch('/api/booking-assistant/confirm', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          sessionId: sessionId
                        })
                      });
                      
                      // Dismiss loading toast
                      loadingToast.dismiss();

                      if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                      }
                      
                      const assistantStep = await response.json();
                      console.log('Appointment confirmed with assistant:', assistantStep);
                      
                      // Show success toast
                      toast({
                        title: "Appointment Booked Successfully! ✅",
                        description: `Your appointment with ${bookingFormData.doctorId === 1 ? 'Dr. Sarah Johnson' : 'Dr. Emily Rodriguez'} has been confirmed. You will receive a confirmation email shortly.`,
                        variant: "default"
                      });
                      
                      // Add assistant confirmation message
                      const assistantMessage = {
                        id: (Date.now() + 5).toString(),
                        text: assistantStep.message,
                        sender: 'bot' as const,
                        timestamp: new Date()
                      };
                      setMessages(prev => [...prev, assistantMessage]);
                      
                      // Make avatar speak the confirmation
                      if (avatarRef.current) {
                        avatarRef.current.speak(assistantStep.message);
                      }
                      
                      // Reset form and UI - Complete reset to main chat
                      setBookingFormData({
                        selectedDate: null,
                        doctorId: 1,
                        patientName: '',
                        patientEmail: '',
                        patientPhone: '',
                        reason: ''
                      });
                      setShowBookingForm(false);
                      setShowChatInterface(true);
                      setShowDoctorList(false);
                      setShowBookingCalendar(false);
                      setShowFacePage(false);
                      setFaceAnalysisCameraActive(false);
                      setFaceAnalysisResult(null);
                      setFaceAnalysisError(null);
                      setIsMinimized(false);
                      setSelectedMenuItem('');
                      setSelectedDate(null);
                      setAvatarPosition({ x: null, y: null });
                      
                    } catch (error) {
                      console.error('Booking confirmation error:', error);
                      
                      // Show error toast
                      toast({
                        title: "Booking Failed ❌",
                        description: "Unable to confirm your appointment. Please check your connection and try again, or contact our support team.",
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={!bookingFormData.patientName || !bookingFormData.patientEmail || !bookingFormData.patientPhone}
                  className={`
                    w-full mt-2 py-2 rounded-full font-medium transition-all text-xs
                    ${(bookingFormData.patientName && bookingFormData.patientEmail && bookingFormData.patientPhone)
                      ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  Book Appointment
                </button>
                
                {/* Chat Input for Voice */}
                <div className="mt-2 flex items-center gap-1 p-1.5 bg-gray-50 rounded-full">
                  <input
                    type="text"
                    placeholder="Or speak to fill the form..."
                    className="flex-1 bg-transparent text-xs placeholder-gray-500 focus:outline-none"
                    onKeyPress={async (e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const userInput = e.currentTarget.value;
                        e.currentTarget.value = '';
                        
                        // Process with booking assistant
                        try {
                          const response = await fetch('/api/booking-assistant/process-input', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              sessionId: sessionId,
                              userInput: userInput
                            })
                          });
                          
                          const assistantStep = await response.json();
                          console.log('Form input processed:', assistantStep);
                          
                          // Add user message to chat
                          const userMessage = {
                            id: Date.now().toString(),
                            text: userInput,
                            sender: 'user' as const,
                            timestamp: new Date()
                          };
                          setMessages(prev => [...prev, userMessage]);
                          
                          // Add assistant response
                          const assistantMessage = {
                            id: (Date.now() + 3).toString(),
                            text: assistantStep.message,
                            sender: 'bot' as const,
                            timestamp: new Date()
                          };
                          setMessages(prev => [...prev, assistantMessage]);
                          
                          // Make avatar speak the message
                          if (avatarRef.current) {
                            avatarRef.current.speak(assistantStep.message);
                          }
                        } catch (error) {
                          console.error('Failed to process form input:', error);
                          handleSendMessage(userInput);
                        }
                      }
                    }}
                  />
                  <BrowserVoiceButton
                    onTranscript={async (transcript: string) => {
                      if (transcript.trim()) {
                        // Process with booking assistant
                        try {
                          const response = await fetch('/api/booking-assistant/process-input', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              sessionId: sessionId,
                              userInput: transcript
                            })
                          });
                          
                          const assistantStep = await response.json();
                          console.log('Voice input processed:', assistantStep);
                          
                          // Add user message to chat
                          const userMessage = {
                            id: Date.now().toString(),
                            text: transcript,
                            sender: 'user' as const,
                            timestamp: new Date()
                          };
                          setMessages(prev => [...prev, userMessage]);
                          
                          // Add assistant response
                          const assistantMessage = {
                            id: (Date.now() + 4).toString(),
                            text: assistantStep.message,
                            sender: 'bot' as const,
                            timestamp: new Date()
                          };
                          setMessages(prev => [...prev, assistantMessage]);
                          
                          // Make avatar speak the message
                          if (avatarRef.current) {
                            avatarRef.current.speak(assistantStep.message);
                          }
                        } catch (error) {
                          console.error('Failed to process voice input:', error);
                          handleSendMessage(transcript);
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Animated Button on Chest Area */}
        <div className={`absolute left-1/2 top-[68%] transform -translate-x-1/2 -translate-y-1/2 z-30 ${showChatInterface ? 'hidden' : ''}`}>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="relative w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-110 animate-float"
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
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                sideOffset={12}
                className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-xl border-none z-[100]"
              >
                <p>Click to open AI assistant menu</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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

      {/* Patient Auth Overlay with Tabs */}
      {showAuthOverlay && (
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-2">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs mx-2 relative max-h-[90%] overflow-y-auto">
            <button
              onClick={() => {
                setShowAuthOverlay(false);
                setAuthTab('login');
                loginForm.reset();
                setLoginError(null);
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="p-5">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">
                  {authTab === 'login' ? 'Patient Login' : 'Create Account'}
                </h2>
                <p className="text-sm text-gray-600">
                  {authTab === 'login' ? 'Access your health records' : 'Register for MedCare AI'}
                </p>
              </div>

              {/* Tab Buttons */}
              <div className="flex mb-4 bg-gray-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('login');
                    loginForm.reset();
                    setLoginError(null);
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    authTab === 'login'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signup');
                    loginForm.reset();
                    setLoginError(null);
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    authTab === 'signup'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Login/Signup Form */}
              {authTab === 'login' ? (
                <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-8 h-9 text-sm"
                      {...loginForm.register("email")}
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-red-500">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-8 pr-8 h-9 text-sm"
                      {...loginForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-red-500">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {loginError && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-xs text-red-600">{loginError}</p>
                  </div>
                )}

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-9 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-medium"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>

                {/* Divider */}
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Google SSO */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 border-gray-300 hover:bg-gray-50 text-sm"
                  onClick={() => window.location.href = '/api/auth/google'}
                >
                  <FaGoogle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-gray-700 font-medium">Continue with Google</span>
                </Button>
              </form>
              ) : (
                /* Signup Form */
                <form onSubmit={(e) => {
                  e.preventDefault();
                  // For now, show informational message
                  toast({
                    title: "Registration",
                    description: "Please contact your healthcare provider or clinic administrator to register for an account. They will provide you with login credentials.",
                    variant: "default"
                  });
                }} className="space-y-4">
                  {/* Name Field */}
                  <div className="space-y-1">
                    <Label htmlFor="signup-name" className="text-xs font-medium text-gray-700">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        className="pl-8 h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-1">
                    <Label htmlFor="signup-email" className="text-xs font-medium text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-8 h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1">
                    <Label htmlFor="signup-password" className="text-xs font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        className="pl-8 pr-8 h-9 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Info Message */}
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs text-blue-600">
                      Note: Patient registration requires approval from your healthcare provider.
                    </p>
                  </div>

                  {/* Signup Button */}
                  <Button
                    type="submit"
                    className="w-full h-9 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-medium"
                  >
                    Request Account
                  </Button>

                  {/* Divider */}
                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  {/* Google SSO */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-9 border-gray-300 hover:bg-gray-50 text-sm"
                    onClick={() => window.location.href = '/api/auth/google'}
                  >
                    <FaGoogle className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-gray-700 font-medium">Continue with Google</span>
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Page View */}
      {showProfilePage && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm z-50 rounded-lg overflow-hidden">
          {/* Back Button */}
          <button
            onClick={() => {
              setShowProfilePage(false);
              setShowChatInterface(true);
              setSelectedMenuItem("");
            }}
            className="absolute top-[85px] left-[25px] flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="font-medium text-sm">Back</span>
          </button>
          
          {/* Profile Content */}
          <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Your Profile</h2>
                <p className="text-sm text-gray-600 mt-1">Patient Account</p>
              </div>
              
              {/* User Information */}
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <p className="text-xs text-gray-500 mb-1">Name</p>
                  <p className="text-sm font-medium text-gray-800">
                    {user?.first_name} {user?.last_name || ''}
                  </p>
                </div>
                
                <div className="border-b pb-3">
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-800">
                    {user?.email || 'Not provided'}
                  </p>
                </div>
                
                <div className="border-b pb-3">
                  <p className="text-xs text-gray-500 mb-1">Role</p>
                  <p className="text-sm font-medium text-gray-800 capitalize">
                    {user?.role || 'Patient'}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 mb-1">Account Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm font-medium text-gray-800">Active</p>
                  </div>
                </div>
              </div>
              
              {/* Logout Button */}
              <Button
                onClick={() => {
                  logout();
                  setShowProfilePage(false);
                  setShowChatInterface(true);
                  setSelectedMenuItem("");
                  toast({
                    title: "Logged Out",
                    description: "You have been successfully logged out.",
                  });
                }}
                className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Skincare Tips View - Full chat widget structure */}
      {showVoiceTipsPage && (
          <div className="chat-widget-container fixed bottom-4 right-4 w-[380px] h-[600px] bg-gradient-to-br from-blue-100/95 to-green-100/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50">
            {/* Header - Voice Skincare Tips */}
            <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm absolute top-0 left-0 right-0 z-50">
              <div className="flex items-center gap-2">
                <VoiceIcon className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700 text-sm">Voice Skincare Tips</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-purple-600 font-bold text-lg">medcor</span>
                <Button variant="ghost" size="sm" onClick={onClose} className="p-0">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => {
                setShowVoiceTipsPage(false);
                setSelectedMenuItem(null);
              }}
              className="absolute top-[85px] left-[25px] flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105 z-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="font-medium text-sm">Back</span>
            </button>
            
            {/* Voice Skincare Tips Content */}
            <div className="flex-1 pt-16">
              <VoiceSkincareWidget 
                onClose={() => {
                  setShowVoiceTipsPage(false);
                  setSelectedMenuItem(null);
                }}
              />
            </div>
          </div>
        )}

      {/* Hair Extension View - Full chat widget structure */}
      {showHairExtensionWidget && (
          <div className="chat-widget-container fixed bottom-4 right-4 w-[380px] h-[600px] bg-gradient-to-br from-purple-100/95 to-pink-100/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50">
            {/* Header - Hair Extension */}
            <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm absolute top-0 left-0 right-0 z-50">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-600" />
                <span className="text-gray-700 text-sm">Hair Extension</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-purple-600 font-bold text-lg">medcor</span>
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => {
                setShowHairExtensionWidget(false);
                setSelectedMenuItem(null);
              }}
              className="absolute top-[85px] left-[25px] flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="font-medium text-sm">Back</span>
            </button>
            
            {/* Hair Extension Content */}
            <div className="flex-1 pt-16 overflow-hidden">
              <HairExtensionWidget 
                isOpen={true}
                onClose={() => {
                  setShowHairExtensionWidget(false);
                  setSelectedMenuItem(null);
                }}
                isEmbedded={true}
              />
            </div>
          </div>
        )}
    </div>
    </>
  );
}

export default AvatarChatWidget;