import { useEffect, useRef, useState } from "react";
import AnimatedTextOverlay from "./animated-text-overlay";

interface HeyGenAvatarProps {
  avatarResponse?: {
    videoUrl?: string;
    audioUrl?: string;
    text: string;
    isSimulated?: boolean;
  };
  isLoading?: boolean;
  userSpeechText?: string;
  isUserSpeaking?: boolean;
}

export default function HeyGenAvatar({ avatarResponse, isLoading, userSpeechText, isUserSpeaking }: HeyGenAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lipSyncAnimation, setLipSyncAnimation] = useState(false);

  useEffect(() => {
    if (avatarResponse?.text) {
      setIsPlaying(true);
      setLipSyncAnimation(true);
      
      // Simulate realistic speaking duration (150-200 WPM reading speed)
      const wordCount = avatarResponse.text.split(' ').length;
      const duration = Math.max(2000, (wordCount / 3) * 1000); // ~180 WPM
      
      const timer = setTimeout(() => {
        setIsPlaying(false);
        setLipSyncAnimation(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [avatarResponse]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse mb-3 mx-auto flex items-center justify-center">
            <div className="w-8 h-8 bg-white rounded-full opacity-80"></div>
          </div>
          <p className="text-sm text-gray-600 animate-pulse">AI is thinking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center overflow-hidden">
      {/* Interactive Medical Avatar */}
      <div className="relative">
        {avatarResponse?.videoUrl ? (
          <video
            ref={videoRef}
            className="w-24 h-32 rounded-lg object-cover border-2 border-white shadow-lg"
            autoPlay
            muted
            loop={false}
          >
            <source src={avatarResponse.videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div className="relative">
            {/* Medical Professional Avatar */}
            <div className={`w-24 h-32 bg-gradient-to-b from-white to-blue-50 rounded-lg border-2 border-white shadow-lg overflow-hidden transition-all duration-300 ${
              isPlaying ? 'scale-105 shadow-xl' : 'scale-100'
            }`}>
              {/* Face and Hair */}
              <div className="relative h-20 bg-gradient-to-b from-pink-100 to-pink-50">
                {/* Hair */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-amber-700 rounded-t-full"></div>
                
                {/* Face */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-14 bg-pink-100 rounded-full">
                  {/* Eyes */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    <div className={`w-1.5 h-1.5 bg-blue-800 rounded-full transition-transform duration-200 ${
                      lipSyncAnimation ? 'scale-110' : ''
                    }`}></div>
                    <div className={`w-1.5 h-1.5 bg-blue-800 rounded-full transition-transform duration-200 ${
                      lipSyncAnimation ? 'scale-110' : ''
                    }`}></div>
                  </div>
                  
                  {/* Nose */}
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-pink-200 rounded-full"></div>
                  
                  {/* Mouth with Lip Sync Animation */}
                  <div className={`absolute top-8 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
                    lipSyncAnimation 
                      ? 'w-3 h-2 bg-red-300 rounded-full animate-pulse' 
                      : 'w-2 h-1 bg-red-200 rounded-full'
                  }`}></div>
                </div>
              </div>
              
              {/* Medical Coat */}
              <div className="h-12 bg-white relative">
                {/* Collar */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-gray-100 rounded-t-sm"></div>
                
                {/* Stethoscope */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-6 h-6">
                  <div className="w-full h-1 bg-gray-600 rounded-full"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-600 rounded-full"></div>
                </div>
                
                {/* Breathing Animation */}
                <div className={`absolute inset-0 transition-all duration-2000 ${
                  isPlaying ? 'animate-pulse' : ''
                }`}>
                  <div className="w-full h-full bg-gradient-to-b from-transparent to-blue-50 opacity-30"></div>
                </div>
              </div>
            </div>
            
            {/* Speaking Indicator */}
            {isPlaying && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Animated Text Overlay for User Speech */}
      <AnimatedTextOverlay
        text={userSpeechText || ""}
        isVisible={isUserSpeaking || false}
        duration={3000}
      />
      
      {/* Medical Badge */}
      <div className="absolute top-2 right-2">
        <div className="bg-white/90 px-2 py-1 rounded-full shadow-sm">
          <span className="text-xs font-medium text-purple-600">Dr. AI</span>
        </div>
      </div>
      
      {/* Status Text */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-xs text-gray-600 bg-white/80 px-2 py-1 rounded-full">
          {isPlaying ? "Speaking..." : "Ready to help"}
        </p>
      </div>
    </div>
  );
}