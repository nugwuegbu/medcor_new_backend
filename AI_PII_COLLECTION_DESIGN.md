# AI Agent Personal Information Collection - Design Document

## 📋 Overview

This document outlines the best practices and architecture for collecting personal information (email, phone number, and other PII) during AI conversations, storing it securely, and using it for user preference analysis.

---

## 🎯 Design Principles

### 1. **Privacy-First Approach**
- ✅ Always request consent before collecting PII
- ✅ Explain why information is needed
- ✅ Allow users to skip optional fields
- ✅ Provide clear data usage policies
- ✅ Enable data deletion requests

### 2. **Conversational & Natural**
- ✅ Collect information organically during conversation
- ✅ Use context-aware prompts (don't ask for email if already provided)
- ✅ Validate and confirm information before storing
- ✅ Handle partial information gracefully

### 3. **Progressive Disclosure**
- ✅ Collect only what's needed when it's needed
- ✅ Start with least sensitive info (name) → most sensitive (phone/email)
- ✅ Don't overwhelm users with multiple requests at once
- ✅ Use multi-turn conversations to gather information

### 4. **Data Quality**
- ✅ Validate format (email, phone) before storing
- ✅ Confirm information with user ("Is john@example.com correct?")
- ✅ Handle corrections gracefully
- ✅ Store confidence level (confirmed vs. unconfirmed)

---

## 🏗️ Architecture Design

### **Option 1: Structured State Machine (Recommended)**

Use a state machine in `conversation_state` to track what information has been collected and what's still needed.

**Advantages:**
- ✅ Clear flow control
- ✅ Easy to resume interrupted conversations
- ✅ Prevents duplicate requests
- ✅ Supports conditional collection (only ask for phone if email provided)

**Flow Example:**
```
Initial State → Greeting → Collect Name → Collect Email → Collect Phone → Complete
```

### **Option 2: AI-Guided Collection (More Flexible)**

Let the AI decide when to request information based on conversation context, but provide structured tools/functions to extract and store PII.

**Advantages:**
- ✅ More natural conversations
- ✅ Context-aware collection
- ✅ Handles edge cases better
- ✅ Can collect multiple fields in one turn

**Flow Example:**
```
AI analyzes conversation → Detects need for contact info → 
Requests information naturally → Extracts PII from response → 
Stores in structured format
```

### **Option 3: Hybrid Approach (Best of Both)**

Combine structured state tracking with AI-guided collection for maximum flexibility.

---

## 📊 Data Model Design

### **New Model: `UserProfile` (or extend `ChatSession`)**

Store collected PII separately from User model to support anonymous sessions.

```python
class UserProfile(models.Model):
    """Collected user information from chat sessions."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    session = models.OneToOneField(
        ChatSession, 
        on_delete=models.CASCADE, 
        related_name="user_profile"
    )
    
    # Personal Information (collected progressively)
    full_name = models.CharField(max_length=200, blank=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True, db_index=True)
    phone_number = models.CharField(max_length=20, blank=True, db_index=True)
    
    # Additional Information
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, blank=True)
    location = models.CharField(max_length=255, blank=True)
    occupation = models.CharField(max_length=200, blank=True)
    
    # Preferences (for analysis)
    preferences = models.JSONField(default=dict, blank=True)
    interests = models.JSONField(default=list, blank=True)
    concerns = models.JSONField(default=list, blank=True)
    
    # Data Quality & Consent
    data_quality = models.JSONField(default=dict)  # {field: "confirmed"|"unconfirmed"|"inferred"}
    consent_given = models.BooleanField(default=False)
    consent_timestamp = models.DateTimeField(null=True, blank=True)
    consent_version = models.CharField(max_length=20, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    last_verified = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["phone_number"]),
            models.Index(fields=["session"]),
        ]
```

### **Enhanced `ChatSession.conversation_state`**

Store collection state and progress:

```json
{
  "collection_state": {
    "status": "collecting" | "completed" | "skipped",
    "current_field": "email",
    "collected_fields": ["name", "email"],
    "pending_fields": ["phone_number"],
    "collection_attempts": {
      "email": 1,
      "phone_number": 0
    },
    "last_request_timestamp": "2024-01-15T10:30:00Z"
  },
  "extracted_data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": null
  },
  "user_preferences": {
    "communication_preference": "email",
    "topics_of_interest": ["health", "wellness"]
  }
}
```

---

## 🤖 AI System Prompt Enhancement

### **Add to System Prompt:**

```
COLLECTING PERSONAL INFORMATION:

You may need to collect user information during conversations. Follow these guidelines:

1. **When to Collect:**
   - When user asks about appointments, reports, or follow-ups
   - When user requests to be contacted
   - When providing personalized recommendations
   - When user explicitly offers information

2. **How to Request:**
   - Be natural and conversational
   - Explain why you need it: "To send you your analysis report, may I have your email address?"
   - One field at a time (don't ask for multiple fields in one message)
   - Respect if user declines or skips

3. **Information to Collect (in order of priority):**
   - Full Name (first and last)
   - Email Address
   - Phone Number (optional, only if needed)
   - Date of Birth (optional, for medical records)
   - Location (optional, for local recommendations)

4. **Validation:**
   - Confirm email format: "Is john@example.com correct?"
   - Confirm phone format: "Is +1234567890 correct?"
   - If user provides incorrect format, politely ask again

5. **Response Format:**
   When you successfully collect information, include a structured marker in your response:
   [COLLECTED:email=john@example.com]
   [COLLECTED:name=John Doe]
   
   This helps the system store the information correctly.

6. **Privacy:**
   - Always mention: "Your information will be kept confidential and used only for [purpose]"
   - If user asks about privacy, explain your data usage policy
```

---

## 🔄 Conversation Flow Examples

### **Example 1: Natural Collection During Appointment Request**

```
User: "I'd like to book an appointment"
AI: "I'd be happy to help you book an appointment! To send you a confirmation, 
     may I have your email address?"
User: "Sure, it's john@example.com"
AI: "Perfect! I have john@example.com. Is that correct?"
     [COLLECTED:email=john@example.com]
User: "Yes"
AI: "Great! And may I have your name for the appointment?"
User: "John Doe"
AI: [COLLECTED:name=John Doe] "Thank you, John! Let me help you book that appointment..."
```

### **Example 2: Information Already Provided**

```
User: "My email is jane@example.com, can you send me the report?"
AI: "Absolutely! I'll send the report to jane@example.com. 
     May I also have your name?"
     [COLLECTED:email=jane@example.com]
User: "Jane Smith"
AI: [COLLECTED:name=Jane Smith] "Perfect! I'll send the report to jane@example.com right away..."
```

### **Example 3: User Declines**

```
AI: "To send you updates, may I have your email address?"
User: "No thanks, I don't want to share that"
AI: "No problem at all! I can still help you with [alternative solution]. 
     How can I assist you today?"
```

---

## 📈 Analysis & Insights Design

### **1. User Preference Extraction**

Extract preferences from conversation context:

```python
class PreferenceExtractor:
    """Extract user preferences from conversation."""
    
    def extract_preferences(self, conversation_history: List[ChatMessage]) -> Dict:
        """
        Analyze conversation to extract:
        - Topics of interest
        - Communication preferences
        - Health concerns
        - Preferred services
        """
        # Use AI to analyze conversation
        # Store in UserProfile.preferences
```

### **2. Conversation Analysis**

```python
class ConversationAnalyzer:
    """Analyze conversations for insights."""
    
    def analyze_session(self, session: ChatSession) -> Dict:
        """
        Returns:
        - Sentiment analysis
        - Key topics discussed
        - User intent (booking, inquiry, support)
        - Satisfaction indicators
        - Conversion metrics (did they book? did they provide info?)
        """
```

### **3. Analytics Dashboard Data**

Store aggregated insights:

```python
class UserInsight(models.Model):
    """Aggregated user insights for analysis."""
    
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE)
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    
    # Insights
    primary_intent = models.CharField(max_length=50)  # booking, inquiry, support
    topics_discussed = models.JSONField(default=list)
    sentiment_score = models.FloatField(null=True)
    satisfaction_score = models.FloatField(null=True)
    
    # Conversion metrics
    provided_contact_info = models.BooleanField(default=False)
    booked_appointment = models.BooleanField(default=False)
    requested_follow_up = models.BooleanField(default=False)
    
    # Preferences
    communication_preference = models.CharField(max_length=20, blank=True)
    preferred_topics = models.JSONField(default=list)
    
    created_at = models.DateTimeField(default=timezone.now)
```

---

## 🔒 Privacy & Security

### **1. Consent Management**

- Track consent in `ConsentRecord` model (already exists)
- Link consent to `UserProfile`
- Store consent version and timestamp
- Support consent revocation

### **2. Data Encryption**

- Encrypt sensitive fields at rest (email, phone)
- Use Django's encryption utilities
- Hash phone numbers for search (optional)

### **3. Data Retention**

- Implement data retention policies
- Allow users to request data deletion
- Anonymize data after retention period

### **4. Access Control**

- Only authorized hospital staff can view PII
- Audit logs for PII access
- Role-based access control

---

## 🛠️ Implementation Strategy

### **Phase 1: Foundation**
1. Create `UserProfile` model
2. Add PII extraction utilities
3. Enhance system prompt with collection guidelines
4. Update `conversation_state` structure

### **Phase 2: Collection Logic**
1. Implement state machine for collection flow
2. Add PII extraction from AI responses
3. Add validation and confirmation logic
4. Handle edge cases (partial info, corrections)

### **Phase 3: Analysis**
1. Build preference extraction service
2. Create conversation analyzer
3. Implement `UserInsight` model
4. Build analytics queries

### **Phase 4: Privacy & Compliance**
1. Enhance consent tracking
2. Add data encryption
3. Implement data retention policies
4. Add audit logging

---

## 📝 API Design

### **New Endpoints:**

1. **GET `/api/chat/profile/{session_id}/`**
   - Get collected user profile
   - Returns: UserProfile data (masked if no consent)

2. **POST `/api/chat/profile/{session_id}/update/`**
   - Manually update profile (for corrections)
   - Validates and updates fields

3. **POST `/api/chat/profile/{session_id}/consent/`**
   - Record consent for data collection
   - Required before storing PII

4. **GET `/api/chat/insights/{session_id}/`**
   - Get conversation insights
   - Returns: UserInsight data

5. **DELETE `/api/chat/profile/{session_id}/`**
   - Delete user profile (GDPR compliance)
   - Anonymizes conversation history

---

## 🎨 Frontend Integration

### **UI Components Needed:**

1. **Consent Modal**
   - Show before collecting PII
   - Link to privacy policy
   - Accept/Decline buttons

2. **Information Collection Indicator**
   - Show when AI is requesting info
   - Display what's being collected
   - Show progress (e.g., "2 of 3 fields collected")

3. **Profile Summary**
   - Show collected information
   - Allow editing/correction
   - Show data quality status

---

## ✅ Success Metrics

- **Collection Rate**: % of sessions where PII is collected
- **Completion Rate**: % of sessions where all required fields collected
- **Data Quality**: % of confirmed vs. unconfirmed data
- **User Satisfaction**: Sentiment analysis of collection interactions
- **Conversion Rate**: % of users who provide info and then book/convert

---

## 🚀 Next Steps

1. **Review this design** with stakeholders
2. **Choose implementation approach** (State Machine vs. AI-Guided vs. Hybrid)
3. **Prioritize features** (what's MVP vs. nice-to-have)
4. **Start with Phase 1** (Foundation)
5. **Iterate based on user feedback**

---

## 📚 References

- GDPR Compliance Guidelines
- HIPAA Considerations (if applicable)
- OpenAI Function Calling (for structured extraction)
- Django Security Best Practices
- Conversation Design Patterns













