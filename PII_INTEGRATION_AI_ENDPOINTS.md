# PII Collection Integration with AI Agent Endpoints

## ✅ Integration Complete

The PII collection system has been successfully integrated into the main AI agent endpoints.

---

## 🔗 Integrated Endpoints

### **1. `/api/ai/query/` - HealthAwareQueryView**

**Status:** ✅ **FULLY INTEGRATED**

This is the main AI query endpoint that handles:
- General health questions
- Hospital-specific queries
- Appointment booking

**Integration Details:**
- PII extraction runs automatically after AI response generation
- Works with all query types: `health`, `hospital`, `appointment`
- Extracts PII from both user question and AI response
- Stores PII when `session_id` is provided
- Returns `pii_collected: true/false` in response

**Example Request:**
```bash
POST /api/ai/query/
{
  "question": "I want to book an appointment",
  "hospital": "hospital-uuid",
  "session_id": "user-session-123"
}
```

**Example Response:**
```json
{
  "success": true,
  "response": "I'd be happy to help! May I have your email address?",
  "query_type": "appointment",
  "pii_collected": false
}
```

**After User Provides Email:**
```bash
POST /api/ai/query/
{
  "question": "My email is john@example.com",
  "hospital": "hospital-uuid",
  "session_id": "user-session-123"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Perfect! I have john@example.com.",
  "query_type": "appointment",
  "pii_collected": true  // ✅ Email collected!
}
```

---

### **2. `/api/chat/` - TextChatView**

**Status:** ✅ **ALREADY INTEGRATED** (from previous implementation)

This endpoint handles text chat conversations.

**Integration Details:**
- PII extraction integrated in previous implementation
- Works with chat sessions
- Returns `pii_collected` flag

---

## 🔄 How It Works

### **Flow Diagram**

```
User Question
    ↓
POST /api/ai/query/
    ↓
AI Processes Query
    ↓
AI Response Generated
    ↓
PII Extraction Service
    ├─→ Extract from user question
    └─→ Extract from AI response
    ↓
PII Validation
    ↓
Store in UserProfile (if session_id provided)
    ↓
Response with pii_collected flag
```

### **Code Integration**

**Helper Method Added:**
```python
def _extract_and_store_pii(self, question: str, ai_response: str, chat_session):
    """
    Extract and store PII from question and AI response.
    Returns True if PII was collected, False otherwise.
    """
    if not chat_session:
        return False
    
    try:
        from core.pii_collection_manager import PIICollectionManager
        
        pii_manager = PIICollectionManager(chat_session)
        pii_result = pii_manager.extract_and_store_pii(question, ai_response)
        
        if pii_result.get("stored"):
            logger.info(f"Collected PII: {pii_result['stored']}")
            return True
        return False
    except Exception as e:
        logger.warning(f"Error extracting PII: {e}")
        return False
```

**Integration Points:**
1. **Health Queries** - After `_handle_health_query()`
2. **Hospital Queries** - After `_handle_hospital_query()`
3. **Appointment Booking** - After `_handle_appointment_booking()`

**Response Enhancement:**
```python
# Extract and store PII
pii_collected = self._extract_and_store_pii(
    question, 
    response_data.get('response'), 
    chat_session
)

# Add pii_collected flag to response
response_data['pii_collected'] = pii_collected
response = Response(response_data, status=response.status_code)
```

---

## 📊 Supported Query Types

### **1. Health Queries**
```bash
POST /api/ai/query/
{
  "question": "What are the symptoms of diabetes?",
  "session_id": "session-123"
}
```

**PII Collection:**
- Extracts PII if user provides it in follow-up questions
- Example: "My email is john@example.com for the report"

### **2. Hospital Queries**
```bash
POST /api/ai/query/
{
  "question": "Is there a Gynecologist in this hospital?",
  "hospital": "hospital-uuid",
  "session_id": "session-123"
}
```

**PII Collection:**
- Extracts PII if user provides contact information
- Example: "Contact me at john@example.com"

### **3. Appointment Booking**
```bash
POST /api/ai/query/
{
  "question": "I want to book an appointment",
  "hospital": "hospital-uuid",
  "session_id": "session-123"
}
```

**PII Collection:**
- **Most common use case** - AI will request email/phone for booking
- Extracts email, phone, name during booking flow
- Example: "My email is john@example.com and phone is +1234567890"

---

## 🎯 Complete Example Flow

### **Step 1: User Requests Appointment**

```bash
POST /api/ai/query/
{
  "question": "I want to book an appointment",
  "hospital": "hospital-uuid",
  "session_id": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "response": "I'd be happy to help you book an appointment! To send you a confirmation, may I have your email address?",
  "query_type": "appointment",
  "pii_collected": false
}
```

### **Step 2: User Provides Email**

```bash
POST /api/ai/query/
{
  "question": "Sure, it's john@example.com",
  "hospital": "hospital-uuid",
  "session_id": "user-123"
}
```

**What Happens:**
1. AI processes: "Sure, it's john@example.com"
2. PII Extraction: Finds `john@example.com`
3. Validation: ✅ Valid email format
4. Storage: Saved to UserProfile
5. Response: `pii_collected: true`

**Response:**
```json
{
  "success": true,
  "response": "Perfect! I have john@example.com. Is that correct?",
  "query_type": "appointment",
  "pii_collected": true  // ✅
}
```

### **Step 3: Check Profile**

```bash
GET /api/profile/user-123/
```

**Response:**
```json
{
  "email": "john@example.com",
  "collected_fields": ["email"],
  "data_quality": {
    "email": "confirmed"
  }
}
```

---

## 🔍 What Gets Extracted

### **From User Questions:**
- Email: "My email is john@example.com"
- Phone: "Call me at +1234567890"
- Name: "My name is John Doe"

### **From AI Responses:**
- Structured markers: `[COLLECTED:email=john@example.com]`
- Confirmation text: "I have john@example.com"

---

## ✅ Features

1. **Automatic Extraction**
   - No manual intervention needed
   - Works with all query types

2. **Session-Based**
   - Only extracts when `session_id` is provided
   - Links PII to chat session

3. **Validation**
   - Email format validation
   - Phone number validation (international)
   - Name validation

4. **Response Flag**
   - `pii_collected: true/false` in all responses
   - Easy to track collection status

5. **Swagger Documentation**
   - `pii_collected` field documented in OpenAPI schema
   - Available in Swagger UI

---

## 📝 API Documentation

**Swagger UI:**
- `http://localhost:8000/api/docs/`
- Look for `/api/ai/query/` endpoint
- See `pii_collected` field in response schema

**Updated Response Schema:**
```json
{
  "success": true,
  "response": "string",
  "query_type": "health|hospital|appointment",
  "pii_collected": true,  // ✅ New field
  "hospital_info": {...},
  "appointment_options": [...],
  "follow_up_questions": [...]
}
```

---

## 🚀 Usage

### **Basic Usage:**
```python
# 1. Start conversation
POST /api/ai/query/
{
  "question": "I want to book an appointment",
  "session_id": "my-session"
}

# 2. Provide PII
POST /api/ai/query/
{
  "question": "My email is john@example.com",
  "session_id": "my-session"
}

# 3. Check collected data
GET /api/profile/my-session/
```

### **With Hospital:**
```python
POST /api/ai/query/
{
  "question": "I want to book an appointment",
  "hospital": "hospital-uuid",
  "session_id": "my-session"
}
```

---

## 🔒 Privacy & Security

- ✅ PII only extracted when `session_id` provided
- ✅ Validated before storage
- ✅ Stored securely in database
- ✅ Linked to chat session
- ✅ Can be retrieved via profile endpoint

---

## 📚 Related Documentation

- **Flow Guide**: `PII_COLLECTION_FLOW_GUIDE.md`
- **Implementation**: `PII_COLLECTION_IMPLEMENTATION_SUMMARY.md`
- **Design**: `AI_PII_COLLECTION_DESIGN.md`

---

## ✅ Summary

**Integrated Endpoints:**
- ✅ `/api/ai/query/` - HealthAwareQueryView
- ✅ `/api/chat/` - TextChatView

**Features:**
- ✅ Automatic PII extraction
- ✅ Works with all query types
- ✅ Session-based collection
- ✅ Response flag (`pii_collected`)
- ✅ Swagger documentation

**Ready to use!** 🎉













