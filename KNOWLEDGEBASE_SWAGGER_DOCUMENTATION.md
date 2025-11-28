# Knowledgebase API Swagger Documentation

## Overview

The Knowledgebase API provides comprehensive endpoints for managing AI Identities, Behaviors, Response Templates, and Source Files in the MedCor healthcare platform. All endpoints are fully documented in Swagger with proper schemas, parameters, and response models.

## Swagger UI Access

- **Swagger UI**: `http://localhost:8002/api/docs/`
- **ReDoc**: `http://localhost:8002/api/redoc/`
- **OpenAPI Schema**: `http://localhost:8002/api/schema/`

## API Documentation Structure

### 1. AI Identities (`/api/knowledgebase/ai-identities/`) - Knowledge Base

#### **ViewSet Endpoints**

- `GET /api/knowledgebase/ai-identities/` - List AI Identities
- `POST /api/knowledgebase/ai-identities/` - Create AI Identity
- `GET /api/knowledgebase/ai-identities/{id}/` - Get AI Identity Details
- `PUT /api/knowledgebase/ai-identities/{id}/` - Update AI Identity
- `PATCH /api/knowledgebase/ai-identities/{id}/` - Partial Update AI Identity
- `DELETE /api/knowledgebase/ai-identities/{id}/` - Delete AI Identity

#### **Custom Actions**

- `POST /api/knowledgebase/ai-identities/{id}/activate/` - Activate AI Identity
- `POST /api/knowledgebase/ai-identities/{id}/deactivate/` - Deactivate AI Identity
- `GET /api/knowledgebase/ai-identities/active/` - Get Active AI Identities
- `GET /api/knowledgebase/ai-identities/by_hospital/` - Get AI Identities by Hospital

#### **Statistics & Search**

- `GET /api/knowledgebase/ai-statistics/` - Get AI Identity Statistics
- `GET /api/knowledgebase/ai-search/` - Search AI Identities

#### **Swagger Documentation Features**

- **Tags**: Knowledge Base
- **Parameters**: Query parameters for filtering, searching, and pagination
- **Response Models**: Detailed response schemas with proper field descriptions
- **Authentication**: JWT Bearer token required
- **Filtering**: By hospital, active status, search terms
- **Pagination**: Page-based pagination with configurable page size

### 2. Behaviors (`/api/knowledgebase/behaviors/`)

#### **ViewSet Endpoints**

- `GET /api/knowledgebase/behaviors/` - List Behaviors
- `POST /api/knowledgebase/behaviors/` - Create Behavior
- `GET /api/knowledgebase/behaviors/{id}/` - Get Behavior Details
- `PUT /api/knowledgebase/behaviors/{id}/` - Update Behavior
- `PATCH /api/knowledgebase/behaviors/{id}/` - Partial Update Behavior
- `DELETE /api/knowledgebase/behaviors/{id}/` - Delete Behavior

#### **Custom Actions**

- `POST /api/knowledgebase/behaviors/{id}/activate/` - Activate Behavior
- `POST /api/knowledgebase/behaviors/{id}/deactivate/` - Deactivate Behavior
- `GET /api/knowledgebase/behaviors/active/` - Get Active Behaviors
- `GET /api/knowledgebase/behaviors/by_hospital/` - Get Behaviors by Hospital
- `GET /api/knowledgebase/behaviors/by_communication_tone/` - Get Behaviors by Communication Tone

#### **Statistics & Search**

- `GET /api/knowledgebase/behavior-statistics/` - Get Behavior Statistics
- `GET /api/knowledgebase/behavior-search/` - Search Behaviors

#### **Swagger Documentation Features**

- **Tags**: Behaviors
- **Advanced Filtering**: By communication tone, style, confidence level, response length
- **Search Parameters**: Multiple search fields with detailed descriptions
- **Response Models**: Comprehensive behavior data with hospital context
- **Statistics**: Detailed statistics including tone distribution

### 3. Response Templates (`/api/knowledgebase/responses/`)

#### **ViewSet Endpoints**

- `GET /api/knowledgebase/responses/` - List Response Templates
- `POST /api/knowledgebase/responses/` - Create Response Template
- `GET /api/knowledgebase/responses/{id}/` - Get Response Template Details
- `PUT /api/knowledgebase/responses/{id}/` - Update Response Template
- `PATCH /api/knowledgebase/responses/{id}/` - Partial Update Response Template
- `DELETE /api/knowledgebase/responses/{id}/` - Delete Response Template

#### **Custom Actions**

- `POST /api/knowledgebase/responses/{id}/activate/` - Activate Response Template
- `POST /api/knowledgebase/responses/{id}/deactivate/` - Deactivate Response Template
- `GET /api/knowledgebase/responses/active/` - Get Active Response Templates
- `GET /api/knowledgebase/responses/by_hospital/` - Get Response Templates by Hospital
- `GET /api/knowledgebase/responses/templates/` - Get Response Templates
- `GET /api/knowledgebase/responses/{id}/get_template/` - Get Specific Template

#### **Statistics & Search**

- `GET /api/knowledgebase/response-statistics/` - Get Response Statistics
- `GET /api/knowledgebase/response-search/` - Search Response Templates

#### **Swagger Documentation Features**

- **Tags**: Responses
- **Template Types**: Support for multiple response template types
- **Content Search**: Search across all response content fields
- **Hospital Context**: Hospital-specific response templates
- **Template Management**: Comprehensive template CRUD operations

### 4. Knowledge Base Sources (`/api/knowledgebase/sources/`)

#### **ViewSet Endpoints**

- `GET /api/knowledgebase/sources/` – Paginated list of sources (filterable by `hospital_id`, `is_active`, search by hospital name)
- `POST /api/knowledgebase/sources/` – Create a source for a hospital (requires `hospital_id`)
- `GET /api/knowledgebase/sources/{id}/` – Retrieve source details with embedded file metadata
- `PUT /api/knowledgebase/sources/{id}/` – Replace source attributes (e.g. toggle `is_active`)
- `PATCH /api/knowledgebase/sources/{id}/` – Partial updates
- `DELETE /api/knowledgebase/sources/{id}/` – Remove a source and its associated files

#### **Swagger Documentation Features**

- **Tag**: `Knowledge Base - Sources`
- **Query Parameters**: `hospital_id`, `is_active`, `search`, ordering support
- **Permissions**: Only superusers or hospital-bound users may manage their own sources
- **Nested Data**: Response includes `source_files` array with file metadata

### 5. Knowledge Base Source Files (`/api/knowledgebase/source-files/`)

#### **ViewSet Endpoints**

- `GET /api/knowledgebase/source-files/` – Paginated list of source files (filterable by `source_id`, `hospital_id`, `file_type`, `is_active`, search by file name)
- `POST /api/knowledgebase/source-files/` – Upload a file via `multipart/form-data` (fields: `source_id`, `file`, optional `is_active`)
- `GET /api/knowledgebase/source-files/{id}/` – Retrieve metadata for a single file
- `PUT /api/knowledgebase/source-files/{id}/` – Replace file metadata (file upload optional)
- `PATCH /api/knowledgebase/source-files/{id}/` – Partial updates (e.g. toggle `is_active`)
- `DELETE /api/knowledgebase/source-files/{id}/` – Remove a file from a source

#### **Swagger Documentation Features**

- **Tag**: `Knowledge Base - Source Files`
- **Upload Schema**: Multipart request body documented with drf-spectacular
- **Security**: File actions restricted to superusers or the owning hospital
- **Metadata**: File responses include size, type, timestamps, and activation state

## Swagger Documentation Enhancements

### 1. **Response Serializers**

All endpoints now have proper response serializers:

- `AIIdentityStatisticsSerializer` - For AI Identity statistics
- `BehaviorStatisticsSerializer` - For Behavior statistics
- `ResponseStatisticsSerializer` - For Response statistics
- `SourceStatisticsSerializer` - For Source statistics

### 2. **Parameter Documentation**

Detailed parameter documentation with:

- **Type Information**: Proper OpenAPI types (STR, UUID, BOOL)
- **Location**: Query parameters, path parameters, request body
- **Descriptions**: Clear descriptions for each parameter
- **Required/Optional**: Properly marked required fields

### 3. **Response Models**

Comprehensive response models including:

- **Success Responses**: Detailed success response schemas
- **Error Responses**: Proper error response documentation
- **Status Codes**: HTTP status codes with descriptions
- **Authentication**: JWT authentication requirements

### 4. **Tags and Organization**

Organized API documentation with:

- **Logical Grouping**: Endpoints grouped by functionality
- **Consistent Tagging**: All related endpoints use the same tags
- **Clear Descriptions**: Summary and detailed descriptions
- **Operation IDs**: Unique operation identifiers

### 5. **Filtering and Search**

Advanced filtering capabilities documented:

- **Search Fields**: Multiple searchable fields per endpoint
- **Filter Parameters**: Hospital, active status, and custom filters
- **Ordering**: Sortable fields with ascending/descending options
- **Pagination**: Page-based pagination with configurable limits

## API Testing in Swagger UI

### 1. **Authentication**

1. Navigate to `http://localhost:8002/api/docs/`
2. Click "Authorize" button
3. Enter JWT token: `Bearer <your-jwt-token>`
4. Click "Authorize"

### 2. **Testing Endpoints**

1. **List Endpoints**: Use GET endpoints to retrieve data
2. **Create Endpoints**: Use POST endpoints with request body
3. **Update Endpoints**: Use PUT/PATCH endpoints for modifications
4. **Custom Actions**: Use custom action endpoints for specific operations

### 3. **Parameter Testing**

1. **Query Parameters**: Add parameters in the "Parameters" section
2. **Request Body**: Use the request body editor for POST/PUT requests
3. **File Upload**: Use the file upload interface for Source endpoints

### 4. **Response Analysis**

1. **Response Schema**: View detailed response structure
2. **Example Responses**: See example responses for each endpoint
3. **Error Handling**: Understand error response formats

## Swagger Schema Features

### 1. **OpenAPI 3.0 Compliance**

- Full OpenAPI 3.0 specification compliance
- Proper schema definitions and references
- Consistent naming conventions

### 2. **Django REST Framework Integration**

- Automatic schema generation from DRF serializers
- Proper handling of DRF-specific features
- Pagination and filtering integration

### 3. **Multi-tenant Support**

- Hospital-specific filtering documentation
- Permission-based access control
- User context awareness

### 4. **File Upload Support**

- Multipart form data handling
- File validation and metadata
- Secure file download documentation

## Common Swagger Patterns

### 1. **List Endpoints**

```yaml
get:
  summary: List [Resource]
  description: Retrieve a paginated list of [Resource] objects
  parameters:
    - name: page
      in: query
      schema:
        type: integer
        default: 1
    - name: page_size
      in: query
      schema:
        type: integer
        default: 20
        maximum: 100
  responses:
    200:
      description: Successful response
      content:
        application/json:
          schema:
            type: object
            properties:
              count:
                type: integer
              next:
                type: string
                nullable: true
              previous:
                type: string
                nullable: true
              results:
                type: array
                items:
                  $ref: "#/components/schemas/[Resource]Serializer"
```

### 2. **Create Endpoints**

```yaml
post:
  summary: Create [Resource]
  description: Create a new [Resource] object
  requestBody:
    required: true
    content:
      application/json:
        schema:
          $ref: "#/components/schemas/[Resource]Serializer"
  responses:
    201:
      description: Created successfully
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/[Resource]Serializer"
    400:
      description: Bad Request
    401:
      description: Authentication required
```

### 3. **Custom Actions**

```yaml
post:
  summary: Activate [Resource]
  description: Activate a [Resource] object
  parameters:
    - name: id
      in: path
      required: true
      schema:
        type: string
        format: uuid
  responses:
    200:
      description: Successfully activated
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string
              is_active:
                type: boolean
```

## Error Handling Documentation

### 1. **Standard Error Responses**

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

### 2. **Error Response Format**

```json
{
  "error": "Error message",
  "details": "Additional error details",
  "field_errors": {
    "field_name": ["Field-specific error message"]
  }
}
```

### 3. **Validation Errors**

- Field-level validation errors
- Required field errors
- Data type validation errors
- Custom validation rule errors

## Best Practices for Swagger Documentation

### 1. **Consistent Naming**

- Use consistent naming conventions
- Follow RESTful API patterns
- Use clear, descriptive names

### 2. **Comprehensive Descriptions**

- Provide clear summaries and descriptions
- Include parameter descriptions
- Document response schemas thoroughly

### 3. **Proper Tagging**

- Group related endpoints logically
- Use consistent tag names
- Organize by functionality

### 4. **Example Usage**

- Provide example requests and responses
- Include realistic data examples
- Show different scenarios

### 5. **Security Documentation**

- Document authentication requirements
- Explain permission levels
- Show security considerations

## Troubleshooting Swagger Issues

### 1. **Common Issues**

- **Authentication Errors**: Ensure JWT token is valid
- **Permission Errors**: Check user permissions
- **Validation Errors**: Verify request data format
- **File Upload Issues**: Check file size and type limits

### 2. **Debugging Steps**

1. Check server logs for errors
2. Verify request format matches schema
3. Ensure all required fields are provided
4. Check authentication token validity

### 3. **Support Resources**

- **API Documentation**: `http://localhost:8002/api/docs/`
- **ReDoc**: `http://localhost:8002/api/redoc/`
- **OpenAPI Schema**: `http://localhost:8002/api/schema/`

## Conclusion

The Knowledgebase API is now fully documented in Swagger with comprehensive schemas, detailed parameter descriptions, and proper response models. All endpoints are organized logically with consistent tagging and clear documentation that makes it easy for developers to understand and use the API effectively.

The Swagger documentation includes:

- ✅ **Complete API Coverage**: All 4 main resource types documented
- ✅ **Proper Schemas**: Detailed request/response models
- ✅ **Parameter Documentation**: Clear parameter descriptions
- ✅ **Error Handling**: Comprehensive error response documentation
- ✅ **Authentication**: JWT authentication requirements
- ✅ **Filtering & Search**: Advanced filtering capabilities
- ✅ **File Upload**: Multipart form data support
- ✅ **Custom Actions**: Specialized endpoint documentation
- ✅ **Statistics**: Analytics endpoint documentation
- ✅ **Multi-tenant**: Hospital-specific filtering support

The API is now ready for production use with excellent developer experience through comprehensive Swagger documentation.
