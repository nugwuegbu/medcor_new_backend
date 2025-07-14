import FloatingChatButton from "@/components/floating-chat-button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          Provide a preview of the chat feature on the welcome screen
        </h1>
      </div>
      
      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
}