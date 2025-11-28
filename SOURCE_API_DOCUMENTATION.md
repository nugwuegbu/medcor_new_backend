# Source API Documentation

## Overview

The Source API provides endpoints for managing source files per hospital in the MedCor healthcare platform. This system allows hospitals to upload and manage knowledge base source files such as documents, PDFs, images, and other resources that can be used for AI training and knowledge base population.

## Base URL

- **Development**: `http://localhost:8002/api/knowledgebase/`
- **Production**: `https://api.medcor.ai/api/knowledgebase/`

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Source Model

The Source model represents source files for a specific hospital:

### Fields

- `id` - UUID primary key
- `hospital` - Foreign key to Hospital model
- `source_file` - FileField - Source file for knowledge base (uploaded to `knowledgebase/sources/%Y/%m/%d/`)
- `is_active` - BooleanField - Whether the source file is active
- `created_at` - DateTimeField - Creation timestamp
- `updated_at` - DateTimeField - Last update timestamp

### File Upload

Files are uploaded to the `knowledgebase/sources/` directory with date-based subdirectories:

- Format: `knowledgebase/sources/YYYY/MM/DD/`
- Example: `knowledgebase/sources/2025/01/11/document.pdf`

## API Endpoints

### Sources

#### List Sources

```http
GET /api/knowledgebase/sources/
```

**Query Parameters:**

- `is_active` - Filter by active status (true/false)
- `hospital` - Filter by hospital ID
- `search` - Search in file names
- `ordering` - Order by field (created_at, updated_at, source_file\_\_name)
- `page` - Page number
- `page_size` - Items per page (max 100)

**Response:**

```json
{
  "count": 10,
  "next": "http://localhost:8002/api/knowledgebase/sources/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "hospital_name": "MedCor General Hospital",
      "file_name": "medical_guidelines.pdf",
      "file_size": 2048576,
      "file_url": "http://localhost:8002/media/knowledgebase/sources/2025/01/11/medical_guidelines.pdf",
      "is_active": true,
      "created_at": "2025-01-11T10:00:00Z",
      "updated_at": "2025-01-11T10:00:00Z"
    }
  ]
}
```

#### Get Source Details

```http
GET /api/knowledgebase/sources/{id}/
```

**Response:**

```json
{
  "id": "uuid",
  "hospital": "uuid",
  "hospital_name": "MedCor General Hospital",
  "hospital_address": "123 Medical Street",
  "source_file": "knowledgebase/sources/2025/01/11/medical_guidelines.pdf",
  "file_name": "medical_guidelines.pdf",
  "file_size": 2048576,
  "file_url": "http://localhost:8002/media/knowledgebase/sources/2025/01/11/medical_guidelines.pdf",
  "is_active": true,
  "created_at": "2025-01-11T10:00:00Z",
  "updated_at": "2025-01-11T10:00:00Z"
}
```

#### Create Source

```http
POST /api/knowledgebase/sources/
```

**Request Body (multipart/form-data):**

```
hospital_id: uuid
source_file: [file]
is_active: true
```

**Response:**

```json
{
  "id": "uuid",
  "hospital": "uuid",
  "hospital_name": "MedCor General Hospital",
  "hospital_address": "123 Medical Street",
  "source_file": "knowledgebase/sources/2025/01/11/medical_guidelines.pdf",
  "file_name": "medical_guidelines.pdf",
  "file_size": 2048576,
  "file_url": "http://localhost:8002/media/knowledgebase/sources/2025/01/11/medical_guidelines.pdf",
  "is_active": true,
  "created_at": "2025-01-11T10:00:00Z",
  "updated_at": "2025-01-11T10:00:00Z"
}
```

#### Update Source

```http
PUT /api/knowledgebase/sources/{id}/
PATCH /api/knowledgebase/sources/{id}/
```

**Request Body (multipart/form-data):**

```
hospital_id: uuid
source_file: [file] (optional)
is_active: true
```

#### Delete Source

```http
DELETE /api/knowledgebase/sources/{id}/
```

### Source Actions

#### Activate Source

```http
POST /api/knowledgebase/sources/{id}/activate/
```

**Response:**

```json
{
  "message": "Source activated successfully",
  "is_active": true
}
```

#### Deactivate Source

```http
POST /api/knowledgebase/sources/{id}/deactivate/
```

**Response:**

```json
{
  "message": "Source deactivated successfully",
  "is_active": false
}
```

#### Get Sources by Hospital

```http
GET /api/knowledgebase/sources/by_hospital/
```

**Response:**

```json
[
  {
    "hospital_id": "uuid",
    "hospital_name": "MedCor General Hospital",
    "sources": [
      {
        "id": "uuid",
        "hospital_name": "MedCor General Hospital",
        "file_name": "medical_guidelines.pdf",
        "file_size": 2048576,
        "file_url": "http://localhost:8002/media/knowledgebase/sources/2025/01/11/medical_guidelines.pdf",
        "is_active": true,
        "created_at": "2025-01-11T10:00:00Z",
        "updated_at": "2025-01-11T10:00:00Z"
      }
    ]
  }
]
```

#### Get Active Sources

```http
GET /api/knowledgebase/sources/active/
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
      "file_name": "medical_guidelines.pdf",
      "file_size": 2048576,
      "file_url": "http://localhost:8002/media/knowledgebase/sources/2025/01/11/medical_guidelines.pdf",
      "is_active": true,
      "created_at": "2025-01-11T10:00:00Z",
      "updated_at": "2025-01-11T10:00:00Z"
    }
  ]
}
```

#### Download Source File

```http
GET /api/knowledgebase/sources/{id}/download/
```

**Response:**

- **Success**: File download with appropriate headers
- **Error**: JSON error response

**Error Response:**

```json
{
  "error": "No file available for download"
}
```

### Statistics and Search

#### Get Source Statistics

```http
GET /api/knowledgebase/source-statistics/
```

**Response:**

```json
{
  "total_sources": 25,
  "active_sources": 20,
  "inactive_sources": 5,
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

#### Search Sources

```http
GET /api/knowledgebase/source-search/
```

**Query Parameters:**

- `query` - Search term (searches in file names)
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
      "file_name": "medical_guidelines.pdf",
      "file_size": 2048576,
      "file_url": "http://localhost:8002/media/knowledgebase/sources/2025/01/11/medical_guidelines.pdf",
      "is_active": true,
      "created_at": "2025-01-11T10:00:00Z",
      "updated_at": "2025-01-11T10:00:00Z"
    }
  ]
}
```

## File Upload Guidelines

### Supported File Types

- **Documents**: PDF, DOC, DOCX, TXT, RTF
- **Images**: JPG, JPEG, PNG, GIF, BMP, TIFF
- **Spreadsheets**: XLS, XLSX, CSV
- **Presentations**: PPT, PPTX
- **Other**: ZIP, RAR, 7Z

### File Size Limits

- **Maximum file size**: 100MB per file
- **Recommended size**: Under 10MB for optimal performance
- **Total storage per hospital**: 1GB (configurable)

### File Naming

- Use descriptive, meaningful names
- Avoid special characters and spaces
- Use underscores or hyphens instead of spaces
- Include version numbers if applicable

### Examples

- `medical_guidelines_v2.pdf`
- `patient_consent_form.docx`
- `hospital_policies_2025.pdf`
- `emergency_protocols.pdf`

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `413` - File Too Large
- `415` - Unsupported Media Type
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
    "next": "http://localhost:8002/api/knowledgebase/sources/?page=3",
    "previous": "http://localhost:8002/api/knowledgebase/sources/?page=1",
    "results": [...]
}
```

## Filtering and Search

### Text Search

- `search` parameter searches in file names
- Case-insensitive partial matching

### Field Filtering

- Use query parameters to filter by specific fields
- Multiple fields can be filtered simultaneously

### Ordering

- `ordering` parameter controls result ordering
- Prefix with `-` for descending order
- Available fields: `created_at`, `updated_at`, `source_file__name`

## Multi-Tenant Support

The Source system supports multi-tenant architecture:

- **Hospital Isolation**: Sources are filtered by hospital context
- **User Permissions**: Role-based access control
- **Data Segregation**: Each hospital sees only their own sources

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **File Upload**: 10 requests per minute per user
- **Download**: 50 requests per minute per user
- **Read**: 200 requests per minute per user

## Swagger Documentation

Interactive API documentation is available at:

- **Swagger UI**: `http://localhost:8002/api/docs/`
- **ReDoc**: `http://localhost:8002/api/redoc/`
- **OpenAPI Schema**: `http://localhost:8002/api/schema/`

## Examples

### Uploading a Source File

```bash
# 1. Get authentication token
curl -X POST http://localhost:8002/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@medcor.ai", "password": "admin123"}'

# 2. Upload file
curl -X POST http://localhost:8002/api/knowledgebase/sources/ \
  -H "Authorization: Bearer <token>" \
  -F "hospital_id=hospital-uuid" \
  -F "source_file=@medical_guidelines.pdf" \
  -F "is_active=true"
```

### Downloading a Source File

```bash
# Download file
curl -X GET http://localhost:8002/api/knowledgebase/sources/{id}/download/ \
  -H "Authorization: Bearer <token>" \
  -o downloaded_file.pdf
```

### Searching Sources

```bash
curl -X GET "http://localhost:8002/api/knowledgebase/source-search/?query=medical&is_active=true" \
  -H "Authorization: Bearer <token>"
```

### Getting Statistics

```bash
curl -X GET http://localhost:8002/api/knowledgebase/source-statistics/ \
  -H "Authorization: Bearer <token>"
```

## Use Cases

### Knowledge Base Population

- **Medical Guidelines**: Upload hospital-specific medical protocols
- **Training Materials**: Add educational resources for staff
- **Policy Documents**: Store hospital policies and procedures
- **Reference Materials**: Include medical references and textbooks

### AI Training Data

- **Document Processing**: Upload documents for AI analysis
- **Image Recognition**: Add medical images for AI training
- **Text Extraction**: Provide source materials for knowledge extraction
- **Data Augmentation**: Enhance AI models with hospital-specific data

### Document Management

- **Version Control**: Track different versions of documents
- **Access Control**: Manage who can access which files
- **Audit Trail**: Keep track of file uploads and modifications
- **Backup and Recovery**: Ensure important documents are preserved

## Security Considerations

### File Validation

- **File Type Checking**: Validate file extensions and MIME types
- **Virus Scanning**: Scan uploaded files for malware
- **Size Limits**: Enforce file size restrictions
- **Content Validation**: Check file content for appropriateness

### Access Control

- **Hospital Isolation**: Ensure files are only accessible by authorized hospital users
- **Role-based Permissions**: Different access levels for different user types
- **Audit Logging**: Log all file access and modifications
- **Secure Storage**: Store files in secure, encrypted storage

### Data Protection

- **Encryption**: Encrypt files at rest and in transit
- **Backup**: Regular backups of important files
- **Retention Policies**: Implement file retention and deletion policies
- **Compliance**: Ensure compliance with healthcare data regulations

## Support

For API support and questions:

- **Email**: support@medcor.ai
- **Documentation**: [API Documentation](http://localhost:8002/api/docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/medcor_backend2/issues)
