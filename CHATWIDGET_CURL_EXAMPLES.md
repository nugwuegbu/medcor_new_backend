# ChatWidget Customization API - cURL Examples

## Prerequisites

- Replace `YOUR_JWT_TOKEN` with your actual JWT token
- Replace `HOSPITAL_ID` with a valid hospital UUID from your database
- Ensure the server is running on `http://localhost:8000`

## 1. Create ChatWidget Customization

```bash
curl -X POST "http://localhost:8000/api/chatwidget/create-for-hospital/HOSPITAL_ID/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chatwidget": {
      "theme": {
        "company_logo": "/media/logos/hospital-logo.png",
        "primary_color": "#2E86AB",
        "secondary_color": "#A23B72",
        "accent_color": "#F18F01",
        "background_color": "#FFFFFF",
        "text_color": "#333333",
        "user_message_background": "#F8F9FA",
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

## 2. Get ChatWidget Customization by Hospital

```bash
curl -X GET "http://localhost:8000/api/chatwidget/hospital/HOSPITAL_ID/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 3. Update ChatWidget Customization (Full Update)

```bash
curl -X PUT "http://localhost:8000/api/chatwidget/update-for-hospital/HOSPITAL_ID/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chatwidget": {
      "theme": {
        "company_logo": "/media/logos/new-logo.png",
        "primary_color": "#FF6B6B",
        "secondary_color": "#4ECDC4",
        "accent_color": "#45B7D1",
        "background_color": "#F8F9FA",
        "text_color": "#2C3E50",
        "user_message_background": "#E9ECEF",
        "assistant_message_background": "#D1ECF1",
        "message_overlay_color": "#B8D4EA",
        "input_background": "#FFFFFF",
        "glow_border_color": "#FF6B6B"
      },
      "features": {
        "avarta_interaction_type": "text",
        "face_analysis": false,
        "hair_analysis": true,
        "skin_analysis": false,
        "lips_analysis": true,
        "hair_extension_analysis": false
      },
      "avatar": {
        "avarta_language": "es"
      },
      "voice": {
        "voice_id": "hospital_voice_002"
      },
      "integration": {}
    }
  }'
```

## 4. Partial Update ChatWidget Customization

```bash
curl -X PATCH "http://localhost:8000/api/chatwidget/update-for-hospital/HOSPITAL_ID/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chatwidget": {
      "theme": {
        "primary_color": "#E74C3C",
        "secondary_color": "#3498DB"
      },
      "features": {
        "face_analysis": true,
        "hair_analysis": false
      },
      "voice": {
        "voice_id": "hospital_voice_003"
      }
    }
  }'
```

## 5. List All ChatWidget Customizations

```bash
curl -X GET "http://localhost:8000/api/chatwidget/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 6. Get ChatWidget Customization by ID

```bash
curl -X GET "http://localhost:8000/api/chatwidget/CUSTOMIZATION_ID/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 7. Update ChatWidget Customization by ID

```bash
curl -X PATCH "http://localhost:8000/api/chatwidget/CUSTOMIZATION_ID/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chatwidget": {
      "theme": {
        "primary_color": "#9B59B6"
      },
      "features": {
        "skin_analysis": true
      }
    }
  }'
```

## 8. Delete ChatWidget Customization by Hospital

```bash
curl -X DELETE "http://localhost:8000/api/chatwidget/delete-for-hospital/HOSPITAL_ID/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 9. Delete ChatWidget Customization by ID

```bash
curl -X DELETE "http://localhost:8000/api/chatwidget/CUSTOMIZATION_ID/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Example Response

### Successful Creation Response (201)

```json
{
  "message": "ChatWidget customization created successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "hospital": "123e4567-e89b-12d3-a456-426614174001",
    "theme": {
      "company_logo": "https://example.com/hospital-logo.png",
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
    "integration": {},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### Error Response (400)

```json
{
  "error": "ChatWidget customization already exists for this hospital. You can only update it."
}
```

### Not Found Response (404)

```json
{
  "message": "No chatwidget customization found for this hospital"
}
```

## Notes

1. **Authentication**: All endpoints require a valid JWT token in the Authorization header
2. **Hospital ID**: Must be a valid UUID of an existing hospital
3. **One-to-One Relationship**: Each hospital can only have one chatwidget customization
4. **Partial Updates**: Use PATCH for partial updates, PUT for full updates
5. **Color Format**: All color fields should be in hex format (e.g., #FF0000)
6. **Boolean Fields**: Use `true`, `false`, or `null` for boolean fields
7. **File Path Fields**: Company logo should be a valid file path
8. **Language Codes**: Use standard language codes (e.g., en, es, fr, de)

## Testing Tips

1. Start by creating a customization for a hospital
2. Try to create another customization for the same hospital (should fail)
3. Update the existing customization
4. Retrieve the customization to verify changes
5. List all customizations to see the full dataset
6. Delete the customization when done testing
