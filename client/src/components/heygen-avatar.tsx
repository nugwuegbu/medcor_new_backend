import { useEffect, useRef, useState } from "react";
import AnimatedTextOverlay from "./animated-text-overlay";

interface HeyGenAvatarProps {
  avatarResponse?: {
    videoUrl?: string;
    audioUrl?: string;
    text: string;
  };
  isLoading?: boolean;
  userSpeechText?: string;
  isUserSpeaking?: boolean;
}

export default function HeyGenAvatar({ avatarResponse, isLoading, userSpeechText, isUserSpeaking }: HeyGenAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (avatarResponse?.videoUrl && videoRef.current) {
      // In a real implementation, this would load the HeyGen video
      // For now, we'll show a placeholder with animation
      setIsPlaying(true);
      
      // Simulate video playing for the duration of the response
      const duration = Math.max(3000, avatarResponse.text.length * 100);
      const timer = setTimeout(() => {
        setIsPlaying(false);
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
      {/* Avatar Container */}
      <div className="relative">
        {avatarResponse?.videoUrl ? (
          <video
            ref={videoRef}
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            autoPlay
            muted
            loop={false}
          >
            <source src={avatarResponse.videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div className={`w-32 h-32 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg transition-all duration-300 ${isPlaying ? 'scale-110' : 'scale-100'}`}>
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7C14.45 7 14 7.45 14 8V16C14 16.55 14.45 17 15 17H21V15H16V9H21ZM9 13.5C9 14.11 8.61 14.61 8.06 14.81L6.5 15.25C5.44 15.59 4.5 16.61 4.5 17.75V22H2.5V17.75C2.5 15.97 3.81 14.43 5.56 13.95L7.44 13.45C7.61 13.41 7.75 13.27 7.75 13.08V12.42C7.33 12.15 7 11.63 7 11V9C7 8.45 7.45 8 8 8H10C10.55 8 11 8.45 11 9V11C11 11.63 10.67 12.15 10.25 12.42V13.08C10.25 13.27 10.39 13.41 10.56 13.45L12.44 13.95C14.19 14.43 15.5 15.97 15.5 17.75V22H13.5V17.75C13.5 16.61 12.56 15.59 11.5 15.25L9.94 14.81C9.39 14.61 9 14.11 9 13.5Z"/>
              </svg>
            </div>
          </div>
        )}
        
        {/* Speaking Indicator */}
        {isPlaying && (
          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        )}
      </div>
      
      {/* Animated Text Overlay for User Speech */}
      <AnimatedTextOverlay
        text={userSpeechText || ""}
        isVisible={isUserSpeaking || false}
        duration={3000}
      />
      
      {/* Status Text */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-xs text-gray-600 bg-white/80 px-3 py-1 rounded-full">
          {isPlaying ? "Speaking..." : "Ready to help"}
        </p>
      </div>
    </div>
  );
}