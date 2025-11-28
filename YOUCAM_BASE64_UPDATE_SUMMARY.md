# YouCam API - Base64 Image Update Summary

## Overview

The YouCam Analysis API endpoints have been updated to accept JSON payloads with base64 encoded images instead of multipart/form-data file uploads.

## Changes Made

### 1. Request Format Change

**Old Format (Multipart Form Data):**

```http
POST /api/youcam/skin-analysis/
Content-Type: multipart/form-data

image: <binary file data>
```

**New Format (JSON with Base64):**

```http
POST /api/youcam/skin-analysis/
Content-Type: application/json

{
  "imagebase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
}
```

### 2. Field Name Change

- **Old Field**: `image` (file upload)
- **New Field**: `imagebase64` (base64 encoded string)

### 3. Affected Endpoints

All individual analysis type endpoints have been updated:

- ✅ `POST /api/youcam/face-analysis/`
- ✅ `POST /api/youcam/lips-analysis/`
- ✅ `POST /api/youcam/skin-analysis/`
- ✅ `POST /api/youcam/hair-extension/`

### 4. Technical Changes

#### Serializers (`youcam/serializers.py`)

- Created new `Base64ImageField` custom field class
- Updated all create serializers:
  - `FaceAnalysisCreateSerializer`
  - `LipsAnalysisCreateSerializer`
  - `HairExtensionCreateSerializer`
  - `SkinAnalysisCreateSerializer`
- Changed from `ModelSerializer` to `Serializer` with custom create logic
- Added base64 decoding and validation

#### Views (`youcam/views.py`)

- Changed parser classes from `[MultiPartParser, FormParser]` to `[JSONParser]`
- Updated for all viewsets:
  - `FaceAnalysisViewSet`
  - `LipsAnalysisViewSet`
  - `HairExtensionAnalysisViewSet`
  - `SkinAnalysisViewSet`
- Updated OpenAPI examples to show JSON format with base64

#### Documentation

- Updated `youcam/README.md` with new JSON format examples
- Updated `YOUCAM_ENHANCED_API_DOCUMENTATION.md` with base64 format
- Added JavaScript examples showing file-to-base64 conversion

## Base64 Image Format

### Accepted Formats

The `imagebase64` field accepts two formats:

1. **Full Data URI** (recommended):

   ```json
   {
     "imagebase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
   }
   ```

2. **Base64 String Only**:
   ```json
   {
     "imagebase64": "/9j/4AAQSkZJRgABAQEAYABgAAD..."
   }
   ```

### Validation Rules

- ✅ Maximum size: 10MB (decoded)
- ✅ Supported formats: JPEG, PNG, WebP
- ✅ Automatic file extension: `.jpg`
- ✅ Automatic filename generation using UUID

## Migration Guide

### Frontend JavaScript/TypeScript

**Before (Old Format):**

```javascript
async function submitAnalysis(imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch("/api/youcam/skin-analysis/", {
    method: "POST",
    body: formData,
  });

  return await response.json();
}
```

**After (New Format):**

```javascript
// Helper function to convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

async function submitAnalysis(imageFile) {
  const imagebase64 = await fileToBase64(imageFile);

  const response = await fetch("/api/youcam/skin-analysis/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imagebase64 }),
  });

  return await response.json();
}
```

### Python Requests

**Before (Old Format):**

```python
import requests

with open('image.jpg', 'rb') as f:
    files = {'image': f}
    response = requests.post(
        'https://api.example.com/api/youcam/skin-analysis/',
        files=files
    )
```

**After (New Format):**

```python
import requests
import base64

with open('image.jpg', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode('utf-8')

response = requests.post(
    'https://api.example.com/api/youcam/skin-analysis/',
    headers={'Content-Type': 'application/json'},
    json={'imagebase64': f'data:image/jpeg;base64,{image_data}'}
)
```

### cURL

**Before (Old Format):**

```bash
curl -X POST "https://api.example.com/api/youcam/skin-analysis/" \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@photo.jpg"
```

**After (New Format):**

```bash
# First, encode image to base64
IMAGE_BASE64=$(base64 -w 0 photo.jpg)

# Then send as JSON
curl -X POST "https://api.example.com/api/youcam/skin-analysis/" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"imagebase64\":\"data:image/jpeg;base64,$IMAGE_BASE64\"}"
```

## Benefits

### 1. **Simpler API Contract**

- Consistent JSON format across all endpoints
- No need for multipart/form-data handling

### 2. **Better for Mobile Apps**

- Easier to work with in React Native, Flutter, etc.
- Native JSON serialization

### 3. **Easier Testing**

- Can test with simple JSON payloads
- No need for form-data libraries in testing frameworks

### 4. **Better Error Messages**

- JSON validation errors are clearer
- Field-level error reporting

### 5. **CORS Friendly**

- Simple JSON requests don't trigger preflight in some cases
- Easier CORS configuration

## Backward Compatibility

⚠️ **BREAKING CHANGE**: The old multipart/form-data format is **no longer supported**.

Clients must update to use the new JSON format with base64 encoded images.

## Testing

### Test with cURL

```bash
# Create a test with base64 encoded image
curl -X POST "http://localhost:8000/api/youcam/skin-analysis/" \
  -H "Content-Type: application/json" \
  -d '{"imagebase64":"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/..."}'
```

### Test with Python

```python
import requests
import base64

# Load and encode image
with open('test_image.jpg', 'rb') as f:
    image_base64 = base64.b64encode(f.read()).decode('utf-8')

# Create analysis
response = requests.post(
    'http://localhost:8000/api/youcam/skin-analysis/',
    headers={'Content-Type': 'application/json'},
    json={'imagebase64': f'data:image/jpeg;base64,{image_base64}'}
)

print(response.json())
```

## Swagger Documentation

The Swagger/OpenAPI documentation has been updated to reflect:

- ✅ Content-Type: `application/json`
- ✅ Request body schema with `imagebase64` field
- ✅ Example payloads with base64 strings
- ✅ Field descriptions and validation rules

Access at: `/api/docs/` or `/api/redoc/`

## Date of Changes

**Date**: October 8, 2025

## Support

For questions or issues related to these changes, please contact the development team.

## Related Documentation

- `youcam/README.md` - Updated with new format
- `YOUCAM_ENHANCED_API_DOCUMENTATION.md` - Complete API documentation
- `YOUCAM_API_CHANGES_SUMMARY.md` - Previous API structure changes




