"""
General authentication views for all user types (not just admin)
"""
from django.contrib.auth import authenticate, get_user_model
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample

User = get_user_model()


class GeneralLoginAPIView(APIView):
    """
    General authentication endpoint for all user types
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        operation_id='general_login',
        summary='User Login',
        description='Authenticate users and obtain JWT tokens',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'email': {
                        'type': 'string', 
                        'format': 'email',
                        'description': 'User email address'
                    },
                    'password': {
                        'type': 'string',
                        'description': 'User password'
                    }
                },
                'required': ['email', 'password']
            }
        },
        responses={
            200: OpenApiResponse(description='Login successful'),
            400: OpenApiResponse(description='Bad request'),
            401: OpenApiResponse(description='Invalid credentials'),
        },
        tags=['Authentication']
    )
    def post(self, request):
        """User login with JWT token generation"""
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate with email as username
        user = authenticate(
            request,
            username=email,
            password=password
        )
        
        if user and user.is_active:
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Determine user role
            if user.is_superuser:
                role = 'admin'
            elif user.is_staff:
                role = 'staff'  
            elif hasattr(user, 'role'):
                role = user.role
            else:
                # Determine role based on email or other criteria
                email_lower = email.lower()
                if 'doctor' in email_lower:
                    role = 'doctor'
                elif 'patient' in email_lower:
                    role = 'patient'
                elif 'clinic' in email_lower:
                    role = 'clinic'
                else:
                    role = 'user'
            
            return Response({
                'access': str(access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'role': role,
                    'first_name': getattr(user, 'first_name', ''),
                    'last_name': getattr(user, 'last_name', ''),
                    'is_active': user.is_active,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)


class UserProfileAPIView(APIView):
    """Get current user profile"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        operation_id='user_profile',
        summary='Get User Profile',
        description='Get the profile of the currently authenticated user',
        responses={
            200: OpenApiResponse(description='User profile'),
            401: OpenApiResponse(description='Unauthorized'),
        },
        tags=['Authentication']
    )
    def get(self, request):
        user = request.user
        
        # Determine user role
        if user.is_superuser:
            role = 'admin'
        elif user.is_staff:
            role = 'staff'
        elif hasattr(user, 'role'):
            role = user.role
        else:
            # Determine role based on email or other criteria
            if 'doctor' in user.email.lower():
                role = 'doctor'
            elif 'patient' in user.email.lower():
                role = 'patient'
            else:
                role = 'user'
        
        return Response({
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'role': role,
                'first_name': getattr(user, 'first_name', ''),
                'last_name': getattr(user, 'last_name', ''),
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
            }
        })