# Hair Extension Analysis API Documentation

## Overview

The Hair Extension Analysis API provides AI-powered analysis of user images to recommend suitable hair extensions, hairstyles, and styling options. The API analyzes face shape, hair color, and other factors to provide comprehensive recommendations including hairstyle categories, color suggestions, styling tips, and installation methods.

## API Endpoint

```
POST /api/youcam/hair-extension-analysis/
```

## Request Format

### Headers

```
Content-Type: application/json
Accept: application/json
```

### Request Body

```json
{
  "imagebase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
}
```

### Parameters

- `imagebase64` (string, required): Base64 encoded image string for hair extension analysis

## Response Format

### Success Response (201 Created)

```json
{
    "success": true,
    "result": {
        "analysis_info": {
            "base_hair_color": "Red",
            "color_category": "Warm",
            "face_shape": "Oval",
            "skin_tone": "Medium",
            "confidence": 0.85
        },
        "hairstyle_categories": {
            "long_styles": {
                "category_name": "Long Hair Extensions",
                "description": "Perfect for adding length and volume",
                "styles": [
                    {
                        "style_id": "long_001",
                        "style_name": "Long Layered Waves",
                        "length": "24 inches",
                        "texture": "Wavy",
                        "color_match": "Red with highlights",
                        "face_shape_suitability": ["Oval", "Round", "Square"],
                        "maintenance_level": "Medium",
                        "price_range": "$200-400",
                        "image_url": "/static/hairstyles/long_layered_waves.jpg"
                    }
                ]
            },
            "medium_styles": {
                "category_name": "Medium Length Extensions",
                "description": "Versatile length for everyday styling",
                "styles": [...]
            },
            "short_styles": {
                "category_name": "Short Hair Extensions",
                "description": "Perfect for adding volume and texture",
                "styles": [...]
            },
            "specialty_styles": {
                "category_name": "Specialty Hair Extensions",
                "description": "Unique styles for special occasions",
                "styles": [...]
            }
        },
        "color_recommendations": {
            "natural_colors": [
                "Red",
                "Red with subtle highlights",
                "Red with lowlights"
            ],
            "trendy_colors": [
                "Red with balayage",
                "Red to blonde ombre",
                "Red with face-framing highlights"
            ],
            "bold_colors": [
                "Platinum blonde",
                "Rich auburn",
                "Chocolate brown",
                "Jet black"
            ]
        },
        "styling_tips": {
            "daily_care": [
                "Use sulfate-free shampoo and conditioner",
                "Brush gently with wide-tooth comb",
                "Apply heat protectant before styling",
                "Sleep with hair in loose braid or bun"
            ],
            "styling_products": [
                "Heat protectant spray",
                "Leave-in conditioner",
                "Hair serum for shine",
                "Dry shampoo for volume"
            ],
            "maintenance_schedule": [
                "Wash 2-3 times per week",
                "Deep condition weekly",
                "Trim ends every 6-8 weeks",
                "Professional maintenance every 8-10 weeks"
            ]
        },
        "installation_methods": {
            "clip_in": {
                "description": "Temporary extensions that clip in",
                "duration": "Daily wear",
                "damage_level": "None",
                "cost": "$50-150",
                "best_for": "Special occasions, trying styles"
            },
            "tape_in": {
                "description": "Semi-permanent tape-in extensions",
                "duration": "6-8 weeks",
                "damage_level": "Minimal",
                "cost": "$200-400",
                "best_for": "Regular wear, medium maintenance"
            },
            "sew_in": {
                "description": "Sewn-in extensions for durability",
                "duration": "8-12 weeks",
                "damage_level": "Low",
                "cost": "$300-600",
                "best_for": "Long-term wear, active lifestyle"
            },
            "fusion": {
                "description": "Bonded extensions for natural look",
                "duration": "10-12 weeks",
                "damage_level": "Medium",
                "cost": "$400-800",
                "best_for": "Natural appearance, long-term wear"
            }
        },
        "api_version": "Perfect Corp YCE Hair Extension Analysis v1.0",
        "confidence": 0.88
    },
    "message": "Hair extension analysis completed successfully",
    "features_available": [
        "hairstyle_categories",
        "color_recommendations",
        "styling_tips",
        "installation_methods",
        "face_shape_compatibility",
        "maintenance_guidance"
    ],
    "analysis_id": "7bdc7751-e38c-4bf4-bdee-e0d38f8cfbd6",
    "analysis_type": "AI Hair Extension Analysis",
    "status": "completed",
    "completed_at": "2025-10-19T22:57:56.778857+00:00"
}
```

## Response Fields

### Analysis Info

- `base_hair_color`: Detected base hair color (Red, Brown, Blonde, Black, etc.)
- `color_category`: Color category (Warm, Cool, Neutral)
- `face_shape`: Detected face shape (Oval, Round, Square, Heart, Diamond)
- `skin_tone`: Detected skin tone (Fair, Medium, Dark, etc.)
- `confidence`: Analysis confidence score (0.0-1.0)

### Hairstyle Categories

The API returns hairstyles organized into four main categories:

#### Long Styles

- Styles with 20+ inches length
- Perfect for adding length and volume
- Includes: Layered Waves, Straight Silky, Curly Volume

#### Medium Styles

- Styles with 12-20 inches length
- Versatile length for everyday styling
- Includes: Bob with Layers, Wavy Shag, Curly Bob

#### Short Styles

- Styles with 8-12 inches length
- Perfect for adding volume and texture
- Includes: Pixie Cut, Layered Bob, Curly Afro

#### Specialty Styles

- Unique styles for special occasions
- Includes: Ombre Waves, Balayage Curly, Highlights Straight

### Style Information

Each hairstyle includes:

- `style_id`: Unique identifier
- `style_name`: Name of the hairstyle
- `length`: Hair length
- `texture`: Hair texture (Straight, Wavy, Curly, etc.)
- `color_match`: Recommended color matching
- `face_shape_suitability`: Compatible face shapes
- `maintenance_level`: Maintenance requirements (Low, Medium, High)
- `price_range`: Estimated cost range
- `image_url`: Reference image URL

### Color Recommendations

- `natural_colors`: Colors that complement natural hair
- `trendy_colors`: Current trending color options
- `bold_colors`: Bold, dramatic color choices

### Styling Tips

- `daily_care`: Daily hair care routine
- `styling_products`: Recommended styling products
- `maintenance_schedule`: Maintenance schedule recommendations

### Installation Methods

Four main installation methods with details:

- `clip_in`: Temporary clip-in extensions
- `tape_in`: Semi-permanent tape-in extensions
- `sew_in`: Sewn-in extensions for durability
- `fusion`: Bonded extensions for natural look

## Error Responses

### 400 Bad Request

```json
{
  "imagebase64": ["Invalid base64 image data: Incorrect padding"]
}
```

### 500 Internal Server Error

```json
{
  "error": "Hair extension analysis failed: [error details]"
}
```

## cURL Example

```bash
curl -X POST "http://localhost:8000/api/youcam/hair-extension-analysis/" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "imagebase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
  }'
```

## Python Example

```python
import requests
import base64

# Load and encode image
with open("selfie.jpg", "rb") as image_file:
    image_base64 = base64.b64encode(image_file.read()).decode('utf-8')

# Make API request
response = requests.post(
    "http://localhost:8000/api/youcam/hair-extension-analysis/",
    json={"imagebase64": image_base64},
    headers={"Content-Type": "application/json"}
)

if response.status_code == 201:
    data = response.json()
    print("Analysis completed successfully!")
    print(f"Base hair color: {data['result']['analysis_info']['base_hair_color']}")
    print(f"Face shape: {data['result']['analysis_info']['face_shape']}")

    # Display hairstyle categories
    for category_id, category in data['result']['hairstyle_categories'].items():
        print(f"\n{category['category_name']}: {len(category['styles'])} styles")
else:
    print(f"Error: {response.status_code} - {response.text}")
```

## Features Available

The API provides comprehensive hair extension analysis including:

1. **Hairstyle Categories**: Organized by length (long, medium, short, specialty)
2. **Color Recommendations**: Natural, trendy, and bold color options
3. **Styling Tips**: Daily care, products, and maintenance schedules
4. **Installation Methods**: Four different extension installation options
5. **Face Shape Compatibility**: Styles matched to face shapes
6. **Maintenance Guidance**: Detailed care instructions

## Technical Details

- **Analysis Type**: `hair_extension_analysis`
- **Processing**: Synchronous processing with immediate results
- **Image Format**: Supports JPEG, PNG, WebP formats
- **Max Image Size**: 10MB
- **Response Time**: Typically 2-5 seconds
- **API Version**: Perfect Corp YCE Hair Extension Analysis v1.0

## Integration with Perfect Corp YCE API

The implementation integrates with Perfect Corp's YCE (YouCam Extension) API for professional hair extension analysis. When API credentials are available, it uses the real Perfect Corp API. When in mock mode or when API credentials are not configured, it provides comprehensive mock analysis with realistic data.

The API follows the Perfect Corp YCE API format:

- Endpoint: `https://yce-api-01.perfectcorp.com/s2s/v1.0/file/hair-ext`
- Request format matches Perfect Corp specifications
- Response processing maintains compatibility with YCE API structure




















