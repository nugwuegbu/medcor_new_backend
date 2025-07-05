import { useEffect, useRef, useState, memo } from "react";
import { Loader } from "lucide-react";
import { AvatarManager } from "@/services/avatar-manager";

interface HeyGenSDKAvatarProps {
  apiKey: string;
  isVisible: boolean;
  onReady?: () => void;
}

const HeyGenSDKAvatar = memo(({ apiKey, isVisible, onReady }: HeyGenSDKAvatarProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "failed">("connecting");
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCalledOnReady = useRef(false);

  useEffect(() => {
    if (!isVisible || !apiKey) return;

    const initAvatar = async () => {
      try {
        setIsLoading(true);
        setConnectionStatus("connecting");
        
        const avatar = await AvatarManager.getOrCreateAvatar(apiKey);
        console.log("Avatar is ready");
        
        const stream = AvatarManager.getMediaStream();
        
        if (stream && videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video metadata to load
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded");
            // Ensure audio is enabled
            videoRef.current!.muted = false;
            videoRef.current!.volume = 1.0;
            
            // Play the video
            videoRef.current!.play().catch(e => {
              console.error("Video play error:", e);
            });
            
            setConnectionStatus("connected");
            setIsLoading(false);
            
            // Call onReady callback
            if (onReady && !hasCalledOnReady.current) {
              hasCalledOnReady.current = true;
              onReady();
            }
          };
        } else {
          console.error("No media stream available");
          setConnectionStatus("failed");
          setIsLoading(false);
        }
        
      } catch (error) {
        console.error("Failed to initialize avatar:", error);
        setConnectionStatus("failed");
        setIsLoading(false);
      }
    };

    initAvatar();
  }, [apiKey, isVisible, onReady]);

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
      />
    </div>
  );
});

HeyGenSDKAvatar.displayName = 'HeyGenSDKAvatar';

export default HeyGenSDKAvatar;