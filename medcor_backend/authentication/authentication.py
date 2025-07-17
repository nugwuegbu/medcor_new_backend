import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions
from rest_framework.authentication import BaseAuthentication
from datetime import datetime, timedelta
import bcrypt

User = get_user_model()


class JWTAuthentication(BaseAuthentication):
    """
    JWT authentication backend.
    """
    
    def authenticate(self, request):
        """
        Authenticate the request and return a two-tuple of (user, token).
        """
        token = self.get_token_from_request(request)
        if not token:
            return None
        
        try:
            payload = jwt.decode(
                token, 
                settings.JWT_SECRET_KEY, 
                algorithms=[settings.JWT_ALGORITHM]
            )
            user_id = payload.get('userId')
            if not user_id:
                raise exceptions.AuthenticationFailed('Invalid token payload')
            
            user = User.objects.get(id=user_id)
            return (user, token)
        
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token')
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('User not found')
    
    def get_token_from_request(self, request):
        """
        Extract token from Authorization header.
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None
        
        try:
            token_type, token = auth_header.split(' ', 1)
            if token_type.lower() != 'bearer':
                return None
            return token
        except ValueError:
            return None


class JWTManager:
    """
    JWT token management utility.
    """
    
    @staticmethod
    def generate_token(user):
        """
        Generate JWT token for user.
        """
        payload = {
            'userId': user.id,
            'email': user.email,
            'role': user.role,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(seconds=settings.JWT_ACCESS_TOKEN_LIFETIME)
        }
        
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    @staticmethod
    def verify_token(token):
        """
        Verify JWT token and return payload.
        """
        try:
            payload = jwt.decode(
                token, 
                settings.JWT_SECRET_KEY, 
                algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except jwt.InvalidTokenError:
            return None


class PasswordManager:
    """
    Password hashing utility using bcrypt.
    """
    
    @staticmethod
    def hash_password(password):
        """
        Hash password using bcrypt.
        """
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    @staticmethod
    def verify_password(password, hashed_password):
        """
        Verify password against hash.
        """
        password_bytes = password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)