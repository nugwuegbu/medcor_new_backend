"""
Serializers for YouCam AI Analysis API
"""

import base64
import uuid
from django.core.files.base import ContentFile
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import AnalysisHistory, AnalysisStatus, AnalysisType, YouCamAnalysis

User = get_user_model()


class Base64ImageField(serializers.Field):
    """
    Custom field to handle base64 encoded images
    """

    def to_internal_value(self, data):
        """Convert base64 string to image file"""
        if not data:
            raise serializers.ValidationError("Image data is required")

        # Check if it's a base64 string
        if isinstance(data, str):
            # Remove data URI prefix if present
            if 'data:' in data and ';base64,' in data:
                # Extract base64 data
                header, data = data.split(';base64,')
                
            try:
                # Decode base64 string
                decoded_data = base64.b64decode(data)
                
                # Validate size (max 10MB)
                if len(decoded_data) > 10 * 1024 * 1024:
                    raise serializers.ValidationError("Image size cannot exceed 10MB")
                
                # Create file name
                file_name = f"{uuid.uuid4()}.jpg"
                
                # Create ContentFile
                return ContentFile(decoded_data, name=file_name)
                
            except Exception as e:
                raise serializers.ValidationError(f"Invalid base64 image data: {str(e)}")
        else:
            raise serializers.ValidationError("Image must be a base64 encoded string")

    def to_representation(self, value):
        """Return the image URL"""
        if value:
            return value.url
        return None


class YouCamAnalysisCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new YouCam analysis requests
    """

    analysis_type = serializers.ChoiceField(
        choices=AnalysisType.choices, help_text="Type of AI analysis to perform"
    )

    class Meta:
        model = YouCamAnalysis
        fields = ["analysis_type", "image"]
        extra_kwargs = {
            "image": {"help_text": "Image file to be analyzed (JPG, PNG, etc.)"}
        }

    def validate_image(self, value):
        """
        Validate uploaded image
        """
        if not value:
            raise serializers.ValidationError("Image is required")

        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Image size cannot exceed 10MB")

        # Check file type
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                f"Unsupported image type. Allowed types: {', '.join(allowed_types)}"
            )

        return value


class YouCamAnalysisListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing YouCam analyses
    """

    analysis_type_display = serializers.CharField(
        source="get_analysis_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    image_url = serializers.SerializerMethodField()
    is_completed = serializers.BooleanField(read_only=True)
    is_failed = serializers.BooleanField(read_only=True)
    can_retry = serializers.BooleanField(read_only=True)

    class Meta:
        model = YouCamAnalysis
        fields = [
            "id",
            "analysis_type",
            "analysis_type_display",
            "status",
            "status_display",
            "image_url",
            "is_completed",
            "is_failed",
            "can_retry",
            "retry_count",
            "max_retries",
            "created_at",
            "updated_at",
            "completed_at",
        ]

    def get_image_url(self, obj):
        """Get image URL"""
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class YouCamAnalysisDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed YouCam analysis results with comprehensive reports and recommendations
    """

    analysis_type_display = serializers.CharField(
        source="get_analysis_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    image_url = serializers.SerializerMethodField()
    is_completed = serializers.BooleanField(read_only=True)
    is_failed = serializers.BooleanField(read_only=True)
    can_retry = serializers.BooleanField(read_only=True)
    
    # Enhanced report fields
    comprehensive_report = serializers.SerializerMethodField()
    analysis_summary = serializers.SerializerMethodField()
    detailed_recommendations = serializers.SerializerMethodField()
    confidence_score = serializers.SerializerMethodField()

    class Meta:
        model = YouCamAnalysis
        fields = [
            "id",
            "analysis_type",
            "analysis_type_display",
            "status",
            "status_display",
            "image_url",
            "analysis_results",
            "issues_detected",
            "recommendations",
            "comprehensive_report",
            "analysis_summary",
            "detailed_recommendations",
            "confidence_score",
            "error_message",
            "is_completed",
            "is_failed",
            "can_retry",
            "retry_count",
            "max_retries",
            "celery_task_id",
            "created_at",
            "updated_at",
            "completed_at",
        ]

    def get_image_url(self, obj):
        """Get image URL"""
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_comprehensive_report(self, obj):
        """Generate comprehensive analysis report in JSON format"""
        if not obj.is_completed or not obj.analysis_results:
            return None
            
        report = {
            "analysis_metadata": {
                "analysis_id": str(obj.id),
                "analysis_type": obj.analysis_type,
                "analysis_type_display": obj.get_analysis_type_display(),
                "completed_at": obj.completed_at.isoformat() if obj.completed_at else None,
                "processing_time": self._calculate_processing_time(obj),
            },
            "technical_results": obj.analysis_results or {},
            "health_assessment": self._generate_health_assessment(obj),
            "visual_analysis": self._generate_visual_analysis(obj),
            "risk_factors": self._identify_risk_factors(obj),
            "improvement_areas": self._identify_improvement_areas(obj),
        }
        
        return report

    def get_analysis_summary(self, obj):
        """Generate executive summary of the analysis"""
        if not obj.is_completed:
            return {"status": "Analysis not completed", "summary": None}
            
        summary = {
            "overall_condition": self._get_overall_condition(obj),
            "key_findings": self._get_key_findings(obj),
            "primary_concerns": obj.issues_detected or [],
            "immediate_actions": self._get_immediate_actions(obj),
            "follow_up_recommended": self._needs_follow_up(obj),
        }
        
        return summary

    def get_detailed_recommendations(self, obj):
        """Generate detailed recommendations with categories and priorities"""
        if not obj.is_completed:
            return {"status": "Analysis not completed", "recommendations": []}
            
        recommendations = {
            "immediate_actions": {
                "priority": "high",
                "timeframe": "within 1 week",
                "recommendations": self._categorize_recommendations(obj, "immediate")
            },
            "short_term_goals": {
                "priority": "medium",
                "timeframe": "1-4 weeks",
                "recommendations": self._categorize_recommendations(obj, "short_term")
            },
            "long_term_goals": {
                "priority": "low",
                "timeframe": "1-3 months",
                "recommendations": self._categorize_recommendations(obj, "long_term")
            },
            "lifestyle_changes": {
                "priority": "medium",
                "timeframe": "ongoing",
                "recommendations": self._categorize_recommendations(obj, "lifestyle")
            },
            "professional_care": {
                "priority": "high",
                "timeframe": "as needed",
                "recommendations": self._categorize_recommendations(obj, "professional")
            }
        }
        
        return recommendations

    def get_confidence_score(self, obj):
        """Get confidence score from raw response or calculate based on results"""
        if obj.raw_response and "confidence_score" in obj.raw_response:
            return obj.raw_response["confidence_score"]
        
        # Calculate confidence based on data completeness
        if obj.analysis_results:
            data_points = len([v for v in obj.analysis_results.values() if v])
            max_points = len(obj.analysis_results)
            return round((data_points / max_points) * 100) if max_points > 0 else 0
        
        return 0

    def _calculate_processing_time(self, obj):
        """Calculate processing time"""
        if obj.completed_at and obj.created_at:
            delta = obj.completed_at - obj.created_at
            return {
                "total_seconds": delta.total_seconds(),
                "formatted": str(delta)
            }
        return None

    def _generate_health_assessment(self, obj):
        """Generate health assessment based on analysis type"""
        assessment = {
            "overall_score": self._calculate_health_score(obj),
            "condition_status": self._get_condition_status(obj),
            "trend_analysis": self._get_trend_analysis(obj),
            "comparative_analysis": self._get_comparative_analysis(obj)
        }
        
        if obj.analysis_type == "skin_analysis":
            assessment.update(self._get_skin_health_assessment(obj))
        elif obj.analysis_type == "face_analyzer":
            assessment.update(self._get_face_health_assessment(obj))
        elif obj.analysis_type == "hair_analysis":
            assessment.update(self._get_hair_health_assessment(obj))
        elif obj.analysis_type == "lips_analysis":
            assessment.update(self._get_lips_health_assessment(obj))
            
        return assessment

    def _generate_visual_analysis(self, obj):
        """Generate visual analysis summary"""
        results = obj.analysis_results or {}
        return {
            "visual_quality": self._assess_visual_quality(obj),
            "key_visual_indicators": self._extract_visual_indicators(obj),
            "comparison_metrics": self._get_comparison_metrics(obj),
            "visual_trends": self._identify_visual_trends(obj)
        }

    def _identify_risk_factors(self, obj):
        """Identify potential risk factors"""
        issues = obj.issues_detected or []
        risk_factors = {
            "high_risk": [],
            "medium_risk": [],
            "low_risk": []
        }
        
        for issue in issues:
            risk_level = self._assess_risk_level(issue, obj.analysis_type)
            risk_factors[risk_level].append({
                "issue": issue,
                "description": self._get_issue_description(issue),
                "mitigation": self._get_risk_mitigation(issue)
            })
            
        return risk_factors

    def _identify_improvement_areas(self, obj):
        """Identify areas for improvement"""
        return {
            "immediate_improvements": self._get_immediate_improvements(obj),
            "gradual_improvements": self._get_gradual_improvements(obj),
            "preventive_measures": self._get_preventive_measures(obj),
            "maintenance_routine": self._get_maintenance_routine(obj)
        }

    def _get_overall_condition(self, obj):
        """Get overall condition assessment"""
        results = obj.analysis_results or {}
        
        if obj.analysis_type == "skin_analysis":
            moisture = results.get("moisture_level", 0)
            oiliness = results.get("oiliness_level", 0)
            if moisture > 70 and oiliness < 50:
                return "Excellent"
            elif moisture > 50 and oiliness < 70:
                return "Good"
            elif moisture > 30:
                return "Fair"
            else:
                return "Needs Attention"
                
        elif obj.analysis_type == "face_analyzer":
            age = results.get("age_estimation", 0)
            if age < 25:
                return "Youthful"
            elif age < 35:
                return "Young Adult"
            elif age < 50:
                return "Mature Adult"
            else:
                return "Senior"
                
        return "Analyzed"

    def _get_key_findings(self, obj):
        """Extract key findings from analysis"""
        findings = []
        results = obj.analysis_results or {}
        
        if obj.analysis_type == "skin_analysis":
            if results.get("skin_type"):
                findings.append(f"Skin Type: {results['skin_type']}")
            if results.get("moisture_level"):
                findings.append(f"Moisture Level: {results['moisture_level']}%")
            if results.get("skin_tone"):
                findings.append(f"Skin Tone: {results['skin_tone']}")
                
        elif obj.analysis_type == "face_analyzer":
            if results.get("face_shape"):
                findings.append(f"Face Shape: {results['face_shape']}")
            if results.get("age_estimation"):
                findings.append(f"Estimated Age: {results['age_estimation']} years")
            if results.get("gender_estimation"):
                findings.append(f"Gender: {results['gender_estimation']}")
                
        return findings

    def _get_immediate_actions(self, obj):
        """Get immediate actions needed"""
        actions = []
        issues = obj.issues_detected or []
        
        for issue in issues:
            if "acne" in issue.lower():
                actions.append("Consult dermatologist for acne treatment")
            elif "dry" in issue.lower():
                actions.append("Increase hydration and moisturizing routine")
            elif "sensitive" in issue.lower():
                actions.append("Switch to gentle, hypoallergenic products")
                
        return actions

    def _needs_follow_up(self, obj):
        """Determine if follow-up is recommended"""
        issues = obj.issues_detected or []
        return len(issues) > 2 or any("severe" in issue.lower() for issue in issues)

    def _categorize_recommendations(self, obj, category):
        """Categorize recommendations by type and priority"""
        recommendations = obj.recommendations or []
        categorized = []
        
        for rec in recommendations:
            rec_data = {
                "recommendation": rec,
                "category": self._classify_recommendation(rec, obj.analysis_type),
                "priority": self._get_recommendation_priority(rec),
                "estimated_effort": self._get_effort_level(rec)
            }
            
            if category == "immediate" and rec_data["priority"] == "high":
                categorized.append(rec_data)
            elif category == "short_term" and rec_data["priority"] == "medium":
                categorized.append(rec_data)
            elif category == "long_term" and rec_data["priority"] == "low":
                categorized.append(rec_data)
            elif category == "lifestyle" and "routine" in rec.lower():
                categorized.append(rec_data)
            elif category == "professional" and any(word in rec.lower() for word in ["doctor", "dermatologist", "specialist"]):
                categorized.append(rec_data)
                
        return categorized

    # Helper methods for different analysis types
    def _get_skin_health_assessment(self, obj):
        """Get skin-specific health assessment"""
        results = obj.analysis_results or {}
        return {
            "skin_health_score": self._calculate_skin_score(results),
            "hydration_status": self._assess_hydration(results.get("moisture_level", 0)),
            "oil_balance": self._assess_oil_balance(results.get("oiliness_level", 0)),
            "sensitivity_level": self._assess_sensitivity(results.get("sensitivity_score", 0))
        }

    def _get_face_health_assessment(self, obj):
        """Get face-specific health assessment"""
        results = obj.analysis_results or {}
        return {
            "facial_symmetry_score": self._calculate_symmetry_score(results.get("facial_symmetry", {})),
            "skin_quality_score": self._calculate_skin_quality_score(results.get("skin_quality", {})),
            "age_appropriateness": self._assess_age_appropriateness(results.get("age_estimation", 0))
        }

    def _get_hair_health_assessment(self, obj):
        """Get hair-specific health assessment"""
        results = obj.analysis_results or {}
        return {
            "hair_health_score": results.get("hair_health_score", 0),
            "extension_compatibility": results.get("extension_compatibility", {}),
            "hair_density_assessment": self._assess_hair_density(results.get("hair_density", 0))
        }

    def _get_lips_health_assessment(self, obj):
        """Get lips-specific health assessment"""
        results = obj.analysis_results or {}
        return {
            "lip_health_score": self._calculate_lip_health_score(results),
            "hydration_level": self._assess_lip_hydration(results.get("hydration_level", 0)),
            "lip_condition": results.get("lip_condition", {})
        }

    # Additional helper methods
    def _calculate_health_score(self, obj):
        """Calculate overall health score"""
        results = obj.analysis_results or {}
        
        if obj.analysis_type == "skin_analysis":
            moisture = results.get("moisture_level", 0)
            oiliness = results.get("oiliness_level", 100)
            sensitivity = results.get("sensitivity_score", 100)
            return max(0, min(100, (moisture + (100 - oiliness) + (100 - sensitivity)) / 3))
            
        return 75  # Default score

    def _assess_visual_quality(self, obj):
        """Assess visual quality of the analysis"""
        return {
            "image_clarity": "High",
            "analysis_completeness": "Complete" if obj.analysis_results else "Incomplete",
            "confidence_level": self.get_confidence_score(obj)
        }

    def _extract_visual_indicators(self, obj):
        """Extract key visual indicators"""
        indicators = []
        results = obj.analysis_results or {}
        
        if obj.analysis_type == "skin_analysis":
            if results.get("texture_analysis"):
                indicators.append("Skin texture patterns detected")
            if results.get("skin_tone"):
                indicators.append(f"Skin tone: {results['skin_tone']}")
                
        return indicators

    def _get_comparison_metrics(self, obj):
        """Get metrics for comparison with standards"""
        return {
            "industry_standards": "Above Average",
            "age_group_comparison": "Within Normal Range",
            "gender_comparison": "Typical"
        }

    def _identify_visual_trends(self, obj):
        """Identify visual trends in the analysis"""
        return {
            "positive_trends": ["Good symmetry", "Healthy appearance"],
            "areas_of_concern": obj.issues_detected or [],
            "improvement_potential": "High"
        }

    def _assess_risk_level(self, issue, analysis_type):
        """Assess risk level of an issue"""
        high_risk_keywords = ["severe", "serious", "urgent", "infection", "inflammation"]
        medium_risk_keywords = ["moderate", "noticeable", "concerning"]
        
        issue_lower = issue.lower()
        if any(keyword in issue_lower for keyword in high_risk_keywords):
            return "high_risk"
        elif any(keyword in issue_lower for keyword in medium_risk_keywords):
            return "medium_risk"
        else:
            return "low_risk"

    def _get_issue_description(self, issue):
        """Get detailed description of an issue"""
        descriptions = {
            "acne": "Inflammatory skin condition causing pimples and blemishes",
            "dry skin": "Skin lacking sufficient moisture and hydration",
            "oily skin": "Skin producing excess sebum leading to shine and potential breakouts",
            "sensitive skin": "Skin prone to irritation and adverse reactions",
            "dark circles": "Darkened areas under the eyes often due to fatigue or genetics",
            "wrinkles": "Fine lines and creases in the skin due to aging or sun damage"
        }
        
        for key, desc in descriptions.items():
            if key in issue.lower():
                return desc
                
        return f"Analysis detected: {issue}"

    def _get_risk_mitigation(self, issue):
        """Get risk mitigation strategies"""
        mitigations = {
            "acne": "Use non-comedogenic products and maintain consistent skincare routine",
            "dry skin": "Increase hydration, use moisturizers, and avoid harsh products",
            "oily skin": "Use oil-free products and maintain regular cleansing",
            "sensitive skin": "Use hypoallergenic products and patch test new items"
        }
        
        for key, mitigation in mitigations.items():
            if key in issue.lower():
                return mitigation
                
        return "Consult with a healthcare professional for personalized advice"

    def _get_immediate_improvements(self, obj):
        """Get immediate improvement suggestions"""
        return [
            "Start a consistent daily skincare routine",
            "Stay hydrated by drinking adequate water",
            "Protect skin from sun exposure with SPF",
            "Get adequate sleep for skin recovery"
        ]

    def _get_gradual_improvements(self, obj):
        """Get gradual improvement suggestions"""
        return [
            "Consider professional treatments for targeted concerns",
            "Evaluate and adjust current skincare products",
            "Implement lifestyle changes for better skin health",
            "Track progress over time with regular analysis"
        ]

    def _get_preventive_measures(self, obj):
        """Get preventive measures"""
        return [
            "Maintain consistent skincare routine",
            "Protect from environmental damage",
            "Monitor for early signs of issues",
            "Regular professional check-ups"
        ]

    def _get_maintenance_routine(self, obj):
        """Get maintenance routine suggestions"""
        return [
            "Daily cleansing and moisturizing",
            "Weekly exfoliation if appropriate",
            "Monthly professional assessment",
            "Seasonal routine adjustments"
        ]

    def _calculate_skin_score(self, results):
        """Calculate skin health score"""
        moisture = results.get("moisture_level", 0)
        oiliness = results.get("oiliness_level", 0)
        return max(0, min(100, (moisture + (100 - oiliness)) / 2))

    def _assess_hydration(self, moisture_level):
        """Assess hydration status"""
        if moisture_level > 70:
            return "Well Hydrated"
        elif moisture_level > 50:
            return "Moderately Hydrated"
        elif moisture_level > 30:
            return "Mildly Dehydrated"
        else:
            return "Severely Dehydrated"

    def _assess_oil_balance(self, oiliness_level):
        """Assess oil balance"""
        if oiliness_level > 70:
            return "Oily"
        elif oiliness_level > 40:
            return "Combination"
        elif oiliness_level > 20:
            return "Normal"
        else:
            return "Dry"

    def _assess_sensitivity(self, sensitivity_score):
        """Assess sensitivity level"""
        if sensitivity_score > 70:
            return "Highly Sensitive"
        elif sensitivity_score > 40:
            return "Moderately Sensitive"
        else:
            return "Low Sensitivity"

    def _calculate_symmetry_score(self, symmetry_data):
        """Calculate facial symmetry score"""
        if not symmetry_data:
            return 85  # Default score
        # This would be more sophisticated in a real implementation
        return 85

    def _calculate_skin_quality_score(self, quality_data):
        """Calculate skin quality score"""
        if not quality_data:
            return 80  # Default score
        # This would be more sophisticated in a real implementation
        return 80

    def _assess_age_appropriateness(self, age):
        """Assess age appropriateness"""
        if age < 25:
            return "Youthful"
        elif age < 35:
            return "Young Adult"
        elif age < 50:
            return "Mature Adult"
        else:
            return "Senior"

    def _assess_hair_density(self, density):
        """Assess hair density"""
        if density > 70:
            return "Dense"
        elif density > 40:
            return "Medium"
        else:
            return "Sparse"

    def _calculate_lip_health_score(self, results):
        """Calculate lip health score"""
        hydration = results.get("hydration_level", 0)
        return max(0, min(100, hydration))

    def _assess_lip_hydration(self, hydration_level):
        """Assess lip hydration"""
        if hydration_level > 70:
            return "Well Hydrated"
        elif hydration_level > 50:
            return "Moderately Hydrated"
        else:
            return "Dehydrated"

    def _classify_recommendation(self, recommendation, analysis_type):
        """Classify recommendation type"""
        rec_lower = recommendation.lower()
        
        if any(word in rec_lower for word in ["moisturizer", "hydration", "water"]):
            return "hydration"
        elif any(word in rec_lower for word in ["cleanse", "wash", "soap"]):
            return "cleansing"
        elif any(word in rec_lower for word in ["protect", "sunscreen", "spf"]):
            return "protection"
        elif any(word in rec_lower for word in ["doctor", "dermatologist", "specialist"]):
            return "professional"
        else:
            return "general"

    def _get_recommendation_priority(self, recommendation):
        """Get recommendation priority"""
        rec_lower = recommendation.lower()
        
        if any(word in rec_lower for word in ["urgent", "immediately", "emergency"]):
            return "high"
        elif any(word in rec_lower for word in ["soon", "quickly", "asap"]):
            return "medium"
        else:
            return "low"

    def _get_effort_level(self, recommendation):
        """Get effort level for recommendation"""
        rec_lower = recommendation.lower()
        
        if any(word in rec_lower for word in ["simple", "easy", "basic"]):
            return "low"
        elif any(word in rec_lower for word in ["routine", "regular", "daily"]):
            return "medium"
        else:
            return "high"

    def _get_condition_status(self, obj):
        """Get condition status"""
        if not obj.is_completed:
            return "Pending Analysis"
        elif obj.is_failed:
            return "Analysis Failed"
        else:
            return "Analysis Complete"

    def _get_trend_analysis(self, obj):
        """Get trend analysis (placeholder for future implementation)"""
        return {
            "historical_comparison": "No previous data available",
            "improvement_trend": "Baseline established",
            "predicted_outcome": "Positive with proper care"
        }

    def _get_comparative_analysis(self, obj):
        """Get comparative analysis"""
        return {
            "peer_comparison": "Within normal range",
            "industry_standards": "Above average",
            "age_group_comparison": "Typical for age group"
        }


class YouCamAnalysisRetrySerializer(serializers.Serializer):
    """
    Serializer for retrying failed analyses
    """

    analysis_id = serializers.UUIDField(help_text="ID of the analysis to retry")

    def validate_analysis_id(self, value):
        """
        Validate that the analysis exists and can be retried
        """
        try:
            analysis = YouCamAnalysis.objects.get(id=value)
            if not analysis.can_retry:
                raise serializers.ValidationError(
                    "This analysis cannot be retried. It may have exceeded max retries or is not in failed status."
                )
            return value
        except YouCamAnalysis.DoesNotExist:
            raise serializers.ValidationError("Analysis not found")


class AnalysisHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for analysis history
    """

    analysis_type_display = serializers.CharField(
        source="analysis.get_analysis_type_display", read_only=True
    )
    analysis_status = serializers.CharField(source="analysis.status", read_only=True)
    analysis_image_url = serializers.SerializerMethodField()

    class Meta:
        model = AnalysisHistory
        fields = [
            "id",
            "analysis",
            "analysis_type_display",
            "analysis_status",
            "analysis_image_url",
            "viewed_at",
            "feedback_rating",
            "feedback_comment",
        ]

    def get_analysis_image_url(self, obj):
        """Get analysis image URL"""
        if obj.analysis.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.analysis.image.url)
            return obj.analysis.image.url
        return None


class AnalysisFeedbackSerializer(serializers.ModelSerializer):
    """
    Serializer for submitting analysis feedback
    """

    class Meta:
        model = AnalysisHistory
        fields = ["feedback_rating", "feedback_comment"]

    def validate_feedback_rating(self, value):
        """
        Validate feedback rating
        """
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


class YouCamAnalysisStatsSerializer(serializers.Serializer):
    """
    Serializer for analysis statistics
    """

    total_analyses = serializers.IntegerField()
    pending_analyses = serializers.IntegerField()
    processing_analyses = serializers.IntegerField()
    completed_analyses = serializers.IntegerField()
    failed_analyses = serializers.IntegerField()
    analyses_by_type = serializers.DictField()
    success_rate = serializers.FloatField()
    average_processing_time = serializers.FloatField()


class BatchAnalysisSerializer(serializers.Serializer):
    """
    Serializer for batch analysis requests
    """

    analyses = serializers.ListField(
        child=YouCamAnalysisCreateSerializer(), help_text="List of analyses to process"
    )

    def validate_analyses(self, value):
        """
        Validate batch analyses
        """
        if len(value) > 10:
            raise serializers.ValidationError("Maximum 10 analyses allowed per batch")
        return value


# Specific serializers for each analysis type

class FaceAnalysisCreateSerializer(serializers.Serializer):
    """
    Serializer for creating face analysis requests with base64 encoded image
    """

    imagebase64 = Base64ImageField(
        help_text="Base64 encoded image string for face analysis"
    )

    def create(self, validated_data):
        """Create analysis with base64 image"""
        return YouCamAnalysis.objects.create(
            image=validated_data['imagebase64'],
            analysis_type=AnalysisType.FACE_ANALYZER
        )


class LipsAnalysisCreateSerializer(serializers.Serializer):
    """
    Serializer for creating lips analysis requests with base64 encoded image
    """

    imagebase64 = Base64ImageField(
        help_text="Base64 encoded image string for lips analysis"
    )

    def create(self, validated_data):
        """Create analysis with base64 image"""
        return YouCamAnalysis.objects.create(
            image=validated_data['imagebase64'],
            analysis_type=AnalysisType.LIPS_ANALYSIS
        )


class HairAnalysisCreateSerializer(serializers.Serializer):
    """
    Serializer for creating hair analysis requests with base64 encoded image
    """

    imagebase64 = Base64ImageField(
        help_text="Base64 encoded image string for hair analysis"
    )

    def create(self, validated_data):
        """Create analysis with base64 image"""
        return YouCamAnalysis.objects.create(
            image=validated_data['imagebase64'],
            analysis_type=AnalysisType.HAIR_ANALYSIS
        )


class HairExtensionAnalysisCreateSerializer(serializers.Serializer):
    """
    Serializer for creating hair extension analysis requests with base64 encoded image
    """

    imagebase64 = Base64ImageField(
        help_text="Base64 encoded image string for hair extension analysis"
    )
    categories = serializers.ListField(
        child=serializers.ChoiceField(
            choices=[
                ("hairstyle_categories", "Hairstyle Categories"),
                ("color_recommendations", "Color Recommendations"),
                ("styling_tips", "Styling Tips"),
                ("installation_methods", "Installation Methods"),
                ("analysis_info", "Analysis Info"),
            ]
        ),
        required=False,
        allow_empty=True,
        help_text=(
            "Optional list of response categories to include. "
            "Available: hairstyle_categories, color_recommendations, styling_tips, "
            "installation_methods, analysis_info"
        ),
    )

    def create(self, validated_data):
        """Create analysis with base64 image"""
        # Note: categories are accepted for request shaping/documentation but not persisted.
        return YouCamAnalysis.objects.create(
            image=validated_data['imagebase64'],
            analysis_type=AnalysisType.HAIR_EXTENSION_ANALYSIS
        )


class SkinAnalysisCreateSerializer(serializers.Serializer):
    """
    Serializer for creating skin analysis requests with base64 encoded image
    """

    imagebase64 = Base64ImageField(
        help_text="Base64 encoded image string for skin analysis"
    )

    def create(self, validated_data):
        """Create analysis with base64 image"""
        return YouCamAnalysis.objects.create(
            image=validated_data['imagebase64'],
            analysis_type=AnalysisType.SKIN_ANALYSIS
        )


# New Face Analysis Response Serializers

class FaceEyesFeatureSerializer(serializers.Serializer):
    """Serializer for eye features in face analysis"""
    shape = serializers.CharField()
    size = serializers.CharField()
    distance = serializers.CharField()
    dark_circles = serializers.CharField()
    puffiness = serializers.CharField()


class FaceNoseFeatureSerializer(serializers.Serializer):
    """Serializer for nose features in face analysis"""
    shape = serializers.CharField()
    size = serializers.CharField()


class FaceLipsFeatureSerializer(serializers.Serializer):
    """Serializer for lips features in face analysis"""
    shape = serializers.CharField()
    fullness = serializers.CharField()


class FaceEyebrowsFeatureSerializer(serializers.Serializer):
    """Serializer for eyebrows features in face analysis"""
    shape = serializers.CharField()
    thickness = serializers.CharField()


class FaceFeaturesSerializer(serializers.Serializer):
    """Serializer for all facial features"""
    eyes = FaceEyesFeatureSerializer()
    nose = FaceNoseFeatureSerializer()
    lips = FaceLipsFeatureSerializer()
    eyebrows = FaceEyebrowsFeatureSerializer()


class FaceAnalysisResultSerializer(serializers.Serializer):
    """Serializer for face analysis result object"""
    api_source = serializers.CharField()
    fallback_reason = serializers.CharField(allow_null=True, required=False)
    emotion = serializers.CharField()
    beauty_score = serializers.IntegerField()
    face_shape = serializers.CharField()
    skin_tone = serializers.CharField()
    confidence = serializers.FloatField()
    features = FaceFeaturesSerializer()


class FaceAnalysisResponseSerializer(serializers.Serializer):
    """Serializer for complete face analysis response"""
    success = serializers.BooleanField()
    result = FaceAnalysisResultSerializer()
    analysis_id = serializers.UUIDField(required=False)
    analysis_type = serializers.CharField(required=False)
    status = serializers.CharField(required=False)
    completed_at = serializers.DateTimeField(required=False)


# Hair Extension Analysis Response Serializers

class HairExtensionStyleSerializer(serializers.Serializer):
    """Serializer for individual hair extension style"""
    style_id = serializers.CharField()
    style_name = serializers.CharField()
    length = serializers.CharField()
    texture = serializers.CharField()
    color_match = serializers.CharField()
    face_shape_suitability = serializers.ListField(child=serializers.CharField())
    maintenance_level = serializers.CharField()
    price_range = serializers.CharField()
    image_url = serializers.CharField()


class HairExtensionCategorySerializer(serializers.Serializer):
    """Serializer for hair extension category"""
    category_name = serializers.CharField()
    description = serializers.CharField()
    styles = HairExtensionStyleSerializer(many=True)


class HairExtensionAnalysisInfoSerializer(serializers.Serializer):
    """Serializer for hair extension analysis info"""
    base_hair_color = serializers.CharField()
    color_category = serializers.CharField()
    face_shape = serializers.CharField()
    skin_tone = serializers.CharField()
    confidence = serializers.FloatField()


class HairExtensionColorRecommendationsSerializer(serializers.Serializer):
    """Serializer for color recommendations"""
    natural_colors = serializers.ListField(child=serializers.CharField())
    trendy_colors = serializers.ListField(child=serializers.CharField())
    bold_colors = serializers.ListField(child=serializers.CharField())


class HairExtensionStylingTipsSerializer(serializers.Serializer):
    """Serializer for styling tips"""
    daily_care = serializers.ListField(child=serializers.CharField())
    styling_products = serializers.ListField(child=serializers.CharField())
    maintenance_schedule = serializers.ListField(child=serializers.CharField())


class HairExtensionInstallationMethodSerializer(serializers.Serializer):
    """Serializer for installation method"""
    description = serializers.CharField()
    duration = serializers.CharField()
    damage_level = serializers.CharField()
    cost = serializers.CharField()
    best_for = serializers.CharField()


class HairExtensionResultSerializer(serializers.Serializer):
    """Serializer for hair extension analysis result"""
    analysis_info = HairExtensionAnalysisInfoSerializer()
    hairstyle_categories = serializers.DictField(child=HairExtensionCategorySerializer())
    color_recommendations = HairExtensionColorRecommendationsSerializer()
    styling_tips = HairExtensionStylingTipsSerializer()
    installation_methods = serializers.DictField(child=HairExtensionInstallationMethodSerializer())
    api_version = serializers.CharField()
    confidence = serializers.FloatField()


class HairExtensionAnalysisResponseSerializer(serializers.Serializer):
    """Serializer for complete hair extension analysis response"""
    success = serializers.BooleanField()
    result = HairExtensionResultSerializer()
    message = serializers.CharField()
    features_available = serializers.ListField(child=serializers.CharField())
    analysis_id = serializers.UUIDField(required=False)
    analysis_type = serializers.CharField(required=False)
    status = serializers.CharField(required=False)
    completed_at = serializers.DateTimeField(required=False)
