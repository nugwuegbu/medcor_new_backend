import { useState, useEffect } from "react";
import AvatarChatWidget from "./avatar-chat-widget";

export default function FloatingChatButton() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Auto-open chat after 1.5 seconds when page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChatOpen(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Removed floating chat button per user request */}
      
      {/* Only render AvatarChatWidget when actually open to prevent floating avatar issues */}
      {isChatOpen && (
        <AvatarChatWidget 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
        />
      )}
    </>
  );
}