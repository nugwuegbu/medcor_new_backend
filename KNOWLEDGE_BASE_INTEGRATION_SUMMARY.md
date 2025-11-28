# Knowledge Base Integration Summary

## Overview

The AI agent now fully integrates with hospital-specific knowledge base configurations to provide personalized, hospital-branded responses.

## What Was Changed

### Files Modified

1. **`core/ai_query_views.py`** - Enhanced hospital query handling with knowledge base integration

### Key Features Added

#### 1. AI Identity Integration

- **Agent Name**: Personalizes each hospital's AI agent (e.g., "Dr. Sarah", "MedCor Assistant")
- **Agent Title**: Defines agent's role (e.g., "AI Healthcare Assistant", "Patient Care Coordinator")
- **System Prompt**: Guides AI responses with hospital-specific guidelines

#### 2. Behavior Configuration

- **Communication Tone**: Empathic, Authoritative, Casual, Friendly, or Professional
- **Communication Style**: Conversational, Technical & Clinical, Detailed & Thorough, Concise & Direct
- **Confidence Level**: Conservative, Balanced, or Confident
- **Response Length**: Short, Medium, Long, or Adaptive
- **Feature Flags**: Enable/disable follow-up questions, appointment booking, personalization

#### 3. Response Templates (Priority Response System)

The AI agent now uses predefined templates as **first responses**:

**Greeting Message**

- Used when user says "hello", "hi", "tell me about yourself", etc.
- First impression message from the agent

**Appointment Booking**

- Used when user requests to book an appointment
- First response for appointment inquiries
- Can include instructions, requirements, or general info

**Business Hours**

- Used when user asks about operating hours
- Provides hospital availability information

**Medical Specialties**

- Used when user asks about available specialties
- Lists or describes available medical services

**General Inquiries**

- Used for general hospital information requests
- Catches broad information queries

**Emergency Response**

- Used for emergency-related queries
- Provides urgent care information

**Fallback Response**

- Used when no specific template matches
- Default response for unmatched queries

#### 4. Template Placeholders

Response templates support dynamic placeholders:

- `{hospital_name}` - Hospital name
- `{hospital_city}` - Hospital city
- `{hospital_state}` - Hospital state/location
- `{agent_name}` - AI agent's name
- `{agent_title}` - AI agent's title

## How It Works

### 1. Query Processing Flow

```
User Query with Hospital ID
    ↓
Check Knowledge Base Configuration
    ↓
Identify Query Type
    ↓
Match Response Template
    ↓
Apply Agent Identity & Behavior
    ↓
Format Response with Data
    ↓
Return Personalized Response
```

### 2. Template Priority System

**First Priority**: Knowledge Base Templates

- If a response template exists, use it as the FIRST response
- Append dynamic data (appointments, doctors, etc.) to template

**Second Priority**: System Dynamic Responses

- If no template matches, use MCP server data
- Generate contextual responses based on query

**Third Priority**: Fallback

- Use fallback template from knowledge base
- Or use default system response

### 3. Integration Examples

#### Example 1: Appointment Booking

**Knowledge Base Template:**

```
"Welcome to {hospital_name}! To book an appointment with our experienced medical professionals,
please provide your preferred date and time, along with any specific medical concerns you'd like to address.
Our {agent_name} team is here to assist you."
```

**User Query:** "I want to book an appointment"

**Response:**

```
"Welcome to Acibadem Hospital! To book an appointment with our experienced medical professionals,
please provide your preferred date and time, along with any specific medical concerns you'd like to address.
Our Dr. Sarah team is here to assist you.

Here are the available slots:
1. Dr. John Smith (Cardiology) - 2025-11-01 at 14:00 (30 minutes)
2. Dr. Jane Doe (Pediatrics) - 2025-11-01 at 15:00 (30 minutes)
..."
```

#### Example 2: Greeting/Introduction

**Knowledge Base Template:**

```
"Hello! I'm {agent_name}, your {agent_title} at {hospital_name}.
I'm here to help you with your healthcare needs, answer questions about our services,
and assist with appointment scheduling. How can I help you today?"
```

**User Query:** "Tell me about yourself"

**Response:**

```
"Hello! I'm Dr. Sarah, your AI Healthcare Assistant at Acibadem Hospital.
I'm here to help you with your healthcare needs, answer questions about our services,
and assist with appointment scheduling. How can I help you today?"
```

#### Example 3: Business Hours

**Knowledge Base Template:**

```
"Our {hospital_name} operates Monday-Friday from 8:00 AM to 6:00 PM,
and Saturday from 9:00 AM to 1:00 PM. We're closed on Sundays and public holidays.
For emergency care, our 24/7 emergency department is always available."
```

**User Query:** "What are your business hours?"

**Response:**

```
"Our Acibadem Hospital operates Monday-Friday from 8:00 AM to 6:00 PM,
and Saturday from 9:00 AM to 1:00 PM. We're closed on Sundays and public holidays.
For emergency care, our 24/7 emergency department is always available."
```

## Code Implementation

### New Methods Added

#### 1. `_process_hospital_question_with_kb()`

Processes hospital queries with knowledge base awareness. Checks for matching templates before falling back to dynamic processing.

#### 2. `_format_response_with_knowledge_base()`

Formats response templates by replacing placeholders with actual hospital and agent data.

#### 3. `_get_knowledge_base_follow_ups()`

Generates follow-up questions based on behavior configuration, respecting the `enable_follow_up_questions` flag.

#### 4. Enhanced `_handle_hospital_query()`

Now fully integrates knowledge base configuration:

- Checks for greeting/intro queries
- Uses greeting message template
- Processes queries with KB awareness
- Returns agent identity information
- Uses KB follow-up questions

#### 5. Enhanced `_handle_appointment_booking()`

Uses appointment booking template as first response, then appends available slots.

### Modified Methods

#### `_get_knowledge_base()`

Already retrieves all knowledge base components (identity, behavior, response).

## Benefits

### 1. Hospital Branding

- Each hospital can have its own AI personality
- Consistent messaging across interactions
- Professional, branded customer experience

### 2. Customization

- Tone, style, and approach tailored per hospital
- Different communication strategies for different audiences
- Flexibility in response length and formality

### 3. Control

- Hospitals control first impression messages
- Templates ensure key information is always conveyed
- Reduces AI hallucinations with predefined content

### 4. Personalization

- Agent name and title for user connection
- Hospital-specific information in every response
- Contextual follow-ups based on behavior settings

### 5. Consistency

- Same questions receive consistent responses
- Templates ensure uniform messaging
- Reduces variation in AI responses

## Configuration in Admin

Hospitals can configure their AI agent through Django admin:

1. **AI Identity**

   - Set agent name and title
   - Define system prompt/guidelines
   - Activate/deactivate

2. **Behavior**

   - Choose communication tone and style
   - Set confidence level
   - Configure response length
   - Enable/disable features

3. **Response Templates**
   - Write greeting message
   - Define appointment booking text
   - Set business hours information
   - Configure all other response templates

## Testing

### Test Scenarios

1. **Greeting/Introduction**

   ```
   Query: "Tell me about yourself"
   Expected: Uses greeting_message template
   ```

2. **Appointment Booking**

   ```
   Query: "I want to book an appointment"
   Expected: Uses appointment_booking template + available slots
   ```

3. **Business Hours**

   ```
   Query: "What are your business hours?"
   Expected: Uses business_hours template
   ```

4. **Medical Specialties**

   ```
   Query: "What specialties do you have?"
   Expected: Uses medical_specialties template
   ```

5. **General Inquiry**

   ```
   Query: "Tell me about your services"
   Expected: Uses general_inquiries template
   ```

6. **Unknown Query**
   ```
   Query: "Random question"
   Expected: Uses fallback_response template
   ```

## Response Format

### Hospital Query Response

```json
{
  "success": true,
  "response": "Template-based or dynamic response",
  "query_type": "hospital",
  "hospital_info": {
    "id": "uuid",
    "name": "Acibadem Hospital",
    "city": "Ankara",
    "state": "Ankara"
  },
  "agent_name": "Dr. Sarah",
  "agent_title": "AI Healthcare Assistant",
  "follow_up_questions": [...]
}
```

### Appointment Query Response

```json
{
  "success": true,
  "response": "Template + available slots",
  "query_type": "appointment",
  "hospital_info": {...},
  "appointment_options": [...],
  "follow_up_questions": [...]
}
```

## Deployment

### Files to Transfer

```bash
# Only one file modified
scp core/ai_query_views.py ubuntu@aws:/home/ubuntu/medcor_backend2/core/
```

### Restart Service

```bash
sudo systemctl restart medcor
```

## Notes

- Templates are checked **first** before dynamic responses
- If template exists, it's used as **first response**
- Dynamic data (slots, doctors) is **appended** to templates
- Placeholders are **replaced** with actual data
- Behavior settings **guide** template usage
- Agent identity **personalizes** every interaction

## Future Enhancements

1. Multi-language template support
2. Template variables for dynamic data (e.g., `{specialties_list}`)
3. A/B testing for different templates
4. Template analytics and usage tracking
5. Rich media support in templates (images, links)
6. Scheduled template updates

## Summary

The AI agent now truly reflects each hospital's brand, personality, and communication style through knowledge base integration. Every interaction is personalized, consistent, and hospital-specific while maintaining the flexibility of dynamic data retrieval from MCP servers.





