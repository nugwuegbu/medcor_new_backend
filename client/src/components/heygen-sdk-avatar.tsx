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
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "failed" | "reconnecting">("connecting");
  const videoRef = useRef<HTMLVideoElement>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkStreamInterval = useRef<NodeJS.Timeout | null>(null);
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
                // Ensure audio is enabled before playing
                if (videoRef.current) {
                  videoRef.current.muted = false;
                  videoRef.current.volume = 1.0;
                  videoRef.current.autoplay = true;
                  await videoRef.current.play();
                  console.log("Video playing with audio enabled");
                }
              } catch (e) {
                console.error("Video play error:", e);
                // Try playing muted first, then unmute
                if (videoRef.current) {
                  try {
                    videoRef.current.muted = true;
                    await videoRef.current.play();
                    setTimeout(() => {
                      if (videoRef.current) {
                        videoRef.current.muted = false;
                        videoRef.current.volume = 1.0;
                      }
                    }, 500);
                  } catch (retryError) {
                    console.error("Retry video play error:", retryError);
                  }
                }
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
        
        checkStreamInterval.current = setInterval(async () => {
          // Skip if already reconnecting
          if (connectionStatus === "reconnecting") return;
          
          const stream = AvatarManager.getMediaStream();
          const status = {
            hasStream: !!stream,
            streamActive: stream?.active || false,
            videoTracks: stream?.getVideoTracks().length || 0,
            audioTracks: stream?.getAudioTracks().length || 0
          };
          console.log("Avatar debug - Stream status:", status);
          
          // If stream is dead, recreate
          if (!stream || !stream.active || status.videoTracks === 0) {
            console.log("Stream is inactive, recreating avatar...");
            setConnectionStatus("reconnecting");
            
            // Clear the interval to prevent multiple recreations
            if (checkStreamInterval.current) {
              clearInterval(checkStreamInterval.current);
              checkStreamInterval.current = null;
            }
            
            // Clear the manager's avatar to force recreation
            const manager = (window as any).__avatarManager;
            if (manager && !manager.lock) {
              manager.avatar = null;
              manager.promise = null;
            }
            
            // Reinitialize after a short delay
            setTimeout(() => {
              initAvatar();
            }, 1000);
          }
        }, 5000);

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
      if (checkStreamInterval.current) {
        clearInterval(checkStreamInterval.current);
      }
    };
  }, [apiKey, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-blue-50 to-white overflow-hidden">
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