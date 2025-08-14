# Google Calendar + MCP Server Integration Guide
## For MedCor Voice Appointment System

This document shows how Google Calendar can enhance the MCP server WITHOUT modifying current code.

## 🎯 Integration Architecture

```
Voice Input → MCP Server → Google Calendar API
                ↓              ↓
         PostgreSQL DB    Real-time Sync
```

## 📅 How It Would Work

### Current Flow (What You Have):
1. User: "Book appointment with Dr. Johnson tomorrow at 2 PM"
2. Voice → Text conversion
3. MCP Server checks PostgreSQL for availability
4. Creates appointment in database
5. Confirms to user

### Enhanced Flow (With Google Calendar):
1. User: "Book appointment with Dr. Johnson tomorrow at 2 PM"
2. Voice → Text conversion
3. MCP Server:
   - Checks PostgreSQL for basic info
   - **Queries Google Calendar for real-time availability**
   - **Detects conflicts automatically**
   - Creates appointment in both systems
4. Confirms to user with calendar invite

## 🔧 MCP Server Enhancement (Conceptual)

### New MCP Tools That Would Be Added:

```python
# In mcp_server_updated.py (conceptual additions)

async def check_google_availability(doctor_id: int, date: str, time: str) -> dict:
    """
    Check doctor's Google Calendar for availability
    """
    doctor = get_doctor_details(doctor_id)
    calendar_id = doctor.get('google_calendar_id')
    
    if calendar_id:
        # Check Google Calendar API
        service = build('calendar', 'v3', credentials=creds)
        
        # Convert date/time to RFC3339 format
        start_time = f"{date}T{time}:00"
        end_time = # Add appointment duration
        
        # Check for conflicts
        events = service.events().list(
            calendarId=calendar_id,
            timeMin=start_time,
            timeMax=end_time,
            singleEvents=True
        ).execute()
        
        return {
            "available": len(events.get('items', [])) == 0,
            "conflicts": events.get('items', [])
        }
    
    # Fallback to database check
    return check_database_availability(doctor_id, date, time)

async def sync_appointment_to_calendar(appointment_id: int) -> dict:
    """
    Sync confirmed appointment to Google Calendar
    """
    appointment = get_appointment_details(appointment_id)
    doctor = get_doctor_details(appointment['doctor_id'])
    patient = get_patient_details(appointment['patient_id'])
    
    event = {
        'summary': f'Appointment: {patient["name"]}',
        'description': appointment.get('notes', ''),
        'start': {
            'dateTime': appointment['datetime'],
            'timeZone': 'America/New_York',
        },
        'end': {
            'dateTime': appointment['end_datetime'],
            'timeZone': 'America/New_York',
        },
        'attendees': [
            {'email': patient['email']},
            {'email': doctor['email']}
        ],
        'reminders': {
            'useDefault': False,
            'overrides': [
                {'method': 'email', 'minutes': 24 * 60},
                {'method': 'popup', 'minutes': 30},
            ],
        },
    }
    
    # Create calendar event
    calendar_service.events().insert(
        calendarId=doctor['google_calendar_id'],
        body=event,
        sendNotifications=True
    ).execute()
    
    return {"status": "synced", "appointment_id": appointment_id}
```

## 🎤 Voice Commands That Would Work

With Google Calendar integration, these become possible:

1. **Smart Scheduling**: 
   - "Book me with Dr. Johnson at his next available slot"
   - MCP checks Google Calendar for next opening

2. **Conflict Detection**:
   - "Move my 2 PM appointment to 4 PM"
   - MCP checks if 4 PM conflicts with doctor's calendar

3. **Bulk Operations**:
   - "Show me all available cardiologists this week"
   - MCP queries multiple Google Calendars simultaneously

4. **Smart Rescheduling**:
   - "Reschedule all my appointments next week"
   - MCP finds alternative slots automatically

## 🔄 Data Flow Example

```javascript
// When user says: "Book appointment with Dr. Johnson tomorrow at 2 PM"

// 1. Voice processing extracts:
{
  doctor: "Dr. Johnson",
  date: "2025-01-15",
  time: "14:00"
}

// 2. MCP Server flow:
async function processVoiceAppointment(voiceData) {
  // Find doctor
  const doctor = await mcp.list_doctors({ name: voiceData.doctor });
  
  // Check Google Calendar (NEW)
  const availability = await mcp.check_google_availability(
    doctor.id, 
    voiceData.date, 
    voiceData.time
  );
  
  if (!availability.available) {
    // Offer alternatives
    const alternatives = await mcp.find_alternative_slots(doctor.id, voiceData.date);
    return {
      status: "conflict",
      message: "That time is taken. How about 3 PM or 4 PM?",
      alternatives: alternatives
    };
  }
  
  // Create appointment
  const appointment = await mcp.create_appointment({
    doctor_id: doctor.id,
    date: voiceData.date,
    time: voiceData.time
  });
  
  // Sync to Google Calendar (NEW)
  await mcp.sync_appointment_to_calendar(appointment.id);
  
  return {
    status: "success",
    message: "Appointment booked and calendar invite sent!"
  };
}
```

## 🚀 Benefits for MedCor

### Immediate Benefits:
1. **Real-time Availability** - No double bookings
2. **Calendar Invites** - Automatic reminders
3. **Mobile Sync** - Doctors see appointments on phones
4. **Video Calls** - Google Meet links auto-added

### Advanced Features:
1. **Buffer Time** - Auto-add prep time between appointments
2. **Travel Time** - Calculate time between locations
3. **Recurring Appointments** - Weekly therapy sessions
4. **Team Scheduling** - Book multiple staff members

## 📊 Implementation Priority

### Phase 1 (Current - Already Working):
- ✅ Voice input processing
- ✅ MCP appointment creation
- ✅ Database storage
- ✅ Basic availability checking

### Phase 2 (Google Calendar Addition):
- 📅 Real-time availability checking
- 📅 Calendar event creation
- 📅 Automatic conflict detection
- 📅 Email invitations

### Phase 3 (Advanced):
- 🔮 AI-powered optimal scheduling
- 🔮 Multi-practitioner coordination
- 🔮 Automatic rescheduling suggestions
- 🔮 Integration with other calendar systems

## 🔑 Required Google APIs

To implement this, you would need:
1. Google Calendar API enabled
2. OAuth 2.0 credentials
3. Service account for server-to-server auth
4. Calendar IDs for each doctor

## 💡 Testing Without Implementation

You can simulate this flow by:
1. Running `test-voice-mcp-booking.js` to see current flow
2. Imagining Google Calendar checks at each step
3. Understanding where real-time data would enhance decisions

## 🎯 Summary

The MCP server is the **orchestrator** that coordinates between:
- Voice input (what user wants)
- Database (your appointment records)
- Google Calendar (real-time availability)
- AI responses (natural conversation)

This creates a seamless experience where users can speak naturally and get intelligent, context-aware appointment scheduling that respects everyone's actual calendar availability.