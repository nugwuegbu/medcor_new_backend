# ChatWidget Customization API Documentation

## Overview

The ChatWidget Customization API allows hospitals to configure their chat widget appearance, features, and behavior. Each hospital can have only one chat widget customization configuration, ensuring a consistent experience across their platform.

## Models

### ChatWidgetCustomization

Main model that links to a Hospital with a one-to-one relationship.

### Theme

Controls the visual appearance of the chat widget:

- `company_logo`: File path where the hospital's logo is saved
- `primary_color`: Main brand color (hex format)
- `secondary_color`: Secondary brand color (hex format)
- `accent_color`: Accent color for highlights (hex format)
- `background_color`: Background color (hex format)
- `text_color`: Text color (hex format)
- `user_message_background`: User message background
- `assistant_message_background`: Assistant message background
- `message_overlay_color`: Message overlay color
- `input_background`: Input field background
- `glow_border_color`: Glow effect border color

### Features

Controls the functionality and analysis features:

- `avarta_interaction_type`: Type of avatar interaction
- `face_analysis`: Enable/disable face analysis (boolean)
- `hair_analysis`: Enable/disable hair analysis (boolean)
- `skin_analysis`: Enable/disable skin analysis (boolean)
- `lips_analysis`: Enable/disable lips analysis (boolean)
- `hair_extension_analysis`: Enable/disable hair extension analysis (boolean)

### Avatar

Controls avatar behavior:

- `avarta_language`: Language for the avatar

### Voice

Controls voice settings:

- `voice_id`: Identifier for the voice to use

### Integration

Controls third-party integrations (extensible for future features)

## API Endpoints

### Base URL

```
/api/chatwidget/
```

### 1. Create ChatWidget Customization for Hospital

**Endpoint:** `POST /api/chatwidget/create-for-hospital/{hospital_id}/`

**Description:** Creates a new chat widget customization for a specific hospital. Only one customization per hospital is allowed.

**Request Body:**

```json
{
  "chatwidget": {
    "theme": {
      "company_logo": "/media/logos/hospital-logo.png",
      "primary_color": "#FF0000",
      "secondary_color": "#00FF00",
      "accent_color": "#0000FF",
      "background_color": "#FFFFFF",
      "text_color": "#000000",
      "user_message_background": "#F0F0F0",
      "assistant_message_background": "#E0E0E0",
      "message_overlay_color": "#CCCCCC",
      "input_background": "#FFFFFF",
      "glow_border_color": "#FFD700"
    },
    "features": {
      "avarta_interaction_type": "voice",
      "face_analysis": true,
      "hair_analysis": false,
      "skin_analysis": true,
      "lips_analysis": false,
      "hair_extension_analysis": true
    },
    "avatar": {
      "avarta_language": "en"
    },
    "voice": {
      "voice_id": "voice_001"
    },
    "integration": {}
  }
}
```

**Response (201 Created):**

```json
{
  "message": "ChatWidget customization created successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "hospital": "123e4567-e89b-12d3-a456-426614174001",
    "theme": {
      "company_logo": "/media/logos/hospital-logo.png",
      "primary_color": "#FF0000",
      "secondary_color": "#00FF00",
      "accent_color": "#0000FF",
      "background_color": "#FFFFFF",
      "text_color": "#000000",
      "user_message_background": "#F0F0F0",
      "assistant_message_background": "#E0E0E0",
      "message_overlay_color": "#CCCCCC",
      "input_background": "#FFFFFF",
      "glow_border_color": "#FFD700"
    },
    "features": {
      "avarta_interaction_type": "voice",
      "face_analysis": true,
      "hair_analysis": false,
      "skin_analysis": true,
      "lips_analysis": false,
      "hair_extension_analysis": true
    },
    "avatar": {
      "avarta_language": "en"
    },
    "voice": {
      "voice_id": "voice_001"
    },
    "integration": {},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "ChatWidget customization already exists for this hospital. You can only update it."
}
```

### 2. Get ChatWidget Customization by Hospital

**Endpoint:** `GET /api/chatwidget/hospital/{hospital_id}/`

**Description:** Retrieves the chat widget customization for a specific hospital.

**Response (200 OK):**

```json
{
  "message": "ChatWidget customization retrieved successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "hospital": "123e4567-e89b-12d3-a456-426614174001",
    "theme": {
      "company_logo": "/media/logos/hospital-logo.png",
      "primary_color": "#FF0000",
      "secondary_color": "#00FF00",
      "accent_color": "#0000FF",
      "background_color": "#FFFFFF",
      "text_color": "#000000",
      "user_message_background": "#F0F0F0",
      "assistant_message_background": "#E0E0E0",
      "message_overlay_color": "#CCCCCC",
      "input_background": "#FFFFFF",
      "glow_border_color": "#FFD700"
    },
    "features": {
      "avarta_interaction_type": "voice",
      "face_analysis": true,
      "hair_analysis": false,
      "skin_analysis": true,
      "lips_analysis": false,
      "hair_extension_analysis": true
    },
    "avatar": {
      "avarta_language": "en"
    },
    "voice": {
      "voice_id": "voice_001"
    },
    "integration": {},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "message": "No chatwidget customization found for this hospital"
}
```

### 3. Update ChatWidget Customization for Hospital

**Endpoint:** `PUT /api/chatwidget/update-for-hospital/{hospital_id}/`

**Description:** Updates the chat widget customization for a specific hospital. Use PATCH for partial updates.

**Request Body:**

```json
{
  "chatwidget": {
    "theme": {
      "primary_color": "#00FF00",
      "secondary_color": "#FF0000"
    },
    "features": {
      "face_analysis": false,
      "hair_analysis": true
    }
  }
}
```

**Response (200 OK):**

```json
{
  "message": "ChatWidget customization updated successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "hospital": "123e4567-e89b-12d3-a456-426614174001",
    "theme": {
      "company_logo": "/media/logos/hospital-logo.png",
      "primary_color": "#00FF00",
      "secondary_color": "#FF0000",
      "accent_color": "#0000FF",
      "background_color": "#FFFFFF",
      "text_color": "#000000",
      "user_message_background": "#F0F0F0",
      "assistant_message_background": "#E0E0E0",
      "message_overlay_color": "#CCCCCC",
      "input_background": "#FFFFFF",
      "glow_border_color": "#FFD700"
    },
    "features": {
      "avarta_interaction_type": "voice",
      "face_analysis": false,
      "hair_analysis": true,
      "skin_analysis": true,
      "lips_analysis": false,
      "hair_extension_analysis": true
    },
    "avatar": {
      "avarta_language": "en"
    },
    "voice": {
      "voice_id": "voice_001"
    },
    "integration": {},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

### 4. Delete ChatWidget Customization for Hospital

**Endpoint:** `DELETE /api/chatwidget/delete-for-hospital/{hospital_id}/`

**Description:** Deletes the chat widget customization for a specific hospital.

**Response (200 OK):**

```json
{
  "message": "ChatWidget customization deleted successfully"
}
```

### 5. List All ChatWidget Customizations

**Endpoint:** `GET /api/chatwidget/`

**Description:** Lists all chat widget customizations in the system.

**Response (200 OK):**

```json
{
  "message": "ChatWidget customizations retrieved successfully",
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "hospital": "123e4567-e89b-12d3-a456-426614174001",
      "theme": {
        "company_logo": "/media/logos/hospital-logo.png",
        "primary_color": "#FF0000",
        "secondary_color": "#00FF00",
        "accent_color": "#0000FF",
        "background_color": "#FFFFFF",
        "text_color": "#000000",
        "user_message_background": "#F0F0F0",
        "assistant_message_background": "#E0E0E0",
        "message_overlay_color": "#CCCCCC",
        "input_background": "#FFFFFF",
        "glow_border_color": "#FFD700"
      },
      "features": {
        "avarta_interaction_type": "voice",
        "face_analysis": true,
        "hair_analysis": false,
        "skin_analysis": true,
        "lips_analysis": false,
        "hair_extension_analysis": true
      },
      "avatar": {
        "avarta_language": "en"
      },
      "voice": {
        "voice_id": "voice_001"
      },
      "integration": {},
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 6. Get ChatWidget Customization by ID

**Endpoint:** `GET /api/chatwidget/{customization_id}/`

**Description:** Retrieves a specific chat widget customization by its ID.

**Response (200 OK):**

```json
{
  "message": "ChatWidget customization retrieved successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "hospital": "123e4567-e89b-12d3-a456-426614174001",
    "theme": {
      "company_logo": "/media/logos/hospital-logo.png",
      "primary_color": "#FF0000",
      "secondary_color": "#00FF00",
      "accent_color": "#0000FF",
      "background_color": "#FFFFFF",
      "text_color": "#000000",
      "user_message_background": "#F0F0F0",
      "assistant_message_background": "#E0E0E0",
      "message_overlay_color": "#CCCCCC",
      "input_background": "#FFFFFF",
      "glow_border_color": "#FFD700"
    },
    "features": {
      "avarta_interaction_type": "voice",
      "face_analysis": true,
      "hair_analysis": false,
      "skin_analysis": true,
      "lips_analysis": false,
      "hair_extension_analysis": true
    },
    "avatar": {
      "avarta_language": "en"
    },
    "voice": {
      "voice_id": "voice_001"
    },
    "integration": {},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 7. Update ChatWidget Customization by ID

**Endpoint:** `PUT /api/chatwidget/{customization_id}/`

**Description:** Updates a specific chat widget customization by its ID. Use PATCH for partial updates.

**Request Body:** Same as update-for-hospital endpoint.

**Response:** Same as update-for-hospital endpoint.

### 8. Delete ChatWidget Customization by ID

**Endpoint:** `DELETE /api/chatwidget/{customization_id}/`

**Description:** Deletes a specific chat widget customization by its ID.

**Response (200 OK):**

```json
{
  "message": "ChatWidget customization deleted successfully"
}
```

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Successful operation
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Field Validation

### Theme Fields

- All color fields should be valid hex color codes (e.g., `#FF0000`)
- `company_logo` should be a valid file path to the logo file

### Features Fields

- Boolean fields accept `true`, `false`, or `null`
- `avarta_interaction_type` accepts string values

### Avatar Fields

- `avarta_language` should be a valid language code (e.g., `en`, `es`, `fr`)

### Voice Fields

- `voice_id` should be a valid voice identifier string

## Usage Examples

### Creating a Complete Customization

```bash
curl -X POST "https://your-domain.com/api/chatwidget/create-for-hospital/123e4567-e89b-12d3-a456-426614174001/" \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "chatwidget": {
      "theme": {
        "company_logo": "https://hospital.com/logo.png",
        "primary_color": "#2E86AB",
        "secondary_color": "#A23B72",
        "accent_color": "#F18F01",
        "background_color": "#FFFFFF",
        "text_color": "#333333",
        "user_management_background": "#F8F9FA",
        "assistant_message_background": "#E3F2FD",
        "message_overlay_color": "#BBDEFB",
        "input_background": "#FFFFFF",
        "glow_border_color": "#2E86AB"
      },
      "features": {
        "avarta_interaction_type": "voice",
        "face_analysis": true,
        "hair_analysis": true,
        "skin_analysis": true,
        "lips_analysis": false,
        "hair_extension_analysis": true
      },
      "avatar": {
        "avarta_language": "en"
      },
      "voice": {
        "voice_id": "hospital_voice_001"
      },
      "integration": {}
    }
  }'
```

### Updating Specific Features

```bash
curl -X PATCH "https://your-domain.com/api/chatwidget/update-for-hospital/123e4567-e89b-12d3-a456-426614174001/" \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "chatwidget": {
      "features": {
        "face_analysis": false,
        "hair_analysis": true
      },
      "theme": {
        "primary_color": "#FF6B6B"
      }
    }
  }'
```

### Retrieving Customization

```bash
curl -X GET "https://your-domain.com/api/chatwidget/hospital/123e4567-e89b-12d3-a456-426614174001/" \
  -H "Authorization: Bearer <your_token>"
```

## Database Schema

The chatwidget customization system uses the following database tables:

- `chatwidget_customizations`: Main customization records
- `chatwidget_themes`: Theme configurations
- `chatwidget_features`: Feature settings
- `chatwidget_avatars`: Avatar configurations
- `chatwidget_voices`: Voice settings
- `chatwidget_integrations`: Integration settings

All tables use UUID primary keys and include `created_at` and `updated_at` timestamps.
