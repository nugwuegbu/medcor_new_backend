import { useState, useRef, useEffect } from "react";
import HeyGenSDKAvatar from './heygen-sdk-avatar';

interface DynamicVideoPlayerProps {
  sessionId: string;
  onUserInteraction: () => void;
  onModeChange: (mode: 'loop' | 'heygen' | 'idle') => void;
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

export default function DynamicVideoPlayer({ sessionId, onUserInteraction, onModeChange }: DynamicVideoPlayerProps) {
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
    if (playerState?.mode === 'heygen') {
      // Check for inactivity every 10 seconds
      inactivityTimerRef.current = setInterval(() => {
        checkInactivity();
      }, 10000);
    } else {
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
      const response = await fetch('/api/video/player/switch-heygen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      const data = await response.json();
      if (data.success) {
        setPlayerState(data.playerState);
        onModeChange(data.playerState.mode);
        onUserInteraction();
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
      // Loop the video
      videoRef.current.currentTime = 0;
      videoRef.current.play();
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
    (window as any).triggerVideoPlayerInteraction = handleUserInput;
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
      {playerState.mode === 'loop' && videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          muted
          loop={false} // We handle looping manually to track loop count
          onEnded={handleVideoEnded}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : playerState.mode === 'heygen' ? (
        <div className="absolute inset-0">
          {/* HeyGen avatar will be rendered here by parent component */}
          {heyGenProps && (
            <HeyGenSDKAvatar {...heyGenProps} />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">Player in idle mode</p>
        </div>
      )}
      
      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black/50 text-white text-xs p-2 rounded">
          <div>Mode: {playerState.mode}</div>
          <div>Playing: {playerState.isPlaying ? 'Yes' : 'No'}</div>
          <div>Video: {playerState.currentVideo}</div>
          <div>Loops: {playerState.loopCount}</div>
        </div>
      )}
    </div>
  );
}