# YouCam AI Analysis API

A comprehensive Django REST API for AI-powered image analysis using YouCam technology. This API provides endpoints for skin analysis, face analysis, hair extension analysis, and lips analysis with asynchronous processing using Celery.

## Features

- **AI Skin Analysis**: Analyze skin condition, type, moisture, oiliness, and detect issues
- **AI Face Analyzer**: Analyze facial features, symmetry, emotions, and age estimation
- **AI Hair Extension**: Analyze hair quality, type, color, and extension compatibility
- **AI Lips Analysis**: Analyze lip shape, size, color, condition, and hydration
- **Synchronous Processing**: All analyses are processed synchronously and return immediate results
- **Comprehensive Results**: Detailed analysis results, issues detected, and recommendations
- **Comprehensive Reports**: Detailed health assessments, risk factors, and recommendations
- **Multiple Report Formats**: JSON reports with detailed analysis data
- **Swagger Documentation**: Complete API documentation with examples

## API Endpoints

### Base URL

```
/api/youcam/
```

### API Structure

The YouCam API is organized by analysis type. Each analysis type has its own dedicated endpoints:

- **Face Analysis**: `/api/youcam/face-analysis/`
- **Lips Analysis**: `/api/youcam/lips-analysis/`
- **Skin Analysis**: `/api/youcam/skin-analysis/`
- **Hair Extension Analysis**: `/api/youcam/hair-extension/`

### Analysis Endpoints

Each analysis type supports the same operations. Replace `{analysis-type}` with one of: `face-analysis`, `lips-analysis`, `skin-analysis`, or `hair-extension`.

#### 1. Create Analysis

**POST** `/api/youcam/{analysis-type}/`

Submit a new image for AI analysis. The analysis is processed synchronously and returns complete results immediately.

**Request Body (application/json):**

```json
{
  "imagebase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
}
```

**Note:** The `imagebase64` field should contain a base64 encoded image string. You can optionally include the data URI prefix (`data:image/jpeg;base64,`) or just the base64 string.

**Response (Immediate Results):**

```json
{
  "message": "AI analysis completed successfully.",
  "analysis_id": "uuid",
  "analysis_type": "Skin Analysis",
  "status": "completed",
  "completed_at": "2025-09-25T...",
  "comprehensive_report": { ... },
  "analysis_summary": { ... },
  "detailed_recommendations": { ... },
  "confidence_score": 94
}
```

#### 2. List Analyses

**GET** `/api/youcam/{analysis-type}/`

Retrieve a list of all analyses for the specific analysis type with optional filtering.

**Query Parameters:**

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
      "created_at": "2025-08-31T21:50:10Z",
      "updated_at": "2025-08-31T21:50:17Z",
      "completed_at": "2025-08-31T21:50:17Z"
    }
  ]
}
```

#### 3. Get Analysis Details

**GET** `/api/youcam/{analysis-type}/{id}/`

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
        "oiliness_level": 60
    },
    "issues_detected": [
        "Acne spots detected",
        "Dark circles under eyes"
    ],
    "recommendations": [
        "Use oil-free moisturizer",
        "Apply sunscreen daily"
    ],
    "comprehensive_report": { ... },
    "analysis_summary": { ... },
    "detailed_recommendations": { ... },
    "confidence_score": 87,
    "is_completed": true,
    "is_failed": false,
    "created_at": "2025-08-31T21:50:10Z",
    "completed_at": "2025-08-31T21:50:17Z"
}
```

### Report Endpoints

All report endpoints are available for each analysis type.

#### 4. Get Comprehensive Report

**GET** `/api/youcam/{analysis-type}/{id}/comprehensive-report/`

Retrieve a comprehensive analysis report with detailed health assessment and recommendations.

#### 5. Get Health Summary

**GET** `/api/youcam/{analysis-type}/{id}/health-summary/`

Retrieve a concise health assessment summary with key findings.

#### 6. Get Detailed Recommendations

**GET** `/api/youcam/{analysis-type}/{id}/detailed-recommendations/`

Retrieve detailed recommendations categorized by priority and timeframe.

#### 7. Export Analysis Report

**GET** `/api/youcam/{analysis-type}/{id}/export-report/?format=json`

Export comprehensive analysis report in JSON format.

## JavaScript Frontend Integration

### Example: Skin Analysis (Synchronous)

```javascript
// Convert image file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

// Submit image for skin analysis - returns complete results immediately
async function submitSkinAnalysis(imageFile) {
  try {
    // Convert image to base64
    const imagebase64 = await fileToBase64(imageFile);

    const response = await fetch("/api/youcam/skin-analysis/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imagebase64 }),
    });

    const result = await response.json();
    console.log("Analysis completed:", result);

    // Result includes immediate complete analysis:
    // - comprehensive_report
    // - analysis_summary
    // - detailed_recommendations
    // - confidence_score

    return result;
  } catch (error) {
    console.error("Error submitting analysis:", error);
  }
}

// Get comprehensive report
async function getComprehensiveReport(analysisId) {
  try {
    const response = await fetch(
      `/api/youcam/skin-analysis/${analysisId}/comprehensive-report/`
    );
    const report = await response.json();
    console.log("Comprehensive report:", report);
    return report;
  } catch (error) {
    console.error("Error getting report:", error);
  }
}

// Get health summary
async function getHealthSummary(analysisId) {
  try {
    const response = await fetch(
      `/api/youcam/skin-analysis/${analysisId}/health-summary/`
    );
    const summary = await response.json();
    console.log("Health summary:", summary);
    return summary;
  } catch (error) {
    console.error("Error getting summary:", error);
  }
}
```

### Example: Face Analysis

```javascript
// Submit image for face analysis - returns complete results immediately
async function submitFaceAnalysis(imageFile) {
  const imagebase64 = await fileToBase64(imageFile);

  const response = await fetch("/api/youcam/face-analysis/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imagebase64 }),
  });

  return await response.json();
}
```

### Example: Hair Extension Analysis

```javascript
// Submit image for hair extension analysis
async function submitHairAnalysis(imageFile) {
  const imagebase64 = await fileToBase64(imageFile);

  const response = await fetch("/api/youcam/hair-extension/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imagebase64 }),
  });

  return await response.json();
}
```

### Example: Lips Analysis

```javascript
// Submit image for lips analysis
async function submitLipsAnalysis(imageFile) {
  const imagebase64 = await fileToBase64(imageFile);

  const response = await fetch("/api/youcam/lips-analysis/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imagebase64 }),
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
