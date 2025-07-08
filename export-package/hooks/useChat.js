import { useState, useCallback, useRef, useEffect } from 'react';
import { chatApi } from '../utils/api';

export const useChat = (options = {}) => {
  const {
    sessionId: initialSessionId,
    language = 'en',
    autoScroll = true,
    onMessageSent,
    onMessageReceived,
    onError,
  } = options;

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(
    initialSessionId || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);

  // Scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Add message to chat
  const addMessage = useCallback((message) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      ...message,
    };

    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  // Send message
  const sendMessage = useCallback(async (content, type = 'text') => {
    if (!content.trim()) return null;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Add user message
    const userMessage = addMessage({
      content: content.trim(),
      sender: 'user',
      type,
    });

    onMessageSent?.(userMessage);

    setIsLoading(true);
    setError(null);

    try {
      // Create new abort controller
      abortControllerRef.current = new AbortController();

      const response = await chatApi.sendMessage(
        content.trim(),
        sessionId,
        language
      );

      // Add bot response
      const botMessage = addMessage({
        content: response.response || response.text || 'Sorry, I could not process your request.',
        sender: 'bot',
        type: 'text',
        metadata: response.metadata,
      });

      onMessageReceived?.(botMessage);
      return botMessage;

    } catch (err) {
      if (err.name === 'AbortError') {
        return null; // Request was cancelled
      }

      const errorMessage = 'Sorry, I encountered an error. Please try again.';
      setError(err.message || errorMessage);
      
      const errorBotMessage = addMessage({
        content: errorMessage,
        sender: 'bot',
        type: 'error',
      });

      onError?.(err);
      return errorBotMessage;

    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [sessionId, language, addMessage, onMessageSent, onMessageReceived, onError]);

  // Send voice message
  const sendVoiceMessage = useCallback(async (audioBlob) => {
    // Convert audio to base64 or handle file upload
    // This would depend on your backend implementation
    try {
      const base64Audio = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(audioBlob);
      });

      return await sendMessage(base64Audio, 'voice');
    } catch (error) {
      console.error('Voice message error:', error);
      setError('Failed to send voice message');
      return null;
    }
  }, [sendMessage]);

  // Clear chat
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Retry last message
  const retryLastMessage = useCallback(() => {
    const lastUserMessage = messages
      .filter(msg => msg.sender === 'user')
      .pop();

    if (lastUserMessage) {
      return sendMessage(lastUserMessage.content, lastUserMessage.type);
    }
    return null;
  }, [messages, sendMessage]);

  // Cancel current request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  // Load chat history
  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const history = await chatApi.getChatHistory(sessionId);
      
      const formattedMessages = history.map(msg => ({
        id: msg.id || Date.now() + Math.random(),
        content: msg.text || msg.content,
        sender: msg.sender,
        type: msg.type || 'text',
        timestamp: new Date(msg.timestamp),
        metadata: msg.metadata,
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setError('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Update session ID
  const updateSessionId = useCallback((newSessionId) => {
    setSessionId(newSessionId);
    setMessages([]);
    setError(null);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    sendMessage,
    sendVoiceMessage,
    addMessage,
    clearMessages,
    retryLastMessage,
    cancelRequest,
    loadHistory,
    updateSessionId,
    messagesEndRef,
    scrollToBottom,
  };
};

export default useChat;