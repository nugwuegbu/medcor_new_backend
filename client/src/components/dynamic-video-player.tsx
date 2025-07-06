import { useState, useRef, useEffect, useCallback } from "react";
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
  


  // Initialize player on component mount - only if not already initialized
  useEffect(() => {
    if (!playerState) {
      initializePlayer();
      console.log("🎬 Video Player Manager initialized: idle");
    } else {
      console.log("🎬 Player already initialized with mode:", playerState.mode);
    }
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
    
    // CRITICAL: Stop the video immediately
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = ''; // Clear the source to stop buffering
      console.log('🛑 Video stopped and cleared');
    }
    
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
      if (playerState) {
        const newState = { 
          ...playerState, 
          mode: 'heygen' as const,
          lastInteraction: new Date()
        };
        setPlayerState(newState);
        onModeChange('heygen');
        onUserInteraction();
      }
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
    console.log('🎬 handleUserInput called - FORCE STOPPING VIDEO');
    
    // IMMEDIATE VIDEO STOP - No conditions, just stop
    if (videoRef.current) {
      console.log('🛑 IMMEDIATE VIDEO STOP');
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.style.display = 'none';
    }
    
    // Force mode change immediately
    setPlayerState(prev => prev ? { ...prev, mode: 'heygen' } : null);
    onModeChange('heygen');
    
    await updateInteraction();
    await switchToHeyGen();
  }, [updateInteraction, switchToHeyGen, onModeChange]);

  // CRITICAL FIX: Force video pause when switching to heygen mode
  useEffect(() => {
    if (playerState?.mode === 'heygen' && videoRef.current) {
      console.log('🛑 CRITICAL FIX: FORCING VIDEO PAUSE - Mode is heygen');
      const video = videoRef.current;
      video.pause();
      video.currentTime = 0;
      // Remove src to completely stop video
      video.removeAttribute('src');
      video.load();
    }
  }, [playerState?.mode]);

  // Expose interaction handler to parent component
  useEffect(() => {
    const handleInteraction = async () => {
      console.log('🎬 Video Player Interaction triggered - FORCE STOPPING VIDEO');
      await handleUserInput();
    };
    
    // Also expose immediate stop function
    const immediateStop = () => {
      console.log('🛑 IMMEDIATE STOP CALLED');
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        videoRef.current.style.display = 'none';
      }
      setPlayerState(prev => prev ? { ...prev, mode: 'heygen' } : null);
      onModeChange('heygen');
    };
    
    (window as any).triggerVideoPlayerInteraction = handleInteraction;
    (window as any).immediateStopVideo = immediateStop;
    console.log('✅ triggerVideoPlayerInteraction and immediateStopVideo exposed on window');
    
    return () => {
      delete (window as any).triggerVideoPlayerInteraction;
      delete (window as any).immediateStopVideo;
      console.log('🗑️ Video functions removed from window');
    };
  }, [playerState, handleUserInput, onModeChange]);

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

  // Debug logs outside JSX
  console.log('🎬 RENDER DEBUG - playerState:', playerState);
  console.log('🎬 RENDER DEBUG - mode:', playerState.mode);
  console.log('🎬 RENDER DEBUG - videoUrl:', videoUrl);

  return (
    <div className="absolute inset-0">
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
            if (videoRef.current && playerState.mode === 'loop') {
              videoRef.current.play().catch(e => console.error('Video play failed:', e));
            }
          }}
          onTimeUpdate={() => {
            // Log video progress for debugging
            if (videoRef.current && playerState.mode === 'loop') {
              const progress = (videoRef.current.currentTime / videoRef.current.duration * 100).toFixed(1);
              if (videoRef.current.currentTime > 0 && videoRef.current.currentTime % 2 < 0.1) {
                console.log(`Video progress: ${progress}% (${videoRef.current.currentTime.toFixed(1)}s / ${videoRef.current.duration.toFixed(1)}s)`);
              }
            }
          }}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : playerState.mode === 'heygen' ? (
        <>
          {console.log('🎬 HEYGEN MODE - NO VIDEO SHOULD BE PLAYING')}
          {/* In HeyGen mode, return nothing - parent will render HeyGen avatar */}
        </>
      ) : (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">Player in idle mode</p>
        </div>
      )}
      

    </div>
  );
}