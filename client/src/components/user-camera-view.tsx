import { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff } from 'lucide-react';

interface UserCameraViewProps {
  isEnabled: boolean;
  onPermissionRequest?: () => void;
}

export default function UserCameraView({ isEnabled, onPermissionRequest }: UserCameraViewProps) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isEnabled && hasPermission) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isEnabled, hasPermission]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setCameraError(false);
    } catch (error) {
      console.error("Camera access error:", error);
      setCameraError(true);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCameraClick = () => {
    if (!hasPermission) {
      setHasPermission(true);
      onPermissionRequest?.();
    }
  };

  return (
    <div 
      className={`
        absolute left-1/2 top-[75%] transform -translate-x-1/2
        transition-all duration-300 ease-in-out z-20
        ${isHovered ? 'w-32 h-32' : 'w-16 h-16'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!hasPermission ? (
        <button
          onClick={handleCameraClick}
          className={`
            w-full h-full rounded-full bg-purple-500/80 backdrop-blur-sm
            flex items-center justify-center cursor-pointer
            hover:bg-purple-600/80 transition-colors
            shadow-lg hover:shadow-xl
            ${isHovered ? 'scale-110' : ''}
          `}
        >
          <Camera className={`text-white ${isHovered ? 'h-8 w-8' : 'h-6 w-6'}`} />
        </button>
      ) : (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`
              w-full h-full object-cover rounded-full
              shadow-lg hover:shadow-xl
              ${cameraError ? 'hidden' : 'block'}
            `}
          />
          
          {cameraError && (
            <div className="w-full h-full rounded-full bg-red-500/80 flex items-center justify-center">
              <CameraOff className="text-white h-6 w-6" />
            </div>
          )}
          
          {/* Decorative ring */}
          <div className="absolute inset-0 rounded-full ring-2 ring-purple-500/50 ring-offset-2 ring-offset-transparent pointer-events-none" />
        </div>
      )}
      
      {/* Tooltip */}
      {isHovered && !hasPermission && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg">
            Click to enable camera
          </div>
        </div>
      )}
    </div>
  );
}