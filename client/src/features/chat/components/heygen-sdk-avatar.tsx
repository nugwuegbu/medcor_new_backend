import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { AvatarManager } from "../services/avatar-manager";
import { Loader } from "lucide-react";
import { TaskType, TaskMode } from "@heygen/streaming-avatar";

interface HeyGenSDKAvatarProps {
  apiKey: string;
  onMessage?: (text: string) => void;
  isVisible: boolean;
  onReady?: () => void;
}

export interface HeyGenSDKAvatarRef {
  speak: (params: { text: string; taskType?: TaskType; taskMode?: TaskMode }) => void;
}

const HeyGenSDKAvatar = forwardRef<HeyGenSDKAvatarRef, HeyGenSDKAvatarProps>(({ apiKey, onMessage, isVisible, onReady }, ref) => {
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<"ready" | "connecting" | "connected" | "failed" | "reconnecting">("connecting");
  const videoRef = useRef<HTMLVideoElement>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkStreamInterval = useRef<NodeJS.Timeout | null>(null);
  const hasCalledOnReady = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const lastErrorTime = useRef<number>(0);

  // Expose speak method through ref
  useImperativeHandle(ref, () => ({
    speak: async ({ text, taskType = TaskType.TALK, taskMode = TaskMode.SYNC }) => {
      try {
        const avatar = AvatarManager.getAvatar();
        if (avatar) {
          await avatar.speak({ text, taskType, taskMode });
        }
      } catch (e: any) {
        console.error("Failed to speak:", e);
        
        // Don't automatically recreate on session errors to prevent credit consumption
        if (e.message?.includes('session state wrong') || e.message?.includes('closed')) {
          console.log("Session closed. Manual reconnection required to prevent excessive API calls.");
          setConnectionStatus("failed");
          // User needs to manually refresh or reconnect
        }
      }
    }
  }), [apiKey]);

  useEffect(() => {
    if (!isVisible || !apiKey) return;

    const initAvatar = async () => {
      try {
        setIsLoading(true);
        setConnectionStatus("connecting");

        // Get or create avatar - only create when user has interacted
        const avatar = await AvatarManager.getOrCreateAvatar(apiKey, false);
        
        // Set up stream checking
        const checkStream = () => {
          const mediaStream = AvatarManager.getMediaStream();
          if (mediaStream && videoRef.current) {
            console.log("Attaching media stream to video element:", mediaStream);
            videoRef.current.srcObject = mediaStream;
            videoRef.current.muted = true; // Allow autoplay by muting initially
            videoRef.current.onloadedmetadata = async () => {
              console.log("Video metadata loaded");
              try {
                await videoRef.current!.play();
                // Try to unmute after playing starts
                setTimeout(() => {
                  if (videoRef.current) {
                    videoRef.current.muted = false;
                  }
                }, 100);
              } catch (e) {
                console.error("Video play error:", e);
              }
            };
            setConnectionStatus("connected");
            setIsLoading(false);
            
            // Call onReady callback when avatar is ready (only once)
            if (onReady && !hasCalledOnReady.current) {
              hasCalledOnReady.current = true;
              onReady();
            }
            
            // Clear the interval once connected
            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
              checkIntervalRef.current = null;
            }
          }
        };

        // Check immediately and then periodically  
        checkStream();
        checkIntervalRef.current = setInterval(checkStream, 100);
        
        // Force check after avatar is ready
        setTimeout(checkStream, 500);
        setTimeout(checkStream, 1000);
        setTimeout(checkStream, 1500);
        
        // Monitor stream status and recreate if needed
        if (checkStreamInterval.current) {
          clearInterval(checkStreamInterval.current);
        }
        
        // Disable automatic stream monitoring to prevent excessive API calls
        // Only check stream status manually when needed
        console.log("Stream monitoring disabled to prevent excessive HeyGen API calls");

      } catch (error: any) {
        // Check if it's a user interaction required error
        if (error.message === "Avatar creation requires user interaction") {
          console.log("Avatar ready - waiting for user interaction to start");
          setConnectionStatus("ready");
          setIsLoading(false);
          // Avatar will be created when user clicks to start
          return;
        }
        
        console.error("Failed to initialize avatar:", error);
        setConnectionStatus("failed");
        setIsLoading(false);
        
        // Don't retry automatically to prevent credit consumption
        console.log("Avatar initialization failed. Manual action required.");
      }
    };

    initAvatar();

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (checkStreamInterval.current) {
        clearInterval(checkStreamInterval.current);
      }
    };
  }, [apiKey, isVisible]);

  // Handle user starting the avatar
  const handleStartAvatar = async () => {
    console.log("User clicked to start avatar");
    AvatarManager.enableUserInteraction();
    setIsLoading(true);
    setConnectionStatus("connecting");
    
    try {
      // Now create the avatar with user interaction enabled
      const avatar = await AvatarManager.getOrCreateAvatar(apiKey, true);
      
      // Set up stream checking
      const checkStream = () => {
        const mediaStream = AvatarManager.getMediaStream();
        if (mediaStream && videoRef.current) {
          console.log("Attaching media stream to video element:", mediaStream);
          videoRef.current.srcObject = mediaStream;
          videoRef.current.muted = true;
          videoRef.current.onloadedmetadata = async () => {
            console.log("Video metadata loaded");
            try {
              await videoRef.current!.play();
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.muted = false;
                }
              }, 100);
            } catch (e) {
              console.error("Video play error:", e);
            }
          };
          setConnectionStatus("connected");
          setIsLoading(false);
          
          if (onReady && !hasCalledOnReady.current) {
            hasCalledOnReady.current = true;
            onReady();
          }
          
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }
        }
      };

      checkStream();
      checkIntervalRef.current = setInterval(checkStream, 100);
      setTimeout(checkStream, 500);
      setTimeout(checkStream, 1000);
      
    } catch (error) {
      console.error("Failed to start avatar:", error);
      setConnectionStatus("failed");
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-blue-50 to-white overflow-hidden">
      {connectionStatus === "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-10">
          <div className="text-center">
            <button 
              onClick={handleStartAvatar}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Start AI Assistant
            </button>
            <p className="text-sm text-gray-600 mt-4">Click to activate the AI health assistant</p>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-sm text-gray-600">Connecting to Medcor AI...</p>
          </div>
        </div>
      )}

      {connectionStatus === "failed" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-red-600 text-sm">Failed to connect to avatar</p>
        </div>
      )}

      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        playsInline
        muted
      />
    </div>
  );
});

HeyGenSDKAvatar.displayName = 'HeyGenSDKAvatar';

export default HeyGenSDKAvatar;