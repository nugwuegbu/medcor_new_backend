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
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "failed">("connecting");
  const videoRef = useRef<HTMLVideoElement>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledOnReady = useRef(false);

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
        
        // If session is closed, try to recreate the avatar
        if (e.message?.includes('session state wrong') || e.message?.includes('closed')) {
          console.log("Session closed, attempting to recreate avatar...");
          try {
            // Reset manager state
            const manager = (window as any).__avatarManager;
            manager.avatar = null;
            manager.promise = null;
            manager.lock = false;
            
            // Recreate avatar
            await AvatarManager.getOrCreateAvatar(apiKey);
            
            // Retry speaking
            const newAvatar = AvatarManager.getAvatar();
            if (newAvatar) {
              await newAvatar.speak({ text, taskType, taskMode });
            }
          } catch (recreateError) {
            console.error("Failed to recreate avatar:", recreateError);
          }
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

        // Get or create avatar
        const avatar = await AvatarManager.getOrCreateAvatar(apiKey);
        
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
        
        // Debug: Check avatar status after 2 seconds
        setTimeout(() => {
          const stream = AvatarManager.getMediaStream();
          console.log("Avatar debug - Stream status:", {
            hasStream: !!stream,
            streamActive: stream?.active,
            videoTracks: stream?.getVideoTracks().length,
            audioTracks: stream?.getAudioTracks().length
          });
        }, 2000);

      } catch (error) {
        console.error("Failed to initialize avatar:", error);
        setConnectionStatus("failed");
        setIsLoading(false);
      }
    };

    initAvatar();

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [apiKey, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-blue-50 to-white rounded-lg overflow-hidden">
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
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted
      />
    </div>
  );
});

HeyGenSDKAvatar.displayName = 'HeyGenSDKAvatar';

export default HeyGenSDKAvatar;