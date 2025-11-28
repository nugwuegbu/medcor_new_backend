# Behavior API Documentation

## Overview

The Behavior API provides endpoints for managing AI behavior configurations per hospital in the MedCor healthcare platform. This system allows hospitals to configure how their AI agents communicate and behave with different tones, styles, confidence levels, and response lengths.

## Base URL

- **Development**: `http://localhost:8002/api/knowledgebase/`
- **Production**: `https://api.medcor.ai/api/knowledgebase/`

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Behavior Model

The Behavior model represents AI behavior configuration for a specific hospital:

### Fields

- `id` - UUID primary key
- `hospital` - Foreign key to Hospital model
- `communication_tone` - Choice field with options:
  - `Empathic` - Shows understanding and compassion
  - `Authoritative` - Confident and directive
  - `Casual` - Relaxed and informal
  - `Friendly` - Warm and approachable
  - `Professional` - Formal and business-like
- `communication_style` - Choice field with options:
  - `Conversational` - Natural dialogue style
  - `Technical & Clinical` - Medical terminology and precision
  - `Detailed & Thorough` - Comprehensive explanations
  - `Concise & Direct` - Brief and to the point
- `confidence_level` - Choice field with options:
  - `Conservative` - Cautious and careful
  - `Balanced` - Moderate confidence
  - `Confident` - Assured and decisive
- `response_length` - Choice field with options:
  - `Short` - Brief responses
  - `Medium` - Moderate length
  - `Long` - Detailed responses
  - `Adaptive` - Adjusts based on context
- `is_active` - BooleanField - Whether the behavior is active
- `created_at` - DateTimeField - Creation timestamp
- `updated_at` - DateTimeField - Last update timestamp

## API Endpoints

### Behaviors

#### List Behaviors

```http
GET /api/knowledgebase/behaviors/
```

**Query Parameters:**

- `is_active` - Filter by active status (true/false)
- `hospital` - Filter by hospital ID
- `communication_tone` - Filter by communication tone
- `communication_style` - Filter by communication style
- `confidence_level` - Filter by confidence level
- `response_length` - Filter by response length
- `search` - Search in all behavior fields
- `ordering` - Order by field (created_at, updated_at, communication_tone, communication_style)
- `page` - Page number
- `page_size` - Items per page (max 100)

**Response:**

```json
{
  "count": 10,
  "next": "http://localhost:8002/api/knowledgebase/behaviors/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "hospital_name": "MedCor General Hospital",
      "communication_tone": "Professional",
      "communication_style": "Technical & Clinical",
      "confidence_level": "Balanced",
      "response_length": "Medium",
      "is_active": true,
      "created_at": "2025-01-11T10:00:00Z",
      "updated_at": "2025-01-11T10:00:00Z"
    }
  ]
}
```

#### Get Behavior Details

```http
GET /api/knowledgebase/behaviors/{id}/
```

**Response:**

```json
{
  "id": "uuid",
  "hospital": "uuid",
  "hospital_name": "MedCor General Hospital",
  "hospital_address": "123 Medical Street",
  "communication_tone": "Professional",
  "communication_style": "Technical & Clinical",
  "confidence_level": "Balanced",
  "response_length": "Medium",
  "is_active": true,
  "created_at": "2025-01-11T10:00:00Z",
  "updated_at": "2025-01-11T10:00:00Z"
}
```

#### Create Behavior

```http
POST /api/knowledgebase/behaviors/
```

**Request Body:**

```json
{
  "hospital_id": "uuid",
  "communication_tone": "Professional",
  "communication_style": "Technical & Clinical",
  "confidence_level": "Balanced",
  "response_length": "Medium",
  "is_active": true
}
```

#### Update Behavior

```http
PUT /api/knowledgebase/behaviors/{id}/
PATCH /api/knowledgebase/behaviors/{id}/
```

**Request Body:**

```json
{
  "hospital_id": "uuid",
  "communication_tone": "Empathic",
  "communication_style": "Conversational",
  "confidence_level": "Confident",
  "response_length": "Adaptive",
  "is_active": true
}
```

#### Delete Behavior

```http
DELETE /api/knowledgebase/behaviors/{id}/
```

### Behavior Actions

#### Activate Behavior

```http
POST /api/knowledgebase/behaviors/{id}/activate/
```

**Response:**

```json
{
  "message": "Behavior activated successfully",
  "is_active": true
}
```

#### Deactivate Behavior

```http
POST /api/knowledgebase/behaviors/{id}/deactivate/
```

**Response:**

```json
{
  "message": "Behavior deactivated successfully",
  "is_active": false
}
```

#### Get Behaviors by Hospital

```http
GET /api/knowledgebase/behaviors/by_hospital/
```

**Response:**

```json
[
  {
    "hospital_id": "uuid",
    "hospital_name": "MedCor General Hospital",
    "behaviors": [
      {
        "id": "uuid",
        "hospital_name": "MedCor General Hospital",
        "communication_tone": "Professional",
        "communication_style": "Technical & Clinical",
        "confidence_level": "Balanced",
        "response_length": "Medium",
        "is_active": true,
        "created_at": "2025-01-11T10:00:00Z",
        "updated_at": "2025-01-11T10:00:00Z"
      }
    ]
  }
]
```

#### Get Active Behaviors

```http
GET /api/knowledgebase/behaviors/active/
```

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
      "communication_tone": "Professional",
      "communication_style": "Technical & Clinical",
      "confidence_level": "Balanced",
      "response_length": "Medium",
      "is_active": true,
      "created_at": "2025-01-11T10:00:00Z",
      "updated_at": "2025-01-11T10:00:00Z"
    }
  ]
}
```

#### Get Behaviors by Communication Tone

```http
GET /api/knowledgebase/behaviors/by_communication_tone/
```

**Response:**

```json
[
  {
    "communication_tone": "Professional",
    "behaviors": [
      {
        "id": "uuid",
        "hospital_name": "MedCor General Hospital",
        "communication_tone": "Professional",
        "communication_style": "Technical & Clinical",
        "confidence_level": "Balanced",
        "response_length": "Medium",
        "is_active": true,
        "created_at": "2025-01-11T10:00:00Z",
        "updated_at": "2025-01-11T10:00:00Z"
      }
    ]
  }
]
```

### Statistics and Search

#### Get Behavior Statistics

```http
GET /api/knowledgebase/behavior-statistics/
```

**Response:**

```json
{
  "total_behaviors": 25,
  "active_behaviors": 20,
  "inactive_behaviors": 5,
  "hospital_stats": [
    {
      "hospital_name": "MedCor General Hospital",
      "total": 10,
      "active": 8,
      "inactive": 2
    },
    {
      "hospital_name": "City Medical Center",
      "total": 15,
      "active": 12,
      "inactive": 3
    }
  ],
  "tone_stats": {
    "Professional": 15,
    "Empathic": 8,
    "Friendly": 2
  }
}
```

#### Search Behaviors

```http
GET /api/knowledgebase/behavior-search/
```

**Query Parameters:**

- `query` - Search term (searches in all behavior fields)
- `hospital` - Filter by hospital ID
- `is_active` - Filter by active status (true/false)
- `communication_tone` - Filter by communication tone
- `communication_style` - Filter by communication style
- `confidence_level` - Filter by confidence level
- `response_length` - Filter by response length

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
      "communication_tone": "Professional",
      "communication_style": "Technical & Clinical",
      "confidence_level": "Balanced",
      "response_length": "Medium",
      "is_active": true,
      "created_at": "2025-01-11T10:00:00Z",
      "updated_at": "2025-01-11T10:00:00Z"
    }
  ]
}
```

## Choice Field Options

### Communication Tone Options

- **Empathic** - Shows understanding and compassion
- **Authoritative** - Confident and directive
- **Casual** - Relaxed and informal
- **Friendly** - Warm and approachable
- **Professional** - Formal and business-like

### Communication Style Options

- **Conversational** - Natural dialogue style
- **Technical & Clinical** - Medical terminology and precision
- **Detailed & Thorough** - Comprehensive explanations
- **Concise & Direct** - Brief and to the point

### Confidence Level Options

- **Conservative** - Cautious and careful
- **Balanced** - Moderate confidence
- **Confident** - Assured and decisive

### Response Length Options

- **Short** - Brief responses
- **Medium** - Moderate length
- **Long** - Detailed responses
- **Adaptive** - Adjusts based on context

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
    "next": "http://localhost:8002/api/knowledgebase/behaviors/?page=3",
    "previous": "http://localhost:8002/api/knowledgebase/behaviors/?page=1",
    "results": [...]
}
```

## Filtering and Search

### Text Search

- `search` parameter searches in all behavior fields
- Case-insensitive partial matching

### Field Filtering

- Use query parameters to filter by specific fields
- Multiple choice fields can be filtered

### Ordering

- `ordering` parameter controls result ordering
- Prefix with `-` for descending order
- Available fields: `created_at`, `updated_at`, `communication_tone`, `communication_style`

## Multi-Tenant Support

The Behavior system supports multi-tenant architecture:

- **Hospital Isolation**: Behaviors are filtered by hospital context
- **User Permissions**: Role-based access control
- **Data Segregation**: Each hospital sees only their own behaviors

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

### Creating a Behavior

```bash
# 1. Get authentication token
curl -X POST http://localhost:8002/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@medcor.ai", "password": "admin123"}'

# 2. Create Behavior
curl -X POST http://localhost:8002/api/knowledgebase/behaviors/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "hospital_id": "hospital-uuid",
    "communication_tone": "Professional",
    "communication_style": "Technical & Clinical",
    "confidence_level": "Balanced",
    "response_length": "Medium",
    "is_active": true
  }'
```

### Searching Behaviors

```bash
curl -X GET "http://localhost:8002/api/knowledgebase/behavior-search/?communication_tone=Professional&is_active=true" \
  -H "Authorization: Bearer <token>"
```

### Getting Statistics

```bash
curl -X GET http://localhost:8002/api/knowledgebase/behavior-statistics/ \
  -H "Authorization: Bearer <token>"
```

## Use Cases

### Medical AI Assistant Configuration

- **Professional + Technical & Clinical + Balanced + Medium**: For formal medical consultations
- **Empathic + Conversational + Conservative + Long**: For patient counseling
- **Friendly + Conversational + Confident + Short**: For quick patient interactions

### Emergency Response AI

- **Authoritative + Concise & Direct + Confident + Short**: For urgent medical situations
- **Professional + Technical & Clinical + Balanced + Adaptive**: For complex medical procedures

### Patient Support AI

- **Empathic + Detailed & Thorough + Conservative + Long**: For patient education
- **Friendly + Conversational + Balanced + Medium**: For general patient inquiries

## Support

For API support and questions:

- **Email**: support@medcor.ai
- **Documentation**: [API Documentation](http://localhost:8002/api/docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/medcor_backend2/issues)
