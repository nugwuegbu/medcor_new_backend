# AI Identity API Documentation

## Overview

The AI Identity API provides endpoints for managing AI agent identities per hospital in the MedCor healthcare platform. This system supports multi-tenant architecture with hospital-specific AI agent management.

## Base URL

- **Development**: `http://localhost:8002/api/knowledgebase/`
- **Production**: `https://api.medcor.ai/api/knowledgebase/`

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## AI Identity Model

The AI Identity model represents an AI agent configuration for a specific hospital:

### Fields

- `id` - UUID primary key
- `hospital` - Foreign key to Hospital model
- `agent_name` - CharField (max 100 characters) - Name of the AI agent
- `agent_title` - CharField (max 200 characters) - Title/role of the AI agent
- `system_prompt` - TextField - System prompt for the AI agent
- `is_active` - BooleanField - Whether the AI identity is active
- `created_at` - DateTimeField - Creation timestamp
- `updated_at` - DateTimeField - Last update timestamp

## API Endpoints

### AI Identities

#### List AI Identities

```http
GET /api/knowledgebase/ai-identities/
```

**Query Parameters:**

- `is_active` - Filter by active status (true/false)
- `hospital` - Filter by hospital ID
- `search` - Search in agent_name, agent_title, and system_prompt
- `ordering` - Order by field (created_at, updated_at, agent_name)
- `page` - Page number
- `page_size` - Items per page (max 100)

**Response:**

```json
{
  "count": 10,
  "next": "http://localhost:8002/api/knowledgebase/ai-identities/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "hospital_name": "MedCor General Hospital",
      "agent_name": "Dr. AI Assistant",
      "agent_title": "Medical AI Assistant",
      "is_active": true,
      "created_at": "2025-01-11T10:00:00Z",
      "updated_at": "2025-01-11T10:00:00Z"
    }
  ]
}
```

#### Get AI Identity Details

```http
GET /api/knowledgebase/ai-identities/{id}/
```

**Response:**

```json
{
  "id": "uuid",
  "hospital": "uuid",
  "hospital_name": "MedCor General Hospital",
  "hospital_address": "123 Medical Street",
  "agent_name": "Dr. AI Assistant",
  "agent_title": "Medical AI Assistant",
  "system_prompt": "You are a medical AI assistant specialized in...",
  "is_active": true,
  "created_at": "2025-01-11T10:00:00Z",
  "updated_at": "2025-01-11T10:00:00Z"
}
```

#### Create AI Identity

```http
POST /api/knowledgebase/ai-identities/
```

**Request Body:**

```json
{
  "hospital_id": "uuid",
  "agent_name": "Dr. AI Assistant",
  "agent_title": "Medical AI Assistant",
  "system_prompt": "You are a medical AI assistant specialized in cardiology...",
  "is_active": true
}
```

#### Update AI Identity

```http
PUT /api/knowledgebase/ai-identities/{id}/
PATCH /api/knowledgebase/ai-identities/{id}/
```

**Request Body:**

```json
{
  "hospital_id": "uuid",
  "agent_name": "Dr. AI Assistant Updated",
  "agent_title": "Senior Medical AI Assistant",
  "system_prompt": "Updated system prompt...",
  "is_active": true
}
```

#### Delete AI Identity

```http
DELETE /api/knowledgebase/ai-identities/{id}/
```

### AI Identity Actions

#### Activate AI Identity

```http
POST /api/knowledgebase/ai-identities/{id}/activate/
```

**Response:**

```json
{
  "message": "AI Identity activated successfully",
  "is_active": true
}
```

#### Deactivate AI Identity

```http
POST /api/knowledgebase/ai-identities/{id}/deactivate/
```

**Response:**

```json
{
  "message": "AI Identity deactivated successfully",
  "is_active": false
}
```

#### Get AI Identities by Hospital

```http
GET /api/knowledgebase/ai-identities/by_hospital/
```

**Response:**

```json
[
  {
    "hospital_id": "uuid",
    "hospital_name": "MedCor General Hospital",
    "ai_identities": [
      {
        "id": "uuid",
        "hospital_name": "MedCor General Hospital",
        "agent_name": "Dr. AI Assistant",
        "agent_title": "Medical AI Assistant",
        "is_active": true,
        "created_at": "2025-01-11T10:00:00Z",
        "updated_at": "2025-01-11T10:00:00Z"
      }
    ]
  }
]
```

#### Get Active AI Identities

```http
GET /api/knowledgebase/ai-identities/active/
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
      "agent_name": "Dr. AI Assistant",
      "agent_title": "Medical AI Assistant",
      "is_active": true,
      "created_at": "2025-01-11T10:00:00Z",
      "updated_at": "2025-01-11T10:00:00Z"
    }
  ]
}
```

### Statistics and Search

#### Get AI Identity Statistics

```http
GET /api/knowledgebase/statistics/
```

**Response:**

```json
{
  "total_identities": 25,
  "active_identities": 20,
  "inactive_identities": 5,
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
  ]
}
```

#### Search AI Identities

```http
GET /api/knowledgebase/search/
```

**Query Parameters:**

- `query` - Search term (searches in agent_name, agent_title, system_prompt)
- `hospital` - Filter by hospital ID
- `is_active` - Filter by active status (true/false)

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
      "agent_name": "Dr. AI Assistant",
      "agent_title": "Medical AI Assistant",
      "is_active": true,
      "created_at": "2025-01-11T10:00:00Z",
      "updated_at": "2025-01-11T10:00:00Z"
    }
  ]
}
```

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
    "next": "http://localhost:8002/api/knowledgebase/ai-identities/?page=3",
    "previous": "http://localhost:8002/api/knowledgebase/ai-identities/?page=1",
    "results": [...]
}
```

## Filtering and Search

### Text Search

- `search` parameter searches in agent_name, agent_title, and system_prompt
- Case-insensitive partial matching

### Field Filtering

- Use query parameters to filter by specific fields
- `is_active` - Filter by active status
- `hospital` - Filter by hospital ID

### Ordering

- `ordering` parameter controls result ordering
- Prefix with `-` for descending order
- Available fields: `created_at`, `updated_at`, `agent_name`

## Multi-Tenant Support

The AI Identity system supports multi-tenant architecture:

- **Hospital Isolation**: AI identities are filtered by hospital context
- **User Permissions**: Role-based access control
- **Data Segregation**: Each hospital sees only their own AI identities

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

### Creating an AI Identity

```bash
# 1. Get authentication token
curl -X POST http://localhost:8002/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@medcor.ai", "password": "admin123"}'

# 2. Create AI Identity
curl -X POST http://localhost:8002/api/knowledgebase/ai-identities/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "hospital_id": "hospital-uuid",
    "agent_name": "Dr. AI Assistant",
    "agent_title": "Medical AI Assistant",
    "system_prompt": "You are a medical AI assistant specialized in cardiology...",
    "is_active": true
  }'
```

### Searching AI Identities

```bash
curl -X GET "http://localhost:8002/api/knowledgebase/search/?query=medical&is_active=true" \
  -H "Authorization: Bearer <token>"
```

### Getting Statistics

```bash
curl -X GET http://localhost:8002/api/knowledgebase/statistics/ \
  -H "Authorization: Bearer <token>"
```

## Support

For API support and questions:

- **Email**: support@medcor.ai
- **Documentation**: [API Documentation](http://localhost:8002/api/docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/medcor_backend2/issues)
