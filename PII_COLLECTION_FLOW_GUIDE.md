# PII Collection System - Complete Flow Guide

## 📋 Overview

This guide shows the complete flow of how the PII collection system works, from user interaction to data storage and retrieval.

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION FLOW                         │
└─────────────────────────────────────────────────────────────────┘

1. User sends message
   ↓
2. AI processes message (with enhanced system prompt)
   ↓
3. AI responds (may request PII if needed)
   ↓
4. PII Extraction Service analyzes both:
   - User's message
   - AI's response (for [COLLECTED:field=value] markers)
   ↓
5. PII Validation Service validates extracted data
   ↓
6. PIICollectionManager stores validated PII
   ↓
7. Collection state updated in conversation_state
   ↓
8. Response returned to user (with pii_collected flag)
```

---

## 🎯 Step-by-Step Flow with Examples

### **Scenario 1: User Requests Appointment (Natural Collection)**

#### **Step 1: User Initiates Conversation**

```bash
POST /api/chat/
{
  "message": "I want to book an appointment",
  "session_id": "user-session-123",
  "language": "en"
}
```

**What Happens:**
- Chat session is created/retrieved
- Message sent to OpenAI with enhanced system prompt
- System prompt includes PII collection guidelines

#### **Step 2: AI Responds (Requests Email)**

**AI Response:**
```
"I'd be happy to help you book an appointment! To send you a confirmation, 
may I have your email address?"
```

**What Happens:**
- AI naturally requests email (following system prompt guidelines)
- Response stored in `ChatMessage`
- PII extraction runs on both user message and AI response

#### **Step 3: User Provides Email**

```bash
POST /api/chat/
{
  "message": "Sure, it's john@example.com",
  "session_id": "user-session-123",
  "language": "en"
}
```

**What Happens Behind the Scenes:**

1. **PII Extraction** (`PIIExtractor.extract_all()`):
   ```python
   text = "Sure, it's john@example.com"
   extracted = {
       "email": "john@example.com",  # ✅ Extracted
       "phone_number": None,
       "name": None
   }
   ```

2. **Email Validation** (`PIIValidator.validate_email()`):
   ```python
   email = "john@example.com"
   is_valid, error = validator.validate_email(email)
   # Returns: (True, None) ✅ Valid
   ```

3. **Storage** (`PIICollectionManager._store_email()`):
   ```python
   profile.email = "john@example.com"
   profile.data_quality["email"] = "confirmed"
   profile.save()
   ```

4. **State Update**:
   ```python
   conversation_state["collection_state"] = {
       "status": "collecting",
       "collected_fields": ["email"],
       "collection_attempts": {"email": 1}
   }
   ```

**API Response:**
```json
{
  "response": "Perfect! I have john@example.com. Is that correct?",
  "messageId": "msg-uuid",
  "pii_collected": true,  // ✅ Indicates PII was collected
  "language": "en"
}
```

#### **Step 4: User Confirms**

```bash
POST /api/chat/
{
  "message": "Yes, that's correct",
  "session_id": "user-session-123",
  "language": "en"
}
```

**What Happens:**
- AI confirms email
- May request name next (following progressive collection)
- Collection state updated

#### **Step 5: User Provides Name**

```bash
POST /api/chat/
{
  "message": "My name is John Doe",
  "session_id": "user-session-123",
  "language": "en"
}
```

**PII Extraction:**
```python
text = "My name is John Doe"
extracted = {
    "name": {
        "first_name": "John",
        "last_name": "Doe",
        "full_name": "John Doe"
    },
    "email": None,
    "phone_number": None
}
```

**Storage:**
```python
profile.first_name = "John"
profile.last_name = "Doe"
profile.full_name = "John Doe"
profile.data_quality["name"] = "confirmed"
profile.save()
```

**Updated State:**
```json
{
  "collection_state": {
    "status": "collecting",
    "collected_fields": ["email", "name"],
    "pending_fields": ["phone_number"]
  }
}
```

---

### **Scenario 2: User Provides Multiple Fields at Once**

#### **User Message:**
```bash
POST /api/chat/
{
  "message": "My email is jane@example.com and my phone is +1234567890",
  "session_id": "user-session-456",
  "language": "en"
}
```

**What Happens:**

1. **Extraction**:
   ```python
   extracted = {
       "email": "jane@example.com",
       "phone_number": "+1234567890",  # Formatted to E.164
       "name": None
   }
   ```

2. **Validation**:
   - Email: ✅ Valid
   - Phone: ✅ Valid (formatted to E.164)

3. **Storage**:
   ```python
   profile.email = "jane@example.com"
   profile.phone_number = "+1234567890"
   profile.data_quality = {
       "email": "confirmed",
       "phone_number": "confirmed"
   }
   ```

4. **Response**:
   ```json
   {
     "response": "Thank you! I have your email (jane@example.com) and phone (+1234567890).",
     "pii_collected": true
   }
   ```

---

### **Scenario 3: AI Uses Structured Markers**

#### **AI Response (with marker):**
```
"Perfect! I'll send the report to john@example.com.
[COLLECTED:email=john@example.com]
[COLLECTED:name=John Doe]"
```

**What Happens:**

1. **Marker Extraction** (`PIICollectionManager._extract_from_ai_markers()`):
   ```python
   ai_response = "Perfect! [COLLECTED:email=john@example.com] [COLLECTED:name=John Doe]"
   extracted = {
       "email": "john@example.com",
       "name": {
           "first_name": "John",
           "last_name": "Doe",
           "full_name": "John Doe"
       }
   }
   ```

2. **Storage**: Same as above

**Note:** Markers are removed from final response shown to user.

---

## 🔍 How Each Component Works

### **1. PII Extraction (`PIIExtractor`)**

```python
from core.pii_service import PIIExtractor

extractor = PIIExtractor()

# Extract email
email = extractor.extract_email("Contact me at john@example.com")
# Returns: "john@example.com"

# Extract phone
phone = extractor.extract_phone("Call me at +1-234-567-8900")
# Returns: "+12345678900" (E.164 format)

# Extract name
name = extractor.extract_name("My name is John Doe")
# Returns: {
#     "first_name": "John",
#     "last_name": "Doe",
#     "full_name": "John Doe"
# }

# Extract all
all_pii = extractor.extract_all("Email: john@example.com, Phone: +1234567890")
# Returns: {
#     "email": "john@example.com",
#     "phone_number": "+1234567890",
#     "name": None
# }
```

**Supported Formats:**

**Email:**
- `john@example.com` ✅
- `user.name+tag@domain.co.uk` ✅
- `invalid-email` ❌

**Phone:**
- `+1234567890` ✅
- `(123) 456-7890` ✅
- `123-456-7890` ✅
- `+1 234 567 8900` ✅

**Name:**
- "My name is John Doe" ✅
- "I'm Jane Smith" ✅
- "Call me John" ✅

---

### **2. PII Validation (`PIIValidator`)**

```python
from core.pii_service import PIIValidator

validator = PIIValidator()

# Validate email
is_valid, error = validator.validate_email("john@example.com")
# Returns: (True, None) ✅

is_valid, error = validator.validate_email("invalid-email")
# Returns: (False, "The email address is not valid.") ❌

# Validate phone
is_valid, error = validator.validate_phone("+1234567890")
# Returns: (True, None) ✅

is_valid, error = validator.validate_phone("123")
# Returns: (False, "Invalid phone number format") ❌

# Validate name
is_valid, error = validator.validate_name({
    "first_name": "John",
    "last_name": "Doe"
})
# Returns: (True, None) ✅
```

---

### **3. PII Collection Manager (`PIICollectionManager`)**

```python
from core.pii_collection_manager import PIICollectionManager
from core.chat_models import ChatSession

# Get session
session = ChatSession.objects.get(session_id="user-session-123")

# Create manager
manager = PIICollectionManager(session)

# Extract and store PII
result = manager.extract_and_store_pii(
    user_message="My email is john@example.com",
    ai_response="Thank you!"
)

# Result:
{
    "extracted": {
        "email": "john@example.com"
    },
    "stored": {
        "email": "john@example.com"
    },
    "status": "success"
}

# Get collection state
state = manager.get_collection_state()
# Returns:
{
    "status": "collecting",
    "collected_fields": ["email"],
    "pending_fields": [],
    "collection_attempts": {"email": 1}
}

# Check if should request field
should_request = manager.should_request_field("phone_number")
# Returns: True (if not collected and attempts < 2)
```

---

## 📊 Data Storage Flow

### **1. UserProfile Model**

```python
# Profile is automatically created when first PII is collected
profile = UserProfile.objects.get(session=session)

# Profile fields
profile.email = "john@example.com"
profile.phone_number = "+1234567890"
profile.first_name = "John"
profile.last_name = "Doe"
profile.full_name = "John Doe"

# Data quality tracking
profile.data_quality = {
    "email": "confirmed",      # User explicitly provided
    "phone_number": "confirmed",
    "name": "confirmed"
}

# Preferences (for future analysis)
profile.preferences = {
    "communication_preference": "email",
    "topics_of_interest": ["appointments", "health"]
}

profile.save()
```

### **2. Conversation State**

```python
# Stored in ChatSession.conversation_state
session.conversation_state = {
    "collection_state": {
        "status": "collecting",  # or "completed", "skipped"
        "current_field": "phone_number",
        "collected_fields": ["email", "name"],
        "pending_fields": ["phone_number"],
        "collection_attempts": {
            "email": 1,
            "name": 1,
            "phone_number": 0
        },
        "last_request_timestamp": "2024-01-15T10:30:00Z"
    },
    "extracted_data": {
        "email": "john@example.com",
        "name": "John Doe"
    }
}
session.save()
```

---

## 🔄 Complete API Flow Example

### **Step 1: Start Chat Session**

```bash
POST /api/chat/
Content-Type: application/json

{
  "message": "Hello",
  "session_id": "demo-session-001",
  "language": "en"
}
```

**Response:**
```json
{
  "response": "Hello! How can I help you today?",
  "messageId": "msg-001",
  "pii_collected": false,
  "language": "en"
}
```

### **Step 2: Request Appointment**

```bash
POST /api/chat/
Content-Type: application/json

{
  "message": "I want to book an appointment",
  "session_id": "demo-session-001",
  "language": "en"
}
```

**Response:**
```json
{
  "response": "I'd be happy to help you book an appointment! To send you a confirmation, may I have your email address?",
  "messageId": "msg-002",
  "pii_collected": false,
  "language": "en"
}
```

### **Step 3: Provide Email**

```bash
POST /api/chat/
Content-Type: application/json

{
  "message": "Sure, it's john@example.com",
  "session_id": "demo-session-001",
  "language": "en"
}
```

**Response:**
```json
{
  "response": "Perfect! I have john@example.com. Is that correct?",
  "messageId": "msg-003",
  "pii_collected": true,  // ✅ PII was collected!
  "language": "en"
}
```

**What Happened:**
- Email extracted: `john@example.com`
- Email validated: ✅ Valid
- Email stored in UserProfile
- Collection state updated

### **Step 4: Confirm Email**

```bash
POST /api/chat/
Content-Type: application/json

{
  "message": "Yes, that's correct",
  "session_id": "demo-session-001",
  "language": "en"
}
```

**Response:**
```json
{
  "response": "Great! And may I have your name for the appointment?",
  "messageId": "msg-004",
  "pii_collected": false,
  "language": "en"
}
```

### **Step 5: Provide Name**

```bash
POST /api/chat/
Content-Type: application/json

{
  "message": "My name is John Doe",
  "session_id": "demo-session-001",
  "language": "en"
}
```

**Response:**
```json
{
  "response": "Thank you, John! Let me help you book that appointment...",
  "messageId": "msg-005",
  "pii_collected": true,  // ✅ Name collected!
  "language": "en"
}
```

### **Step 6: Check Profile**

```bash
GET /api/profile/demo-session-001/
```

**Response:**
```json
{
  "id": "profile-uuid",
  "session_id": "demo-session-001",
  "full_name": "John Doe",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone_number": null,
  "collected_fields": ["name", "email"],
  "is_complete": true,
  "data_quality": {
    "name": "confirmed",
    "email": "confirmed"
  },
  "preferences": {},
  "interests": [],
  "concerns": [],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:35:00Z"
}
```

### **Step 7: Check Collection State**

```bash
GET /api/profile/demo-session-001/collection-state/
```

**Response:**
```json
{
  "session_id": "demo-session-001",
  "collection_state": {
    "status": "collecting",
    "current_field": "name",
    "collected_fields": ["email", "name"],
    "pending_fields": ["phone_number"],
    "collection_attempts": {
      "email": 1,
      "name": 1,
      "phone_number": 0
    }
  },
  "collected_fields": ["name", "email"],
  "is_complete": true
}
```

### **Step 8: Update Profile (Optional)**

```bash
PATCH /api/profile/demo-session-001/
Content-Type: application/json

{
  "phone_number": "+1234567890"
}
```

**Response:**
```json
{
  "id": "profile-uuid",
  "session_id": "demo-session-001",
  "full_name": "John Doe",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone_number": "+1234567890",  // ✅ Updated!
  "collected_fields": ["name", "email", "phone_number"],
  "is_complete": true,
  "data_quality": {
    "name": "confirmed",
    "email": "confirmed",
    "phone_number": "confirmed"
  },
  "updated_at": "2024-01-15T10:40:00Z"
}
```

---

## 🧠 AI System Prompt Integration

### **How AI Knows to Collect PII**

The system prompt includes:

```
COLLECTING PERSONAL INFORMATION:

1. **When to Collect:**
   - When user asks about appointments, reports, or follow-ups
   - When user requests to be contacted
   - When providing personalized recommendations

2. **How to Request:**
   - Be natural and conversational
   - Explain why you need it
   - One field at a time
   - Respect if user declines

3. **Response Format:**
   When you successfully collect information, include:
   [COLLECTED:email=john@example.com]
   [COLLECTED:name=John Doe]
```

**Example AI Behavior:**

**User:** "I want to book an appointment"

**AI:** "I'd be happy to help you book an appointment! To send you a confirmation, may I have your email address?"

**User:** "john@example.com"

**AI:** "Perfect! I have john@example.com. [COLLECTED:email=john@example.com] Is that correct?"

---

## 🔄 State Machine Flow

```
┌─────────────┐
│ Not Started │
└──────┬──────┘
       │ User requests something requiring PII
       ↓
┌─────────────┐
│ Collecting  │ ←──┐
└──────┬──────┘    │
       │           │ More fields needed
       │ PII collected │
       ↓           │
┌─────────────┐    │
│  Completed  │    │
└─────────────┘    │
       │           │
       │ User skips│
       ↓           │
┌─────────────┐    │
│   Skipped   │ ───┘
└─────────────┘
```

---

## 📝 Key Features

### **1. Automatic Extraction**
- Extracts from user messages
- Extracts from AI response markers
- Handles multiple formats

### **2. Validation**
- Email format validation
- Phone number validation (international)
- Name validation

### **3. State Management**
- Tracks collection progress
- Prevents duplicate requests
- Limits attempts (max 2 per field)

### **4. Data Quality**
- Tracks confirmation status
- Supports: confirmed, unconfirmed, inferred

### **5. Privacy**
- Consent fields ready
- Data quality tracking
- Secure storage

---

## 🎯 Best Practices

### **For Frontend Developers:**

1. **Check `pii_collected` flag** in chat responses
2. **Show collection progress** using collection state endpoint
3. **Display collected fields** to user for confirmation
4. **Handle updates** via PATCH endpoint

### **For Backend Developers:**

1. **Monitor collection rates** via analytics
2. **Validate data quality** before using PII
3. **Respect consent** (check `consent_given` field)
4. **Log collection events** for audit

---

## 🚀 Quick Start

```python
# 1. User sends message
POST /api/chat/ {"message": "I want an appointment", "session_id": "123"}

# 2. AI requests email
# Response: "May I have your email?"

# 3. User provides email
POST /api/chat/ {"message": "john@example.com", "session_id": "123"}

# 4. Check what was collected
GET /api/profile/123/

# 5. Update if needed
PATCH /api/profile/123/ {"phone_number": "+1234567890"}
```

---

## 📚 Related Documentation

- **Design**: `AI_PII_COLLECTION_DESIGN.md`
- **Implementation**: `IMPLEMENTATION_GUIDE_PII_COLLECTION.md`
- **Summary**: `PII_COLLECTION_IMPLEMENTATION_SUMMARY.md`
- **This Flow**: `PII_COLLECTION_FLOW_GUIDE.md`

---

## ✅ Summary

The PII collection system works seamlessly in the background:

1. **User chats** → AI responds naturally
2. **AI requests info** → User provides it
3. **System extracts** → Validates → Stores
4. **State tracked** → Progress monitored
5. **Data available** → Via API endpoints

All happening automatically with minimal user friction! 🎉













