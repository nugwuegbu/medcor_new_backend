import { useEffect, useRef } from "react";
import { AvatarManager } from "../services/avatar-manager";

interface AvatarMirrorProps {
  className?: string;
}

// This component mirrors the main avatar video stream
// It doesn't create a new avatar instance, just shows the same video
export default function AvatarMirror({ className = "" }: AvatarMirrorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check for media stream periodically
    const checkStream = () => {
      const stream = AvatarManager.getMediaStream();
      if (stream && videoRef.current && stream.active) {
        console.log("Mirroring avatar stream");
        videoRef.current.srcObject = stream;
      }
    };

    // Check immediately and then periodically
    checkStream();
    checkIntervalRef.current = setInterval(checkStream, 1000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay
      playsInline
      muted
    />
  );
}