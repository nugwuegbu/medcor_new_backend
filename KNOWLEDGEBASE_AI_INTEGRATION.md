# Knowledge Base AI Integration Summary

## Overview

This implementation integrates the knowledge base system with the OpenAI health query endpoint to provide hospital-specific AI responses customized based on each hospital's knowledge base configuration.

## What Was Implemented

### 1. Knowledge Base Integration with Health Queries

The system now retrieves and uses the knowledge base configuration when processing generic health questions for each hospital. The implementation:

- Retrieves knowledge base configuration when a `hospital_id` is provided with health queries
- Uses the `identity.system_prompt` to customize the AI's system prompt
- Uses the `behavior.communication_tone` to guide the AI's tone
- Uses the `behavior.communication_style` to guide the AI's communication style
- Uses the `behavior.confidence_level` to guide the AI's confidence level
- Uses the `behavior.response_length` to guide the AI's response length

### 2. Enhanced OpenAI Service Integration

The OpenAI service now accepts custom system prompts and behavior instructions, allowing each hospital to have a unique AI personality and response style.

## Implementation Details

### Files Modified

1. **`core/ai_query_views.py`**
   - Added imports for knowledge base models (`Ai_Identity`, `Behavior`, `Response`)
   - Modified `_handle_health_query()` method to accept `hospital_id` parameter
   - Added `_get_knowledge_base()` helper method to retrieve knowledge base configuration
   - Enhanced system prompt generation with knowledge base configuration

### Key Changes

#### 1. Modified Health Query Handler

```python
def _handle_health_query(self, question: str, hospital_id: str = None) -> Response:
    """Handle general health questions using OpenAI with knowledge base configuration"""
    # Get knowledge base configuration if hospital_id is provided
    knowledge_base = None
    if hospital_id:
        knowledge_base = self._get_knowledge_base(hospital_id)

    # Build system prompt with knowledge base configuration
    if knowledge_base:
        system_prompt = knowledge_base.get('identity', {}).get('system_prompt', '')
    else:
        # Default system prompt
        system_prompt = """..."""

    # Get communication tone and style from knowledge base
    tone_instructions = ""
    if knowledge_base:
        behavior = knowledge_base.get('behavior', {})
        # Build detailed tone instructions based on behavior settings
        ...

    # Combine prompts and generate response
    full_system_prompt = system_prompt + tone_instructions
    response = asyncio.run(
        self.openai_service.generate_chat_response(
            question,
            language="en",
            context={"system_prompt": full_system_prompt}
        )
    )
```

#### 2. Added Knowledge Base Retrieval Method

```python
def _get_knowledge_base(self, hospital_id: str) -> Optional[Dict]:
    """Get knowledge base configuration for a hospital"""
    try:
        hospital = Hospital.objects.get(id=hospital_id, is_active=True)

        # Try to get AI Identity, Behavior, and Response models
        # Return dictionary with all three components

        return {
            'identity': identity_data,
            'behavior': behavior_data,
            'response': response_data
        }
    except Hospital.DoesNotExist:
        return None
```

#### 3. Enhanced Tone Instructions

The system now translates knowledge base behavior settings into detailed OpenAI instructions:

- **Tone Mapping**: Converts tone values (Empathic, Authoritative, Casual, Friendly, Professional) into specific instructions
- **Style Mapping**: Converts style values (Conversational, Technical & Clinical, Detailed & Thorough, Concise & Direct) into specific instructions
- **Confidence Mapping**: Converts confidence levels (Conservative, Balanced, Confident) into specific instructions
- **Length Mapping**: Converts response length (Short, Medium, Long, Adaptive) into specific instructions

## Usage

### API Endpoint

**Endpoint**: `POST /api/ai/query/`

**Request Body**:

```json
{
  "question": "What are the symptoms of diabetes?",
  "hospital": "95acef1a-c4a5-4f24-a589-d46231697c1e"
}
```

**Response**:

```json
{
  "success": true,
  "response": "Diabetes symptoms include...",
  "query_type": "health",
  "follow_up_questions": [
    "Would you like to know more about this condition?",
    "Do you need help finding a specialist?",
    "Would you like to book an appointment with a doctor?"
  ]
}
```

### How It Works

1. **With Hospital ID**: When a `hospital` parameter is provided, the system:

   - Retrieves the knowledge base configuration for that hospital
   - Uses the hospital's custom system prompt from `identity.system_prompt`
   - Applies the hospital's communication tone, style, confidence level, and response length preferences
   - Generates a response that matches the hospital's AI personality

2. **Without Hospital ID**: When no `hospital` parameter is provided, the system uses default settings and behavior

## Knowledge Base Structure

The knowledge base API returns the following structure:

```json
{
  "count": 1,
  "results": [
    {
      "hospital_id": "95acef1a-c4a5-4f24-a589-d46231697c1e",
      "hospital_name": "MedCor General Hospital",
      "hospital_address": "...",
      "identity": {
        "agent_name": "Medcor AI",
        "agent_title": "Medcor Medical Assistant",
        "system_prompt": "you are a medical assistant..."
      },
      "behavior": {
        "communication_tone": "Empathic",
        "communication_style": "Conversational",
        "confidence_level": "Conservative",
        "response_length": "Short",
        "enable_follow_up_questions": true,
        "enable_appointment_booking": true,
        "enable_personalization": true
      },
      "response": {
        "greeting_message": "How may assist you today",
        "appointment_booking": "I can actually book appointment for you",
        "general_inquiries": "Do you want me to help you do anythin",
        "fallback_response": "Hey Good day",
        "emergency_response": "Are you in need of assistance",
        "business_hours": "9-5",
        "medical_specialties": "GENERAL"
      },
      "source": {
        "source_files": [],
        "files_count": 0,
        "is_active": true
      }
    }
  ]
}
```

## Benefits

1. **Hospital-Specific AI Personality**: Each hospital can customize how their AI assistant communicates
2. **Consistent Branding**: The AI's tone, style, and response length match each hospital's preferences
3. **Flexible Configuration**: Hospitals can adjust their AI's behavior without code changes
4. **Backward Compatible**: The system still works without hospital ID, using default settings

## Testing

Run the test script to verify the integration:

```bash
python test_knowledgebase_integration.py
```

This will test:

1. Knowledge base retrieval by hospital ID
2. Health queries with hospital ID (using knowledge base)
3. Health queries without hospital ID (using defaults)

## Example Outputs

### With Hospital ID (Empathic, Conversational, Short)

**Query**: "What are the symptoms of diabetes?"

**Response**: "Diabetes symptoms include increased thirst, frequent urination, and fatigue. I understand this might be concerning. Please consult with a healthcare professional for proper diagnosis and treatment."

### Without Hospital ID (Default, Professional, Medium)

**Query**: "What are the symptoms of diabetes?"

**Response**: "Diabetes symptoms typically include increased thirst, frequent urination, unexplained weight loss, fatigue, and blurred vision. If you're experiencing these symptoms, it's important to consult with a healthcare professional for proper diagnosis and treatment. They can perform blood tests to confirm whether you have diabetes and recommend appropriate management strategies."

## Future Enhancements

1. **Source Files Integration**: Use hospital's source files to provide more context to the AI
2. **Response Templates**: Use hospital's response templates for common queries
3. **Personalization**: Implement user history-based personalization
4. **Multi-Language Support**: Support different languages based on hospital configuration











