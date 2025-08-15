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
      {!videoError ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          onLoadedData={handleVideoLoaded}
          onError={(e) => {
            console.error("Error loading avatar video:", e);
            setVideoError(true);
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
      ) : (
        <AvatarPlaceholder />
      )}
    </div>
  );
}