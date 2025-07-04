import { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import { interactiveDialogue } from '../services/interactive-dialogue';

interface UserCameraViewProps {
  isEnabled: boolean;
  onPermissionRequest?: () => void;
  capturePhotoRef?: React.MutableRefObject<(() => string | null) | null>;
}

export default function UserCameraView({ isEnabled, onPermissionRequest, capturePhotoRef }: UserCameraViewProps) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  
  // Capture photo function
  const capturePhoto = (): string | null => {
    if (!videoRef.current || !streamRef.current || !hasPermission) {
      console.log("Cannot capture photo - camera not ready");
      return null;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    const base64Image = imageData.split(',')[1];
    
    console.log("Photo captured from user camera");
    return base64Image;
  };
  
  // Expose capture function via ref
  useEffect(() => {
    if (capturePhotoRef) {
      capturePhotoRef.current = capturePhoto;
    }
  }, [hasPermission, capturePhotoRef]);

  useEffect(() => {
    if (isEnabled && hasPermission) {
      console.log("Camera conditions met - starting camera");
      startCamera();
    } else if (isEnabled && !hasPermission) {
      console.log("Camera enabled but no permission yet - requesting");
      setHasPermission(true);
      onPermissionRequest?.();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isEnabled, hasPermission, onPermissionRequest]);

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
      
      // Remove auto-greeting - will be triggered manually to avoid repetition
      console.log("Camera started successfully");
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
    } else {
      // Toggle camera off
      setHasPermission(false);
      stopCamera();
    }
  };

  return (
    <div 
      className={`
        relative
        transition-all duration-300 ease-in-out
        ${isHovered ? 'w-12 h-12' : 'w-8 h-8'}
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
          <Camera className={`text-white ${isHovered ? 'h-5 w-5' : 'h-4 w-4'}`} />
        </button>
      ) : (
        <button
          onClick={handleCameraClick}
          className="relative w-full h-full cursor-pointer group"
        >
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
          
          {/* Click to close overlay */}
          <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <CameraOff className="text-white h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          {/* Decorative ring */}
          <div className="absolute inset-0 rounded-full ring-2 ring-purple-500/50 ring-offset-2 ring-offset-transparent pointer-events-none" />
        </button>
      )}
      
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg">
            {hasPermission ? 'Click to close camera' : 'Click to enable camera'}
          </div>
        </div>
      )}
    </div>
  );
}