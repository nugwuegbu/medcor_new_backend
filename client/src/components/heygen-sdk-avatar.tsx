import { useEffect, useRef, useState } from "react";
import StreamingAvatar, { 
  AvatarQuality, 
  StreamingEvents,
  TaskType,
  TaskMode,
  VoiceEmotion 
} from "@heygen/streaming-avatar";
import { Loader } from "lucide-react";

interface HeyGenSDKAvatarProps {
  apiKey: string;
  onMessage?: (text: string) => void;
  isVisible: boolean;
}

export default function HeyGenSDKAvatar({ apiKey, onMessage, isVisible }: HeyGenSDKAvatarProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "failed">("connecting");
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarRef = useRef<StreamingAvatar | null>(null);

  useEffect(() => {
    if (!isVisible || !apiKey) return;

    const initAvatar = async () => {
      try {
        setIsLoading(true);
        setConnectionStatus("connecting");

        // Create streaming avatar instance
        const avatar = new StreamingAvatar({ token: apiKey });
        avatarRef.current = avatar;

        // Set up event listeners
        avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
          console.log("Avatar started talking");
        });

        avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
          console.log("Avatar stopped talking");
        });

        avatar.on(StreamingEvents.STREAM_READY, async (event) => {
          console.log("Stream ready:", event);
          setConnectionStatus("connected");
          setIsLoading(false);
          
          // Attach the stream to video element
          if (videoRef.current && avatar.mediaStream) {
            videoRef.current.srcObject = avatar.mediaStream;
            videoRef.current.play().catch(e => console.error("Video play error:", e));
          }

          // Initial greeting from Medcor AI
          try {
            await avatar.speak({
              text: "Hello there! How can I help you? I am Medcor AI assistant.",
              taskType: TaskType.REPEAT,
              taskMode: TaskMode.SYNC
            });
          } catch (error) {
            console.error("Failed to speak initial greeting:", error);
          }
        });

        avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
          console.log("Stream disconnected");
          setConnectionStatus("failed");
        });

        // Start the avatar
        const sessionInfo = await avatar.createStartAvatar({
          quality: AvatarQuality.High,
          avatarName: "Ann_Doctor_Standing2_public",
          voice: {
            voiceId: "1bd001e7e50f421d891986aad5158bc8", // Default female voice
            rate: 1.0,
            emotion: VoiceEmotion.FRIENDLY
          },
          disableIdleTimeout: true // Prevent default idle messages
        });

        console.log("Avatar session started:", sessionInfo);

      } catch (error) {
        console.error("Failed to initialize avatar:", error);
        setConnectionStatus("failed");
        setIsLoading(false);
      }
    };

    initAvatar();

    // Cleanup
    return () => {
      if (avatarRef.current) {
        console.log("Cleaning up avatar instance");
        avatarRef.current.stopAvatar().catch(e => console.error("Error stopping avatar:", e));
        avatarRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [apiKey, isVisible]);

  // Public method to make avatar speak
  const speak = async (text: string) => {
    if (!avatarRef.current) {
      console.error("Avatar not initialized");
      return;
    }

    try {
      await avatarRef.current.speak({
        text,
        taskType: TaskType.REPEAT, // Changed from TALK to REPEAT to speak exact text
        taskMode: TaskMode.SYNC
      });
    } catch (error) {
      console.error("Failed to make avatar speak:", error);
    }
  };

  // Expose speak method to parent
  useEffect(() => {
    if (onMessage) {
      (window as any).heygenSpeak = speak;
    }
  }, [onMessage]);

  if (!isVisible) return null;

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-blue-50 to-white rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-sm text-gray-600">Connecting to HeyGen...</p>
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
        muted={false}
      />
    </div>
  );
}