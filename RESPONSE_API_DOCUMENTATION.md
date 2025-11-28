# Response API Documentation

## Overview

The Response API provides endpoints for managing AI response templates per hospital in the MedCor healthcare platform. This system allows hospitals to configure standardized response templates for various types of interactions including greetings, appointment booking, medical analysis, and emergency responses.

## Base URL

- **Development**: `http://localhost:8002/api/knowledgebase/`
- **Production**: `https://api.medcor.ai/api/knowledgebase/`

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Model

The Response model represents AI response templates for a specific hospital:

### Fields

- `id` - UUID primary key
- `hospital` - Foreign key to Hospital model
- `greeting_message` - TextField - Welcome message for new users
- `appointment_booking` - TextField - Response template for appointment booking inquiries
- `face_analysis` - TextField - Response template for face analysis requests
- `hair_analysis` - TextField - Response template for hair analysis requests
- `hair_extension_analysis` - TextField - Response template for hair extension analysis requests
- `lips_analysis` - TextField - Response template for lips analysis requests
- `skin_analysis` - TextField - Response template for skin analysis requests
- `general_inquiries` - TextField - Response template for general medical inquiries
- `fallback_response` - TextField - Default response when no specific template matches
- `emergency_response` - TextField - Response template for emergency situations
- `business_hours` - TextField - Information about hospital business hours
- `medical_specialties` - TextField - Information about available medical specialties
- `is_active` - BooleanField - Whether the response templates are active
- `created_at` - DateTimeField - Creation timestamp
- `updated_at` - DateTimeField - Last update timestamp

## API Endpoints

### Responses

#### List Responses

```http
GET /api/knowledgebase/responses/
```

**Query Parameters:**

- `is_active` - Filter by active status (true/false)
- `hospital` - Filter by hospital ID
- `search` - Search in all response template fields
- `ordering` - Order by field (created_at, updated_at)
- `page` - Page number
- `page_size` - Items per page (max 100)

**Response:**

```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "hospital_name": "MedCor General Hospital",
      "greeting_message": "Welcome to MedCor General Hospital! How can I assist you today?",
      "appointment_booking": "I'd be happy to help you book an appointment. Please provide your preferred date and time.",
      "face_analysis": "I can help analyze facial features for medical purposes. Please upload a clear photo.",
      "hair_analysis": "I can assist with hair analysis. Please provide details about your hair concerns.",
      "hair_extension_analysis": "I can help analyze hair extensions. Please describe the type and condition.",
      "lips_analysis": "I can assist with lip analysis. Please provide details about your concerns.",
      "skin_analysis": "I can help analyze skin conditions. Please describe your skin concerns.",
      "general_inquiries": "I'm here to help with general medical questions. What would you like to know?",
      "fallback_response": "I'm not sure how to help with that. Let me connect you with a human specialist.",
      "emergency_response": "This appears to be a medical emergency. Please call 911 or go to the nearest emergency room immediately.",
      "business_hours": "Our hospital is open Monday-Friday 8AM-6PM, Saturday 9AM-4PM, closed Sundays.",
      "medical_specialties": "We offer services in Cardiology, Dermatology, Orthopedics, Pediatrics, and more.",
      "is_active": true,
      "created_at": "2025-01-11T10:00:00Z",
      "updated_at": "2025-01-11T10:00:00Z"
    }
  ]
}
```

#### Get Response Details

```http
GET /api/knowledgebase/responses/{id}/
```

**Response:**

```json
{
  "id": "uuid",
  "hospital": "uuid",
  "hospital_name": "MedCor General Hospital",
  "hospital_address": "123 Medical Street",
  "greeting_message": "Welcome to MedCor General Hospital! How can I assist you today?",
  "appointment_booking": "I'd be happy to help you book an appointment. Please provide your preferred date and time.",
  "face_analysis": "I can help analyze facial features for medical purposes. Please upload a clear photo.",
  "hair_analysis": "I can assist with hair analysis. Please provide details about your hair concerns.",
  "hair_extension_analysis": "I can help analyze hair extensions. Please describe the type and condition.",
  "lips_analysis": "I can assist with lip analysis. Please provide details about your concerns.",
  "skin_analysis": "I can help analyze skin conditions. Please describe your skin concerns.",
  "general_inquiries": "I'm here to help with general medical questions. What would you like to know?",
  "fallback_response": "I'm not sure how to help with that. Let me connect you with a human specialist.",
  "emergency_response": "This appears to be a medical emergency. Please call 911 or go to the nearest emergency room immediately.",
  "business_hours": "Our hospital is open Monday-Friday 8AM-6PM, Saturday 9AM-4PM, closed Sundays.",
  "medical_specialties": "We offer services in Cardiology, Dermatology, Orthopedics, Pediatrics, and more.",
  "is_active": true,
  "created_at": "2025-01-11T10:00:00Z",
  "updated_at": "2025-01-11T10:00:00Z"
}
```

#### Create Response

```http
POST /api/knowledgebase/responses/
```

**Request Body:**

```json
{
  "hospital_id": "uuid",
  "greeting_message": "Welcome to MedCor General Hospital! How can I assist you today?",
  "appointment_booking": "I'd be happy to help you book an appointment. Please provide your preferred date and time.",
  "face_analysis": "I can help analyze facial features for medical purposes. Please upload a clear photo.",
  "hair_analysis": "I can assist with hair analysis. Please provide details about your hair concerns.",
  "hair_extension_analysis": "I can help analyze hair extensions. Please describe the type and condition.",
  "lips_analysis": "I can assist with lip analysis. Please provide details about your concerns.",
  "skin_analysis": "I can help analyze skin conditions. Please describe your skin concerns.",
  "general_inquiries": "I'm here to help with general medical questions. What would you like to know?",
  "fallback_response": "I'm not sure how to help with that. Let me connect you with a human specialist.",
  "emergency_response": "This appears to be a medical emergency. Please call 911 or go to the nearest emergency room immediately.",
  "business_hours": "Our hospital is open Monday-Friday 8AM-6PM, Saturday 9AM-4PM, closed Sundays.",
  "medical_specialties": "We offer services in Cardiology, Dermatology, Orthopedics, Pediatrics, and more.",
  "is_active": true
}
```

#### Update Response

```http
PUT /api/knowledgebase/responses/{id}/
PATCH /api/knowledgebase/responses/{id}/
```

**Request Body:**

```json
{
  "hospital_id": "uuid",
  "greeting_message": "Welcome to MedCor General Hospital! How can I assist you today?",
  "appointment_booking": "I'd be happy to help you book an appointment. Please provide your preferred date and time.",
  "face_analysis": "I can help analyze facial features for medical purposes. Please upload a clear photo.",
  "hair_analysis": "I can assist with hair analysis. Please provide details about your hair concerns.",
  "hair_extension_analysis": "I can help analyze hair extensions. Please describe the type and condition.",
  "lips_analysis": "I can assist with lip analysis. Please provide details about your concerns.",
  "skin_analysis": "I can help analyze skin conditions. Please describe your skin concerns.",
  "general_inquiries": "I'm here to help with general medical questions. What would you like to know?",
  "fallback_response": "I'm not sure how to help with that. Let me connect you with a human specialist.",
  "emergency_response": "This appears to be a medical emergency. Please call 911 or go to the nearest emergency room immediately.",
  "business_hours": "Our hospital is open Monday-Friday 8AM-6PM, Saturday 9AM-4PM, closed Sundays.",
  "medical_specialties": "We offer services in Cardiology, Dermatology, Orthopedics, Pediatrics, and more.",
  "is_active": true
}
```

#### Delete Response

```http
DELETE /api/knowledgebase/responses/{id}/
```

### Response Actions

#### Activate Response

```http
POST /api/knowledgebase/responses/{id}/activate/
```

**Response:**

```json
{
  "message": "Response activated successfully",
  "is_active": true
}
```

#### Deactivate Response

```http
POST /api/knowledgebase/responses/{id}/deactivate/
```

**Response:**

```json
{
  "message": "Response deactivated successfully",
  "is_active": false
}
```

#### Get Responses by Hospital

```http
GET /api/knowledgebase/responses/by_hospital/
```

**Response:**

```json
[
  {
    "hospital_id": "uuid",
    "hospital_name": "MedCor General Hospital",
    "responses": [
      {
        "id": "uuid",
        "hospital_name": "MedCor General Hospital",
        "greeting_message": "Welcome to MedCor General Hospital! How can I assist you today?",
        "appointment_booking": "I'd be happy to help you book an appointment. Please provide your preferred date and time.",
        "face_analysis": "I can help analyze facial features for medical purposes. Please upload a clear photo.",
        "hair_analysis": "I can assist with hair analysis. Please provide details about your hair concerns.",
        "hair_extension_analysis": "I can help analyze hair extensions. Please describe the type and condition.",
        "lips_analysis": "I can assist with lip analysis. Please provide details about your concerns.",
        "skin_analysis": "I can help analyze skin conditions. Please describe your skin concerns.",
        "general_inquiries": "I'm here to help with general medical questions. What would you like to know?",
        "fallback_response": "I'm not sure how to help with that. Let me connect you with a human specialist.",
        "emergency_response": "This appears to be a medical emergency. Please call 911 or go to the nearest emergency room immediately.",
        "business_hours": "Our hospital is open Monday-Friday 8AM-6PM, Saturday 9AM-4PM, closed Sundays.",
        "medical_specialties": "We offer services in Cardiology, Dermatology, Orthopedics, Pediatrics, and more.",
        "is_active": true,
        "created_at": "2025-01-11T10:00:00Z",
        "updated_at": "2025-01-11T10:00:00Z"
      }
    ]
  }
]
```

#### Get Active Responses

```http
GET /api/knowledgebase/responses/active/
```

**Response:**

```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "hospital_name": "MedCor General Hospital",
      "greeting_message": "Welcome to MedCor General Hospital! How can I assist you today?",
      "appointment_booking": "I'd be happy to help you book an appointment. Please provide your preferred date and time.",
      "face_analysis": "I can help analyze facial features for medical purposes. Please upload a clear photo.",
      "hair_analysis": "I can assist with hair analysis. Please provide details about your hair concerns.",
      "hair_extension_analysis": "I can help analyze hair extensions. Please describe the type and condition.",
      "lips_analysis": "I can assist with lip analysis. Please provide details about your concerns.",
      "skin_analysis": "I can help analyze skin conditions. Please describe your skin concerns.",
      "general_inquiries": "I'm here to help with general medical questions. What would you like to know?",
      "fallback_response": "I'm not sure how to help with that. Let me connect you with a human specialist.",
      "emergency_response": "This appears to be a medical emergency. Please call 911 or go to the nearest emergency room immediately.",
      "business_hours": "Our hospital is open Monday-Friday 8AM-6PM, Saturday 9AM-4PM, closed Sundays.",
      "medical_specialties": "We offer services in Cardiology, Dermatology, Orthopedics, Pediatrics, and more.",
      "is_active": true,
      "created_at": "2025-01-11T10:00:00Z",
      "updated_at": "2025-01-11T10:00:00Z"
    }
  ]
}
```

#### Get Response Templates

```http
GET /api/knowledgebase/responses/templates/
```

**Response:**

```json
[
  {
    "hospital_id": "uuid",
    "hospital_name": "MedCor General Hospital",
    "templates": {
      "greeting_message": "Welcome to MedCor General Hospital! How can I assist you today?",
      "appointment_booking": "I'd be happy to help you book an appointment. Please provide your preferred date and time.",
      "face_analysis": "I can help analyze facial features for medical purposes. Please upload a clear photo.",
      "hair_analysis": "I can assist with hair analysis. Please provide details about your hair concerns.",
      "hair_extension_analysis": "I can help analyze hair extensions. Please describe the type and condition.",
      "lips_analysis": "I can assist with lip analysis. Please provide details about your concerns.",
      "skin_analysis": "I can help analyze skin conditions. Please describe your skin concerns.",
      "general_inquiries": "I'm here to help with general medical questions. What would you like to know?",
      "fallback_response": "I'm not sure how to help with that. Let me connect you with a human specialist.",
      "emergency_response": "This appears to be a medical emergency. Please call 911 or go to the nearest emergency room immediately.",
      "business_hours": "Our hospital is open Monday-Friday 8AM-6PM, Saturday 9AM-4PM, closed Sundays.",
      "medical_specialties": "We offer services in Cardiology, Dermatology, Orthopedics, Pediatrics, and more."
    }
  }
]
```

#### Get Specific Template

```http
GET /api/knowledgebase/responses/{id}/get_template/?type=greeting_message
```

**Query Parameters:**

- `type` - Template type (greeting_message, appointment_booking, face_analysis, etc.)

**Response:**

```json
{
  "hospital_name": "MedCor General Hospital",
  "template_type": "greeting_message",
  "content": "Welcome to MedCor General Hospital! How can I assist you today?",
  "is_active": true
}
```

### Statistics and Search

#### Get Response Statistics

```http
GET /api/knowledgebase/response-statistics/
```

**Response:**

```json
{
  "total_responses": 10,
  "active_responses": 8,
  "inactive_responses": 2,
  "hospital_stats": [
    {
      "hospital_name": "MedCor General Hospital",
      "total": 5,
      "active": 4,
      "inactive": 1
    },
    {
      "hospital_name": "City Medical Center",
      "total": 5,
      "active": 4,
      "inactive": 1
    }
  ]
}
```

#### Search Responses

```http
GET /api/knowledgebase/response-search/
```

**Query Parameters:**

- `query` - Search term (searches in all response template fields)
- `hospital` - Filter by hospital ID
- `is_active` - Filter by active status (true/false)

**Response:**

```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "hospital_name": "MedCor General Hospital",
      "greeting_message": "Welcome to MedCor General Hospital! How can I assist you today?",
      "appointment_booking": "I'd be happy to help you book an appointment. Please provide your preferred date and time.",
      "face_analysis": "I can help analyze facial features for medical purposes. Please upload a clear photo.",
      "hair_analysis": "I can assist with hair analysis. Please provide details about your hair concerns.",
      "hair_extension_analysis": "I can help analyze hair extensions. Please describe the type and condition.",
      "lips_analysis": "I can assist with lip analysis. Please provide details about your concerns.",
      "skin_analysis": "I can help analyze skin conditions. Please describe your skin concerns.",
      "general_inquiries": "I'm here to help with general medical questions. What would you like to know?",
      "fallback_response": "I'm not sure how to help with that. Let me connect you with a human specialist.",
      "emergency_response": "This appears to be a medical emergency. Please call 911 or go to the nearest emergency room immediately.",
      "business_hours": "Our hospital is open Monday-Friday 8AM-6PM, Saturday 9AM-4PM, closed Sundays.",
      "medical_specialties": "We offer services in Cardiology, Dermatology, Orthopedics, Pediatrics, and more.",
      "is_active": true,
      "created_at": "2025-01-11T10:00:00Z",
      "updated_at": "2025-01-11T10:00:00Z"
    }
  ]
}
```

## Template Types

The Response model supports the following template types:

### Core Templates

- **greeting_message** - Welcome message for new users
- **appointment_booking** - Response template for appointment booking inquiries
- **general_inquiries** - Response template for general medical inquiries
- **fallback_response** - Default response when no specific template matches

### Analysis Templates

- **face_analysis** - Response template for face analysis requests
- **hair_analysis** - Response template for hair analysis requests
- **hair_extension_analysis** - Response template for hair extension analysis requests
- **lips_analysis** - Response template for lips analysis requests
- **skin_analysis** - Response template for skin analysis requests

### Special Templates

- **emergency_response** - Response template for emergency situations
- **business_hours** - Information about hospital business hours
- **medical_specialties** - Information about available medical specialties

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

**Error Response Format:**

```json
{
  "error": "Error message",
  "details": "Additional error details",
  "field_errors": {
    "field_name": ["Field-specific error message"]
  }
}
```

## Pagination

List endpoints support pagination with the following parameters:

- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 20, max: 100)

**Pagination Response:**

```json
{
    "count": 100,
    "next": "http://localhost:8002/api/knowledgebase/responses/?page=3",
    "previous": "http://localhost:8002/api/knowledgebase/responses/?page=1",
    "results": [...]
}
```

## Filtering and Search

### Text Search

- `search` parameter searches in all response template fields
- Case-insensitive partial matching

### Field Filtering

- Use query parameters to filter by specific fields
- Multiple fields can be filtered simultaneously

### Ordering

- `ordering` parameter controls result ordering
- Prefix with `-` for descending order
- Available fields: `created_at`, `updated_at`

## Multi-Tenant Support

The Response system supports multi-tenant architecture:

- **Hospital Isolation**: Responses are filtered by hospital context
- **User Permissions**: Role-based access control
- **Data Segregation**: Each hospital sees only their own responses

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Search**: 100 requests per minute per user
- **Create/Update**: 50 requests per minute per user
- **Read**: 200 requests per minute per user

## Swagger Documentation

Interactive API documentation is available at:

- **Swagger UI**: `http://localhost:8002/api/docs/`
- **ReDoc**: `http://localhost:8002/api/redoc/`
- **OpenAPI Schema**: `http://localhost:8002/api/schema/`

## Examples

### Creating a Response

```bash
# 1. Get authentication token
curl -X POST http://localhost:8002/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@medcor.ai", "password": "admin123"}'

# 2. Create Response
curl -X POST http://localhost:8002/api/knowledgebase/responses/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "hospital_id": "hospital-uuid",
    "greeting_message": "Welcome to MedCor General Hospital! How can I assist you today?",
    "appointment_booking": "I'\''d be happy to help you book an appointment. Please provide your preferred date and time.",
    "face_analysis": "I can help analyze facial features for medical purposes. Please upload a clear photo.",
    "hair_analysis": "I can assist with hair analysis. Please provide details about your hair concerns.",
    "hair_extension_analysis": "I can help analyze hair extensions. Please describe the type and condition.",
    "lips_analysis": "I can assist with lip analysis. Please provide details about your concerns.",
    "skin_analysis": "I can help analyze skin conditions. Please describe your skin concerns.",
    "general_inquiries": "I'\''m here to help with general medical questions. What would you like to know?",
    "fallback_response": "I'\''m not sure how to help with that. Let me connect you with a human specialist.",
    "emergency_response": "This appears to be a medical emergency. Please call 911 or go to the nearest emergency room immediately.",
    "business_hours": "Our hospital is open Monday-Friday 8AM-6PM, Saturday 9AM-4PM, closed Sundays.",
    "medical_specialties": "We offer services in Cardiology, Dermatology, Orthopedics, Pediatrics, and more.",
    "is_active": true
  }'
```

### Getting Templates

```bash
# Get all templates for a hospital
curl -X GET http://localhost:8002/api/knowledgebase/responses/templates/ \
  -H "Authorization: Bearer <token>"

# Get specific template
curl -X GET "http://localhost:8002/api/knowledgebase/responses/{id}/get_template/?type=greeting_message" \
  -H "Authorization: Bearer <token>"
```

### Searching Responses

```bash
curl -X GET "http://localhost:8002/api/knowledgebase/response-search/?query=appointment&is_active=true" \
  -H "Authorization: Bearer <token>"
```

## Use Cases

### Medical AI Assistant

- **Greeting Message**: Welcome new patients and set expectations
- **Appointment Booking**: Guide patients through scheduling process
- **General Inquiries**: Handle common medical questions
- **Fallback Response**: Escalate complex queries to human staff

### Analysis Services

- **Face Analysis**: Guide patients through facial analysis process
- **Hair Analysis**: Assist with hair-related concerns and treatments
- **Skin Analysis**: Help with skin condition assessments
- **Hair Extension Analysis**: Support hair extension consultations

### Emergency Response

- **Emergency Response**: Provide immediate guidance for medical emergencies
- **Business Hours**: Inform patients about hospital operating hours
- **Medical Specialties**: List available services and specialties

## Support

For API support and questions:

- **Email**: support@medcor.ai
- **Documentation**: [API Documentation](http://localhost:8002/api/docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/medcor_backend2/issues)
