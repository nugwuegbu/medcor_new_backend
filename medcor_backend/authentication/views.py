from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.utils import timezone
from .serializers import (
    LoginSerializer, SignupSerializer, UserSerializer,
    FaceLoginSerializer, RegisterFaceSerializer, UpdatePhoneSerializer
)
from .authentication import JWTManager
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class LoginView(APIView):
    """User login endpoint."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            serializer = LoginSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': 'Invalid credentials',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user = serializer.validated_data['user']
            
            # Update last login
            user.last_login = timezone.now()
            user.save()
            
            # Generate JWT token
            token = JWTManager.generate_token(user)
            
            return Response({
                'success': True,
                'token': token,
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response({
                'success': False,
                'message': 'Login failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SignupView(APIView):
    """User registration endpoint."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            serializer = SignupSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': 'Validation failed',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create user
            user = serializer.save()
            
            # Generate JWT token
            token = JWTManager.generate_token(user)
            
            return Response({
                'success': True,
                'token': token,
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Signup error: {str(e)}")
            return Response({
                'success': False,
                'message': 'Registration failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserProfileView(APIView):
    """Get current user profile."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            return Response({
                'success': True,
                'user': UserSerializer(request.user).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"User profile error: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to get user profile'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FaceLoginView(APIView):
    """Face recognition login endpoint."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            serializer = FaceLoginSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': 'Invalid face data',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            face_data = serializer.validated_data['face_data']
            
            # TODO: Implement face recognition logic with Azure Face API
            # For now, return not implemented
            return Response({
                'success': False,
                'message': 'Face recognition not implemented yet'
            }, status=status.HTTP_501_NOT_IMPLEMENTED)
            
        except Exception as e:
            logger.error(f"Face login error: {str(e)}")
            return Response({
                'success': False,
                'message': 'Face login failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RegisterFaceView(APIView):
    """Register face for authenticated user."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            serializer = RegisterFaceSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': 'Invalid face data',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            face_data = serializer.validated_data['face_data']
            
            # TODO: Implement face registration logic with Azure Face API
            # For now, return not implemented
            return Response({
                'success': False,
                'message': 'Face registration not implemented yet'
            }, status=status.HTTP_501_NOT_IMPLEMENTED)
            
        except Exception as e:
            logger.error(f"Face registration error: {str(e)}")
            return Response({
                'success': False,
                'message': 'Face registration failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdatePhoneView(APIView):
    """Update user phone number."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            serializer = UpdatePhoneSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': 'Invalid phone number',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            phone_number = serializer.validated_data['phone_number']
            
            # Update user phone number
            request.user.phone_number = phone_number
            request.user.save()
            
            return Response({
                'success': True,
                'message': 'Phone number updated successfully',
                'user': UserSerializer(request.user).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Update phone error: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to update phone number'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LogoutView(APIView):
    """User logout endpoint."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # In JWT, logout is handled client-side by removing the token
            # Here we could implement token blacklisting if needed
            return Response({
                'success': True,
                'message': 'Logged out successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return Response({
                'success': False,
                'message': 'Logout failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)