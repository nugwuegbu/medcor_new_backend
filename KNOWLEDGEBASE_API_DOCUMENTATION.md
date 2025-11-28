# Knowledge Base API Documentation

## Overview

The Knowledge Base API provides comprehensive endpoints for managing healthcare knowledge articles, categories, tags, comments, attachments, and feedback. This system supports multi-tenant architecture with hospital-specific content isolation.

## Base URL

- **Development**: `http://localhost:8002/api/knowledgebase/`
- **Production**: `https://api.medcor.ai/api/knowledgebase/`

## Authentication

All endpoints require JWT authentication unless specified otherwise. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Articles

#### List Articles

```http
GET /api/knowledgebase/articles/
```

**Query Parameters:**

- `status` - Filter by status (draft, published, archived)
- `priority` - Filter by priority (low, medium, high, urgent)
- `is_featured` - Filter featured articles (true/false)
- `is_pinned` - Filter pinned articles (true/false)
- `category` - Filter by category ID
- `hospital` - Filter by hospital ID
- `author` - Filter by author ID
- `search` - Search in title, content, excerpt, and tags
- `ordering` - Order by field (created_at, updated_at, published_at, view_count, like_count, title)
- `page` - Page number
- `page_size` - Items per page (max 100)

**Response:**

```json
{
  "count": 25,
  "next": "http://localhost:8002/api/knowledgebase/articles/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "title": "Article Title",
      "slug": "article-title",
      "excerpt": "Article excerpt...",
      "status": "published",
      "priority": "medium",
      "view_count": 150,
      "like_count": 25,
      "is_featured": true,
      "is_pinned": false,
      "created_at": "2025-01-11T10:00:00Z",
      "updated_at": "2025-01-11T10:00:00Z",
      "published_at": "2025-01-11T10:00:00Z",
      "author": "uuid",
      "author_name": "Dr. John Doe",
      "category": "uuid",
      "category_name": "Cardiology",
      "hospital": "uuid",
      "hospital_name": "MedCor General",
      "tags_list": ["heart", "surgery"],
      "comments_count": 5,
      "attachments_count": 2
    }
  ]
}
```

#### Get Article Details

```http
GET /api/knowledgebase/articles/{id}/
```

**Response:**

```json
{
    "id": "uuid",
    "title": "Article Title",
    "slug": "article-title",
    "content": "Full article content...",
    "excerpt": "Article excerpt...",
    "status": "published",
    "priority": "medium",
    "view_count": 150,
    "like_count": 25,
    "is_featured": true,
    "is_pinned": false,
    "allow_comments": true,
    "created_at": "2025-01-11T10:00:00Z",
    "updated_at": "2025-01-11T10:00:00Z",
    "published_at": "2025-01-11T10:00:00Z",
    "meta_title": "SEO Title",
    "meta_description": "SEO Description",
    "author": "uuid",
    "author_name": "Dr. John Doe",
    "author_email": "john@medcor.ai",
    "category": {
        "id": "uuid",
        "name": "Cardiology",
        "description": "Heart-related articles",
        "color": "#007bff",
        "icon": "heart",
        "is_active": true,
        "sort_order": 1,
        "articles_count": 15
    },
    "hospital": {
        "id": "uuid",
        "name": "MedCor General",
        "address": "123 Medical St"
    },
    "tags": [
        {
            "id": "uuid",
            "name": "heart",
            "description": "Heart-related content",
            "color": "#dc3545",
            "is_active": true,
            "articles_count": 8
        }
    ],
    "comments": [...],
    "attachments": [...],
    "feedback": [...],
    "comments_count": 5,
    "attachments_count": 2,
    "feedback_count": 3
}
```

#### Create Article

```http
POST /api/knowledgebase/articles/
```

**Request Body:**

```json
{
  "title": "New Article Title",
  "content": "Article content...",
  "excerpt": "Article excerpt...",
  "status": "draft",
  "priority": "medium",
  "is_featured": false,
  "is_pinned": false,
  "allow_comments": true,
  "meta_title": "SEO Title",
  "meta_description": "SEO Description",
  "category_id": "uuid",
  "hospital_id": "uuid",
  "tag_ids": ["uuid1", "uuid2"]
}
```

#### Update Article

```http
PUT /api/knowledgebase/articles/{id}/
PATCH /api/knowledgebase/articles/{id}/
```

#### Delete Article

```http
DELETE /api/knowledgebase/articles/{id}/
```

#### Article Actions

##### Like Article

```http
POST /api/knowledgebase/articles/{id}/like/
```

**Response:**

```json
{
  "liked": true,
  "like_count": 26
}
```

##### Increment View Count

```http
POST /api/knowledgebase/articles/{id}/view/
```

**Response:**

```json
{
  "view_count": 151
}
```

##### Get Article Comments

```http
GET /api/knowledgebase/articles/{id}/comments/
```

##### Get Article Attachments

```http
GET /api/knowledgebase/articles/{id}/attachments/
```

##### Get Article Feedback

```http
GET /api/knowledgebase/articles/{id}/feedback/
```

### Categories

#### List Categories

```http
GET /api/knowledgebase/categories/
```

#### Get Category Details

```http
GET /api/knowledgebase/categories/{id}/
```

#### Create Category

```http
POST /api/knowledgebase/categories/
```

**Request Body:**

```json
{
  "name": "Category Name",
  "description": "Category description",
  "color": "#007bff",
  "icon": "heart",
  "is_active": true,
  "sort_order": 1,
  "parent": "uuid"
}
```

#### Update Category

```http
PUT /api/knowledgebase/categories/{id}/
PATCH /api/knowledgebase/categories/{id}/
```

#### Delete Category

```http
DELETE /api/knowledgebase/categories/{id}/
```

#### Get Category Articles

```http
GET /api/knowledgebase/categories/{id}/articles/
```

### Tags

#### List Tags

```http
GET /api/knowledgebase/tags/
```

#### Get Tag Details

```http
GET /api/knowledgebase/tags/{id}/
```

#### Create Tag

```http
POST /api/knowledgebase/tags/
```

**Request Body:**

```json
{
  "name": "tag-name",
  "description": "Tag description",
  "color": "#6c757d",
  "is_active": true
}
```

#### Update Tag

```http
PUT /api/knowledgebase/tags/{id}/
PATCH /api/knowledgebase/tags/{id}/
```

#### Delete Tag

```http
DELETE /api/knowledgebase/tags/{id}/
```

#### Get Tag Articles

```http
GET /api/knowledgebase/tags/{id}/articles/
```

### Comments

#### List Comments

```http
GET /api/knowledgebase/comments/
```

**Query Parameters:**

- `article` - Filter by article ID

#### Get Comment Details

```http
GET /api/knowledgebase/comments/{id}/
```

#### Create Comment

```http
POST /api/knowledgebase/comments/
```

**Request Body:**

```json
{
  "content": "Comment content...",
  "article": "uuid",
  "parent": "uuid"
}
```

#### Update Comment

```http
PUT /api/knowledgebase/comments/{id}/
PATCH /api/knowledgebase/comments/{id}/
```

#### Delete Comment

```http
DELETE /api/knowledgebase/comments/{id}/
```

### Attachments

#### List Attachments

```http
GET /api/knowledgebase/attachments/
```

**Query Parameters:**

- `article` - Filter by article ID

#### Get Attachment Details

```http
GET /api/knowledgebase/attachments/{id}/
```

#### Create Attachment

```http
POST /api/knowledgebase/attachments/
```

**Request Body (multipart/form-data):**

```
file: [file]
article: uuid
description: "Attachment description"
```

#### Update Attachment

```http
PUT /api/knowledgebase/attachments/{id}/
PATCH /api/knowledgebase/attachments/{id}/
```

#### Delete Attachment

```http
DELETE /api/knowledgebase/attachments/{id}/
```

### Feedback

#### List Feedback

```http
GET /api/knowledgebase/feedback/
```

**Query Parameters:**

- `article` - Filter by article ID

#### Get Feedback Details

```http
GET /api/knowledgebase/feedback/{id}/
```

#### Create Feedback

```http
POST /api/knowledgebase/feedback/
```

**Request Body:**

```json
{
  "feedback_type": "helpful",
  "comment": "This article was very helpful",
  "article": "uuid"
}
```

**Feedback Types:**

- `helpful` - Article was helpful
- `not_helpful` - Article was not helpful
- `outdated` - Article is outdated
- `inaccurate` - Article contains inaccurate information
- `suggestion` - Suggestion for improvement

#### Update Feedback

```http
PUT /api/knowledgebase/feedback/{id}/
PATCH /api/knowledgebase/feedback/{id}/
```

#### Delete Feedback

```http
DELETE /api/knowledgebase/feedback/{id}/
```

### Search and Discovery

#### Search Articles

```http
POST /api/knowledgebase/search/
```

**Request Body:**

```json
{
  "query": "search term",
  "category": "uuid",
  "tags": ["uuid1", "uuid2"],
  "status": "published",
  "priority": "high",
  "is_featured": true,
  "is_pinned": false,
  "author": "uuid",
  "hospital": "uuid",
  "date_from": "2025-01-01T00:00:00Z",
  "date_to": "2025-12-31T23:59:59Z",
  "ordering": "-published_at",
  "page": 1,
  "page_size": 20
}
```

**Response:**

```json
{
    "query": "search term",
    "total_count": 50,
    "page": 1,
    "page_size": 20,
    "total_pages": 3,
    "results": [...],
    "search_id": "uuid"
}
```

#### Get Featured Articles

```http
GET /api/knowledgebase/featured/
```

#### Get Recent Articles

```http
GET /api/knowledgebase/recent/
```

#### Get Popular Articles

```http
GET /api/knowledgebase/popular/
```

#### Get Statistics

```http
GET /api/knowledgebase/statistics/
```

**Response:**

```json
{
    "total_articles": 150,
    "total_categories": 12,
    "total_tags": 45,
    "total_comments": 300,
    "most_viewed": [...],
    "most_liked": [...],
    "recent_searches": [...]
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
    "next": "http://localhost:8002/api/knowledgebase/articles/?page=3",
    "previous": "http://localhost:8002/api/knowledgebase/articles/?page=1",
    "results": [...]
}
```

## Filtering and Search

Most list endpoints support filtering and search:

### Text Search

- `search` parameter searches in title, content, excerpt, and tags
- Case-insensitive partial matching

### Field Filtering

- Use query parameters to filter by specific fields
- Multiple values can be provided for many-to-many relationships

### Ordering

- `ordering` parameter controls result ordering
- Prefix with `-` for descending order
- Multiple fields can be specified (comma-separated)

## Multi-Tenant Support

The knowledge base supports multi-tenant architecture:

- **Hospital Isolation**: Articles are filtered by hospital context
- **User Permissions**: Role-based access control
- **Data Segregation**: Each hospital sees only their own content

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

### Creating a Complete Article

```bash
# 1. Create category
curl -X POST http://localhost:8002/api/knowledgebase/categories/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emergency Procedures",
    "description": "Emergency medical procedures",
    "color": "#dc3545",
    "icon": "emergency"
  }'

# 2. Create tags
curl -X POST http://localhost:8002/api/knowledgebase/tags/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cpr",
    "description": "Cardiopulmonary resuscitation",
    "color": "#dc3545"
  }'

# 3. Create article
curl -X POST http://localhost:8002/api/knowledgebase/articles/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "CPR Guidelines 2025",
    "content": "Complete CPR procedure guidelines...",
    "excerpt": "Updated CPR guidelines for 2025",
    "status": "published",
    "priority": "high",
    "is_featured": true,
    "category_id": "category-uuid",
    "tag_ids": ["tag-uuid"]
  }'
```

### Searching Articles

```bash
curl -X POST http://localhost:8002/api/knowledgebase/search/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "emergency procedures",
    "status": "published",
    "priority": "high",
    "is_featured": true,
    "ordering": "-published_at",
    "page": 1,
    "page_size": 10
  }'
```

## Support

For API support and questions:

- **Email**: support@medcor.ai
- **Documentation**: [API Documentation](http://localhost:8002/api/docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/medcor_backend2/issues)
