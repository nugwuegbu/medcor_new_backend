# Enhanced AI Query Endpoint Documentation

## Overview

The enhanced AI Query endpoint (`/api/ai/query/`) provides intelligent health and hospital-specific query processing. It automatically detects query types and routes them to appropriate services.

## Endpoint Details

- **URL**: `http://localhost:8002/api/ai/query/`
- **Method**: POST
- **Content-Type**: application/json
- **Authentication**: None required (AllowAny)

## Request Format

```json
{
  "question": "string",
  "hospital": "string" // Optional - required for hospital-specific queries
}
```

## Query Types Supported

### 1. General Health Questions

**Examples:**

- "What are the symptoms of diabetes?"
- "How do I treat high blood pressure?"
- "What causes headaches?"

**Response:** Uses OpenAI GPT-4 to provide health information with appropriate disclaimers.

### 2. Non-Health Questions (Filtered)

**Examples:**

- "What's the weather like today?"
- "Tell me about the latest movies"
- "How do I cook pasta?"

**Response:** Politely redirects to health topics only.

### 3. Hospital-Specific Queries

**Examples:**

- "Is there a Gynecologist in this hospital?"
- "What diseases are treated in this hospital?"
- "Who are the doctors in this hospital?"
- "Does your hospital perform brain surgery?"

**Response:** Uses MCP server to query hospital database for specific information.

### 4. Appointment Booking

**Examples:**

- "I want to book an appointment"
- "Can you help me schedule a consultation?"
- "I need to see a doctor"

**Response:** Shows available appointment slots with doctors and times.

## Response Format

### Success Response

```json
{
  "success": true,
  "response": "string",
  "query_type": "health|hospital|appointment|non_health",
  "hospital_info": {
    "id": "string",
    "name": "string",
    "city": "string",
    "state": "string"
  },
  "appointment_options": [
    {
      "slot_id": "string",
      "doctor_name": "string",
      "specialization": "string",
      "date": "YYYY-MM-DD",
      "start_time": "HH:MM:SS",
      "end_time": "HH:MM:SS",
      "duration_minutes": 30,
      "available_spots": 1
    }
  ],
  "follow_up_questions": ["string"]
}
```

### Error Response

```json
{
  "success": false,
  "error": "string",
  "details": "string"
}
```

## Features

### 1. Intelligent Query Detection

- Automatically detects query type based on keywords
- Routes to appropriate service (OpenAI, MCP server, or appointment system)
- Filters out non-health related questions

### 2. Health Question Processing

- Uses OpenAI GPT-4 for general health questions
- Includes appropriate medical disclaimers
- Provides follow-up question suggestions

### 3. Hospital-Specific Queries

- Checks for specific specialists (Gynecologist, Cardiologist, etc.)
- Lists available doctors and their specializations
- Checks if specific procedures are performed
- Provides hospital contact information

### 4. Appointment Booking

- Shows available appointment slots
- Lists doctors with their specializations
- Provides time slots and availability
- Guides users through booking process

### 5. Error Handling

- Graceful error handling for all query types
- Fallback responses when services are unavailable
- Clear error messages for debugging

## Usage Examples

### Example 1: Health Question

```bash
curl -X POST http://localhost:8002/api/ai/query/ \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the symptoms of diabetes?"}'
```

### Example 2: Hospital Query

```bash
curl -X POST http://localhost:8002/api/ai/query/ \
  -H "Content-Type: application/json" \
  -d '{"question": "Is there a Gynecologist in this hospital?", "hospital": "hospital-uuid-123"}'
```

### Example 3: Appointment Booking

```bash
curl -X POST http://localhost:8002/api/ai/query/ \
  -H "Content-Type: application/json" \
  -d '{"question": "I want to book an appointment", "hospital": "hospital-uuid-123"}'
```

## Testing

Run the test script to verify functionality:

```bash
python test_ai_query_endpoint.py
```

Make sure to update the `TEST_HOSPITAL_ID` in the test script with a real hospital ID from your database.

## Dependencies

- OpenAI API key configured in environment
- MCP server running and accessible
- Database with hospital, doctor, and appointment data
- Celery for background processing (optional)

## Configuration

Ensure the following environment variables are set:

- `OPENAI_API_KEY`: Your OpenAI API key
- Database connection settings
- MCP server configuration

## Error Codes

- `400`: Bad Request - Missing required fields
- `500`: Internal Server Error - Service unavailable or processing error

## Notes

- The endpoint is designed to be conversational and user-friendly
- All health responses include appropriate medical disclaimers
- Hospital queries require a valid hospital ID
- Appointment booking shows real-time availability
- Non-health questions are politely redirected to health topics
