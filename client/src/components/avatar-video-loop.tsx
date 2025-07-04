import { useEffect, useRef, useState } from 'react';
import AvatarPlaceholder from './avatar-placeholder';

interface AvatarVideoLoopProps {
  isActive: boolean;
  onVideoReady?: () => void;
  className?: string;
}

export default function AvatarVideoLoop({ isActive, onVideoReady, className = "" }: AvatarVideoLoopProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  
  useEffect(() => {
    if (videoRef.current && isActive && !videoError) {
      // Set video to loop and play
      videoRef.current.loop = true;
      videoRef.current.muted = true; // Muted to allow autoplay
      videoRef.current.play().catch(error => {
        console.error("Error playing avatar video:", error);
      });
    }
  }, [isActive, videoError]);
  
  const handleVideoLoaded = () => {
    console.log("Avatar video loop loaded and ready");
    setVideoError(false);
    onVideoReady?.();
  };
  
  if (!isActive) return null;
  
  return (
    <div className={`relative w-full h-full ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        onLoadedData={handleVideoLoaded}
        onError={(e) => {
          console.error("Error loading avatar video:", e);
          console.log("Please record the avatar using: POST /api/avatar/record");
        }}
        playsInline
        autoPlay
        loop
        muted
      >
        <source src="/recordings/avatar-idle-loop.mp4" type="video/mp4" />
        {/* Fallback for browsers that don't support MP4 */}
        <source src="/recordings/avatar-idle-loop.webm" type="video/webm" />
      </video>
      
      {/* Instructions if video not found */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
        <div className="text-center p-4 bg-white/90 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600 mb-2">Avatar video not found</p>
          <p className="text-xs text-gray-500">To record avatar:</p>
          <code className="text-xs bg-gray-100 p-1 rounded block mt-1">
            POST /api/avatar/record
          </code>
        </div>
      </div>
    </div>
  );
}