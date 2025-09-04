"""
YouCam API Client for AI Analysis
"""

import base64
import io
import logging
from typing import Any, Dict, Optional

import requests
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from PIL import Image

logger = logging.getLogger(__name__)


class YouCamAPIError(Exception):
    """Custom exception for YouCam API errors"""

    pass


class YouCamClient:
    """
    Client for interacting with YouCam AI Analysis API
    """

    def __init__(self):
        self.api_key = getattr(settings, "YOUCAM_API_KEY", None)
        self.secret_key = getattr(settings, "YOUCAM_SECRET_KEY", None)
        self.base_url = "https://api.youcam.com/v1"  # Update with actual YouCam API URL

        if not self.api_key or not self.secret_key:
            raise ValueError("YouCam API credentials not configured")

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for API requests"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "X-Secret-Key": self.secret_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _prepare_image(self, image_file) -> str:
        """
        Convert image file to base64 string for API upload
        """
        try:
            if isinstance(image_file, UploadedFile):
                image_data = image_file.read()
            else:
                with open(image_file.path, "rb") as f:
                    image_data = f.read()

            # Convert to base64
            base64_image = base64.b64encode(image_data).decode("utf-8")
            return base64_image
        except Exception as e:
            logger.error(f"Error preparing image: {str(e)}")
            raise YouCamAPIError(f"Failed to prepare image: {str(e)}")

    def _make_request(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make API request to YouCam
        """
        try:
            url = f"{self.base_url}/{endpoint}"
            headers = self._get_headers()

            logger.info(f"Making request to YouCam API: {endpoint}")
            response = requests.post(url, json=data, headers=headers, timeout=30)

            if response.status_code == 200:
                return response.json()
            else:
                error_msg = (
                    f"YouCam API error: {response.status_code} - {response.text}"
                )
                logger.error(error_msg)
                raise YouCamAPIError(error_msg)

        except requests.exceptions.RequestException as e:
            error_msg = f"Network error calling YouCam API: {str(e)}"
            logger.error(error_msg)
            raise YouCamAPIError(error_msg)

    def analyze_skin(self, image_file) -> Dict[str, Any]:
        """
        Perform AI Skin Analysis

        Args:
            image_file: Image file to analyze

        Returns:
            Dict containing skin analysis results
        """
        try:
            base64_image = self._prepare_image(image_file)

            data = {
                "image": base64_image,
                "analysis_type": "skin_analysis",
                "options": {
                    "detailed_analysis": True,
                    "include_recommendations": True,
                    "detect_issues": True,
                },
            }

            result = self._make_request("analyze/skin", data)
            return self._process_skin_analysis(result)

        except Exception as e:
            logger.error(f"Skin analysis failed: {str(e)}")
            raise YouCamAPIError(f"Skin analysis failed: {str(e)}")

    def analyze_face(self, image_file) -> Dict[str, Any]:
        """
        Perform AI Face Analysis

        Args:
            image_file: Image file to analyze

        Returns:
            Dict containing face analysis results
        """
        try:
            base64_image = self._prepare_image(image_file)

            data = {
                "image": base64_image,
                "analysis_type": "face_analysis",
                "options": {
                    "detailed_analysis": True,
                    "include_recommendations": True,
                    "detect_issues": True,
                    "facial_features": True,
                },
            }

            result = self._make_request("analyze/face", data)
            return self._process_face_analysis(result)

        except Exception as e:
            logger.error(f"Face analysis failed: {str(e)}")
            raise YouCamAPIError(f"Face analysis failed: {str(e)}")

    def analyze_hair_extension(self, image_file) -> Dict[str, Any]:
        """
        Perform AI Hair Extension Analysis

        Args:
            image_file: Image file to analyze

        Returns:
            Dict containing hair extension analysis results
        """
        try:
            base64_image = self._prepare_image(image_file)

            data = {
                "image": base64_image,
                "analysis_type": "hair_extension",
                "options": {
                    "detailed_analysis": True,
                    "include_recommendations": True,
                    "detect_issues": True,
                    "hair_quality": True,
                },
            }

            result = self._make_request("analyze/hair", data)
            return self._process_hair_analysis(result)

        except Exception as e:
            logger.error(f"Hair extension analysis failed: {str(e)}")
            raise YouCamAPIError(f"Hair extension analysis failed: {str(e)}")

    def analyze_lips(self, image_file) -> Dict[str, Any]:
        """
        Perform AI Lips Analysis

        Args:
            image_file: Image file to analyze

        Returns:
            Dict containing lips analysis results
        """
        try:
            base64_image = self._prepare_image(image_file)

            data = {
                "image": base64_image,
                "analysis_type": "lips_analysis",
                "options": {
                    "detailed_analysis": True,
                    "include_recommendations": True,
                    "detect_issues": True,
                    "lip_condition": True,
                },
            }

            result = self._make_request("analyze/lips", data)
            return self._process_lips_analysis(result)

        except Exception as e:
            logger.error(f"Lips analysis failed: {str(e)}")
            raise YouCamAPIError(f"Lips analysis failed: {str(e)}")

    def _process_skin_analysis(self, raw_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and structure skin analysis results
        """
        return {
            "analysis_type": "skin_analysis",
            "results": {
                "skin_condition": raw_result.get("skin_condition", {}),
                "skin_type": raw_result.get("skin_type", ""),
                "moisture_level": raw_result.get("moisture_level", 0),
                "oiliness_level": raw_result.get("oiliness_level", 0),
                "sensitivity_score": raw_result.get("sensitivity_score", 0),
                "age_estimation": raw_result.get("age_estimation", 0),
                "skin_tone": raw_result.get("skin_tone", ""),
                "texture_analysis": raw_result.get("texture_analysis", {}),
            },
            "issues_detected": raw_result.get("issues_detected", []),
            "recommendations": raw_result.get("recommendations", []),
            "confidence_score": raw_result.get("confidence_score", 0),
            "raw_data": raw_result,
        }

    def _process_face_analysis(self, raw_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and structure face analysis results
        """
        return {
            "analysis_type": "face_analysis",
            "results": {
                "facial_symmetry": raw_result.get("facial_symmetry", {}),
                "face_shape": raw_result.get("face_shape", ""),
                "facial_features": raw_result.get("facial_features", {}),
                "skin_quality": raw_result.get("skin_quality", {}),
                "age_estimation": raw_result.get("age_estimation", 0),
                "gender_estimation": raw_result.get("gender_estimation", ""),
                "emotion_analysis": raw_result.get("emotion_analysis", {}),
            },
            "issues_detected": raw_result.get("issues_detected", []),
            "recommendations": raw_result.get("recommendations", []),
            "confidence_score": raw_result.get("confidence_score", 0),
            "raw_data": raw_result,
        }

    def _process_hair_analysis(self, raw_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and structure hair extension analysis results
        """
        return {
            "analysis_type": "hair_extension",
            "results": {
                "hair_quality": raw_result.get("hair_quality", {}),
                "hair_type": raw_result.get("hair_type", ""),
                "hair_color": raw_result.get("hair_color", ""),
                "hair_length": raw_result.get("hair_length", ""),
                "hair_density": raw_result.get("hair_density", 0),
                "hair_health_score": raw_result.get("hair_health_score", 0),
                "extension_compatibility": raw_result.get(
                    "extension_compatibility", {}
                ),
            },
            "issues_detected": raw_result.get("issues_detected", []),
            "recommendations": raw_result.get("recommendations", []),
            "confidence_score": raw_result.get("confidence_score", 0),
            "raw_data": raw_result,
        }

    def _process_lips_analysis(self, raw_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and structure lips analysis results
        """
        return {
            "analysis_type": "lips_analysis",
            "results": {
                "lip_shape": raw_result.get("lip_shape", ""),
                "lip_size": raw_result.get("lip_size", {}),
                "lip_color": raw_result.get("lip_color", ""),
                "lip_condition": raw_result.get("lip_condition", {}),
                "hydration_level": raw_result.get("hydration_level", 0),
                "lip_symmetry": raw_result.get("lip_symmetry", {}),
                "age_estimation": raw_result.get("age_estimation", 0),
            },
            "issues_detected": raw_result.get("issues_detected", []),
            "recommendations": raw_result.get("recommendations", []),
            "confidence_score": raw_result.get("confidence_score", 0),
            "raw_data": raw_result,
        }
