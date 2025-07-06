import { useState, useRef, useEffect } from "react";
import HeyGenSDKAvatar from './heygen-sdk-avatar';

interface DynamicVideoPlayerProps {
  sessionId: string;
  onUserInteraction: () => void;
  onModeChange: (mode: 'loop' | 'heygen' | 'idle') => void;
  heyGenProps?: any; // HeyGen avatar props when in heygen mode
}

interface PlayerState {
  id: string;
  isPlaying: boolean;
  currentVideo: string | null;
  mode: 'loop' | 'heygen' | 'idle';
  lastInteraction: Date;
  loopCount: number;
  sessionActive: boolean;
}

export default function DynamicVideoPlayer({ sessionId, onUserInteraction, onModeChange, heyGenProps }: DynamicVideoPlayerProps) {
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  


  // Initialize player on component mount
  useEffect(() => {
    initializePlayer();
    console.log("🎬 Video Player Manager initialized: idle");
  }, [sessionId]);

  // COMPLETELY REMOVE INACTIVITY CHECKS
  useEffect(() => {
    // Clear any existing timers
    if (inactivityTimerRef.current) {
      clearInterval(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    
    return () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
    };
  }, []);

  const initializePlayer = async () => {
    try {
      const response = await fetch('/api/video/player/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          videoId: 'adana01'
        })
      });

      const data = await response.json();
      if (data.success) {
        setPlayerState(data.playerState);
        setVideoUrl(data.videoUrl);
        setIsInitialized(true);
        onModeChange(data.playerState.mode);
      }
    } catch (error) {
      console.error('Failed to initialize video player:', error);
    }
  };

  const switchToHeyGen = async () => {
    console.log('🎬 FORCE SWITCHING TO HEYGEN MODE');
    
    try {
      // Tell backend to switch to HeyGen mode
      const response = await fetch('/api/video/player/switch-heygen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      const data = await response.json();
      if (data.success) {
        setPlayerState(data.playerState);
        onModeChange('heygen');
        onUserInteraction();
        console.log('🎬 HEYGEN MODE FORCED - Backend updated');
      }
    } catch (error) {
      console.error('Failed to switch to HeyGen:', error);
      // Fallback to local state update
      const newState = { 
        ...playerState, 
        mode: 'heygen' as const,
        lastInteraction: new Date().toISOString()
      };
      setPlayerState(newState);
      onModeChange('heygen');
      onUserInteraction();
    }
  };

  const switchToLoop = async () => {
    try {
      const response = await fetch('/api/video/player/switch-loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      const data = await response.json();
      if (data.success) {
        setPlayerState(data.playerState);
        setVideoUrl(data.videoUrl);
        onModeChange(data.playerState.mode);
        
        // Restart video when switching back to loop
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play();
        }
      }
    } catch (error) {
      console.error('Failed to switch to loop:', error);
    }
  };

  const checkInactivity = async () => {
    // COMPLETELY DISABLED - Never switch back to loop
    return;
  };

  const updateInteraction = async () => {
    try {
      await fetch('/api/video/player/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
    } catch (error) {
      console.error('Failed to update interaction:', error);
    }
  };

  // Handle video events
  const handleVideoEnded = () => {
    if (playerState?.mode === 'loop' && videoRef.current) {
      // Loop the video - ensure it plays full duration
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(e => console.error('Video restart failed:', e));
        }
      }, 100);
    }
  };

  // Handle user interaction (message send, typing, etc.)
  const handleUserInput = useCallback(async () => {
    console.log('🎬 handleUserInput called - Current mode:', playerState?.mode);
    await updateInteraction();
    if (playerState?.mode === 'loop') {
      console.log('🎬 Switching from loop to HeyGen mode');
      await switchToHeyGen();
    } else {
      console.log('🎬 Already in HeyGen mode, no switch needed');
    }
  }, [playerState, updateInteraction, switchToHeyGen]);

  // Expose interaction handler to parent component
  useEffect(() => {
    const handleInteraction = async () => {
      console.log('🎬 Video Player Interaction triggered - Current mode:', playerState?.mode);
      await handleUserInput();
    };
    
    (window as any).triggerVideoPlayerInteraction = handleInteraction;
    console.log('✅ triggerVideoPlayerInteraction exposed on window');
    
    return () => {
      delete (window as any).triggerVideoPlayerInteraction;
      console.log('🗑️ triggerVideoPlayerInteraction removed from window');
    };
  }, [playerState, handleUserInput]);

  if (!isInitialized || !playerState) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing video player...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      {console.log('🎬 RENDER DEBUG - playerState:', playerState)}
      {console.log('🎬 RENDER DEBUG - mode:', playerState.mode)}
      {console.log('🎬 RENDER DEBUG - videoUrl:', videoUrl)}
      {playerState.mode === 'loop' && videoUrl ? (
        <video
          key="loop-video-element" // Force React to unmount/remount on mode change
          ref={videoRef}
          src={videoUrl}
          autoPlay
          muted
          loop={false} // We handle looping manually to track loop count
          preload="auto" // Preload the entire video
          playsInline
          onEnded={handleVideoEnded}
          onLoadedMetadata={() => {
            // Ensure video starts from beginning and plays full duration
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              console.log('Video loaded - Duration:', videoRef.current.duration);
            }
          }}
          onCanPlay={() => {
            // Auto-play when video is ready
            if (videoRef.current) {
              videoRef.current.play().catch(e => console.error('Video play failed:', e));
            }
          }}
          onTimeUpdate={() => {
            // Log video progress for debugging
            if (videoRef.current) {
              const progress = (videoRef.current.currentTime / videoRef.current.duration * 100).toFixed(1);
              if (videoRef.current.currentTime > 0 && videoRef.current.currentTime % 2 < 0.1) {
                console.log(`Video progress: ${progress}% (${videoRef.current.currentTime.toFixed(1)}s / ${videoRef.current.duration.toFixed(1)}s)`);
              }
            }
          }}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : playerState.mode === 'heygen' ? (
        <div key="heygen-container" className="absolute inset-0 z-0">
          {console.log('🎬 HEYGEN MODE - NO VIDEO SHOULD BE PLAYING')}
          {/* In HeyGen mode, DynamicVideoPlayer should NOT render anything */}
          {/* HeyGen avatar is handled by parent component */}
        </div>
      ) : (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">Player in idle mode</p>
        </div>
      )}
      

    </div>
  );
}