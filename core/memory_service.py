"""
Hybrid Memory Service combining Database Storage with LangChain ConversationBufferWindowMemory
Provides the benefits of both persistent storage and automatic memory management
"""

import logging
from typing import Dict, List, Optional

try:
    from langchain.memory import ConversationBufferWindowMemory
    from langchain_community.chat_message_histories import ChatMessageHistory
    from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    ConversationBufferWindowMemory = None
    ChatMessageHistory = None
    BaseMessage = None

logger = logging.getLogger(__name__)


class HybridMemoryService:
    """
    Hybrid memory service that combines:
    1. Database persistence (ChatSession/ChatMessage)
    2. LangChain ConversationBufferWindowMemory for automatic management
    
    Best of both worlds: persistence + automatic window management
    """
    
    def __init__(self, k: int = 10, return_messages: bool = True):
        """
        Initialize hybrid memory service
        
        Args:
            k: Number of conversation pairs to keep in window (default: 10)
            return_messages: Whether to return BaseMessage objects or strings
        """
        if not LANGCHAIN_AVAILABLE:
            logger.warning("LangChain not available, falling back to manual memory management")
        
        self.k = k
        self.return_messages = return_messages
        self._memory_cache = {}  # Cache memory objects per session
    
    def load_memory_from_database(self, session_id: str) -> Optional[ConversationBufferWindowMemory]:
        """
        Load conversation history from database and create ConversationBufferWindowMemory
        
        Args:
            session_id: Chat session ID
            
        Returns:
            ConversationBufferWindowMemory instance or None if LangChain unavailable
        """
        if not LANGCHAIN_AVAILABLE:
            return None
        
        try:
            from core.chat_models import ChatSession, ChatMessage
            
            # Check cache first
            if session_id in self._memory_cache:
                return self._memory_cache[session_id]
            
            # Load session
            try:
                chat_session = ChatSession.objects.get(session_id=session_id)
            except ChatSession.DoesNotExist:
                logger.warning(f"Session {session_id} not found")
                return None
            
            # Create ChatMessageHistory from database
            chat_history = ChatMessageHistory()
            
            # Load ALL messages from database (ordered by timestamp)
            # ConversationBufferWindowMemory will handle the windowing (k parameter)
            messages = ChatMessage.objects.filter(
                session=chat_session
            ).order_by("timestamp")
            
            logger.info(f"Loading {len(messages)} total messages from database for session {session_id}")
            
            # Add messages to history
            for msg in messages:
                chat_history.add_user_message(msg.message)
                chat_history.add_ai_message(msg.response)
            
            logger.debug(f"Added {len(messages)} message pairs to ChatMessageHistory")
            
            # Create ConversationBufferWindowMemory with database-backed history
            memory = ConversationBufferWindowMemory(
                chat_memory=chat_history,
                k=self.k,
                return_messages=self.return_messages,
                memory_key="chat_history"
            )
            
            # Cache it
            self._memory_cache[session_id] = memory
            
            # Log what will be used (windowed)
            total_pairs = len(messages)
            windowed_pairs = min(total_pairs, self.k)
            logger.info(f"Created ConversationBufferWindowMemory for session {session_id}: {total_pairs} total message pairs in DB, will use last {windowed_pairs} pairs (k={self.k})")
            return memory
            
        except Exception as e:
            logger.error(f"Error loading memory from database: {e}")
            return None
    
    def get_openai_messages(
        self, 
        session_id: str, 
        system_prompt: str,
        current_message: str
    ) -> List[Dict[str, str]]:
        """
        Get messages in OpenAI format (for direct OpenAI API calls)
        
        Args:
            session_id: Chat session ID
            system_prompt: System prompt for the conversation
            current_message: Current user message
            
        Returns:
            List of message dicts in OpenAI format
        """
        memory = self.load_memory_from_database(session_id)
        
        messages = [{"role": "system", "content": system_prompt}]
        
        if memory:
            # Get messages from LangChain memory
            if self.return_messages:
                # ConversationBufferWindowMemory's chat_memory contains ALL messages
                # We need to apply the window (last k pairs) manually
                all_messages = memory.chat_memory.messages
                
                # Apply windowing: take last k*2 messages (k pairs)
                # Each pair = 1 user message + 1 assistant message
                windowed_messages = all_messages[-self.k * 2:] if len(all_messages) > self.k * 2 else all_messages
                
                logger.info(f"Retrieved {len(all_messages)} total messages, applying window k={self.k} ({len(windowed_messages)} messages)")
                
                for msg in windowed_messages:
                    if isinstance(msg, HumanMessage):
                        messages.append({"role": "user", "content": msg.content})
                        logger.debug(f"Added user message: {msg.content[:50]}...")
                    elif isinstance(msg, AIMessage):
                        messages.append({"role": "assistant", "content": msg.content})
                        logger.debug(f"Added assistant message: {msg.content[:50]}...")
            else:
                # If returning strings, need to parse chat_history
                # This is a fallback if return_messages=False
                history_str = memory.buffer
                # Would need custom parsing logic here
                pass
        else:
            # Fallback to manual database retrieval
            from core.chat_models import ChatSession, ChatMessage
            
            try:
                chat_session = ChatSession.objects.get(session_id=session_id)
                previous_messages = ChatMessage.objects.filter(
                    session=chat_session
                ).order_by("timestamp")[:self.k]
                
                for msg in previous_messages:
                    messages.append({"role": "user", "content": msg.message})
                    messages.append({"role": "assistant", "content": msg.response})
            except ChatSession.DoesNotExist:
                pass
        
        # Add current message
        messages.append({"role": "user", "content": current_message})
        
        return messages
    
    def save_to_database(self, session_id: str, user_message: str, ai_response: str):
        """
        Save conversation to database (persistent storage)
        
        Args:
            session_id: Chat session ID
            user_message: User's message
            ai_response: AI's response
        """
        try:
            from core.chat_models import ChatSession, ChatMessage
            from django.utils import timezone
            
            # Get or create session
            chat_session, created = ChatSession.objects.get_or_create(
                session_id=session_id,
                defaults={"language": "en"}
            )
            
            # Update last activity
            chat_session.last_activity = timezone.now()
            chat_session.save()
            
            # Save message
            ChatMessage.objects.create(
                session=chat_session,
                message=user_message,
                response=ai_response,
                language="en"
            )
            
            # Update memory cache if exists
            if session_id in self._memory_cache:
                memory = self._memory_cache[session_id]
                memory.chat_memory.add_user_message(user_message)
                memory.chat_memory.add_ai_message(ai_response)
            
            logger.debug(f"Saved conversation to database for session {session_id}")
            
        except Exception as e:
            logger.error(f"Error saving to database: {e}")
    
    def clear_cache(self, session_id: Optional[str] = None):
        """
        Clear memory cache
        
        Args:
            session_id: Specific session to clear, or None to clear all
        """
        if session_id:
            self._memory_cache.pop(session_id, None)
        else:
            self._memory_cache.clear()
    
    def get_buffer_as_string(self, session_id: str) -> str:
        """
        Get conversation history as a formatted string
        
        Args:
            session_id: Chat session ID
            
        Returns:
            Formatted conversation history string
        """
        memory = self.load_memory_from_database(session_id)
        
        if memory:
            return memory.buffer
        else:
            # Fallback to manual formatting
            from core.chat_models import ChatSession, ChatMessage
            
            try:
                chat_session = ChatSession.objects.get(session_id=session_id)
                messages = ChatMessage.objects.filter(
                    session=chat_session
                ).order_by("timestamp")[:self.k]
                
                buffer = []
                for msg in messages:
                    buffer.append(f"Human: {msg.message}")
                    buffer.append(f"AI: {msg.response}")
                
                return "\n".join(buffer)
            except ChatSession.DoesNotExist:
                return ""


# Singleton instance
_hybrid_memory_service = None

def get_memory_service(k: int = 10) -> HybridMemoryService:
    """
    Get singleton instance of HybridMemoryService
    
    Args:
        k: Window size for memory
        
    Returns:
        HybridMemoryService instance
    """
    global _hybrid_memory_service
    if _hybrid_memory_service is None:
        _hybrid_memory_service = HybridMemoryService(k=k)
    return _hybrid_memory_service

