import { useState, useRef, useEffect, memo } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import { interactiveDialogue } from '../services/interactive-dialogue';

interface UserCameraViewProps {
  isEnabled: boolean;
  onPermissionRequest?: () => void;
  capturePhotoRef?: React.MutableRefObject<(() => string | null) | null>;
  videoStreamRef?: React.MutableRefObject<MediaStream | null>;
  streamReady?: boolean;
}

const UserCameraView = memo(({ isEnabled, onPermissionRequest, capturePhotoRef, videoStreamRef, streamReady }: UserCameraViewProps) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [manuallyTurnedOff, setManuallyTurnedOff] = useState(false);
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

  // UserCameraView is not affected by Hair Analysis trigger
  // No periodic trigger check needed for main camera

  useEffect(() => {
    console.log("🎥 DEBUG: Camera useEffect triggered");
    console.log("🎥 DEBUG: isEnabled:", isEnabled);
    console.log("🎥 DEBUG: streamReady:", streamReady);
    console.log("🎥 DEBUG: hasPermission:", hasPermission);
    console.log("🎥 DEBUG: videoStreamRef.current:", videoStreamRef?.current);
    
    // Main camera is not affected by Hair Analysis trigger
    const checkAndStart = async () => {
      // UserCameraView is not affected by Hair Analysis trigger
      // Only Hair Analysis page is affected by kadirli/kozan triggers
      
      // If stream is already ready, use it
      if (streamReady && videoStreamRef?.current && videoRef.current) {
        console.log("🎥 DEBUG: Using existing stream from videoStreamRef");
        videoRef.current.srcObject = videoStreamRef.current;
        streamRef.current = videoStreamRef.current;
        setHasPermission(true);
        setCameraError(false);
        return;
      }
      
      if (isEnabled && hasPermission && !manuallyTurnedOff) {
        console.log("🎥 DEBUG: Camera conditions met - starting camera");
        startCamera();
      } else if (isEnabled && !hasPermission && !manuallyTurnedOff) {
        console.log("🎥 DEBUG: Camera enabled but no permission yet - requesting");
        setHasPermission(true);
        onPermissionRequest?.();
      } else {
        console.log("🎥 DEBUG: Stopping camera");
        stopCamera();
      }
    };
    
    checkAndStart();

    return () => {
      console.log("🎥 DEBUG: Camera cleanup");
      // Don't stop shared stream
      if (!streamReady) {
        stopCamera();
      }
    };
  }, [isEnabled, hasPermission, manuallyTurnedOff, streamReady, videoStreamRef, onPermissionRequest]);

  const startCamera = async () => {
    console.log("🎥 DEBUG: Starting camera...");
    console.log("🎥 DEBUG: hasPermission:", hasPermission);
    console.log("🎥 DEBUG: isEnabled:", isEnabled);
    console.log("🎥 DEBUG: manuallyTurnedOff:", manuallyTurnedOff);
    
    // Main camera is not affected by Hair Analysis trigger
    // UserCameraView works independently
    
    try {
      console.log("🎥 DEBUG: Requesting camera permission...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      console.log("🎥 DEBUG: Camera stream obtained:", stream);
      console.log("🎥 DEBUG: videoRef.current:", videoRef.current);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Also expose stream via ref for other components
        if (videoStreamRef) {
          videoStreamRef.current = stream;
          console.log("🎥 DEBUG: Video stream shared via ref");
        }
        
        console.log("🎥 DEBUG: Video element setup complete");
      }
      setCameraError(false);
      
      console.log("🎥 DEBUG: Camera started successfully");
    } catch (error) {
      console.error("🎥 ERROR: Camera access error:", error);
      console.error("🎥 ERROR: Error name:", error.name);
      console.error("🎥 ERROR: Error message:", error.message);
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
      setManuallyTurnedOff(false);
      onPermissionRequest?.();
    } else {
      // Toggle camera off
      setHasPermission(false);
      setManuallyTurnedOff(true);
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
});

UserCameraView.displayName = 'UserCameraView';

export default UserCameraView;