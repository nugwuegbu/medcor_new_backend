"""
PII (Personally Identifiable Information) Collection Manager.

Manages the collection of user information (full name and phone number) during chat
sessions with strict sequential enforcement: name -> phone.
"""

import logging
from typing import Dict, Optional, List, Tuple

from .chat_models import ChatSession, UserProfile
from .pii_service import PIIExtractor, PIIValidator

logger = logging.getLogger(__name__)


class PIICollectionManager:
    """Manages PII collection during chat sessions with sequential enforcement."""
    
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
    
    def _refresh_profile(self):
        """Refresh profile from database to ensure latest state."""
        if self._profile:
            self._profile.refresh_from_db()
        else:
            self._profile, _ = UserProfile.objects.get_or_create(
                session=self.session,
                defaults={"data_quality": {}}
            )
    
    def get_collection_state(self) -> Dict:
        """Get current collection state from conversation_state."""
        if not hasattr(self.session, 'conversation_state') or not self.session.conversation_state:
            self.session.conversation_state = {}
        
        state = self.session.conversation_state.get("collection_state", {})
        return {
            "status": state.get("status", "not_started"),
            "current_field": state.get("current_field"),
            "collected_fields": state.get("collected_fields", []),
            "pending_fields": state.get("pending_fields", []),
            "collection_attempts": state.get("collection_attempts", {}),
            "user_turn_count": state.get("user_turn_count", 0),
        }
    
    def update_collection_state(self, updates: Dict):
        """Update collection state in conversation_state."""
        if not hasattr(self.session, 'conversation_state') or not self.session.conversation_state:
            self.session.conversation_state = {}
        
        if "collection_state" not in self.session.conversation_state:
            self.session.conversation_state["collection_state"] = {}
        
        self.session.conversation_state["collection_state"].update(updates)
        self.session.save(update_fields=["conversation_state"])
    
    def increment_user_turn_count(self) -> int:
        """Increment and return user turn count."""
        state = self.get_collection_state()
        turn_count = state.get("user_turn_count", 0) + 1
        self.update_collection_state({"user_turn_count": turn_count})
        return turn_count
    
    def should_trigger_initial_prompt(self, min_turns: int = 1) -> bool:
        """Determine if we should proactively request contact details."""
        state = self.get_collection_state()
        if state.get("user_turn_count", 0) < min_turns:
            return False
        return self.missing_required_fields()
    
    def missing_required_fields(self, required_fields: Optional[List[str]] = None) -> bool:
        """Check if required fields are missing, based on actual profile state."""
        if required_fields is None:
            required_fields = ["name", "phone_number"]
        
        # Check actual profile state with strict validation
        # Refresh profile from database to ensure we have latest data
        self._refresh_profile()
        profile = self.profile
        
        has_name = self._is_name_strictly_collected(profile)
        has_phone = bool(profile.phone_number and len(profile.phone_number.strip()) > 0)
        
        # Check which fields are actually missing
        missing = []
        if "name" in required_fields and not has_name:
            missing.append("name")
        if "phone_number" in required_fields and not has_phone:
            missing.append("phone_number")
        
        # Sync collection state with actual profile
        actual_collected = []
        if has_name:
            actual_collected.append("name")
        if has_phone:
            actual_collected.append("phone_number")
        
        state = self.get_collection_state()
        collected = state.get("collected_fields", [])
        if set(actual_collected) != set(collected):
            self.update_collection_state({"collected_fields": actual_collected})
        
        return len(missing) > 0
    
    def _is_name_strictly_collected(self, profile: UserProfile) -> bool:
        """Check if both first and last names are collected with minimum length."""
        first = (profile.first_name or "").strip()
        last = (profile.last_name or "").strip()
        return bool(first and last and len(first) >= 2 and len(last) >= 2)
    
    def get_next_required_field(self) -> Optional[str]:
        """Get the next required field in sequential order: name -> phone."""
        self._refresh_profile()
        profile = self.profile
        
        has_name = self._is_name_strictly_collected(profile)
        has_phone = bool(profile.phone_number and len(profile.phone_number.strip()) > 0)
        
        # Enforce strict sequential order
        if not has_name:
            return "name"
        elif not has_phone:
            return "phone_number"
        return None
    
    def extract_and_store_pii(self, user_message: str, ai_response: str) -> Dict:
        """
        Extract PII from user message and AI response, then store if valid.
        Enforces sequential collection: name -> phone.
        Returns dict with extracted data and status.
        """
        extracted = {}
        stored = {}
        errors: Dict[str, str] = {}
        
        # Check current profile state to enforce sequential collection
        self._refresh_profile()
        profile = self.profile
        has_name = self._is_name_strictly_collected(profile)
        has_phone = bool(profile.phone_number and len(profile.phone_number.strip()) > 0)
        
        state = self.get_collection_state()
        current_field = state.get("current_field")

        # Extract from user message
        user_pii = self.extractor.extract_all(user_message)
        
        # Extract from AI response (look for [COLLECTED:field=value] markers)
        ai_pii = self._extract_from_ai_markers(ai_response)
        
        # Combine (user message takes priority)
        all_extracted = {**ai_pii, **user_pii}
        
        # Process fields in STRICT sequential order: name first, then phone
        # This ensures that even if both are provided in the same message, we process name first
        # and update has_name before processing phone
        
        # Step 1: Process NAME first (if present)
        if "name" in all_extracted and isinstance(all_extracted["name"], dict):
            value = all_extracted["name"]
            if value:
                # Always allow name collection (it's the first field)
                success, error_message = self._store_name(value)
                if success:
                    stored["name"] = value
                    extracted["name"] = value
                    logger.info(
                        f"Successfully stored name: {value.get('full_name', '')} "
                        f"for session {self.session.session_id}"
                    )
                    # Refresh has_name after storing
                    self._refresh_profile()
                    has_name = self._is_name_strictly_collected(self.profile)
                else:
                    logger.info(
                        "Name provided but not stored for session %s: %s",
                        self.session.session_id,
                        error_message or "validation failed",
                    )
                    if current_field == "name":
                        errors["name"] = (
                            error_message
                            or "Could you please share your full first and last name so I can personalize our conversation?"
                        )
        
        # Step 2: Process PHONE NUMBER (if present and name is now collected)
        if "phone_number" in all_extracted and isinstance(all_extracted["phone_number"], str):
            value = all_extracted["phone_number"]
            if value:
                # Only store phone if name is already collected (sequential enforcement)
                # Refresh to ensure we have latest state (name might have been just stored above)
                self._refresh_profile()
                has_name = self._is_name_strictly_collected(self.profile)
                
                if not has_name:
                    logger.info(f"Phone provided but name not collected yet. Deferring phone storage for session {self.session.session_id}")
                    errors["phone_number"] = (
                        "Thanks for sharing that. I need your full name first so I can personalize our care before capturing your phone number."
                    )
                else:
                    # Validate and store phone
                    is_valid, error = self.validator.validate_phone(value)
                    if is_valid:
                        if self._store_phone(value):
                            stored["phone_number"] = value
                            extracted["phone_number"] = value
                    else:
                        logger.warning(f"Invalid phone: {error}")
                        errors["phone_number"] = (
                            "The phone number you entered seems invalid. Please share a valid number with the country code (for example, +1234567890) so we can reach you if needed."
                        )
        
        # Update collection state
        if stored:
            self._update_collected_fields(list(stored.keys()))
            # Clear current_field if we successfully collected what we were asking for
            state = self.get_collection_state()
            current_field = state.get("current_field")
            if current_field and current_field in stored:
                # Successfully collected the field we were requesting, clear it
                self.update_collection_state({"current_field": None})
        
        return {
            "extracted": extracted,
            "stored": stored,
            "status": "success" if stored else "no_pii_found",
            "errors": errors,
        }
    
    def _extract_from_ai_markers(self, ai_response: str) -> Dict:
        """Extract PII from AI response markers like [COLLECTED:phone_number=value]."""
        import re
        extracted = {}
        
        # Pattern: [COLLECTED:field=value]
        pattern = r'\[COLLECTED:(\w+)=([^\]]+)\]'
        matches = re.findall(pattern, ai_response)
        
        for field, value in matches:
            if field == "phone" or field == "phone_number":
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
    
    def _store_name(self, name_dict: Dict) -> Tuple[bool, Optional[str]]:
        """Store name in profile if both first and last names are provided."""
        if not name_dict:
            return False, "Please share your full name (first and last)."
        
        first = (name_dict.get("first_name") or "").strip()
        last = (name_dict.get("last_name") or "").strip()
        full = (name_dict.get("full_name") or "").strip()

        normalized = {
            "first_name": first,
            "last_name": last,
            "full_name": full or f"{first} {last}".strip(),
        }

        is_valid, error = self.validator.validate_name(normalized)
        if not is_valid:
            return False, error or "Please include both your first and last name."
        
        self.profile.first_name = first
        self.profile.last_name = last
        self.profile.full_name = normalized.get("full_name", "").strip()
        
        # Update data quality
        quality = self.profile.data_quality
        quality["name"] = "confirmed"
        self.profile.data_quality = quality
        
        self.profile.save()
        return True, None
    
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
    
    def get_contact_prompt(self, enforce: bool = False) -> str:
        """Generate a prompt to request contact information for the next required field."""
        self._refresh_profile()
        profile = self.profile
        
        has_name = self._is_name_strictly_collected(profile)
        has_phone = bool(profile.phone_number and len(profile.phone_number.strip()) > 0)
        
        state = self.get_collection_state()
        collected = state.get("collected_fields", [])
        current_field = state.get("current_field")
        
        # Sync collected_fields with actual profile
        actual_collected = []
        if has_name:
            actual_collected.append("name")
        if has_phone:
            actual_collected.append("phone_number")
        if set(actual_collected) != set(collected):
            self.update_collection_state({"collected_fields": actual_collected})
            collected = actual_collected
        
        # Determine next field to request
        if current_field and current_field not in collected:
            # If we're already asking for a field and it's not collected, continue asking
            if (current_field == "name" and not has_name) or \
               (current_field == "phone_number" and not has_phone):
                next_field = current_field
            else:
                next_field = self.get_next_required_field()
        else:
            next_field = self.get_next_required_field()
        
        if not next_field:
            return ""
        
        # Set current_field if not already set
        if not current_field or current_field != next_field:
            self.update_collection_state({"current_field": next_field})
        
        # Generate appropriate prompt text
        if next_field == "name":
            field_text = "full name"
            reason = "so I can personalize our conversation"
        elif next_field == "phone_number":
            field_text = "phone number"
            reason = "in case we need to follow up about your care"
        else:
            return ""
        
        if enforce:
            return (
                "I want to make sure I take good care of you. "
                f"Before we go any further, could you please share your {field_text} {reason}? "
                "We'll keep everything confidential and only use it for your care."
            )
        return (
            f"To help me help you, could you please share your {field_text} {reason}? "
            "We'll keep your information confidential and only use it for your care."
        )
    
    @staticmethod
    def format_validation_errors(errors: Dict[str, str]) -> str:
        """Combine validation error messages into a single friendly string."""
        if not errors:
            return ""
        return " ".join(errors.values())
