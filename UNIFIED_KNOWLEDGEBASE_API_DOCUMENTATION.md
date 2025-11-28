# Unified KnowledgeBase API Documentation

## Overview

The KnowledgeBase API has been refactored to provide a unified interface for managing all AI components (AI Identity, Behavior, Response Templates, and Source Files) for each hospital. This new design ensures a one-to-one relationship between hospitals and their knowledge base configurations.

## Key Features

- **One-to-One Relationship**: Each hospital can have only one KnowledgeBase configuration
- **Unified Endpoint**: Single endpoint to manage all AI components
- **Hospital-Specific URLs**: Access knowledge base using hospital ID in the URL
- **Backward Compatibility**: Legacy endpoints are still available (deprecated)
- **Auto-Creation**: KnowledgeBase is automatically created when accessed if it doesn't exist

## API Endpoints

### Base URL Structure

```
/api/knowledgebase/hospital/{hospital_id}/knowledge-base/
```

### Available Operations

| Method | Endpoint                                                         | Description                                             |
| ------ | ---------------------------------------------------------------- | ------------------------------------------------------- |
| GET    | `/api/knowledgebase/hospital/{hospital_id}/knowledge-base/`      | List all knowledge bases (filtered by user permissions) |
| GET    | `/api/knowledgebase/hospital/{hospital_id}/knowledge-base/{id}/` | Retrieve specific knowledge base                        |
| POST   | `/api/knowledgebase/hospital/{hospital_id}/knowledge-base/`      | Create new knowledge base for hospital                  |
| PUT    | `/api/knowledgebase/hospital/{hospital_id}/knowledge-base/{id}/` | Update entire knowledge base                            |
| PATCH  | `/api/knowledgebase/hospital/{hospital_id}/knowledge-base/{id}/` | Partial update of knowledge base                        |
| DELETE | `/api/knowledgebase/hospital/{hospital_id}/knowledge-base/{id}/` | Delete knowledge base                                   |

### Additional Actions

| Method | Endpoint                                                                       | Description                             |
| ------ | ------------------------------------------------------------------------------ | --------------------------------------- |
| GET    | `/api/knowledgebase/hospital/{hospital_id}/knowledge-base/by_hospital/`        | Get knowledge bases grouped by hospital |
| GET    | `/api/knowledgebase/hospital/{hospital_id}/knowledge-base/active/`             | Get only active knowledge bases         |
| POST   | `/api/knowledgebase/hospital/{hospital_id}/knowledge-base/{id}/activate/`      | Activate knowledge base                 |
| POST   | `/api/knowledgebase/hospital/{hospital_id}/knowledge-base/{id}/deactivate/`    | Deactivate knowledge base               |
| GET    | `/api/knowledgebase/hospital/{hospital_id}/knowledge-base/{id}/download_file/` | Download source file                    |

## Data Model

### KnowledgeBase Model

The unified KnowledgeBase model combines all four original components:

#### AI Identity Fields

- `agent_name`: Name of the AI agent (default: "MedCor AI Assistant")
- `agent_title`: Title/role of the AI agent (default: "AI Medical Assistant")
- `system_prompt`: System prompt for the AI (default: "You are a helpful AI medical assistant.")

#### Behavior Fields

- `communication_tone`: Communication tone (choices: Empathic, Authoritative, Casual, Friendly, Professional)
- `communication_style`: Communication style (choices: Conversational, Technical & Clinical, Detailed & Thorough, Concise & Direct)
- `confidence_level`: Confidence level (choices: Conservative, Balanced, Confident)
- `response_length`: Response length (choices: Short, Medium, Long, Adaptive)

#### Response Template Fields

- `greeting_message`: Welcome message for new users
- `appointment_booking`: Response template for appointment booking
- `face_analysis`: Response template for face analysis
- `hair_analysis`: Response template for hair analysis
- `hair_extension_analysis`: Response template for hair extension analysis
- `lips_analysis`: Response template for lips analysis
- `skin_analysis`: Response template for skin analysis
- `general_inquiries`: Response template for general inquiries
- `fallback_response`: Default response when no template matches
- `emergency_response`: Response template for emergencies
- `business_hours`: Information about business hours
- `medical_specialties`: Information about medical specialties

#### Source File Fields

- `source_file`: File field for knowledge base source files
- `file_name`: Read-only property for file name
- `file_size`: Read-only property for file size
- `file_url`: Read-only property for file URL

#### Common Fields

- `id`: UUID primary key
- `hospital`: OneToOneField to Hospital model
- `is_active`: Boolean flag for active status
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Request/Response Examples

### 1. Create KnowledgeBase for Hospital

**Request:**

```http
POST /api/knowledgebase/hospital/123e4567-e89b-12d3-a456-426614174000/knowledge-base/
Content-Type: application/json
Authorization: Bearer <token>

{
    "agent_name": "MedCor AI Assistant",
    "agent_title": "AI Medical Assistant",
    "system_prompt": "You are a helpful AI medical assistant for MedCor Hospital.",
    "communication_tone": "Professional",
    "communication_style": "Conversational",
    "confidence_level": "Balanced",
    "response_length": "Medium",
    "greeting_message": "Hello! I'm your AI medical assistant. How can I help you today?",
    "appointment_booking": "I can help you book an appointment. Please let me know your preferred date and time.",
    "face_analysis": "I can help analyze facial features. Please describe what you'd like me to look at.",
    "hair_analysis": "I can help analyze hair conditions. Please describe your hair concerns.",
    "hair_extension_analysis": "I can help analyze hair extensions. Please describe your extension concerns.",
    "lips_analysis": "I can help analyze lip conditions. Please describe your lip concerns.",
    "skin_analysis": "I can help analyze skin conditions. Please describe your skin concerns.",
    "general_inquiries": "I'm here to help with your medical inquiries. What would you like to know?",
    "fallback_response": "I'm not sure how to help with that. Please contact our medical staff for assistance.",
    "emergency_response": "This appears to be a medical emergency. Please call emergency services immediately or go to the nearest emergency room.",
    "business_hours": "Our business hours are Monday-Friday 9AM-5PM. Please contact us during these hours.",
    "medical_specialties": "We offer various medical specialties. Please let me know what specific area you're interested in.",
    "is_active": true
}
```

**Response:**

```json
{
  "id": "456e7890-e89b-12d3-a456-426614174001",
  "hospital_name": "MedCor Hospital",
  "hospital_address": "123 Medical Street, City, State",
  "agent_name": "MedCor AI Assistant",
  "agent_title": "AI Medical Assistant",
  "system_prompt": "You are a helpful AI medical assistant for MedCor Hospital.",
  "communication_tone": "Professional",
  "communication_style": "Conversational",
  "confidence_level": "Balanced",
  "response_length": "Medium",
  "greeting_message": "Hello! I'm your AI medical assistant. How can I help you today?",
  "appointment_booking": "I can help you book an appointment. Please let me know your preferred date and time.",
  "face_analysis": "I can help analyze facial features. Please describe what you'd like me to look at.",
  "hair_analysis": "I can help analyze hair conditions. Please describe your hair concerns.",
  "hair_extension_analysis": "I can help analyze hair extensions. Please describe your extension concerns.",
  "lips_analysis": "I can help analyze lip conditions. Please describe your lip concerns.",
  "skin_analysis": "I can help analyze skin conditions. Please describe your skin concerns.",
  "general_inquiries": "I'm here to help with your medical inquiries. What would you like to know?",
  "fallback_response": "I'm not sure how to help with that. Please contact our medical staff for assistance.",
  "emergency_response": "This appears to be a medical emergency. Please call emergency services immediately or go to the nearest emergency room.",
  "business_hours": "Our business hours are Monday-Friday 9AM-5PM. Please contact us during these hours.",
  "medical_specialties": "We offer various medical specialties. Please let me know what specific area you're interested in.",
  "source_file": null,
  "file_name": null,
  "file_size": null,
  "file_url": null,
  "is_active": true,
  "created_at": "2025-09-19T10:30:00.000Z",
  "updated_at": "2025-09-19T10:30:00.000Z"
}
```

### 2. Retrieve KnowledgeBase for Hospital

**Request:**

```http
GET /api/knowledgebase/hospital/123e4567-e89b-12d3-a456-426614174000/knowledge-base/456e7890-e89b-12d3-a456-426614174001/
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": "456e7890-e89b-12d3-a456-426614174001",
  "hospital_name": "MedCor Hospital",
  "hospital_address": "123 Medical Street, City, State",
  "agent_name": "MedCor AI Assistant",
  "agent_title": "AI Medical Assistant",
  "system_prompt": "You are a helpful AI medical assistant for MedCor Hospital.",
  "communication_tone": "Professional",
  "communication_style": "Conversational",
  "confidence_level": "Balanced",
  "response_length": "Medium",
  "greeting_message": "Hello! I'm your AI medical assistant. How can I help you today?",
  "appointment_booking": "I can help you book an appointment. Please let me know your preferred date and time.",
  "face_analysis": "I can help analyze facial features. Please describe what you'd like me to look at.",
  "hair_analysis": "I can help analyze hair conditions. Please describe your hair concerns.",
  "hair_extension_analysis": "I can help analyze hair extensions. Please describe your extension concerns.",
  "lips_analysis": "I can help analyze lip conditions. Please describe your lip concerns.",
  "skin_analysis": "I can help analyze skin conditions. Please describe your skin concerns.",
  "general_inquiries": "I'm here to help with your medical inquiries. What would you like to know?",
  "fallback_response": "I'm not sure how to help with that. Please contact our medical staff for assistance.",
  "emergency_response": "This appears to be a medical emergency. Please call emergency services immediately or go to the nearest emergency room.",
  "business_hours": "Our business hours are Monday-Friday 9AM-5PM. Please contact us during these hours.",
  "medical_specialties": "We offer various medical specialties. Please let me know what specific area you're interested in.",
  "source_file": null,
  "file_name": null,
  "file_size": null,
  "file_url": null,
  "is_active": true,
  "created_at": "2025-09-19T10:30:00.000Z",
  "updated_at": "2025-09-19T10:30:00.000Z"
}
```

### 3. Update KnowledgeBase (Partial Update)

**Request:**

```http
PATCH /api/knowledgebase/hospital/123e4567-e89b-12d3-a456-426614174000/knowledge-base/456e7890-e89b-12d3-a456-426614174001/
Content-Type: application/json
Authorization: Bearer <token>

{
    "communication_tone": "Empathic",
    "greeting_message": "Welcome to MedCor Hospital! I'm here to help you with your medical needs."
}
```

**Response:**

```json
{
  "id": "456e7890-e89b-12d3-a456-426614174001",
  "hospital_name": "MedCor Hospital",
  "hospital_address": "123 Medical Street, City, State",
  "agent_name": "MedCor AI Assistant",
  "agent_title": "AI Medical Assistant",
  "system_prompt": "You are a helpful AI medical assistant for MedCor Hospital.",
  "communication_tone": "Empathic",
  "communication_style": "Conversational",
  "confidence_level": "Balanced",
  "response_length": "Medium",
  "greeting_message": "Welcome to MedCor Hospital! I'm here to help you with your medical needs.",
  "appointment_booking": "I can help you book an appointment. Please let me know your preferred date and time.",
  "face_analysis": "I can help analyze facial features. Please describe what you'd like me to look at.",
  "hair_analysis": "I can help analyze hair conditions. Please describe your hair concerns.",
  "hair_extension_analysis": "I can help analyze hair extensions. Please describe your extension concerns.",
  "lips_analysis": "I can help analyze lip conditions. Please describe your lip concerns.",
  "skin_analysis": "I can help analyze skin conditions. Please describe your skin concerns.",
  "general_inquiries": "I'm here to help with your medical inquiries. What would you like to know?",
  "fallback_response": "I'm not sure how to help with that. Please contact our medical staff for assistance.",
  "emergency_response": "This appears to be a medical emergency. Please call emergency services immediately or go to the nearest emergency room.",
  "business_hours": "Our business hours are Monday-Friday 9AM-5PM. Please contact us during these hours.",
  "medical_specialties": "We offer various medical specialties. Please let me know what specific area you're interested in.",
  "source_file": null,
  "file_name": null,
  "file_size": null,
  "file_url": null,
  "is_active": true,
  "created_at": "2025-09-19T10:30:00.000Z",
  "updated_at": "2025-09-19T10:35:00.000Z"
}
```

### 4. Upload Source File

**Request:**

```http
PATCH /api/knowledgebase/hospital/123e4567-e89b-12d3-a456-426614174000/knowledge-base/456e7890-e89b-12d3-a456-426614174001/
Content-Type: multipart/form-data
Authorization: Bearer <token>

source_file: [file upload]
```

**Response:**

```json
{
  "id": "456e7890-e89b-12d3-a456-426614174001",
  "hospital_name": "MedCor Hospital",
  "hospital_address": "123 Medical Street, City, State",
  "agent_name": "MedCor AI Assistant",
  "agent_title": "AI Medical Assistant",
  "system_prompt": "You are a helpful AI medical assistant for MedCor Hospital.",
  "communication_tone": "Empathic",
  "communication_style": "Conversational",
  "confidence_level": "Balanced",
  "response_length": "Medium",
  "greeting_message": "Welcome to MedCor Hospital! I'm here to help you with your medical needs.",
  "appointment_booking": "I can help you book an appointment. Please let me know your preferred date and time.",
  "face_analysis": "I can help analyze facial features. Please describe what you'd like me to look at.",
  "hair_analysis": "I can help analyze hair conditions. Please describe your hair concerns.",
  "hair_extension_analysis": "I can help analyze hair extensions. Please describe your extension concerns.",
  "lips_analysis": "I can help analyze lip conditions. Please describe your lip concerns.",
  "skin_analysis": "I can help analyze skin conditions. Please describe your skin concerns.",
  "general_inquiries": "I'm here to help with your medical inquiries. What would you like to know?",
  "fallback_response": "I'm not sure how to help with that. Please contact our medical staff for assistance.",
  "emergency_response": "This appears to be a medical emergency. Please call emergency services immediately or go to the nearest emergency room.",
  "business_hours": "Our business hours are Monday-Friday 9AM-5PM. Please contact us during these hours.",
  "medical_specialties": "We offer various medical specialties. Please let me know what specific area you're interested in.",
  "source_file": "knowledgebase/sources/2025/09/19/medical_guidelines.pdf",
  "file_name": "knowledgebase/sources/2025/09/19/medical_guidelines.pdf",
  "file_size": 1024000,
  "file_url": "https://api.medcor.ai/media/knowledgebase/sources/2025/09/19/medical_guidelines.pdf",
  "is_active": true,
  "created_at": "2025-09-19T10:30:00.000Z",
  "updated_at": "2025-09-19T10:40:00.000Z"
}
```

## Authentication & Permissions

- **Authentication Required**: All endpoints require valid authentication
- **Hospital-Based Access**: Users can only access knowledge bases for their assigned hospital (unless superuser)
- **Superuser Access**: Superusers can access all knowledge bases

## Error Responses

### 400 Bad Request

```json
{
  "error": "KnowledgeBase already exists for this hospital. Use PUT/PATCH to update."
}
```

### 403 Forbidden

```json
{
  "detail": "You don't have permission to access this hospital's knowledge base."
}
```

### 404 Not Found

```json
{
  "detail": "Not found."
}
```

## Migration from Legacy API

### Before (Legacy)

```javascript
// Separate endpoints for each component
const aiIdentity = await fetch("/api/knowledgebase/ai-identities/");
const behavior = await fetch("/api/knowledgebase/behaviors/");
const response = await fetch("/api/knowledgebase/responses/");
const source = await fetch("/api/knowledgebase/sources/");
```

### After (Unified)

```javascript
// Single endpoint for all components
const knowledgeBase = await fetch(
  "/api/knowledgebase/hospital/{hospital_id}/knowledge-base/"
);
```

## Benefits of Unified API

1. **Simplified Management**: Single endpoint to manage all AI components
2. **Data Consistency**: Ensures all components are updated together
3. **Reduced API Calls**: One request instead of four separate requests
4. **Better Performance**: Fewer database queries and HTTP requests
5. **Easier Maintenance**: Single model and viewset to maintain
6. **Hospital Isolation**: Clear separation of knowledge bases by hospital

## Legacy API Deprecation

The original separate endpoints are still available but marked as deprecated:

- `/api/knowledgebase/ai-identities/` (deprecated)
- `/api/knowledgebase/behaviors/` (deprecated)
- `/api/knowledgebase/responses/` (deprecated)
- `/api/knowledgebase/sources/` (deprecated)

These will be removed in a future version. Please migrate to the unified API.

## Database Migration

To apply the new model changes, run:

```bash
python3 manage.py migrate knowledgebase
```

This will create the new `KnowledgeBase` model while preserving the existing legacy models for backward compatibility.
