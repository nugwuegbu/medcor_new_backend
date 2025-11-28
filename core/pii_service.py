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
        
        # Additional pattern: Extract name that appears before a phone number or email
        # Pattern: Two capitalized words at the start of the string (before phone/email)
        name_before_phone = r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:[+\d@]|\s)"
        match = re.match(name_before_phone, text.strip())
        if match:
            full_name = match.group(1).strip()
            parts = full_name.split()
            if len(parts) >= 2:
                return {
                    "first_name": parts[0],
                    "last_name": " ".join(parts[1:]),
                    "full_name": full_name
                }
        
        # Last resort: Look for two capitalized words at the start (simple name pattern)
        # This handles cases like "Ugwuegbu Nnamdi +2348035660292"
        simple_name_pattern = r"^([A-Z][a-z]+\s+[A-Z][a-z]+)"
        match = re.match(simple_name_pattern, text.strip())
        if match:
            full_name = match.group(1).strip()
            parts = full_name.split()
            if len(parts) >= 2:
                return {
                    "first_name": parts[0],
                    "last_name": " ".join(parts[1:]),
                    "full_name": full_name
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
        """Validate that both first and last names are provided."""
        if not name_dict:
            return False, "Please share your full name (first and last)."
        
        first = (name_dict.get("first_name") or "").strip()
        last = (name_dict.get("last_name") or "").strip()
        
        if not first or len(first) < 2:
            return False, "First name must be at least 2 characters."
        if not last or len(last) < 2:
            return False, "Please include your last name as well."
        return True, None











