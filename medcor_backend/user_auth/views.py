"""
User Authentication API Views with Swagger Documentation
"""
from django.contrib.auth import authenticate, get_user_model
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

User = get_user_model()


class AdminLoginAPIView(APIView):
    """
    Admin authentication endpoint
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        operation_id='admin_login',
        summary='Admin Login',
        description='Authenticate admin users and obtain JWT tokens for accessing protected endpoints',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'email': {
                        'type': 'string', 
                        'format': 'email',
                        'description': 'Admin email address',
                        'example': 'admin@medcor.ai'
                    },
                    'password': {
                        'type': 'string',
                        'description': 'Admin password',
                        'example': 'admin123'
                    }
                },
                'required': ['email', 'password']
            }
        },
        responses={
            200: OpenApiResponse(
                description='Login successful with JWT tokens',
                examples=[
                    OpenApiExample(
                        'Success Response',
                        value={
                            'message': 'Login successful',
                            'access_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                            'refresh_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                            'user': {
                                'id': 1,
                                'email': 'admin@medcor.ai',
                                'username': 'admin',
                                'role': 'admin',
                                'is_active': True,
                                'is_staff': True,
                                'created_at': '2025-07-23T05:00:00Z',
                                'last_login': '2025-07-23T06:00:00Z'
                            }
                        }
                    )
                ]
            ),
            400: OpenApiResponse(description='Email and password are required'),
            401: OpenApiResponse(description='Invalid credentials'),
            403: OpenApiResponse(description='Access denied. Admin privileges required.'),
        },
        tags=['Authentication']
    )
    def post(self, request):
        """Admin login with JWT token generation"""
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Authenticate with email as username for Django admin
            user = authenticate(
                request,
                username=email,
                password=password
            )
            
            if user and user.is_active:
                # Check if user has admin permissions
                if not (user.is_staff or user.is_superuser):
                    return Response({
                        'error': 'Access denied. Admin privileges required.'
                    }, status=status.HTTP_403_FORBIDDEN)
                
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token
                
                # Determine the correct role
                if hasattr(user, 'role') and user.role:
                    role = user.role
                elif user.is_superuser:
                    role = 'admin'
                else:
                    role = 'admin'  # If they have staff/admin access, they're admin
                
                return Response({
                    'message': 'Login successful',
                    'access_token': str(access_token),
                    'refresh_token': str(refresh),
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'username': user.username,
                        'role': role,
                        'is_active': user.is_active,
                        'is_staff': user.is_staff,
                        'is_superuser': user.is_superuser,
                        'created_at': user.created_at,
                        'last_login': user.last_login
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except Exception as e:
            return Response({
                'error': f'Login failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminLogoutAPIView(APIView):
    """
    Admin logout endpoint
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        operation_id='admin_logout',
        summary='Admin Logout',
        description='Logout admin user and blacklist refresh token to prevent further use',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'refresh_token': {
                        'type': 'string',
                        'description': 'JWT refresh token to blacklist'
                    }
                }
            }
        },
        responses={
            200: OpenApiResponse(description='Logout successful'),
        },
        tags=['Authentication']
    )
    def post(self, request):
        """Admin logout with token blacklisting"""
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        except Exception:
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)


class AdminProfileAPIView(APIView):
    """
    Get current admin user profile
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        operation_id='admin_profile',
        summary='Get Admin Profile',
        description='Retrieve current authenticated admin user profile information',
        responses={
            200: OpenApiResponse(
                description='Admin profile data',
                examples=[
                    OpenApiExample(
                        'Admin Profile',
                        value={
                            'user': {
                                'id': 1,
                                'email': 'admin@medcor.ai',
                                'username': 'admin',
                                'role': 'admin',
                                'is_staff': True,
                                'is_superuser': True,
                                'last_login': '2025-07-23T06:00:00Z',
                                'created_at': '2025-07-23T05:00:00Z'
                            }
                        }
                    )
                ]
            ),
            403: OpenApiResponse(description='Access denied. Admin privileges required.'),
        },
        tags=['Authentication']
    )
    def get(self, request):
        """Get authenticated admin user profile"""
        user = request.user
        
        if not (user.is_staff or user.is_superuser):
            return Response({
                'error': 'Access denied. Admin privileges required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return Response({
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'role': 'admin' if user.is_superuser else 'staff',
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'last_login': user.last_login,
                'created_at': user.created_at
            }
        }, status=status.HTTP_200_OK)


class AdminStatsAPIView(APIView):
    """
    Get admin dashboard statistics
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        operation_id='admin_stats',
        summary='Get Admin Statistics',
        description='Retrieve comprehensive statistics for admin dashboard including user counts and system metrics',
        responses={
            200: OpenApiResponse(
                description='Admin dashboard statistics',
                examples=[
                    OpenApiExample(
                        'Dashboard Stats',
                        value={
                            'totalUsers': 156,
                            'activeUsers': 134,
                            'staffUsers': 12,
                            'superUsers': 2,
                            'recentRegistrations': 8,
                            'monthlyGrowth': 23
                        }
                    )
                ]
            ),
            403: OpenApiResponse(description='Access denied. Admin privileges required.'),
        },
        tags=['Statistics']
    )
    def get(self, request):
        """Get comprehensive admin statistics"""
        user = request.user
        
        if not (user.is_staff or user.is_superuser):
            return Response({
                'error': 'Access denied. Admin privileges required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Calculate date ranges
            last_month = timezone.now() - timedelta(days=30)
            
            # Basic user counts
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()
            staff_users = User.objects.filter(is_staff=True).count()
            super_users = User.objects.filter(is_superuser=True).count()
            recent_registrations = User.objects.filter(created_at__gte=last_month).count()
            
            return Response({
                'totalUsers': total_users,
                'activeUsers': active_users,
                'staffUsers': staff_users,
                'superUsers': super_users,
                'recentRegistrations': recent_registrations,
                'monthlyGrowth': recent_registrations
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to fetch statistics: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminUsersAPIView(APIView):
    """
    Get all users for admin management
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        operation_id='admin_users',
        summary='Get All Users',
        description='Retrieve all users in the system for admin management',
        responses={
            200: OpenApiResponse(
                description='List of all users',
                examples=[
                    OpenApiExample(
                        'Users List',
                        value=[
                            {
                                'id': 1,
                                'username': 'admin',
                                'email': 'admin@medcor.ai',
                                'is_active': True,
                                'is_staff': True,
                                'is_superuser': True,
                                'created_at': '2025-07-23T05:00:00Z',
                                'last_login': '2025-07-23T06:00:00Z'
                            },
                            {
                                'id': 2,
                                'username': 'doctor1',
                                'email': 'doctor@medcor.ai',
                                'is_active': True,
                                'is_staff': False,
                                'is_superuser': False,
                                'created_at': '2025-07-23T05:30:00Z',
                                'last_login': '2025-07-23T05:45:00Z'
                            }
                        ]
                    )
                ]
            ),
            403: OpenApiResponse(description='Access denied. Admin privileges required.'),
        },
        tags=['User Management']
    )
    def get(self, request):
        """Get all users for admin management"""
        user = request.user
        
        if not (user.is_staff or user.is_superuser):
            return Response({
                'error': 'Access denied. Admin privileges required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            users = User.objects.all().order_by('-created_at')
            user_data = []
            
            for u in users:
                # Determine user role based on flags
                role = 'admin' if u.is_superuser else ('staff' if u.is_staff else 'user')
                
                user_data.append({
                    'id': u.id,
                    'username': u.username,
                    'email': u.email,
                    'first_name': u.first_name,
                    'last_name': u.last_name,
                    'role': role,
                    'is_active': u.is_active,
                    'is_staff': u.is_staff,
                    'is_superuser': u.is_superuser,
                    'created_at': u.created_at,
                    'last_login': u.last_login
                })
            
            return Response(user_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to fetch users: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserListAPIView(APIView):
    """
    Get paginated list of users
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        operation_id='user_list',
        summary='List Users',
        description='Retrieve paginated list of users with filtering capabilities',
        parameters=[
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Search users by username, email, first name, or last name'
            ),
            OpenApiParameter(
                name='is_active',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='Filter by active status'
            ),
            OpenApiParameter(
                name='is_staff',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='Filter by staff status'
            ),
        ],
        responses={
            200: OpenApiResponse(description='List of users with filtering applied'),
        },
        tags=['User Management']
    )
    def get(self, request):
        """Get filtered list of users"""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({
                'error': 'Access denied. Admin privileges required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        queryset = User.objects.all()
        
        # Apply filters
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        is_staff = request.query_params.get('is_staff')
        if is_staff is not None:
            queryset = queryset.filter(is_staff=is_staff.lower() == 'true')
        
        # Serialize data
        users = queryset.order_by('-created_at')
        user_data = []
        
        for user in users:
            user_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'created_at': user.created_at,
                'last_login': user.last_login
            })
        
        return Response({
            'count': len(user_data),
            'results': user_data
        }, status=status.HTTP_200_OK)


class UserDetailAPIView(APIView):
    """
    Get, update, or delete a specific user
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        operation_id='user_detail',
        summary='Get User Details',
        description='Retrieve detailed information about a specific user',
        responses={
            200: OpenApiResponse(description='User details'),
            403: OpenApiResponse(description='Access denied. Admin privileges required.'),
            404: OpenApiResponse(description='User not found'),
        },
        tags=['User Management']
    )
    def get(self, request, pk):
        """Get user details"""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({
                'error': 'Access denied. Admin privileges required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(pk=pk)
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'created_at': user.created_at,
                'last_login': user.last_login,
                'phone_number': getattr(user, 'phone_number', None),
                'address': getattr(user, 'address', None),
                'department': getattr(user, 'department', None),
                'specialty': getattr(user, 'specialty', None),
                'medical_license': getattr(user, 'medical_license', None),
                'years_of_experience': getattr(user, 'years_of_experience', None),
                'consultation_fee': getattr(user, 'consultation_fee', None),
                'qualifications': getattr(user, 'qualifications', None),
                'avatar': getattr(user, 'avatar', None),
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @extend_schema(
        operation_id='update_user',
        summary='Update User Details',
        description='Update user information (Admin only). Can update any user field including role and status.',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'first_name': {'type': 'string', 'example': 'John'},
                    'last_name': {'type': 'string', 'example': 'Doe'},
                    'email': {'type': 'string', 'format': 'email', 'example': 'john.doe@medcor.ai'},
                    'username': {'type': 'string', 'example': 'johndoe'},
                    'is_active': {'type': 'boolean', 'example': True},
                    'is_staff': {'type': 'boolean', 'example': False},
                    'phone_number': {'type': 'string', 'example': '+1234567890'},
                    'address': {'type': 'string', 'example': '123 Medical St'},
                    'department': {'type': 'string', 'example': 'Cardiology'},
                    'specialty': {'type': 'string', 'example': 'Cardiologist'},
                    'medical_license': {'type': 'string', 'example': 'ML123456'},
                    'years_of_experience': {'type': 'integer', 'example': 10},
                    'consultation_fee': {'type': 'number', 'example': 150.00},
                    'qualifications': {'type': 'string', 'example': 'MD, PhD'},
                }
            }
        },
        responses={
            200: OpenApiResponse(
                description='User updated successfully',
                examples=[
                    OpenApiExample(
                        'Success Response',
                        value={
                            'message': 'User updated successfully',
                            'user': {
                                'id': 2,
                                'email': 'john.doe@medcor.ai',
                                'first_name': 'John',
                                'last_name': 'Doe',
                                'is_active': True
                            }
                        }
                    )
                ]
            ),
            400: OpenApiResponse(description='Invalid data provided'),
            403: OpenApiResponse(description='Access denied. Admin privileges required.'),
            404: OpenApiResponse(description='User not found'),
        },
        tags=['User Management']
    )
    def patch(self, request, pk):
        """Update user details (partial update)"""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({
                'error': 'Access denied. Admin privileges required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(pk=pk)
            
            # Update user fields
            updateable_fields = [
                'first_name', 'last_name', 'email', 'username', 
                'is_active', 'is_staff', 'phone_number', 'address',
                'department', 'specialty', 'medical_license',
                'years_of_experience', 'consultation_fee', 'qualifications'
            ]
            
            for field in updateable_fields:
                if field in request.data:
                    setattr(user, field, request.data[field])
            
            user.save()
            
            return Response({
                'message': 'User updated successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_active': user.is_active,
                    'is_staff': user.is_staff,
                    'phone_number': getattr(user, 'phone_number', None),
                    'department': getattr(user, 'department', None),
                    'specialty': getattr(user, 'specialty', None),
                }
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Failed to update user: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        operation_id='delete_user',
        summary='Delete User',
        description='Deactivate a user from the system (Admin only). The user account will be disabled and cannot login.',
        responses={
            200: OpenApiResponse(
                description='User deactivated successfully',
                examples=[
                    OpenApiExample(
                        'Success Response',
                        value={
                            'message': 'User deactivated successfully',
                            'deactivated_user': {
                                'id': 2,
                                'email': 'john.doe@medcor.ai',
                                'name': 'John Doe',
                                'is_active': False
                            }
                        }
                    )
                ]
            ),
            403: OpenApiResponse(description='Access denied. Admin privileges required.'),
            404: OpenApiResponse(description='User not found'),
            409: OpenApiResponse(description='Cannot deactivate yourself or superadmin'),
        },
        tags=['User Management']
    )
    def delete(self, request, pk):
        """Deactivate a user (Admin only)"""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({
                'error': 'Access denied. Admin privileges required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(pk=pk)
            
            # Prevent self-deactivation
            if user.id == request.user.id:
                return Response({
                    'error': 'You cannot deactivate your own account'
                }, status=status.HTTP_409_CONFLICT)
            
            # Prevent deactivation of superadmin accounts (optional safeguard)
            if user.is_superuser and not request.user.is_superuser:
                return Response({
                    'error': 'Only superadmin can deactivate other superadmin accounts'
                }, status=status.HTTP_409_CONFLICT)
            
            # Store user info
            deactivated_user_info = {
                'id': user.id,
                'email': user.email,
                'name': f'{user.first_name} {user.last_name}'.strip() or user.username,
                'is_active': False
            }
            
            # Deactivate the user instead of deleting
            # This is safer for multi-tenant systems
            user.is_active = False
            user.save()
            
            return Response({
                'message': 'User deactivated successfully',
                'deactivated_user': deactivated_user_info
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)