# Treatment API Documentation

## Overview
The Treatment API provides comprehensive CRUD operations for managing medical treatments with multi-tenant support, advanced filtering, and rich text descriptions.

## API Endpoints

### Base URL: `/api/treatments/`

### 1. List & Create Treatments
**Endpoint:** `GET|POST /api/treatments/`

**GET - List Treatments:**
- **Description:** Retrieve a paginated list of treatments with filtering and search
- **Authentication:** Required
- **Query Parameters:**
  - `tenant`: Filter by tenant ID
  - `is_active`: Filter by active status (true/false)
  - `search`: Search in name and description
  - `ordering`: Sort by fields (name, cost, created_at)
- **Response:** Array of treatment objects (simplified format)

**POST - Create Treatment:**
- **Description:** Create a new treatment
- **Authentication:** Required
- **Request Body:**
```json
{
  "tenant": 1,
  "name": "Dental Cleaning",
  "image": "file_upload",
  "description": "<p>Professional dental cleaning service</p>",
  "cost": 150.00,
  "is_active": true
}
```

### 2. Treatment Details
**Endpoint:** `GET|PUT|PATCH|DELETE /api/treatments/{id}/`

**GET - Retrieve Treatment:**
- **Description:** Get detailed treatment information
- **Authentication:** Required
- **Response:** Complete treatment object with tenant info

**PUT/PATCH - Update Treatment:**
- **Description:** Update treatment information
- **Authentication:** Required
- **Request Body:** Same as create (excluding tenant)

**DELETE - Delete Treatment:**
- **Description:** Delete a treatment
- **Authentication:** Required

### 3. Treatments by Tenant
**Endpoint:** `GET /api/treatments/tenant/{tenant_id}/`
- **Description:** List active treatments for a specific tenant
- **Authentication:** Required
- **Query Parameters:**
  - `search`: Search in name and description
  - `ordering`: Sort by fields

### 4. Advanced Search
**Endpoint:** `GET /api/treatments/search/`
- **Description:** Advanced search with multiple criteria
- **Authentication:** Required
- **Query Parameters:**
  - `q`: General search query
  - `min_cost`: Minimum cost filter
  - `max_cost`: Maximum cost filter
  - `tenant_id`: Filter by tenant
  - `is_active`: Filter by active status

### 5. Treatment Statistics
**Endpoint:** `GET /api/treatments/stats/`
- **Description:** Get treatment statistics and cost analysis
- **Authentication:** Required
- **Query Parameters:**
  - `tenant_id`: Filter stats by tenant
- **Response:**
```json
{
  "total_treatments": 25,
  "active_treatments": 20,
  "inactive_treatments": 5,
  "average_cost": 275.50,
  "min_cost": 50.00,
  "max_cost": 1200.00
}
```

## Data Models

### Treatment Object
```json
{
  "id": 1,
  "tenant": 1,
  "tenant_name": "MedCor Clinic",
  "name": "Dental Cleaning",
  "image": "/media/treatments/dental_cleaning.jpg",
  "description": "<p>Professional dental cleaning service</p>",
  "cost": 150.00,
  "is_active": true,
  "created_at": "2025-07-22T00:00:00Z",
  "updated_at": "2025-07-22T00:00:00Z"
}
```

## Authentication
All endpoints require authentication using JWT tokens or session authentication.

## Permissions
- Users can access treatments based on their tenant permissions
- Full CRUD operations available for authenticated users

## Validation Rules
- **Cost:** Must be greater than 0
- **Name:** Cannot be empty or whitespace only
- **Tenant:** Must be a valid tenant ID
- **Description:** Rich text field supporting HTML formatting

## Error Handling
The API returns standard HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Example Usage

### Create a Treatment
```bash
curl -X POST http://localhost:8000/api/treatments/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant": 1,
    "name": "Root Canal Treatment",
    "description": "<p>Comprehensive root canal therapy</p>",
    "cost": 800.00
  }'
```

### Search Treatments
```bash
curl "http://localhost:8000/api/treatments/search/?q=dental&min_cost=100&max_cost=500" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Treatment Statistics
```bash
curl "http://localhost:8000/api/treatments/stats/?tenant_id=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```