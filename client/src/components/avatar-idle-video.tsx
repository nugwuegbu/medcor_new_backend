interface AvatarIdleVideoProps {
  isVisible: boolean;
}

export default function AvatarIdleVideo({ isVisible }: AvatarIdleVideoProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Video loop of HeyGen avatar */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/avatar-idle.mp4" type="video/mp4" />
          {/* Fallback for browsers that don't support video */}
          <img 
            src="/avatar-idle-poster.jpg" 
            alt="Dr. Ann Avatar" 
            className="w-full h-full object-cover"
          />
        </video>
        
        {/* Subtle overlay to indicate it's idle */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 to-transparent pointer-events-none"></div>
        
        {/* Idle message */}
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-purple-600 font-medium animate-pulse bg-white/80 px-6 py-2 rounded-full shadow-lg">
            Click the button to start consultation
          </p>
        </div>
      </div>
    </div>
  );
}