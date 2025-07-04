import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowRight, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import FaceRecognition from "./face-recognition";
import VoiceAvatarChat from "./voice-avatar-chat";

interface MedcorChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MedcorChatModal({ isOpen, onClose }: MedcorChatModalProps) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [showFaceRecognition, setShowFaceRecognition] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [recognizedUser, setRecognizedUser] = useState<any>(null);

  const services = [
    {
      id: "face",
      title: "Face Recognition",
      subtitle: "Online Face Editor",
      description: "Instant patient recognition and language detection",
      gradient: "from-purple-400 to-pink-400",
      image: "/api/placeholder/300/400?text=Face+Recognition",
      route: "/face-recognition",
      action: () => setShowFaceRecognition(true)
    },
    {
      id: "doctor",
      title: "Doctor Portfolio",
      subtitle: "Medical Specialists", 
      description: "Connect with our expert healthcare professionals",
      gradient: "from-blue-400 to-cyan-400",
      image: "/api/placeholder/300/400?text=Doctor",
      route: "/doctors"
    },
    {
      id: "appointment",
      title: "Appointment Booking",
      subtitle: "Schedule Your Visit",
      description: "Book appointments with your preferred doctor",
      gradient: "from-indigo-500 to-blue-600",
      image: "/api/placeholder/300/400?text=Appointment",
      route: "/appointments"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev < services.length - 1 ? prev + 1 : 0));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : services.length - 1));
  };

  const handleFaceRecognition = (result: any) => {
    console.log("Face recognition result:", result);
    setRecognizedUser(result);
    if (result.preferredLanguage) {
      setCurrentLanguage(result.preferredLanguage);
    }
    if (result.recognized) {
      // Start voice chat with recognized user
      setShowFaceRecognition(false);
      setShowVoiceChat(true);
    }
  };

  const handleLanguageDetection = (language: string) => {
    console.log("Language detected:", language);
    setCurrentLanguage(language);
  };

  const startVoiceChat = () => {
    setShowVoiceChat(true);
  };

  const goBackToServices = () => {
    setShowFaceRecognition(false);
    setShowVoiceChat(false);
    setRecognizedUser(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative w-full max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur rounded-t-3xl">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <span className="text-gray-700 font-medium">AI Assistant</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  medcor
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-gradient-to-br from-blue-100 via-purple-50 to-cyan-100 rounded-b-3xl p-8">
            {showVoiceChat ? (
              <div className="space-y-6">
                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={goBackToServices}
                    className="mb-4"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Options
                  </Button>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Voice Avatar Assistant
                  </h2>
                  {recognizedUser?.recognized && (
                    <div className="mb-4">
                      <Badge variant="secondary" className="text-sm">
                        Welcome back! Recognized patient
                      </Badge>
                    </div>
                  )}
                  <p className="text-gray-600">
                    Speak with our AI health assistant using voice commands and interactive avatars
                  </p>
                </div>
                <div className="flex justify-center">
                  <VoiceAvatarChat
                    sessionId="medcor-voice-chat"
                    language={currentLanguage}
                    userId={recognizedUser?.userId}
                    avatarId="heygen_avatar_nurse_medcor"
                  />
                </div>
              </div>
            ) : showFaceRecognition ? (
              <div className="space-y-6">
                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={goBackToServices}
                    className="mb-4"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Options
                  </Button>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Face Recognition Login
                  </h2>
                  <p className="text-gray-600">
                    Look at your camera for instant recognition and personalized service
                  </p>
                </div>
                <div className="flex justify-center">
                  <FaceRecognition
                    sessionId="medcor-modal"
                    onRecognitionComplete={handleFaceRecognition}
                    onLanguageDetected={handleLanguageDetection}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Please select options from below
                  </h2>
                </div>

                {/* Service Cards Carousel */}
                <div className="relative">
                  <div className="flex gap-4 overflow-hidden">
                    {/* Previous partial card */}
                    {currentSlide > 0 && (
                      <div className="flex-shrink-0 w-32 opacity-50">
                        <Card className={`h-96 bg-gradient-to-br ${services[currentSlide - 1].gradient} text-white overflow-hidden`}>
                          <CardContent className="p-6 h-full flex flex-col justify-between">
                            <div>
                              <h3 className="text-lg font-bold mb-2">
                                {services[currentSlide - 1].title}
                              </h3>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Main card */}
                    <div className="flex-1 max-w-md mx-auto">
                      <Card className={`h-96 bg-gradient-to-br ${services[currentSlide].gradient} text-white overflow-hidden shadow-2xl`}>
                        <CardContent className="p-6 h-full flex flex-col justify-between relative">
                          <div className="text-center">
                            <h3 className="text-2xl font-bold mb-2">
                              {services[currentSlide].title}
                            </h3>
                            <p className="text-white/90 mb-4">
                              {services[currentSlide].subtitle}
                            </p>
                            
                            <Link href={services[currentSlide].route}>
                              <Button 
                                variant="secondary" 
                                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                                onClick={services[currentSlide].action}
                              >
                                VIEW DETAIL
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </Link>
                          </div>

                          {/* Mock image placeholder */}
                          <div className="mt-4 flex-1 bg-white/10 rounded-lg flex items-center justify-center">
                            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                              <span className="text-white/80 text-sm">
                                {services[currentSlide].title.split(' ')[0]}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Next partial card */}
                    {currentSlide < services.length - 1 && (
                      <div className="flex-shrink-0 w-32 opacity-50">
                        <Card className={`h-96 bg-gradient-to-br ${services[currentSlide + 1].gradient} text-white overflow-hidden`}>
                          <CardContent className="p-6 h-full flex flex-col justify-between">
                            <div>
                              <h3 className="text-lg font-bold mb-2">
                                {services[currentSlide + 1].title}
                              </h3>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>

                  {/* Navigation arrows */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 bg-white/80 hover:bg-white"
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 bg-white/80 hover:bg-white"
                    onClick={nextSlide}
                    disabled={currentSlide === services.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Dots indicator */}
                <div className="flex justify-center gap-2">
                  {services.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentSlide ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                      onClick={() => setCurrentSlide(index)}
                    />
                  ))}
                </div>

                {/* Bottom actions */}
                <div className="flex justify-center gap-4">
                  <Button 
                    onClick={startVoiceChat}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Voice Chat
                  </Button>
                  <Link href="/chat">
                    <Button 
                      variant="outline" 
                      className="bg-white/80 hover:bg-white"
                      onClick={onClose}
                    >
                      Traditional Text Chat
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}