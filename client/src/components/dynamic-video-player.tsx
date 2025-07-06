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

  // Setup inactivity checker
  useEffect(() => {
    // IMPORTANT: NO inactivity checks in HeyGen mode - once activated, stay in HeyGen
    if (playerState?.mode === 'loop') {
      // Only check for inactivity in LOOP mode to switch TO HeyGen
      inactivityTimerRef.current = setInterval(() => {
        checkInactivity();
      }, 10000);
    } else {
      // Clear timer when in HeyGen mode or any other mode
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
    };
  }, [playerState?.mode]);

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
    try {
      console.log('🎬 Switching to HeyGen mode...');
      const response = await fetch('/api/video/player/switch-heygen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      const data = await response.json();
      if (data.success) {
        console.log('🎬 Successfully switched to HeyGen mode:', data.playerState);
        setPlayerState(data.playerState);
        onModeChange(data.playerState.mode);
        onUserInteraction();
        
        // Make sure HeyGen avatar is visible
        if (data.playerState.mode === 'heygen') {
          console.log('🎬 HeyGen mode activated - avatar should be visible');
        }
      }
    } catch (error) {
      console.error('Failed to switch to HeyGen:', error);
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
    try {
      const response = await fetch('/api/video/player/check-inactivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      const data = await response.json();
      if (data.success && data.switched) {
        setPlayerState(data.playerState);
        setVideoUrl(data.videoUrl);
        onModeChange(data.playerState.mode);
        
        // Restart video when auto-switching back to loop
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play();
        }
      }
    } catch (error) {
      console.error('Failed to check inactivity:', error);
    }
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
  const handleUserInput = () => {
    updateInteraction();
    if (playerState?.mode === 'loop') {
      switchToHeyGen();
    }
  };

  // Expose interaction handler to parent component
  useEffect(() => {
    const handleInteraction = () => {
      console.log('🎬 Video Player Interaction triggered - Current mode:', playerState?.mode);
      handleUserInput();
    };
    
    (window as any).triggerVideoPlayerInteraction = handleInteraction;
    return () => {
      delete (window as any).triggerVideoPlayerInteraction;
    };
  }, [playerState]);

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
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : playerState.mode === 'heygen' ? (
        <div className="absolute inset-0">
          {/* HeyGen avatar will be rendered here by parent component */}
          {console.log('🎬 Rendering HeyGen mode - heyGenProps:', !!heyGenProps)}
          {heyGenProps ? (
            <>
              {console.log('🎬 HeyGen props available, rendering avatar')}
              <HeyGenSDKAvatar 
                ref={heyGenProps.ref}
                apiKey={heyGenProps.apiKey}
                isVisible={heyGenProps.isVisible}
                onMessage={heyGenProps.onMessage}
                onReady={heyGenProps.onReady}
              />
            </>
          ) : (
            <>
              {console.log('🎬 No HeyGen props available')}
              <div className="absolute inset-0 bg-purple-500 flex items-center justify-center text-white">
                HeyGen Mode - Loading Avatar...
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">Player in idle mode</p>
        </div>
      )}
      

    </div>
  );
}