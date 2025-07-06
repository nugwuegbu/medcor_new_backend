import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import AvatarChatWidget from "./avatar-chat-widget";

export default function FloatingChatButton() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Auto-open chat after 1.5 seconds when page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("🔴 AUTO-OPENING CHAT WIDGET");
      setIsChatOpen(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  console.log("🔴 FLOATING CHAT BUTTON - Rendering, isChatOpen:", isChatOpen);
  
  return (
    <>
      <Button
        onClick={() => {
          console.log("🔴 CHAT BUTTON CLICKED");
          setIsChatOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
        size="lg"
      >
        <MessageCircle className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
      </Button>

      {console.log("🔴 RENDERING AVATAR CHAT WIDGET WITH isOpen:", isChatOpen)}
      <AvatarChatWidget 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </>
  );
}