# Dentscape AI Integration API Documentation

## Overview

The Dentscape AI Integration provides comprehensive dental analysis and simulation capabilities through a RESTful API. This integration includes both **Simulation APIs** for visualizing dental treatments and **Analysis APIs** for detailed dental measurements and assessments.

## Base URL

```
/api/dentscape/
```

## Authentication

**IMPORTANT**: All Dentscape API endpoints are **PUBLIC** and do **NOT** require authentication. You can call these endpoints directly without any authentication headers.

```bash
# No authentication required - direct API calls
curl -X POST http://your-domain/api/dentscape/simulations/orthodontics/ \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_image", "user_id": "your_user_id"}'
```

Include the `user_id` in the request body for user tracking purposes.

## Features

### Simulation APIs

- **Orthodontics Simulation**: Visualize orthodontic treatment outcomes
- **Veneer with Whitening Simulation**: Preview veneer application combined with whitening
- **Tooth Whitening Simulation**: Show tooth whitening results

### Analysis APIs

- **Smile Curve Analysis**: Generate smile curve of upper teeth
- **E-line Analysis**: Analyze facial profile esthetic line
- **Tooth Segmentation**: Segment individual teeth from images
- **Width to Height Ratio**: Calculate incisor proportions
- **Incisal Plane**: Generate incisal plane analysis
- **Interdental Width Proportion**: Calculate tooth width relationships

## Technical Requirements

All APIs include comprehensive validation to ensure images meet technical requirements:

- **Resolution**: Minimum 800x800 pixels
- **Brightness**: Well-lit images (50-200 brightness range)
- **Sharpness**: Clear, sharp images for accurate analysis
- **Format**: JPEG, JPG, or PNG formats only
- **Size**: Maximum 10MB file size

## API Endpoints

### Simulation Endpoints

#### 1. Orthodontics Simulation

**POST** `/api/dentscape/simulations/orthodontics/`

Create an orthodontics simulation to visualize treatment outcomes.

**Request Body (multipart/form-data):**

```json
{
  "user_id": "user_12345",
  "image": "dental_image.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Orthodontics simulation completed successfully",
  "simulation_id": "uuid",
  "simulation_type": "Orthodontics Simulation",
  "status": "completed",
  "completed_at": "2025-01-27T...",
  "results": {
    "treatment_plan": {
      "duration": "12-18 months",
      "treatment_type": "Clear aligners",
      "complexity": "Moderate",
      "estimated_cost": "$3,000 - $5,000"
    },
    "before_after_comparison": {
      "before_image_url": "/static/dentscape/before_orthodontics.jpg",
      "after_image_url": "/static/dentscape/after_orthodontics.jpg",
      "improvement_score": 85
    },
    "detailed_analysis": {
      "crowding_severity": "Moderate",
      "bite_issues": "Overbite present",
      "recommended_treatment": "Clear aligner therapy",
      "expected_outcome": "Significant improvement in alignment"
    }
  },
  "api_version": "Dentscape API v1.0",
  "confidence": 0.85
}
```

#### 2. Veneer with Whitening Simulation

**POST** `/api/dentscape/simulations/veneer-with-whitening/`

Create a veneer with whitening simulation to preview combined treatment results.

**Request Body (multipart/form-data):**

```json
{
  "user_id": "user_12345",
  "image": "dental_image.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Veneer with whitening simulation completed successfully",
  "simulation_id": "uuid",
  "simulation_type": "Veneer with Whitening Simulation",
  "status": "completed",
  "completed_at": "2025-01-27T...",
  "results": {
    "treatment_plan": {
      "veneer_material": "Porcelain",
      "whitening_method": "Professional whitening",
      "treatment_duration": "2-3 weeks",
      "estimated_cost": "$1,500 - $3,000 per tooth"
    },
    "before_after_comparison": {
      "before_image_url": "/static/dentscape/before_veneer_whitening.jpg",
      "after_image_url": "/static/dentscape/after_veneer_whitening.jpg",
      "improvement_score": 92
    },
    "detailed_analysis": {
      "current_tooth_color": "A3",
      "target_color": "B1",
      "veneer_thickness": "0.5mm",
      "expected_outcome": "Dramatic improvement in appearance"
    }
  },
  "api_version": "Dentscape API v1.0",
  "confidence": 0.9
}
```

#### 3. Tooth Whitening Simulation

**POST** `/api/dentscape/simulations/tooth-whitening/`

Create a tooth whitening simulation to preview whitening results.

**Request Body (multipart/form-data):**

```json
{
  "user_id": "user_12345",
  "image": "dental_image.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Tooth whitening simulation completed successfully",
  "simulation_id": "uuid",
  "simulation_type": "Tooth Whitening Simulation",
  "status": "completed",
  "completed_at": "2025-01-27T...",
  "results": {
    "treatment_plan": {
      "whitening_method": "Professional whitening",
      "treatment_duration": "1-2 weeks",
      "estimated_cost": "$300 - $800"
    },
    "before_after_comparison": {
      "before_image_url": "/static/dentscape/before_whitening.jpg",
      "after_image_url": "/static/dentscape/after_whitening.jpg",
      "improvement_score": 78
    },
    "detailed_analysis": {
      "current_shade": "A3",
      "target_shade": "A1",
      "whitening_level": "Moderate",
      "expected_outcome": "Noticeable improvement in tooth color"
    }
  },
  "api_version": "Dentscape API v1.0",
  "confidence": 0.88
}
```

### Analysis Endpoints

#### 1. Smile Curve of Upper Teeth

**POST** `/api/dentscape/analyses/smile-curve-upper/`

Analyze and generate smile curve of upper teeth with detailed measurements.

**Request Body (multipart/form-data):**

```json
{
  "user_id": "user_12345",
  "image": "dental_image.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Smile curve upper analysis completed successfully",
  "analysis_id": "uuid",
  "analysis_type": "Generate Smile Curve of Upper Teeth",
  "status": "completed",
  "completed_at": "2025-01-27T...",
  "results": {
    "smile_curve_analysis": {
      "curve_type": "Convex",
      "curve_radius": "12.5mm",
      "symmetry_score": 85,
      "aesthetic_score": 88
    },
    "measurements": {
      "upper_incisor_edge_to_lip": "2.3mm",
      "canine_to_canine_width": "35.2mm",
      "smile_width": "42.1mm"
    },
    "recommendations": {
      "curve_adjustment": "Slight convex adjustment recommended",
      "symmetry_improvement": "Minor adjustments to improve symmetry",
      "overall_assessment": "Good smile curve with room for enhancement"
    }
  },
  "annotations_image_url": "/static/dentscape/smile_curve_annotated.jpg",
  "api_version": "Dentscape API v1.0",
  "confidence": 0.87
}
```

#### 2. E-line Analysis

**POST** `/api/dentscape/analyses/e-line/`

Perform E-line analysis for profile images to assess facial esthetics.

**Request Body (multipart/form-data):**

```json
{
  "user_id": "user_12345",
  "image": "profile_image.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "E-line analysis completed successfully",
  "analysis_id": "uuid",
  "analysis_type": "E-line Analysis",
  "status": "completed",
  "completed_at": "2025-01-27T...",
  "results": {
    "e_line_analysis": {
      "e_line_position": "Ideal",
      "lip_protrusion": "Normal",
      "chin_position": "Balanced",
      "aesthetic_score": 82
    },
    "measurements": {
      "upper_lip_to_e_line": "2.1mm",
      "lower_lip_to_e_line": "1.8mm",
      "chin_projection": "Normal"
    },
    "recommendations": {
      "lip_position": "Ideal lip position",
      "chin_assessment": "Well-balanced chin projection",
      "overall_assessment": "Good facial profile with ideal E-line"
    }
  },
  "annotations_image_url": "/static/dentscape/e_line_annotated.jpg",
  "api_version": "Dentscape API v1.0",
  "confidence": 0.89
}
```

#### 3. Tooth Segmentation

**POST** `/api/dentscape/analyses/tooth-segmentation/`

Segment individual teeth from dental images for detailed analysis.

**Request Body (multipart/form-data):**

```json
{
  "user_id": "user_12345",
  "image": "dental_image.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Tooth segmentation analysis completed successfully",
  "analysis_id": "uuid",
  "analysis_type": "Tooth Segmentation",
  "status": "completed",
  "completed_at": "2025-01-27T...",
  "results": {
    "segmentation_results": {
      "teeth_detected": 14,
      "segmentation_accuracy": 92,
      "individual_teeth": [
        { "tooth_number": "11", "type": "Central Incisor", "confidence": 0.95 },
        { "tooth_number": "12", "type": "Lateral Incisor", "confidence": 0.93 },
        { "tooth_number": "13", "type": "Canine", "confidence": 0.94 },
        { "tooth_number": "14", "type": "First Premolar", "confidence": 0.91 },
        { "tooth_number": "15", "type": "Second Premolar", "confidence": 0.9 },
        { "tooth_number": "16", "type": "First Molar", "confidence": 0.96 },
        { "tooth_number": "17", "type": "Second Molar", "confidence": 0.89 }
      ]
    },
    "analysis_summary": {
      "dental_arch": "Complete",
      "missing_teeth": 0,
      "restorations_detected": 2,
      "overall_health": "Good"
    }
  },
  "annotations_image_url": "/static/dentscape/tooth_segmentation_annotated.jpg",
  "api_version": "Dentscape API v1.0",
  "confidence": 0.91
}
```

#### 4. Width to Height Ratio of Incisors

**POST** `/api/dentscape/analyses/width-height-ratio-incisors/`

Calculate width to height ratio of incisor teeth for proportional analysis.

**Request Body (multipart/form-data):**

```json
{
  "user_id": "user_12345",
  "image": "dental_image.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Width to height ratio incisors analysis completed successfully",
  "analysis_id": "uuid",
  "analysis_type": "Calculate Width to Height Ratio of Incisors",
  "status": "completed",
  "completed_at": "2025-01-27T...",
  "results": {
    "ratio_analysis": {
      "central_incisors": {
        "width": "8.5mm",
        "height": "10.2mm",
        "ratio": 0.83,
        "assessment": "Ideal"
      },
      "lateral_incisors": {
        "width": "6.8mm",
        "height": "9.1mm",
        "ratio": 0.75,
        "assessment": "Good"
      }
    },
    "proportional_analysis": {
      "golden_ratio_compliance": 85,
      "aesthetic_score": 88,
      "symmetry_score": 90
    },
    "recommendations": {
      "central_incisors": "Ideal proportions maintained",
      "lateral_incisors": "Good proportions with minor adjustments possible",
      "overall_assessment": "Excellent incisor proportions"
    }
  },
  "annotations_image_url": "/static/dentscape/incisor_ratio_annotated.jpg",
  "api_version": "Dentscape API v1.0",
  "confidence": 0.86
}
```

#### 5. Incisal Plane Analysis

**POST** `/api/dentscape/analyses/incisal-plane/`

Generate incisal plane analysis for occlusal assessment.

**Request Body (multipart/form-data):**

```json
{
  "user_id": "user_12345",
  "image": "dental_image.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Incisal plane analysis completed successfully",
  "analysis_id": "uuid",
  "analysis_type": "Generate Incisal Plane",
  "status": "completed",
  "completed_at": "2025-01-27T...",
  "results": {
    "incisal_plane_analysis": {
      "plane_angle": "2.3 degrees",
      "plane_level": "Slightly curved",
      "symmetry_score": 87,
      "aesthetic_score": 85
    },
    "measurements": {
      "incisal_edge_alignment": "Good",
      "canine_guidance": "Present",
      "anterior_coupling": "Adequate"
    },
    "recommendations": {
      "plane_adjustment": "Minor leveling recommended",
      "occlusal_considerations": "Good occlusal function",
      "overall_assessment": "Good incisal plane with minor improvements possible"
    }
  },
  "annotations_image_url": "/static/dentscape/incisal_plane_annotated.jpg",
  "api_version": "Dentscape API v1.0",
  "confidence": 0.84
}
```

#### 6. Interdental Width Proportion

**POST** `/api/dentscape/analyses/interdental-width-proportion/`

Calculate interdental width proportion for aesthetic analysis.

**Request Body (multipart/form-data):**

```json
{
  "user_id": "user_12345",
  "image": "dental_image.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Interdental width proportion analysis completed successfully",
  "analysis_id": "uuid",
  "analysis_type": "Calculate Interdental Width Proportion",
  "status": "completed",
  "completed_at": "2025-01-27T...",
  "results": {
    "proportion_analysis": {
      "central_to_lateral_ratio": 1.25,
      "lateral_to_canine_ratio": 0.8,
      "canine_to_premolar_ratio": 1.15,
      "overall_proportion_score": 88
    },
    "measurements": {
      "central_incisor_width": "8.5mm",
      "lateral_incisor_width": "6.8mm",
      "canine_width": "8.5mm",
      "premolar_width": "7.4mm"
    },
    "recommendations": {
      "proportional_balance": "Good proportional relationships",
      "aesthetic_considerations": "Minor adjustments for ideal proportions",
      "overall_assessment": "Excellent interdental proportions"
    }
  },
  "annotations_image_url": "/static/dentscape/interdental_proportion_annotated.jpg",
  "api_version": "Dentscape API v1.0",
  "confidence": 0.87
}
```

## History Endpoints

### Get User History

**GET** `/api/dentscape/history/?user_id=user_12345`

Retrieve analysis and simulation history for a specific user.

**Response:**

```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "user_id": "user_12345",
      "simulation": {
        "id": "uuid",
        "simulation_type": "orthodontics",
        "status": "completed",
        "created_at": "2025-01-27T...",
        "completed_at": "2025-01-27T..."
      },
      "analysis": null,
      "viewed_at": "2025-01-27T...",
      "feedback_rating": 5,
      "feedback_comment": "Excellent results!"
    }
  ]
}
```

## Error Handling

### Validation Errors

When image requirements are not met:

```json
{
  "success": false,
  "error": "Image does not meet technical requirements",
  "validation": {
    "resolution": {
      "required": "Minimum 800x800 pixels",
      "actual": "640x480 pixels",
      "passed": false
    },
    "brightness": {
      "required": "Well-lit image (50-200 brightness range)",
      "actual": "Brightness: 25.3",
      "passed": false
    },
    "sharpness": {
      "required": "Clear, sharp image",
      "actual": "Sharpness score: 45.2",
      "passed": false
    }
  },
  "overall_score": 0
}
```

### API Errors

```json
{
  "success": false,
  "error": "Dentscape API error: Invalid API key",
  "simulation_id": "uuid"
}
```

## Environment Configuration

Add the following to your `.env` file:

```env
# Dentscape AI Configuration
DENTSCAPE_API_KEY=your-dentscape-api-key-here
DENTSCAPE_MOCK_MODE=False  # Set to True for testing without API key
```

## CORS Configuration

Ensure `test.medcor.ai` is included in allowed origins:

```python
CORS_ALLOWED_ORIGINS = [
    "https://medcor.ai",
    "https://www.medcor.ai",
    "https://test.medcor.ai",
    "http://localhost:3000"
]
```

## Rate Limiting

- **Simulation APIs**: 10 requests per minute per user
- **Analysis APIs**: 20 requests per minute per user
- **History API**: 100 requests per minute per user

## Best Practices

1. **Image Quality**: Use high-resolution, well-lit images for best results
2. **User Tracking**: Always include `user_id` for proper tracking
3. **Error Handling**: Implement proper error handling for validation failures
4. **Caching**: Cache results when appropriate to reduce API calls
5. **Security**: Validate all inputs and sanitize user data

## Support

For technical support or questions about the Dentscape AI integration:

- **Email**: support@medcor.ai
- **Documentation**: Available at `/api/docs/` (Swagger UI)
- **API Schema**: Available at `/api/schema/`
