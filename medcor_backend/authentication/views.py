from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
from django.shortcuts import redirect
from django.http import HttpResponseRedirect
from .serializers import (
    LoginSerializer, SignupSerializer, UserSerializer,
    FaceLoginSerializer, RegisterFaceSerializer, UpdatePhoneSerializer
)
from .authentication import JWTManager
import logging
import requests
import secrets
import string
from urllib.parse import urlencode, parse_qs, urlparse

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


class VerifyTokenView(APIView):
    """Token verification endpoint for admin routes."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            user = request.user
            return Response({
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Token verification error: {str(e)}")
            return Response({
                'success': False,
                'message': 'Token verification failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GoogleOAuthView(APIView):
    """Google OAuth authentication endpoint."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            # OAuth configuration
            client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)
            redirect_uri = getattr(settings, 'GOOGLE_OAUTH_REDIRECT_URI', f"{request.build_absolute_uri('/')[:-1]}/api/auth/oauth-callback")
            
            if not client_id:
                return Response({
                    'success': False,
                    'message': 'Google OAuth not configured. Please set GOOGLE_OAUTH_CLIENT_ID in environment variables.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Generate state parameter for security
            state = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
            request.session['oauth_state'] = state
            request.session['oauth_provider'] = 'google'
            
            # Google OAuth URL
            google_oauth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode({
                'client_id': client_id,
                'redirect_uri': redirect_uri,
                'scope': 'email profile',
                'response_type': 'code',
                'state': state,
                'access_type': 'offline'
            })
            
            return HttpResponseRedirect(google_oauth_url)
            
        except Exception as e:
            logger.error(f"Google OAuth error: {str(e)}")
            return Response({
                'success': False,
                'message': 'OAuth initialization failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AppleOAuthView(APIView):
    """Apple OAuth authentication endpoint."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            # Apple OAuth configuration
            client_id = getattr(settings, 'APPLE_OAUTH_CLIENT_ID', None)
            redirect_uri = getattr(settings, 'APPLE_OAUTH_REDIRECT_URI', f"{request.build_absolute_uri('/')[:-1]}/api/auth/oauth-callback")
            
            if not client_id:
                return Response({
                    'success': False,
                    'message': 'Apple OAuth not configured. Please set APPLE_OAUTH_CLIENT_ID in environment variables.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Generate state parameter for security
            state = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
            request.session['oauth_state'] = state
            request.session['oauth_provider'] = 'apple'
            
            # Apple OAuth URL
            apple_oauth_url = "https://appleid.apple.com/auth/authorize?" + urlencode({
                'client_id': client_id,
                'redirect_uri': redirect_uri,
                'scope': 'email name',
                'response_type': 'code',
                'state': state,
                'response_mode': 'form_post'
            })
            
            return HttpResponseRedirect(apple_oauth_url)
            
        except Exception as e:
            logger.error(f"Apple OAuth error: {str(e)}")
            return Response({
                'success': False,
                'message': 'OAuth initialization failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MicrosoftOAuthView(APIView):
    """Microsoft OAuth authentication endpoint."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            # Microsoft OAuth configuration
            client_id = getattr(settings, 'MICROSOFT_OAUTH_CLIENT_ID', None)
            redirect_uri = getattr(settings, 'MICROSOFT_OAUTH_REDIRECT_URI', f"{request.build_absolute_uri('/')[:-1]}/api/auth/oauth-callback")
            
            if not client_id:
                return Response({
                    'success': False,
                    'message': 'Microsoft OAuth not configured. Please set MICROSOFT_OAUTH_CLIENT_ID in environment variables.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Generate state parameter for security
            state = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
            request.session['oauth_state'] = state
            request.session['oauth_provider'] = 'microsoft'
            
            # Microsoft OAuth URL
            microsoft_oauth_url = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?" + urlencode({
                'client_id': client_id,
                'redirect_uri': redirect_uri,
                'scope': 'openid email profile',
                'response_type': 'code',
                'state': state
            })
            
            return HttpResponseRedirect(microsoft_oauth_url)
            
        except Exception as e:
            logger.error(f"Microsoft OAuth error: {str(e)}")
            return Response({
                'success': False,
                'message': 'OAuth initialization failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OAuthCallbackView(APIView):
    """OAuth callback handler for all providers."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        return self._handle_oauth_callback(request)
    
    def post(self, request):
        # Handle Apple's form_post response
        return self._handle_oauth_callback(request)
    
    def _handle_oauth_callback(self, request):
        try:
            # Get parameters from either GET or POST
            if request.method == 'GET':
                params = request.GET
            else:
                params = request.POST
            
            code = params.get('code')
            state = params.get('state')
            error = params.get('error')
            
            if error:
                logger.error(f"OAuth error: {error}")
                return redirect(f"/?error=oauth_error&message={error}")
            
            if not code or not state:
                return redirect("/?error=oauth_error&message=Missing_parameters")
            
            # Verify state parameter
            session_state = request.session.get('oauth_state')
            if not session_state or session_state != state:
                return redirect("/?error=oauth_error&message=Invalid_state")
            
            provider = request.session.get('oauth_provider')
            if not provider:
                return redirect("/?error=oauth_error&message=Unknown_provider")
            
            # Exchange code for tokens based on provider
            if provider == 'google':
                user_info = self._handle_google_callback(code, request)
            elif provider == 'apple':
                user_info = self._handle_apple_callback(code, request)
            elif provider == 'microsoft':
                user_info = self._handle_microsoft_callback(code, request)
            else:
                return redirect("/?error=oauth_error&message=Unsupported_provider")
            
            if not user_info:
                return redirect("/?error=oauth_error&message=Failed_to_get_user_info")
            
            # Create or get user
            user = self._create_or_update_oauth_user(user_info, provider)
            
            # Generate JWT token
            token = JWTManager.generate_token(user)
            
            # Clean up session
            request.session.pop('oauth_state', None)
            request.session.pop('oauth_provider', None)
            
            # Redirect to frontend with token
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5000')
            return redirect(f"{frontend_url}/?token={token}&user={user.id}")
            
        except Exception as e:
            logger.error(f"OAuth callback error: {str(e)}")
            return redirect("/?error=oauth_error&message=Callback_failed")
    
    def _handle_google_callback(self, code, request):
        """Handle Google OAuth callback."""
        try:
            client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)
            client_secret = getattr(settings, 'GOOGLE_OAUTH_CLIENT_SECRET', None)
            redirect_uri = getattr(settings, 'GOOGLE_OAUTH_REDIRECT_URI', f"{request.build_absolute_uri('/')[:-1]}/api/auth/oauth-callback")
            
            if not client_id or not client_secret:
                return None
            
            # Exchange code for token
            token_url = "https://oauth2.googleapis.com/token"
            token_data = {
                'client_id': client_id,
                'client_secret': client_secret,
                'code': code,
                'grant_type': 'authorization_code',
                'redirect_uri': redirect_uri
            }
            
            token_response = requests.post(token_url, data=token_data)
            token_json = token_response.json()
            
            if 'access_token' not in token_json:
                logger.error(f"Google token error: {token_json}")
                return None
            
            # Get user info
            user_url = "https://www.googleapis.com/oauth2/v2/userinfo"
            headers = {'Authorization': f"Bearer {token_json['access_token']}"}
            user_response = requests.get(user_url, headers=headers)
            user_data = user_response.json()
            
            return {
                'email': user_data.get('email'),
                'first_name': user_data.get('given_name', ''),
                'last_name': user_data.get('family_name', ''),
                'name': user_data.get('name', ''),
                'picture': user_data.get('picture'),
                'provider_id': user_data.get('id')
            }
            
        except Exception as e:
            logger.error(f"Google callback error: {str(e)}")
            return None
    
    def _handle_apple_callback(self, code, request):
        """Handle Apple OAuth callback."""
        # Apple OAuth implementation is more complex and requires JWT signing
        # For now, return a placeholder response
        logger.warning("Apple OAuth not fully implemented yet")
        return {
            'email': 'apple_user@example.com',
            'first_name': 'Apple',
            'last_name': 'User',
            'name': 'Apple User',
            'picture': None,
            'provider_id': 'apple_placeholder'
        }
    
    def _handle_microsoft_callback(self, code, request):
        """Handle Microsoft OAuth callback."""
        try:
            client_id = getattr(settings, 'MICROSOFT_OAUTH_CLIENT_ID', None)
            client_secret = getattr(settings, 'MICROSOFT_OAUTH_CLIENT_SECRET', None)
            redirect_uri = getattr(settings, 'MICROSOFT_OAUTH_REDIRECT_URI', f"{request.build_absolute_uri('/')[:-1]}/api/auth/oauth-callback")
            
            if not client_id or not client_secret:
                return None
            
            # Exchange code for token
            token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
            token_data = {
                'client_id': client_id,
                'client_secret': client_secret,
                'code': code,
                'grant_type': 'authorization_code',
                'redirect_uri': redirect_uri
            }
            
            token_response = requests.post(token_url, data=token_data)
            token_json = token_response.json()
            
            if 'access_token' not in token_json:
                logger.error(f"Microsoft token error: {token_json}")
                return None
            
            # Get user info
            user_url = "https://graph.microsoft.com/v1.0/me"
            headers = {'Authorization': f"Bearer {token_json['access_token']}"}
            user_response = requests.get(user_url, headers=headers)
            user_data = user_response.json()
            
            return {
                'email': user_data.get('mail') or user_data.get('userPrincipalName'),
                'first_name': user_data.get('givenName', ''),
                'last_name': user_data.get('surname', ''),
                'name': user_data.get('displayName', ''),
                'picture': None,  # Microsoft Graph photo requires separate API call
                'provider_id': user_data.get('id')
            }
            
        except Exception as e:
            logger.error(f"Microsoft callback error: {str(e)}")
            return None
    
    def _create_or_update_oauth_user(self, user_info, provider):
        """Create or update user from OAuth data."""
        try:
            email = user_info.get('email')
            if not email:
                raise ValueError("No email provided by OAuth provider")
            
            # Try to find existing user by email
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email,
                    'first_name': user_info.get('first_name', ''),
                    'last_name': user_info.get('last_name', ''),
                    'oauth_provider': provider,
                    'oauth_provider_id': user_info.get('provider_id'),
                    'profile_picture': user_info.get('picture'),
                    'is_active': True,
                    'last_login': timezone.now()
                }
            )
            
            if not created:
                # Update existing user
                user.oauth_provider = provider
                user.oauth_provider_id = user_info.get('provider_id')
                user.last_login = timezone.now()
                if user_info.get('picture'):
                    user.profile_picture = user_info.get('picture')
                user.save()
            
            return user
            
        except Exception as e:
            logger.error(f"User creation/update error: {str(e)}")
            raise