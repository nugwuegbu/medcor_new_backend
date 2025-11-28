# Implementation Guide: AI PII Collection System

## 📋 Requirements Checklist

### **1. Python Dependencies**

Add these to `requirements.txt` (if not already present):

```txt
# Already in your requirements.txt:
openai==1.106.1          # ✅ Already installed
pydantic==2.11.7        # ✅ Already installed (for validation)
djangorestframework==3.14.0  # ✅ Already installed

# Add these NEW dependencies:
phonenumbers==8.13.36   # Phone number validation
email-validator==2.2.0  # Enhanced email validation
```

**Install command:**
```bash
pip install phonenumbers==8.13.36 email-validator==2.2.0
```

### **2. Database Requirements**

- ✅ PostgreSQL (already configured)
- ✅ Django migrations support (already available)

### **3. System Requirements**

- ✅ OpenAI API key configured (already set up)
- ✅ Django 5.0.1+ (already installed)
- ✅ Python 3.8+ (assumed)

---

## 🚀 Step-by-Step Implementation

### **STEP 1: Install Dependencies**

```bash
cd /home/nnamdi/pyth/medcor_backend2
source venv/bin/activate
pip install phonenumbers==8.13.36 email-validator==2.2.0
```

---

### **STEP 2: Create UserProfile Model**

**File:** `core/chat_models.py`

Add this model after the existing models:

```python
class UserProfile(models.Model):
    """Collected user information from chat sessions."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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
    data_quality = models.JSONField(
        default=dict,
        help_text="Tracks quality: {field: 'confirmed'|'unconfirmed'|'inferred'}"
    )
    consent_given = models.BooleanField(default=False)
    consent_timestamp = models.DateTimeField(null=True, blank=True)
    consent_version = models.CharField(max_length=20, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    last_verified = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = "user_profiles"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["phone_number"]),
            models.Index(fields=["session"]),
        ]
    
    def __str__(self):
        return f"Profile for session {self.session.session_id}"
    
    def get_collected_fields(self):
        """Return list of fields that have been collected."""
        collected = []
        if self.full_name or (self.first_name and self.last_name):
            collected.append("name")
        if self.email:
            collected.append("email")
        if self.phone_number:
            collected.append("phone_number")
        return collected
    
    def is_complete(self, required_fields=None):
        """Check if all required fields are collected."""
        if required_fields is None:
            required_fields = ["name", "email"]
        
        collected = self.get_collected_fields()
        return all(field in collected for field in required_fields)
```

---

### **STEP 3: Create PII Extraction Service**

**File:** `core/pii_service.py` (NEW FILE)

```python
"""
PII (Personally Identifiable Information) Extraction and Validation Service.
"""

import re
import logging
from typing import Dict, Optional, Tuple
from datetime import datetime

import phonenumbers
from phonenumbers import NumberParseException
from email_validator import validate_email, EmailNotValidError

logger = logging.getLogger(__name__)


class PIIExtractor:
    """Extract and validate PII from text."""
    
    # Email regex pattern
    EMAIL_PATTERN = re.compile(
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    )
    
    # Phone number patterns (various formats)
    PHONE_PATTERNS = [
        r'\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}',  # International
        r'\(\d{3}\)\s?\d{3}[-.\s]?\d{4}',  # US format (123) 456-7890
        r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}',  # US format 123-456-7890
    ]
    
    def extract_email(self, text: str) -> Optional[str]:
        """Extract email address from text."""
        try:
            matches = self.EMAIL_PATTERN.findall(text)
            if matches:
                # Validate the first email found
                email = matches[0].lower().strip()
                try:
                    validation = validate_email(email, check_deliverability=False)
                    return validation.email
                except EmailNotValidError:
                    logger.warning(f"Invalid email format: {email}")
                    return None
        except Exception as e:
            logger.error(f"Error extracting email: {e}")
        return None
    
    def extract_phone(self, text: str, default_region: str = "US") -> Optional[str]:
        """Extract and validate phone number from text."""
        try:
            # Try all patterns
            for pattern in self.PHONE_PATTERNS:
                matches = re.findall(pattern, text)
                if matches:
                    phone_str = matches[0].strip()
                    # Clean phone number
                    phone_str = re.sub(r'[^\d+]', '', phone_str)
                    
                    try:
                        # Parse and validate
                        parsed = phonenumbers.parse(phone_str, default_region)
                        if phonenumbers.is_valid_number(parsed):
                            # Format as E.164
                            return phonenumbers.format_number(
                                parsed, phonenumbers.PhoneNumberFormat.E164
                            )
                    except NumberParseException:
                        continue
        except Exception as e:
            logger.error(f"Error extracting phone: {e}")
        return None
    
    def extract_name(self, text: str) -> Optional[Dict[str, str]]:
        """Extract name from text (simple heuristic)."""
        # Look for patterns like "my name is X", "I'm X", "call me X"
        patterns = [
            r"(?:my name is|i'm|i am|call me|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
            r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$",  # Just a name
        ]
        
        text_lower = text.lower()
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                full_name = match.group(1).strip()
                parts = full_name.split()
                if len(parts) >= 2:
                    return {
                        "first_name": parts[0],
                        "last_name": " ".join(parts[1:]),
                        "full_name": full_name
                    }
                elif len(parts) == 1:
                    return {
                        "first_name": parts[0],
                        "last_name": "",
                        "full_name": parts[0]
                    }
        return None
    
    def extract_all(self, text: str) -> Dict[str, any]:
        """Extract all PII from text."""
        return {
            "email": self.extract_email(text),
            "phone_number": self.extract_phone(text),
            "name": self.extract_name(text),
        }


class PIIValidator:
    """Validate PII data quality."""
    
    @staticmethod
    def validate_email(email: str) -> Tuple[bool, Optional[str]]:
        """Validate email format and return (is_valid, error_message)."""
        try:
            validation = validate_email(email, check_deliverability=False)
            return True, None
        except EmailNotValidError as e:
            return False, str(e)
    
    @staticmethod
    def validate_phone(phone: str, default_region: str = "US") -> Tuple[bool, Optional[str]]:
        """Validate phone number and return (is_valid, error_message)."""
        try:
            parsed = phonenumbers.parse(phone, default_region)
            if phonenumbers.is_valid_number(parsed):
                return True, None
            else:
                return False, "Invalid phone number format"
        except NumberParseException as e:
            return False, str(e)
    
    @staticmethod
    def validate_name(name_dict: Dict[str, str]) -> Tuple[bool, Optional[str]]:
        """Validate name and return (is_valid, error_message)."""
        if not name_dict or not name_dict.get("first_name"):
            return False, "First name is required"
        if len(name_dict.get("first_name", "")) < 2:
            return False, "First name must be at least 2 characters"
        return True, None
```

---

### **STEP 4: Create PII Collection Manager**

**File:** `core/pii_collection_manager.py` (NEW FILE)

```python
"""
Manages PII collection state and flow during conversations.
"""

import json
import logging
from typing import Dict, Optional, List
from django.utils import timezone

from core.chat_models import ChatSession, UserProfile
from core.pii_service import PIIExtractor, PIIValidator

logger = logging.getLogger(__name__)


class PIICollectionManager:
    """Manages PII collection during chat sessions."""
    
    def __init__(self, session: ChatSession):
        self.session = session
        self.extractor = PIIExtractor()
        self.validator = PIIValidator()
        self._profile = None
    
    @property
    def profile(self) -> UserProfile:
        """Get or create user profile for this session."""
        if self._profile is None:
            self._profile, _ = UserProfile.objects.get_or_create(
                session=self.session,
                defaults={"data_quality": {}}
            )
        return self._profile
    
    def get_collection_state(self) -> Dict:
        """Get current collection state from conversation_state."""
        state = self.session.conversation_state.get("collection_state", {})
        return {
            "status": state.get("status", "not_started"),
            "current_field": state.get("current_field"),
            "collected_fields": state.get("collected_fields", []),
            "pending_fields": state.get("pending_fields", []),
            "collection_attempts": state.get("collection_attempts", {}),
        }
    
    def update_collection_state(self, updates: Dict):
        """Update collection state in conversation_state."""
        if "collection_state" not in self.session.conversation_state:
            self.session.conversation_state["collection_state"] = {}
        
        self.session.conversation_state["collection_state"].update(updates)
        self.session.save(update_fields=["conversation_state"])
    
    def extract_and_store_pii(self, user_message: str, ai_response: str) -> Dict:
        """
        Extract PII from user message and AI response, then store if valid.
        Returns dict with extracted data and status.
        """
        extracted = {}
        stored = {}
        
        # Extract from user message
        user_pii = self.extractor.extract_all(user_message)
        
        # Extract from AI response (look for [COLLECTED:field=value] markers)
        ai_pii = self._extract_from_ai_markers(ai_response)
        
        # Combine (user message takes priority)
        all_extracted = {**ai_pii, **user_pii}
        
        # Process each field
        for field, value in all_extracted.items():
            if not value:
                continue
            
            if field == "name" and isinstance(value, dict):
                # Store name
                if self._store_name(value):
                    stored["name"] = value
                    extracted["name"] = value
            
            elif field == "email" and isinstance(value, str):
                # Validate and store email
                is_valid, error = self.validator.validate_email(value)
                if is_valid:
                    if self._store_email(value):
                        stored["email"] = value
                        extracted["email"] = value
                else:
                    logger.warning(f"Invalid email: {error}")
            
            elif field == "phone_number" and isinstance(value, str):
                # Validate and store phone
                is_valid, error = self.validator.validate_phone(value)
                if is_valid:
                    if self._store_phone(value):
                        stored["phone_number"] = value
                        extracted["phone_number"] = value
                else:
                    logger.warning(f"Invalid phone: {error}")
        
        # Update collection state
        if stored:
            self._update_collected_fields(list(stored.keys()))
        
        return {
            "extracted": extracted,
            "stored": stored,
            "status": "success" if stored else "no_pii_found"
        }
    
    def _extract_from_ai_markers(self, ai_response: str) -> Dict:
        """Extract PII from AI response markers like [COLLECTED:email=value]."""
        import re
        extracted = {}
        
        # Pattern: [COLLECTED:field=value]
        pattern = r'\[COLLECTED:(\w+)=([^\]]+)\]'
        matches = re.findall(pattern, ai_response)
        
        for field, value in matches:
            if field == "email":
                extracted["email"] = value.strip()
            elif field == "phone" or field == "phone_number":
                extracted["phone_number"] = value.strip()
            elif field == "name":
                # Try to parse name
                name_parts = value.strip().split()
                if len(name_parts) >= 2:
                    extracted["name"] = {
                        "first_name": name_parts[0],
                        "last_name": " ".join(name_parts[1:]),
                        "full_name": value.strip()
                    }
                else:
                    extracted["name"] = {
                        "first_name": value.strip(),
                        "last_name": "",
                        "full_name": value.strip()
                    }
        
        return extracted
    
    def _store_name(self, name_dict: Dict) -> bool:
        """Store name in profile."""
        is_valid, error = self.validator.validate_name(name_dict)
        if not is_valid:
            return False
        
        self.profile.first_name = name_dict.get("first_name", "")
        self.profile.last_name = name_dict.get("last_name", "")
        self.profile.full_name = name_dict.get("full_name", "")
        
        # Update data quality
        quality = self.profile.data_quality
        quality["name"] = "confirmed"
        self.profile.data_quality = quality
        
        self.profile.save()
        return True
    
    def _store_email(self, email: str) -> bool:
        """Store email in profile."""
        # Check if email already exists (avoid duplicates)
        if self.profile.email and self.profile.email.lower() == email.lower():
            return False  # Already stored
        
        self.profile.email = email.lower()
        
        # Update data quality
        quality = self.profile.data_quality
        quality["email"] = "confirmed"
        self.profile.data_quality = quality
        
        self.profile.save()
        return True
    
    def _store_phone(self, phone: str) -> bool:
        """Store phone in profile."""
        if self.profile.phone_number and self.profile.phone_number == phone:
            return False  # Already stored
        
        self.profile.phone_number = phone
        
        # Update data quality
        quality = self.profile.data_quality
        quality["phone_number"] = "confirmed"
        self.profile.data_quality = quality
        
        self.profile.save()
        return True
    
    def _update_collected_fields(self, new_fields: List[str]):
        """Update collection state with newly collected fields."""
        state = self.get_collection_state()
        collected = set(state.get("collected_fields", []))
        collected.update(new_fields)
        
        self.update_collection_state({
            "collected_fields": list(collected),
            "status": "collecting" if collected else "not_started"
        })
    
    def should_request_field(self, field: str) -> bool:
        """Check if a field should be requested."""
        state = self.get_collection_state()
        collected = state.get("collected_fields", [])
        
        # Don't request if already collected
        if field in collected:
            return False
        
        # Check attempts (don't ask more than 2 times)
        attempts = state.get("collection_attempts", {}).get(field, 0)
        if attempts >= 2:
            return False
        
        return True
    
    def record_collection_attempt(self, field: str):
        """Record that we attempted to collect a field."""
        state = self.get_collection_state()
        attempts = state.get("collection_attempts", {})
        attempts[field] = attempts.get(field, 0) + 1
        
        self.update_collection_state({
            "collection_attempts": attempts,
            "current_field": field
        })
```

---

### **STEP 5: Enhance System Prompt**

**File:** `core/services.py`

Update the `_get_system_prompt` method to include PII collection guidelines:

```python
def _get_system_prompt(self, language: str) -> str:
    """Get system prompt based on language."""
    base_prompts = {
        "en": """You are MedCare AI, a helpful healthcare assistant. Provide clear, compassionate, and professional medical guidance.

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
   - If user asks about privacy, explain your data usage policy""",
        # ... other languages
    }
    return base_prompts.get(language, base_prompts["en"])
```

---

### **STEP 6: Update Chat Views to Use PII Collection**

**File:** `core/chat_views.py`

Update `TextChatView.post` method:

```python
from core.pii_collection_manager import PIICollectionManager

# In TextChatView.post method, after generating AI response:

# Generate AI response
response_text = async_to_sync(openai_service.generate_chat_response)(
    data["message"], data.get("language", "en")
)

# Extract and store PII
pii_manager = PIICollectionManager(session)
pii_result = pii_manager.extract_and_store_pii(
    data["message"],
    response_text
)

# Log if PII was collected
if pii_result["stored"]:
    logger.info(f"Collected PII for session {session.session_id}: {pii_result['stored']}")
```

---

### **STEP 7: Create Migration**

```bash
cd /home/nnamdi/pyth/medcor_backend2
source venv/bin/activate
python manage.py makemigrations core
python manage.py migrate
```

---

### **STEP 8: Create Serializers and API Endpoints**

**File:** `core/chat_serializers.py`

Add:

```python
class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile."""
    
    collected_fields = serializers.SerializerMethodField()
    is_complete = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            "id", "full_name", "first_name", "last_name",
            "email", "phone_number", "location", "occupation",
            "preferences", "interests", "concerns",
            "data_quality", "consent_given", "consent_timestamp",
            "collected_fields", "is_complete",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
    
    def get_collected_fields(self, obj):
        return obj.get_collected_fields()
    
    def get_is_complete(self, obj):
        return obj.is_complete()
```

**File:** `core/chat_views.py`

Add new view:

```python
class UserProfileView(APIView):
    """Get or update user profile for a chat session."""
    
    permission_classes = [AllowAny]
    
    def get(self, request, session_id):
        """Get user profile for session."""
        try:
            session = ChatSession.objects.get(session_id=session_id)
            profile, created = UserProfile.objects.get_or_create(session=session)
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        except ChatSession.DoesNotExist:
            return Response(
                {"error": "Session not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def patch(self, request, session_id):
        """Update user profile."""
        try:
            session = ChatSession.objects.get(session_id=session_id)
            profile, created = UserProfile.objects.get_or_create(session=session)
            serializer = UserProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ChatSession.DoesNotExist:
            return Response(
                {"error": "Session not found"},
                status=status.HTTP_404_NOT_FOUND
            )
```

**File:** `core/urls.py` (or wherever chat URLs are defined)

Add:

```python
path('api/chat/profile/<str:session_id>/', UserProfileView.as_view(), name='user-profile'),
```

---

## ✅ Testing Checklist

### **1. Test PII Extraction**

```python
# Test in Django shell
python manage.py shell

from core.pii_service import PIIExtractor

extractor = PIIExtractor()
text = "My email is john@example.com and my phone is +1234567890"
result = extractor.extract_all(text)
print(result)  # Should extract email and phone
```

### **2. Test Collection Flow**

```bash
# 1. Start chat session
curl -X POST http://localhost:8000/api/chat/text/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "session_id": "test-session-123",
    "language": "en"
  }'

# 2. Request appointment (should trigger email collection)
curl -X POST http://localhost:8000/api/chat/text/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to book an appointment",
    "session_id": "test-session-123",
    "language": "en"
  }'

# 3. Provide email
curl -X POST http://localhost:8000/api/chat/text/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My email is john@example.com",
    "session_id": "test-session-123",
    "language": "en"
  }'

# 4. Check profile
curl http://localhost:8000/api/chat/profile/test-session-123/
```

### **3. Verify Database**

```sql
-- Check if profile was created
SELECT * FROM user_profiles WHERE session_id = (
    SELECT id FROM chat_sessions WHERE session_id = 'test-session-123'
);

-- Check conversation_state
SELECT conversation_state FROM chat_sessions WHERE session_id = 'test-session-123';
```

---

## 🎯 Next Steps (Phase 2)

1. **Add Consent Management**
   - Consent modal/endpoint
   - Link consent to profile

2. **Add Preference Extraction**
   - Analyze conversations for preferences
   - Store in `UserProfile.preferences`

3. **Add Analytics**
   - Track collection rates
   - Measure conversion metrics

4. **Add Data Encryption**
   - Encrypt sensitive fields
   - Implement data retention policies

---

## 📝 Summary

**What we've implemented:**
- ✅ `UserProfile` model for storing collected PII
- ✅ `PIIExtractor` service for extracting email, phone, name
- ✅ `PIIValidator` for validating extracted data
- ✅ `PIICollectionManager` for managing collection flow
- ✅ Enhanced system prompt with collection guidelines
- ✅ Integration with existing chat views
- ✅ API endpoint for profile access

**What's working:**
- AI can naturally request PII during conversations
- System extracts PII from user messages and AI responses
- Validates and stores PII in database
- Tracks collection state in `conversation_state`
- Supports progressive collection (one field at a time)

**Ready to test!** 🚀













