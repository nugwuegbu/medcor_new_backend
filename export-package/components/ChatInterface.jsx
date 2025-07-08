import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MessageCircle, X } from 'lucide-react';

export const ChatInterface = ({ 
  onSendMessage, 
  messages = [], 
  isLoading = false,
  className = "",
  showVoiceInput = true 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      console.error('Speech recognition error');
      setIsRecording(false);
    };

    recognition.start();
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-96 h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col z-50 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
            <MessageCircle size={16} />
          </div>
          <div>
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="text-sm opacity-90">medcor</p>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="p-1 hover:bg-white/20 rounded-md transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl ${
                message.sender === 'user'
                  ? 'bg-purple-600 text-white rounded-br-sm'
                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm shadow-sm'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.text}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-sm p-3 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600 dark:text-gray-300">Typing</span>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Send your message..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500"
            disabled={isLoading}
          />
          
          {showVoiceInput && (
            <button
              onClick={handleVoiceInput}
              className={`p-2 rounded-full transition-colors ${
                isRecording 
                  ? 'text-red-500 animate-pulse' 
                  : 'text-gray-500 hover:text-purple-600'
              }`}
              disabled={isLoading}
            >
              <Mic size={18} />
            </button>
          )}
          
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-full transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;