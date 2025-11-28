# YouCam Enhanced API Documentation

## Overview

The YouCam AI Analysis API has been significantly enhanced to provide comprehensive reports and detailed recommendations in structured JSON format. All analysis endpoints now return rich, actionable insights with health assessments, risk factors, and categorized recommendations.

## 🚀 Key Enhancements

### ✅ **Comprehensive Reports**

- **Structured JSON Reports**: Complete analysis data with metadata, health assessment, and visual analysis
- **Health Assessment Scores**: Calculated health scores based on analysis type and results
- **Risk Factor Analysis**: Categorized risk factors by severity (high, medium, low)
- **Improvement Areas**: Identified areas for improvement with action plans

### ✅ **Enhanced Recommendations**

- **Categorized Recommendations**: Organized by priority and timeframe
- **Priority Levels**: High, medium, and low priority actions
- **Timeframes**: Immediate (1 week), short-term (1-4 weeks), long-term (1-3 months)
- **Effort Levels**: Low, medium, and high effort requirements

### ✅ **Analysis Summaries**

- **Executive Summary**: Key findings and overall condition assessment
- **Immediate Actions**: Urgent recommendations for quick implementation
- **Follow-up Guidance**: Recommendations for ongoing care and monitoring

### ✅ **Export Functionality**

- **JSON Export**: Complete structured data for programmatic use
- **PDF Export**: Human-readable reports (planned for future implementation)
- **Metadata**: Export timestamps and version information

## 📊 API Endpoints

### **Base URL**

```
/api/youcam/
```

### **API Structure**

The YouCam API is organized by analysis type. Each analysis type has its own dedicated endpoints:

- **Face Analysis**: `/api/youcam/face-analysis/`
- **Lips Analysis**: `/api/youcam/lips-analysis/`
- **Skin Analysis**: `/api/youcam/skin-analysis/`
- **Hair Extension Analysis**: `/api/youcam/hair-extension/`

Each analysis type supports the following operations:

- Create new analysis (POST)
- List analyses (GET)
- Retrieve specific analysis (GET `/{id}/`)
- Get comprehensive report (GET `/{id}/comprehensive-report/`)
- Get health summary (GET `/{id}/health-summary/`)
- Get detailed recommendations (GET `/{id}/detailed-recommendations/`)
- Export analysis report (GET `/{id}/export-report/`)

### **⚠️ Important: Synchronous Processing**

**All YouCam analysis endpoints now process requests synchronously and return complete results immediately.** No more pending/queued responses - you'll get the full analysis results, comprehensive reports, and recommendations in a single API call.

#### **New Response Format (Immediate Results)**

**For Face Analysis:**

The response includes a core structure with `success` and `result`, plus optional metadata fields for tracking:

```json
{
  "success": true,
  "result": {
    "api_source": "Fallback_Analysis",
    "fallback_reason": "fetch failed",
    "emotion": "Happy",
    "beauty_score": 98,
    "face_shape": "Heart",
    "skin_tone": "Medium",
    "confidence": 0.942726016839419,
    "features": {
      "eyes": {
        "shape": "Monolid",
        "size": "Small",
        "distance": "Normal",
        "dark_circles": "None",
        "puffiness": "None"
      },
      "nose": {
        "shape": "Straight",
        "size": "Medium"
      },
      "lips": {
        "shape": "Heart-shaped",
        "fullness": "Medium"
      },
      "eyebrows": {
        "shape": "Arched",
        "thickness": "Thick"
      }
    }
  },
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
  "analysis_type": "AI Face Analyzer",
  "status": "completed",
  "completed_at": "2025-10-14T12:00:00Z"
}
```

**Core Response Fields:**

- `success` (boolean): Indicates if the analysis was successful
- `result` (object): Contains the complete face analysis data
  - `api_source` (string): Source of the analysis (e.g., "Fallback_Analysis", "YouCam_API")
  - `fallback_reason` (string|null): Reason for fallback if applicable (e.g., "fetch failed")
  - `emotion` (string): Detected emotion
  - `beauty_score` (integer): Beauty score from 0-100
  - `face_shape` (string): Detected face shape
  - `skin_tone` (string): Detected skin tone
  - `confidence` (float): Confidence score of the analysis (0-1)
  - `features` (object): Detailed facial features

**Optional Metadata Fields (for tracking):**

- `analysis_id` (UUID): Unique identifier for the analysis
- `analysis_type` (string): Type of analysis performed
- `status` (string): Current status of the analysis
- `completed_at` (datetime): When the analysis was completed

**For Other Analysis Types (Skin, Lips, Hair):**

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

#### **Old Response Format (Deprecated - No Longer Used)**

```json
{
  "message": "Face analysis request created successfully and queued for processing.",
  "analysis_id": "uuid",
  "analysis_type": "Face Analysis",
  "status": "pending",
  "task_id": "celery-task-id"
}
```

### **Enhanced Analysis Endpoints**

#### 0. **Create Analysis (All Types)**

**POST** `/api/youcam/{analysis-type}/`

Create a new analysis by sending a base64 encoded image in JSON format.

Examples:

- `POST /api/youcam/face-analysis/`
- `POST /api/youcam/lips-analysis/`
- `POST /api/youcam/skin-analysis/`
- `POST /api/youcam/hair-extension/`

**Request Format:**

- **Content-Type**: `application/json`
- **Request Body**:

```json
{
  "imagebase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
}
```

**Note**: The `imagebase64` field accepts:

- Full data URI: `data:image/jpeg;base64,BASE64_STRING`
- Base64 string only: `BASE64_STRING`
- Maximum size: 10MB (decoded)
- Supported formats: JPEG, PNG, WebP

**Response**: Returns complete analysis results immediately (see "New Response Format" above)

#### 1. **Get Analysis Details (Enhanced)**

**Note:** Each analysis type has its own endpoint. Replace `{analysis-type}` with one of: `face-analysis`, `lips-analysis`, `skin-analysis`, or `hair-extension`.

**GET** `/api/youcam/{analysis-type}/{id}/`

Examples:

- `/api/youcam/face-analysis/{id}/`
- `/api/youcam/lips-analysis/{id}/`
- `/api/youcam/skin-analysis/{id}/`
- `/api/youcam/hair-extension/{id}/`

**Response Structure:**

```json
{
  "id": "uuid",
  "analysis_type": "skin_analysis",
  "analysis_type_display": "AI Skin Analysis",
  "status": "completed",
  "status_display": "Completed",
  "image_url": "http://example.com/image.jpg",
  "analysis_results": {
    "skin_type": "Combination",
    "moisture_level": 65,
    "oiliness_level": 45,
    "sensitivity_score": 25,
    "age_estimation": 28,
    "skin_tone": "Medium"
  },
  "issues_detected": ["Mild dehydration detected", "Some visible pores"],
  "recommendations": [
    "Use a hydrating moisturizer daily",
    "Apply sunscreen with SPF 30+"
  ],
  "comprehensive_report": {
    "analysis_metadata": {
      "analysis_id": "uuid",
      "analysis_type": "skin_analysis",
      "completed_at": "2025-01-15T10:30:00Z",
      "processing_time": {
        "total_seconds": 2.3,
        "formatted": "0:00:02.300000"
      }
    },
    "technical_results": {
      "skin_type": "Combination",
      "moisture_level": 65,
      "oiliness_level": 45
    },
    "health_assessment": {
      "overall_score": 65.0,
      "condition_status": "Analysis Complete",
      "skin_health_score": 60.0,
      "hydration_status": "Moderately Hydrated",
      "oil_balance": "Combination",
      "sensitivity_level": "Low Sensitivity"
    },
    "visual_analysis": {
      "visual_quality": {
        "image_clarity": "High",
        "analysis_completeness": "Complete",
        "confidence_level": 87
      },
      "key_visual_indicators": [
        "Skin texture patterns detected",
        "Skin tone: Medium"
      ]
    },
    "risk_factors": {
      "high_risk": [],
      "medium_risk": [],
      "low_risk": [
        {
          "issue": "Mild dehydration detected",
          "description": "Skin lacking sufficient moisture and hydration",
          "mitigation": "Increase hydration, use moisturizers, and avoid harsh products"
        }
      ]
    },
    "improvement_areas": {
      "immediate_improvements": [
        "Start a consistent daily skincare routine",
        "Stay hydrated by drinking adequate water"
      ],
      "gradual_improvements": [
        "Consider professional treatments for targeted concerns"
      ]
    }
  },
  "analysis_summary": {
    "overall_condition": "Good",
    "key_findings": [
      "Skin Type: Combination",
      "Moisture Level: 65%",
      "Skin Tone: Medium"
    ],
    "primary_concerns": ["Mild dehydration detected", "Some visible pores"],
    "immediate_actions": ["Increase hydration and moisturizing routine"],
    "follow_up_recommended": true
  },
  "detailed_recommendations": {
    "immediate_actions": {
      "priority": "high",
      "timeframe": "within 1 week",
      "recommendations": [
        {
          "recommendation": "Consult dermatologist for acne treatment",
          "category": "professional",
          "priority": "high",
          "estimated_effort": "medium"
        }
      ]
    },
    "short_term_goals": {
      "priority": "medium",
      "timeframe": "1-4 weeks",
      "recommendations": []
    },
    "long_term_goals": {
      "priority": "low",
      "timeframe": "1-3 months",
      "recommendations": [
        {
          "recommendation": "Use a hydrating moisturizer daily",
          "category": "hydration",
          "priority": "low",
          "estimated_effort": "low"
        }
      ]
    },
    "lifestyle_changes": {
      "priority": "medium",
      "timeframe": "ongoing",
      "recommendations": []
    },
    "professional_care": {
      "priority": "high",
      "timeframe": "as needed",
      "recommendations": [
        {
          "recommendation": "Consult dermatologist for professional assessment",
          "category": "professional",
          "priority": "high",
          "estimated_effort": "medium"
        }
      ]
    }
  },
  "confidence_score": 87,
  "is_completed": true,
  "is_failed": false,
  "created_at": "2025-01-15T10:30:00Z",
  "completed_at": "2025-01-15T10:30:02Z"
}
```

#### 2. **Get Comprehensive Report**

**GET** `/api/youcam/{analysis-type}/{id}/comprehensive-report/`

Examples:

- `/api/youcam/skin-analysis/{id}/comprehensive-report/`
- `/api/youcam/face-analysis/{id}/comprehensive-report/`
- `/api/youcam/lips-analysis/{id}/comprehensive-report/`
- `/api/youcam/hair-extension/{id}/comprehensive-report/`

**Description:** Retrieve a comprehensive analysis report with detailed health assessment, risk factors, and structured recommendations in JSON format.

**Response:**

```json
{
  "success": true,
  "analysis_id": "uuid",
  "analysis_type": "AI Skin Analysis",
  "comprehensive_report": {
    // Complete comprehensive report structure as shown above
  }
}
```

#### 3. **Get Health Assessment Summary**

**GET** `/api/youcam/{analysis-type}/{id}/health-summary/`

Examples:

- `/api/youcam/skin-analysis/{id}/health-summary/`
- `/api/youcam/face-analysis/{id}/health-summary/`

**Description:** Retrieve a concise health assessment summary with key findings and immediate actions.

**Response:**

```json
{
  "success": true,
  "analysis_id": "uuid",
  "analysis_type": "AI Skin Analysis",
  "health_summary": {
    "overall_condition": "Good",
    "key_findings": [
      "Skin Type: Combination",
      "Moisture Level: 65%",
      "Skin Tone: Medium"
    ],
    "primary_concerns": ["Mild dehydration detected", "Some visible pores"],
    "immediate_actions": ["Increase hydration and moisturizing routine"],
    "follow_up_recommended": true
  }
}
```

#### 4. **Get Detailed Recommendations**

**GET** `/api/youcam/{analysis-type}/{id}/detailed-recommendations/`

Examples:

- `/api/youcam/skin-analysis/{id}/detailed-recommendations/`
- `/api/youcam/face-analysis/{id}/detailed-recommendations/`

**Description:** Retrieve detailed recommendations categorized by priority and timeframe.

**Response:**

```json
{
  "success": true,
  "analysis_id": "uuid",
  "analysis_type": "AI Skin Analysis",
  "detailed_recommendations": {
    "immediate_actions": {
      "priority": "high",
      "timeframe": "within 1 week",
      "recommendations": [
        {
          "recommendation": "Consult dermatologist for acne treatment",
          "category": "professional",
          "priority": "high",
          "estimated_effort": "medium"
        }
      ]
    },
    "short_term_goals": {
      "priority": "medium",
      "timeframe": "1-4 weeks",
      "recommendations": []
    },
    "long_term_goals": {
      "priority": "low",
      "timeframe": "1-3 months",
      "recommendations": [
        {
          "recommendation": "Use a hydrating moisturizer daily",
          "category": "hydration",
          "priority": "low",
          "estimated_effort": "low"
        }
      ]
    },
    "lifestyle_changes": {
      "priority": "medium",
      "timeframe": "ongoing",
      "recommendations": []
    },
    "professional_care": {
      "priority": "high",
      "timeframe": "as needed",
      "recommendations": [
        {
          "recommendation": "Consult dermatologist for professional assessment",
          "category": "professional",
          "priority": "high",
          "estimated_effort": "medium"
        }
      ]
    }
  }
}
```

#### 5. **Export Analysis Report**

**GET** `/api/youcam/{analysis-type}/{id}/export-report/?format=json`

Examples:

- `/api/youcam/skin-analysis/{id}/export-report/?format=json`
- `/api/youcam/face-analysis/{id}/export-report/?format=json`

**Description:** Export comprehensive analysis report in JSON format.

**Query Parameters:**

- `format` (optional): Export format (`json`, `pdf`) - defaults to `json`

**Response:**

```json
{
  "export_metadata": {
    "exported_at": "2025-01-15T10:30:00Z",
    "analysis_id": "uuid",
    "analysis_type": "AI Skin Analysis",
    "format": "json",
    "version": "1.0"
  },
  "comprehensive_report": {
    // Complete comprehensive report structure
  }
}
```

## 🎯 Analysis Types Supported

### **1. Skin Analysis**

- **Health Metrics**: Moisture level, oiliness, sensitivity score
- **Skin Assessment**: Skin type, tone, texture analysis
- **Age Estimation**: AI-powered age assessment
- **Specific Recommendations**: Hydration, cleansing, protection

### **2. Face Analyzer**

Returns a comprehensive face analysis with the following structure:

**Core Analysis Data:**

- `api_source`: Source of analysis ("Fallback_Analysis" for fallback, "YouCam_API" for live API)
- `fallback_reason`: Reason for fallback if API fetch failed (null if successful)
- `emotion`: Detected emotion (e.g., "Happy", "Neutral", "Sad")
- `beauty_score`: AI-powered beauty assessment (0-100 scale)
- `face_shape`: Detected face shape (e.g., "Heart", "Oval", "Square")
- `skin_tone`: Automated skin tone classification (e.g., "Fair", "Medium", "Dark")
- `confidence`: Confidence score of the analysis (0-1 float)

**Detailed Facial Features:**

- **Eyes**:
  - Shape (e.g., "Monolid", "Almond", "Round")
  - Size (e.g., "Small", "Medium", "Large")
  - Distance (e.g., "Normal", "Close", "Wide")
  - Dark circles assessment (e.g., "None", "Mild", "Moderate")
  - Puffiness level (e.g., "None", "Mild", "Moderate")
- **Nose**:
  - Shape (e.g., "Straight", "Button", "Roman")
  - Size (e.g., "Small", "Medium", "Large")
- **Lips**:
  - Shape (e.g., "Heart-shaped", "Full", "Thin")
  - Fullness (e.g., "Thin", "Medium", "Full")
- **Eyebrows**:
  - Shape (e.g., "Arched", "Straight", "Curved")
  - Thickness (e.g., "Thin", "Medium", "Thick")

### **3. Hair Extension Analysis**

- **Hair Quality**: Health score, density assessment
- **Extension Compatibility**: Suitability for extensions
- **Hair Characteristics**: Type, color, length analysis
- **Care Recommendations**: Maintenance and styling advice

### **4. Lips Analysis**

- **Lip Condition**: Shape, size, symmetry analysis
- **Hydration Level**: Moisture assessment
- **Color Analysis**: Natural lip color detection
- **Care Recommendations**: Hydration and protection advice

## 📈 Health Assessment Features

### **Scoring System**

- **Overall Health Score**: 0-100 scale based on analysis type
- **Confidence Score**: Analysis accuracy and data completeness
- **Risk Assessment**: Categorized by severity levels
- **Improvement Potential**: Areas for enhancement

### **Condition Status**

- **Excellent**: Optimal health indicators
- **Good**: Above average with minor concerns
- **Fair**: Moderate issues requiring attention
- **Needs Attention**: Significant concerns requiring intervention

### **Risk Factor Categories**

- **High Risk**: Severe issues requiring immediate attention
- **Medium Risk**: Moderate concerns needing monitoring
- **Low Risk**: Minor issues for preventive care

## 🔧 Recommendation Categories

### **Priority Levels**

- **High Priority**: Urgent actions requiring immediate attention
- **Medium Priority**: Important actions for short-term improvement
- **Low Priority**: Long-term goals for sustained health

### **Timeframes**

- **Immediate**: Within 1 week
- **Short-term**: 1-4 weeks
- **Long-term**: 1-3 months
- **Ongoing**: Lifestyle changes for continuous improvement

### **Effort Levels**

- **Low Effort**: Simple daily routines and habits
- **Medium Effort**: Regular maintenance and care routines
- **High Effort**: Professional treatments and significant lifestyle changes

### **Recommendation Types**

- **Hydration**: Moisturizing and water intake recommendations
- **Cleansing**: Washing and cleansing routine advice
- **Protection**: Sun protection and environmental care
- **Professional**: Medical and specialist consultations
- **General**: Overall health and wellness recommendations

## 🚀 Usage Examples

### **Example 1: Get Complete Skin Analysis Report**

```bash
curl -X GET "https://api.medcor.ai/api/youcam/skin-analysis/{analysis_id}/comprehensive-report/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Example 2: Get Face Analysis Health Summary**

```bash
curl -X GET "https://api.medcor.ai/api/youcam/face-analysis/{analysis_id}/health-summary/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Example 3: Export Lips Analysis Report**

```bash
curl -X GET "https://api.medcor.ai/api/youcam/lips-analysis/{analysis_id}/export-report/?format=json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Example 4: Get Skin Analysis Recommendations by Priority**

```bash
curl -X GET "https://api.medcor.ai/api/youcam/skin-analysis/{analysis_id}/detailed-recommendations/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Response Status Codes

- **200 OK**: Successful request with complete data
- **400 Bad Request**: Analysis not completed or invalid parameters
- **404 Not Found**: Analysis ID not found
- **500 Internal Server Error**: Server error during processing

## 🔒 Authentication

All endpoints require proper authentication:

- **Bearer Token**: Include in Authorization header
- **API Key**: Include in X-API-Key header
- **Session**: Valid user session for authenticated requests

## 📝 Error Handling

### **Common Error Responses**

```json
{
  "error": "Analysis not completed",
  "message": "Please wait for the analysis to complete before requesting the comprehensive report.",
  "current_status": "processing",
  "analysis_id": "uuid"
}
```

### **Validation Errors**

```json
{
  "error": "Invalid export format",
  "message": "Supported formats: json, pdf",
  "provided_format": "xml"
}
```

## 🎯 Integration Examples

### **Frontend Integration**

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

// Create skin analysis with base64 image
const createSkinAnalysis = async (imageFile) => {
  const imagebase64 = await fileToBase64(imageFile);

  const response = await fetch("/api/youcam/skin-analysis/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imagebase64 }),
  });

  return await response.json();
};

// Get comprehensive report for skin analysis
const getComprehensiveReport = async (
  analysisId,
  analysisType = "skin-analysis"
) => {
  const response = await fetch(
    `/api/youcam/${analysisType}/${analysisId}/comprehensive-report/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (data.success) {
    const report = data.comprehensive_report;
    const healthScore = report.health_assessment.overall_score;
    const recommendations = report.detailed_recommendations;

    // Display health score
    displayHealthScore(healthScore);

    // Show recommendations by priority
    displayRecommendations(recommendations.immediate_actions);
    displayRecommendations(recommendations.short_term_goals);
  }
};
```

### **Mobile App Integration**

```swift
// Swift example for iOS
func getHealthSummary(analysisId: String, analysisType: String = "skin-analysis") async throws -> HealthSummary {
    let url = URL(string: "\(baseURL)/api/youcam/\(analysisType)/\(analysisId)/health-summary/")!
    var request = URLRequest(url: url)
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

    let (data, _) = try await URLSession.shared.data(for: request)
    let response = try JSONDecoder().decode(HealthSummaryResponse.self, from: data)

    return response.health_summary
}
```

## 🔄 Migration Guide

### **From Basic to Enhanced API**

1. **Update API Calls**: Use new endpoint URLs for enhanced reports
2. **Handle New Fields**: Process additional fields in response data
3. **Implement Categorization**: Use recommendation categories and priorities
4. **Add Health Scores**: Display health assessment scores in UI
5. **Export Functionality**: Implement report export features

### **Backward Compatibility**

- All existing endpoints remain functional
- Enhanced fields are additive and optional
- Basic analysis results still available in original format

## 📈 Performance Considerations

- **Caching**: Comprehensive reports can be cached for completed analyses
- **Pagination**: Large recommendation lists are automatically paginated
- **Compression**: JSON responses support gzip compression
- **Rate Limiting**: API calls are rate-limited per user/IP

## 🎯 Future Enhancements

### **Planned Features**

- **PDF Export**: Human-readable report generation
- **Historical Comparison**: Trend analysis over time
- **Personalized Recommendations**: AI-powered custom suggestions
- **Integration APIs**: Third-party health app integrations
- **Real-time Updates**: WebSocket support for live analysis updates

### **Advanced Analytics**

- **Predictive Health**: AI-powered health trend predictions
- **Comparative Analysis**: Benchmark against population data
- **Treatment Effectiveness**: Track improvement over time
- **Risk Stratification**: Advanced risk assessment algorithms

---

**Last Updated**: January 2025  
**Version**: 2.0.0  
**Status**: Production Ready ✅

## 📞 Support

For technical support or questions about the enhanced YouCam API:

- **Documentation**: [API Documentation](https://docs.medcor.ai/youcam-api)
- **Support Email**: api-support@medcor.ai
- **GitHub Issues**: [Report Issues](https://github.com/medcor/backend/issues)
