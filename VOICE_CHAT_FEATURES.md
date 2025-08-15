# MedCor AI Voice Chat Features Documentation

## Overview
The MedCor AI chatbot supports comprehensive voice commands for all major features with stateful conversation management. Users can interact with the system using natural language voice commands to access various healthcare services. The platform now maintains conversation context and handles multi-step processes like appointment booking entirely through voice.

## Status: ✅ FULLY IMPLEMENTED WITH STATEFUL CONVERSATIONS

All features listed below are fully integrated with both frontend widgets and Django backend APIs. The voice conversation manager enables complete voice-driven interactions without requiring any clicks.

## New: Stateful Voice Conversations

### Voice Conversation Manager
The platform now includes a sophisticated VoiceConversationManager that maintains conversation state and handles multi-step voice interactions:

#### Multi-Step Appointment Booking via Voice
Users can now complete the entire appointment booking process through natural conversation:

1. **User:** "I want to book an appointment"
   - **System:** Opens appointment widget and asks for preferred date

2. **User:** "Tomorrow at 3pm"
   - **System:** Automatically selects date and time, asks about doctor preference

3. **User:** "I want to see Dr. Johnson"
   - **System:** Selects doctor, asks for appointment reason

4. **User:** "I have a headache"
   - **System:** Records symptoms and confirms appointment

The system maintains context throughout the conversation and automatically fills forms based on voice input.

#### VOICE_FLOW Commands
The system now supports advanced VOICE_FLOW commands for stateful interactions:
- `VOICE_FLOW:APPOINTMENT_DATE` - Handles date selection
- `VOICE_FLOW:APPOINTMENT_TIME` - Handles time slot selection
- `VOICE_FLOW:APPOINTMENT_DOCTOR` - Handles doctor selection
- `VOICE_FLOW:APPOINTMENT_CONFIRM` - Confirms and submits appointment

## Supported Voice Commands

### 1. 📅 Appointment Scheduling
**Commands:**
- "Book appointment"
- "Schedule appointment"  
- "I need an appointment"
- "Can I book an appointment?"

**Action:** Opens the appointment booking calendar with full backend integration
**API Endpoint:** `/api/appointments/appointments/`
**Status:** ✅ Active

### 2. 👤 Face Analysis
**Commands:**
- "Face analysis"
- "Analyze my face"
- "Face scan"
- "Facial recognition"

**Action:** Opens face analysis widget with camera capture
**Widget:** FaceAnalysisWidgetInline
**Status:** ✅ Active

### 3. 🌟 Skin Analysis
**Commands:**
- "Skin analysis"
- "Analyze my skin"
- "Skin health check"
- "Check my skin"

**Action:** Opens skin analysis widget
**Widget:** SkinAnalysisWidget
**Status:** ✅ Active

### 4. 👄 Lips Analysis
**Commands:**
- "Lips analysis"
- "Analyze my lips"
- "Lip health"
- "Check my lips"

**Action:** Opens lips analysis widget
**Widget:** LipsAnalysisWidget
**Status:** ✅ Active

### 5. 💇 Hair Analysis
**Commands:**
- "Hair analysis"
- "Analyze my hair"
- "Hair health"
- "Check my scalp"

**Action:** Opens hair analysis widget
**Widget:** HairAnalysisWidget
**Status:** ✅ Active

### 6. 💁 Hair Extension
**Commands:**
- "Hair extension"
- "Hair extensions"
- "Show hair pieces"

**Action:** Opens hair extension options widget
**Widget:** HairExtensionWidget
**Status:** ✅ Active

### 7. 📋 Medical Records
**Commands:**
- "Medical records"
- "My records"
- "Show my medical history"
- "View records"

**Action:** Opens medical records list with full CRUD operations
**API Endpoint:** `/api/medical-records/`
**Status:** ✅ Active

### 8. 👨‍⚕️ Doctor List
**Commands:**
- "Show doctors"
- "List doctors"
- "Available doctors"
- "Find a doctor"

**Action:** Displays list of available doctors
**API Endpoint:** `/api/doctors/`
**Status:** ✅ Active

### 9. 🔐 Profile/Authentication
**Commands:**
- "My profile"
- "Login"
- "Sign in"
- "Show my profile"

**Action:** Opens authentication/profile overlay
**API Endpoint:** `/api/auth/login/`
**Status:** ✅ Active

## Technical Implementation

### Frontend (React/TypeScript)
- **Voice Recognition:** Browser native speech recognition API
- **Command Processing:** Real-time keyword detection in `avatar-chat-widget.tsx`
- **Widget Navigation:** Automatic widget opening based on voice commands
- **State Management:** React hooks for seamless transitions

### Backend (Express + Django)
- **Express Server:** Handles voice command routing at `/api/chat/voice`
- **Django APIs:** Full REST API integration for all features
- **Authentication:** JWT-based with role-based access control
- **Multi-tenant:** Supports multiple clinics/hospitals

### Voice Command Flow
1. User speaks command → 
2. Browser captures audio → 
3. Speech-to-text conversion → 
4. Command detection in frontend → 
5. API call to backend → 
6. Backend processes command → 
7. Response with VOICE_COMMAND prefix → 
8. Frontend opens appropriate widget/view → 
9. Avatar provides verbal confirmation

## Language Support
- English ✅
- Turkish ✅  
- Arabic ✅

## Integration Points

### Django Backend Endpoints
```
/api/appointments/appointments/ - Appointment management
/api/medical-records/ - Medical records CRUD
/api/doctors/ - Doctor listings
/api/auth/login/ - Authentication
/api/auth/register/ - Registration
/api/treatments/ - Treatment records
```

### Express Server Endpoints
```
/api/chat/voice - Main voice chat processing
/api/voice-chat/features - Feature status check
/api/location-weather - Location services
/api/nearby-places - Nearby search
```

## Testing Voice Commands

### Via Chat Widget
1. Open the application
2. Click "Start Chat" button
3. Allow microphone permissions
4. Speak any command listed above
5. Widget will automatically open

### Via API
```bash
# Test voice command endpoint
curl -X POST http://localhost:5000/api/chat/voice \
  -H "Content-Type: application/json" \
  -d '{
    "message": "book appointment",
    "sessionId": "test-session",
    "language": "en"
  }'
```

## Feature Status Check
Access `/api/voice-chat/features` to get real-time status of all voice features:

```json
{
  "status": "active",
  "supportedCommands": [...],
  "voiceLanguages": ["en", "tr", "ar"],
  "integrations": {
    "django": { "status": "connected" },
    "heygen": { "status": "requires_api_key" },
    "openai": { "status": "active" }
  }
}
```

## Troubleshooting

### Common Issues
1. **Microphone not working:** Check browser permissions
2. **Commands not recognized:** Speak clearly, use exact phrases
3. **Widget not opening:** Check console for errors
4. **API errors:** Verify Django backend is running on port 8000

### Debug Mode
Enable debug logging in browser console:
```javascript
localStorage.setItem('DEBUG_VOICE_CHAT', 'true');
```

## Future Enhancements
- [ ] Natural language understanding improvements
- [ ] More language support
- [ ] Voice feedback customization
- [ ] Offline mode support
- [ ] Voice command shortcuts

## Support
For issues or questions about voice chat features, contact the development team.

---
*Last Updated: January 2025*
*Version: 1.0.0*