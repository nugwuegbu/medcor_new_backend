# Memory Debugging Guide

## How to Verify Memory is Working

### 1. Check Server Logs

Look for these log messages:

```
INFO: Using LangChain memory for session {session_id}, loaded {N} total messages
INFO: Created ConversationBufferWindowMemory for session {session_id}: {total_pairs} total message pairs in DB, will use last {windowed_pairs} pairs (k={k})
INFO: Retrieved {N} total messages, applying window k={k} ({M} messages)
INFO: Saved conversation using LangChain memory service for session {session_id}
```

### 2. Test Conversation Flow

**First Message:**
```bash
curl -X 'POST' \
  'http://localhost:8000/api/ai/query/' \
  -H 'Content-Type: application/json' \
  -d '{
    "question": "I want to book an appointment",
    "hospital": "cfe6b61d-f82b-4af9-91ef-9cbc5f918883",
    "session_id": "test-session-123"
  }'
```

**Second Message (should remember):**
```bash
curl -X 'POST' \
  'http://localhost:8000/api/ai/query/' \
  -H 'Content-Type: application/json' \
  -d '{
    "question": "Consultation",
    "hospital": "cfe6b61d-f82b-4af9-91ef-9cbc5f918883",
    "session_id": "test-session-123"
  }'
```

The second message should reference the first ("I see you want to book an appointment...")

### 3. Check Database

```python
from core.chat_models import ChatSession, ChatMessage

session = ChatSession.objects.get(session_id="test-session-123")
messages = ChatMessage.objects.filter(session=session).order_by("timestamp")
for msg in messages:
    print(f"User: {msg.message}")
    print(f"AI: {msg.response}")
    print("---")
```

### 4. Common Issues

#### Issue: "Session {session_id} not found"
- **Cause**: Session doesn't exist in database
- **Fix**: Ensure session_id is consistent across requests

#### Issue: "LangChain memory failed, falling back to manual"
- **Cause**: LangChain import error or database issue
- **Fix**: Check if LangChain is installed: `pip install langchain langchain-community`
- Check database connection

#### Issue: Memory not persisting
- **Cause**: Messages not being saved
- **Fix**: Check logs for "Saved conversation using LangChain memory service"
- Verify ChatMessage records are being created

#### Issue: Context not maintained
- **Cause**: session_id not provided or different each time
- **Fix**: Always use the same session_id for a conversation

### 5. Enable Debug Logging

Add to Django settings:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'core.services': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'core.memory_service': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'core.ai_query_views': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```































