import { useEffect, useRef, useState } from "react";

interface StaticAvatarAnimationProps {
  isVisible: boolean;
}

export default function StaticAvatarAnimation({ isVisible }: StaticAvatarAnimationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);

  useEffect(() => {
    // Try to capture a frame from the HeyGen avatar video element if it exists
    const captureAvatarFrame = () => {
      const heygenVideo = document.querySelector('video[id*="heygen"]') as HTMLVideoElement;
      if (heygenVideo && heygenVideo.videoWidth > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = heygenVideo.videoWidth;
        canvas.height = heygenVideo.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(heygenVideo, 0, 0);
          setCapturedFrame(canvas.toDataURL('image/png'));
        }
      }
    };

    // Try to capture frame when component mounts
    setTimeout(captureAvatarFrame, 1000);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
      <div className="relative w-full h-full flex items-center justify-center">
        {capturedFrame ? (
          // Show captured avatar frame with subtle animation
          <div className="relative animate-float">
            <img 
              src={capturedFrame} 
              alt="Dr. Ann Avatar" 
              className="w-full h-full object-contain"
              style={{ maxHeight: '100vh' }}
            />
            {/* Subtle breathing effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-transparent animate-pulse opacity-10"></div>
          </div>
        ) : (
          // Fallback: Show a professional placeholder
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-64 h-64 mx-auto mb-8 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-32 h-32 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">Dr. Ann</h3>
              <p className="text-purple-600 font-medium animate-pulse">Click the button to start consultation</p>
            </div>
          </div>
        )}
        
        {/* Idle Text at bottom */}
        {capturedFrame && (
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-center">
            <p className="text-purple-600 font-medium animate-pulse">Click the button to start consultation</p>
          </div>
        )}
      </div>
    </div>
  );
}