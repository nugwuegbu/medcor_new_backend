"""
User creation API views with role management and tenant assignment
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiResponse
from tenants.models import Client
import re

User = get_user_model()


class CreateUserAPIView(APIView):
    """
    API endpoint for creating users with role selection and tenant assignment
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        operation_id='create_user',
        summary='Create New User',
        description='Create a new user with specified role, tenant, and encrypted password',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'email': {
                        'type': 'string',
                        'format': 'email',
                        'description': 'User email address (required)'
                    },
                    'password': {
                        'type': 'string',
                        'description': 'User password (will be encrypted)',
                        'minLength': 8
                    },
                    'first_name': {
                        'type': 'string',
                        'description': 'User first name'
                    },
                    'last_name': {
                        'type': 'string',
                        'description': 'User last name'
                    },
                    'username': {
                        'type': 'string',
                        'description': 'Username (optional)'
                    },
                    'role': {
                        'type': 'string',
                        'enum': ['patient', 'doctor', 'admin', 'nurse'],
                        'description': 'User role (default: patient)'
                    },
                    'tenant_id': {
                        'type': 'integer',
                        'description': 'Tenant/Client ID to assign user to'
                    },
                    'phone_number': {
                        'type': 'string',
                        'description': 'User phone number'
                    },
                    'address': {
                        'type': 'string',
                        'description': 'User address'
                    },
                    'date_of_birth': {
                        'type': 'string',
                        'format': 'date',
                        'description': 'Date of birth (YYYY-MM-DD)'
                    },
                    'medical_record_number': {
                        'type': 'string',
                        'description': 'Medical record number (for patients)'
                    },
                    'insurance_provider': {
                        'type': 'string',
                        'description': 'Insurance provider (for patients)'
                    },
                    'insurance_policy_number': {
                        'type': 'string',
                        'description': 'Insurance policy number'
                    },
                    'blood_type': {
                        'type': 'string',
                        'enum': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
                        'description': 'Blood type'
                    },
                    'allergies': {
                        'type': 'string',
                        'description': 'Known allergies'
                    },
                    'emergency_contact': {
                        'type': 'string',
                        'description': 'Emergency contact name'
                    },
                    'emergency_phone': {
                        'type': 'string',
                        'description': 'Emergency contact phone'
                    },
                    'is_staff': {
                        'type': 'boolean',
                        'description': 'Staff status (default: True)'
                    },
                    'is_superuser': {
                        'type': 'boolean',
                        'description': 'Superuser status (default: True for admin role)'
                    },
                    'is_active': {
                        'type': 'boolean',
                        'description': 'Active status (default: True)'
                    },
                    'is_verified': {
                        'type': 'boolean',
                        'description': 'Email verification status (default: True)'
                    }
                },
                'required': ['email', 'password', 'first_name', 'last_name']
            }
        },
        responses={
            201: OpenApiResponse(description='User created successfully'),
            400: OpenApiResponse(description='Bad request - validation error'),
            401: OpenApiResponse(description='Unauthorized'),
            403: OpenApiResponse(description='Forbidden - insufficient permissions'),
            409: OpenApiResponse(description='Conflict - user already exists'),
        },
        tags=['User Management']
    )
    def post(self, request):
        """Create a new user with encrypted password and role assignment"""
        
        # Check if requesting user has permission to create users
        if not (request.user.is_superuser or request.user.is_staff or 
                (hasattr(request.user, 'role') and request.user.role in ['admin', 'doctor'])):
            return Response({
                'error': 'You do not have permission to create users'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Extract required fields
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        
        # Validate required fields
        if not email or not password or not first_name or not last_name:
            return Response({
                'error': 'Email, password, first_name, and last_name are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return Response({
                'error': 'Invalid email format'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate password strength
        if len(password) < 8:
            return Response({
                'error': 'Password must be at least 8 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'User with this email already exists'
            }, status=status.HTTP_409_CONFLICT)
        
        # Get optional fields with defaults
        role = request.data.get('role', 'patient')
        username = request.data.get('username', email.split('@')[0])
        tenant_id = request.data.get('tenant_id')
        
        # Set default values for boolean fields
        is_staff = request.data.get('is_staff', True)
        is_active = request.data.get('is_active', True)
        is_verified = request.data.get('is_verified', True)
        
        # Set is_superuser based on role if not explicitly provided
        is_superuser = request.data.get('is_superuser')
        if is_superuser is None:
            is_superuser = True if role == 'admin' else False
        
        # Validate role
        valid_roles = ['patient', 'doctor', 'admin', 'nurse']
        if role not in valid_roles:
            return Response({
                'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate tenant if provided
        tenant = None
        if tenant_id:
            try:
                tenant = Client.objects.get(id=tenant_id)
            except Client.DoesNotExist:
                return Response({
                    'error': f'Tenant with ID {tenant_id} does not exist'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create the user with encrypted password
            user = User.objects.create(
                email=email,
                username=username,
                first_name=first_name,
                last_name=last_name,
                password=make_password(password),  # Encrypt the password
                role=role,
                is_staff=is_staff,
                is_superuser=is_superuser,
                is_active=is_active,
                phone_number=request.data.get('phone_number', ''),
                address=request.data.get('address', ''),
                date_of_birth=request.data.get('date_of_birth'),
                medical_record_number=request.data.get('medical_record_number'),
                insurance_provider=request.data.get('insurance_provider', ''),
                insurance_policy_number=request.data.get('insurance_policy_number', ''),
                blood_type=request.data.get('blood_type', ''),
                allergies=request.data.get('allergies', ''),
                emergency_contact=request.data.get('emergency_contact', ''),
                emergency_phone=request.data.get('emergency_phone', '')
            )
            
            # Add is_verified field if it doesn't exist in the model
            if hasattr(user, 'is_verified'):
                user.is_verified = is_verified
                user.save()
            
            # Assign tenant if provided
            if tenant and hasattr(user, 'tenants'):
                user.tenants.add(tenant)
            
            # Generate JWT tokens for the new user
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'User created successfully',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'is_active': user.is_active,
                    'is_verified': is_verified,
                    'tenant': {
                        'id': tenant.id,
                        'name': tenant.name
                    } if tenant else None,
                    'created_at': user.created_at.isoformat() if hasattr(user, 'created_at') else None
                },
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': f'Failed to create user: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class ListTenantsAPIView(APIView):
    """
    API endpoint to list available tenants for user assignment
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        operation_id='list_tenants',
        summary='List Available Tenants',
        description='Get a list of all available tenants/clients for user assignment',
        responses={
            200: OpenApiResponse(description='List of tenants'),
            401: OpenApiResponse(description='Unauthorized'),
        },
        tags=['User Management']
    )
    def get(self, request):
        """List all available tenants"""
        
        # Check if user has permission to view tenants
        if not (request.user.is_superuser or request.user.is_staff or 
                (hasattr(request.user, 'role') and request.user.role in ['admin'])):
            return Response({
                'error': 'You do not have permission to view tenants'
            }, status=status.HTTP_403_FORBIDDEN)
        
        tenants = Client.objects.all().values('id', 'name', 'schema_name', 'created_at')
        
        return Response({
            'tenants': list(tenants),
            'count': len(tenants)
        }, status=status.HTTP_200_OK)