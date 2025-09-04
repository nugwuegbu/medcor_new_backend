# YouCam AI Analysis API

A comprehensive Django REST API for AI-powered image analysis using YouCam technology. This API provides endpoints for skin analysis, face analysis, hair extension analysis, and lips analysis with asynchronous processing using Celery.

## Features

- **AI Skin Analysis**: Analyze skin condition, type, moisture, oiliness, and detect issues
- **AI Face Analyzer**: Analyze facial features, symmetry, emotions, and age estimation
- **AI Hair Extension**: Analyze hair quality, type, color, and extension compatibility
- **AI Lips Analysis**: Analyze lip shape, size, color, condition, and hydration
- **Asynchronous Processing**: All analyses are processed asynchronously using Celery
- **Comprehensive Results**: Detailed analysis results, issues detected, and recommendations
- **User History**: Track analysis history and feedback
- **Statistics**: Get detailed statistics about analyses
- **Swagger Documentation**: Complete API documentation with examples

## API Endpoints

### Base URL

```
/api/youcam/
```

### Analysis Endpoints

#### 1. Create Analysis

**POST** `/api/youcam/analyses/`

Submit a new image for AI analysis.

**Request Body:**

```json
{
  "analysis_type": "skin_analysis",
  "image": "<image_file>"
}
```

**Analysis Types:**

- `skin_analysis` - AI Skin Analysis
- `face_analyzer` - AI Face Analyzer
- `hair_extension` - AI Hair Extension
- `lips_analysis` - AI Lips Analysis

**Response:**

```json
{
  "message": "AI analysis request created successfully and queued for processing.",
  "analysis_id": "uuid",
  "analysis_type": "AI Skin Analysis",
  "status": "pending",
  "task_id": "celery_task_id"
}
```

#### 2. List Analyses

**GET** `/api/youcam/analyses/`

Retrieve a list of all analyses with optional filtering.

**Query Parameters:**

- `analysis_type` - Filter by analysis type
- `status` - Filter by status (pending, processing, completed, failed)
- `user` - Filter by user ID

**Response:**

```json
{
  "count": 10,
  "results": [
    {
      "id": "uuid",
      "analysis_type": "skin_analysis",
      "analysis_type_display": "AI Skin Analysis",
      "status": "completed",
      "status_display": "Completed",
      "image_url": "http://example.com/image.jpg",
      "is_completed": true,
      "is_failed": false,
      "can_retry": false,
      "retry_count": 0,
      "max_retries": 3,
      "created_at": "2025-08-31T21:50:10Z",
      "updated_at": "2025-08-31T21:50:17Z",
      "completed_at": "2025-08-31T21:50:17Z"
    }
  ]
}
```

#### 3. Get Analysis Details

**GET** `/api/youcam/analyses/{id}/`

Retrieve detailed information about a specific analysis.

**Response:**

```json
{
    "id": "uuid",
    "analysis_type": "skin_analysis",
    "analysis_type_display": "AI Skin Analysis",
    "status": "completed",
    "status_display": "Completed",
    "image_url": "http://example.com/image.jpg",
    "analysis_results": {
        "skin_condition": {...},
        "skin_type": "Oily",
        "moisture_level": 75,
        "oiliness_level": 60,
        "sensitivity_score": 30,
        "age_estimation": 28,
        "skin_tone": "Medium",
        "texture_analysis": {...}
    },
    "issues_detected": [
        "Acne spots detected",
        "Dark circles under eyes"
    ],
    "recommendations": [
        "Use oil-free moisturizer",
        "Apply sunscreen daily",
        "Consider acne treatment"
    ],
    "error_message": null,
    "is_completed": true,
    "is_failed": false,
    "can_retry": false,
    "retry_count": 0,
    "max_retries": 3,
    "celery_task_id": "task_id",
    "created_at": "2025-08-31T21:50:10Z",
    "updated_at": "2025-08-31T21:50:17Z",
    "completed_at": "2025-08-31T21:50:17Z"
}
```

#### 4. Retry Failed Analysis

**POST** `/api/youcam/analyses/retry/`

Retry a failed analysis that hasn't exceeded max retries.

**Request Body:**

```json
{
  "analysis_id": "uuid"
}
```

#### 5. Get Analysis Statistics

**GET** `/api/youcam/analyses/statistics/`

Get comprehensive statistics about analyses.

**Response:**

```json
{
  "total_analyses": 100,
  "pending_analyses": 5,
  "processing_analyses": 3,
  "completed_analyses": 85,
  "failed_analyses": 7,
  "analyses_by_type": {
    "skin_analysis": 40,
    "face_analyzer": 30,
    "hair_extension": 20,
    "lips_analysis": 10
  },
  "success_rate": 85.0,
  "average_processing_time": 12.5
}
```

### History Endpoints

#### 1. List Analysis History

**GET** `/api/youcam/history/`

Get analysis history for the authenticated user.

#### 2. Submit Feedback

**POST** `/api/youcam/history/{id}/submit_feedback/`

Submit feedback for an analysis.

**Request Body:**

```json
{
  "feedback_rating": 5,
  "feedback_comment": "Great analysis results!"
}
```

## JavaScript Frontend Integration

### Example: Skin Analysis

```javascript
// Submit image for skin analysis
async function submitSkinAnalysis(imageFile) {
  const formData = new FormData();
  formData.append("analysis_type", "skin_analysis");
  formData.append("image", imageFile);

  try {
    const response = await fetch("/api/youcam/analyses/", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    console.log("Analysis submitted:", result);

    // Poll for completion
    return await pollAnalysisStatus(result.analysis_id);
  } catch (error) {
    console.error("Error submitting analysis:", error);
  }
}

// Poll analysis status
async function pollAnalysisStatus(analysisId) {
  const maxAttempts = 30; // 5 minutes max
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`/api/youcam/analyses/${analysisId}/`);
      const analysis = await response.json();

      if (analysis.is_completed) {
        return analysis;
      } else if (analysis.is_failed) {
        throw new Error("Analysis failed: " + analysis.error_message);
      }

      // Wait 10 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 10000));
      attempts++;
    } catch (error) {
      console.error("Error polling analysis status:", error);
      throw error;
    }
  }

  throw new Error("Analysis timeout");
}

// Get analysis statistics
async function getAnalysisStats() {
  try {
    const response = await fetch("/api/youcam/analyses/statistics/");
    const stats = await response.json();
    console.log("Analysis statistics:", stats);
    return stats;
  } catch (error) {
    console.error("Error getting statistics:", error);
  }
}
```

### Example: Face Analysis

```javascript
// Submit image for face analysis
async function submitFaceAnalysis(imageFile) {
  const formData = new FormData();
  formData.append("analysis_type", "face_analyzer");
  formData.append("image", imageFile);

  const response = await fetch("/api/youcam/analyses/", {
    method: "POST",
    body: formData,
  });

  return await response.json();
}
```

### Example: Hair Extension Analysis

```javascript
// Submit image for hair extension analysis
async function submitHairAnalysis(imageFile) {
  const formData = new FormData();
  formData.append("analysis_type", "hair_extension");
  formData.append("image", imageFile);

  const response = await fetch("/api/youcam/analyses/", {
    method: "POST",
    body: formData,
  });

  return await response.json();
}
```

### Example: Lips Analysis

```javascript
// Submit image for lips analysis
async function submitLipsAnalysis(imageFile) {
  const formData = new FormData();
  formData.append("analysis_type", "lips_analysis");
  formData.append("image", imageFile);

  const response = await fetch("/api/youcam/analyses/", {
    method: "POST",
    body: formData,
  });

  return await response.json();
}
```

## Configuration

### Environment Variables

```bash
# YouCam API Credentials
YOUCAM_API_KEY=your_api_key_here
YOUCAM_SECRET_KEY=your_secret_key_here

# Celery Configuration
CELERY_BROKER_URL=amqp://guest:guest@localhost:5672//
CELERY_RESULT_BACKEND=rpc://
```

### Django Settings

```python
# YouCam AI Analysis Configuration
YOUCAM_API_KEY = 'your_api_key_here'
YOUCAM_SECRET_KEY = 'your_secret_key_here'

# Add to INSTALLED_APPS
INSTALLED_APPS = [
    # ... other apps
    'youcam',
]
```

## Error Handling

The API provides comprehensive error handling:

- **400 Bad Request**: Invalid request data
- **404 Not Found**: Analysis not found
- **500 Internal Server Error**: Server or YouCam API error

Error responses include detailed error messages:

```json
{
  "error": "Image size cannot exceed 10MB",
  "field": "image"
}
```

## Rate Limiting

- Maximum image size: 10MB
- Supported formats: JPG, PNG, WebP
- Maximum retry attempts: 3
- Batch processing: Maximum 10 analyses per batch

## Swagger Documentation

Complete API documentation is available at:

- **Swagger UI**: `/api/docs/`
- **ReDoc**: `/api/redoc/`
- **Schema**: `/api/schema/`

## Support

For technical support or questions about the YouCam AI Analysis API, please contact the development team.
