from django.contrib.auth import authenticate
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample
from drf_spectacular.types import OpenApiTypes
try:
    from core.models import Doctor, Appointment
except ImportError:
    # Fallback for simplified Django setup
    Doctor = None
    Appointment = None

User = get_user_model()


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def admin_login(request):
    """
    Admin login endpoint for frontend admin interface.
    
    Expected payload:
    {
        "email": "admin@medcare.localhost",
        "password": "admin123"
    }
    """
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'error': 'Email and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get user by email
        user = User.objects.get(email=email)
        
        # Authenticate with username (Django's authenticate expects username)
        authenticated_user = authenticate(
            request,
            username=user.username,
            password=password
        )
        
        if authenticated_user:
            # Check if user has admin permissions
            if not (user.is_staff or user.role == 'admin'):
                return Response({
                    'error': 'Access denied. Admin privileges required.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            return Response({
                'message': 'Login successful',
                'access_token': str(access_token),
                'refresh_token': str(refresh),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name or user.name,
                    'last_name': user.last_name or '',
                    'role': user.role,
                    'is_active': user.is_active,
                    'date_joined': user.created_at,
                    'last_login': user.last_login
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except User.DoesNotExist:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({
            'error': f'Login failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_logout(request):
    """
    Admin logout endpoint.
    """
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


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_profile(request):
    """
    Get current admin user profile.
    """
    user = request.user
    
    if not (user.is_staff or user.role == 'admin'):
        return Response({
            'error': 'Access denied. Admin privileges required.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    return Response({
        'user': {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'role': user.role,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'last_login': user.last_login,
            'created_at': user.created_at
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_stats(request):
    """
    Get admin statistics including user counts, appointments, etc.
    """
    user = request.user
    
    if not (user.is_staff or user.role == 'admin'):
        return Response({
            'error': 'Access denied. Admin privileges required.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Get user counts by role
        total_patients = User.objects.filter(role='patient').count()
        total_doctors = Doctor.objects.count()
        total_appointments = Appointment.objects.count()
        pending_appointments = Appointment.objects.filter(status='pending').count()
        
        # Get today's appointments
        today = timezone.now().date()
        today_appointments = Appointment.objects.filter(
            appointment_date__date=today
        ).count()
        
        # Calculate monthly growth (simplified)
        last_month = timezone.now() - timedelta(days=30)
        new_patients_this_month = User.objects.filter(
            role='patient',
            created_at__gte=last_month
        ).count()
        
        return Response({
            'totalPatients': total_patients,
            'totalDoctors': total_doctors,
            'totalAppointments': total_appointments,
            'pendingAppointments': pending_appointments,
            'todayAppointments': today_appointments,
            'monthlyGrowth': new_patients_this_month
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to fetch statistics: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_users(request):
    """
    Get all users for admin management.
    """
    user = request.user
    
    if not (user.is_staff or user.role == 'admin'):
        return Response({
            'error': 'Access denied. Admin privileges required.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        users = User.objects.all().order_by('-created_at')
        user_data = []
        
        for u in users:
            user_data.append({
                'id': u.id,
                'name': u.name,
                'email': u.email,
                'role': u.role,
                'isActive': u.is_active,
                'createdAt': u.created_at,
                'lastLogin': u.last_login
            })
        
        return Response(user_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to fetch users: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# NEW DRF API VIEWS WITH SWAGGER DOCUMENTATION

class AdminLoginAPIView(APIView):
    """
    Admin authentication endpoint
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        operation_id='admin_login',
        summary='Admin Login',
        description='Authenticate admin users and obtain JWT tokens',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'email': {
                        'type': 'string', 
                        'format': 'email',
                        'description': 'Admin email address'
                    },
                    'password': {
                        'type': 'string',
                        'description': 'Admin password'
                    }
                },
                'required': ['email', 'password'],
                'example': {
                    'email': 'admin@medcor.ai',
                    'password': 'admin123'
                }
            }
        },
        responses={
            200: OpenApiResponse(
                description='Login successful',
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
                                'first_name': 'Admin',
                                'last_name': 'User',
                                'role': 'admin',
                                'is_active': True,
                                'date_joined': '2025-07-23T05:00:00Z',
                                'last_login': '2025-07-23T06:00:00Z'
                            }
                        }
                    )
                ]
            ),
            400: OpenApiResponse(description='Email and password are required'),
            401: OpenApiResponse(description='Invalid credentials'),
            403: OpenApiResponse(description='Access denied. Admin privileges required.'),
        }
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
            # Get user by email
            user = User.objects.get(email=email)
            
            # Authenticate with username (Django's authenticate expects username)
            authenticated_user = authenticate(
                request,
                username=user.username,
                password=password
            )
            
            if authenticated_user:
                # Check if user has admin permissions
                if not (user.is_staff or getattr(user, 'role', None) == 'admin'):
                    return Response({
                        'error': 'Access denied. Admin privileges required.'
                    }, status=status.HTTP_403_FORBIDDEN)
                
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token
                
                return Response({
                    'message': 'Login successful',
                    'access_token': str(access_token),
                    'refresh_token': str(refresh),
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'first_name': getattr(user, 'first_name', '') or getattr(user, 'name', ''),
                        'last_name': getattr(user, 'last_name', ''),
                        'role': getattr(user, 'role', 'admin'),
                        'is_active': user.is_active,
                        'date_joined': getattr(user, 'created_at', user.date_joined),
                        'last_login': user.last_login
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except User.DoesNotExist:
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
        description='Logout admin user and blacklist refresh token',
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
        }
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
                                'name': 'Admin User',
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
        }
    )
    def get(self, request):
        """Get authenticated admin user profile"""
        user = request.user
        
        if not (user.is_staff or getattr(user, 'role', None) == 'admin'):
            return Response({
                'error': 'Access denied. Admin privileges required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return Response({
            'user': {
                'id': user.id,
                'email': user.email,
                'name': getattr(user, 'name', user.username),
                'role': getattr(user, 'role', 'admin'),
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'last_login': user.last_login,
                'created_at': getattr(user, 'created_at', user.date_joined)
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
        description='Retrieve comprehensive statistics for admin dashboard including user counts, appointments, and growth metrics',
        responses={
            200: OpenApiResponse(
                description='Admin dashboard statistics',
                examples=[
                    OpenApiExample(
                        'Dashboard Stats',
                        value={
                            'totalPatients': 156,
                            'totalDoctors': 12,
                            'totalAppointments': 342,
                            'pendingAppointments': 8,
                            'todayAppointments': 5,
                            'monthlyGrowth': 23
                        }
                    )
                ]
            ),
            403: OpenApiResponse(description='Access denied. Admin privileges required.'),
        }
    )
    def get(self, request):
        """Get comprehensive admin statistics"""
        user = request.user
        
        if not (user.is_staff or getattr(user, 'role', None) == 'admin'):
            return Response({
                'error': 'Access denied. Admin privileges required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get user counts by role
            total_patients = User.objects.filter(role='patient').count() if hasattr(User.objects.first() or User(), 'role') else 0
            total_doctors = Doctor.objects.count() if Doctor else 0
            total_appointments = Appointment.objects.count() if Appointment else 0
            pending_appointments = Appointment.objects.filter(status='pending').count() if Appointment else 0
            
            # Get today's appointments
            today = timezone.now().date()
            today_appointments = Appointment.objects.filter(
                appointment_date__date=today
            ).count() if Appointment else 0
            
            # Calculate monthly growth (simplified)
            last_month = timezone.now() - timedelta(days=30)
            new_patients_this_month = User.objects.filter(
                role='patient',
                created_at__gte=last_month
            ).count() if hasattr(User.objects.first() or User(), 'created_at') else 0
            
            return Response({
                'totalPatients': total_patients,
                'totalDoctors': total_doctors,
                'totalAppointments': total_appointments,
                'pendingAppointments': pending_appointments,
                'todayAppointments': today_appointments,
                'monthlyGrowth': new_patients_this_month
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
                                'name': 'Admin User',
                                'email': 'admin@medcor.ai',
                                'role': 'admin',
                                'isActive': True,
                                'createdAt': '2025-07-23T05:00:00Z',
                                'lastLogin': '2025-07-23T06:00:00Z'
                            },
                            {
                                'id': 2,
                                'name': 'Dr. Emily Rodriguez',
                                'email': 'doctor@medcor.ai',
                                'role': 'doctor',
                                'isActive': True,
                                'createdAt': '2025-07-23T05:30:00Z',
                                'lastLogin': '2025-07-23T05:45:00Z'
                            }
                        ]
                    )
                ]
            ),
            403: OpenApiResponse(description='Access denied. Admin privileges required.'),
        }
    )
    def get(self, request):
        """Get all users for admin management"""
        user = request.user
        
        if not (user.is_staff or getattr(user, 'role', None) == 'admin'):
            return Response({
                'error': 'Access denied. Admin privileges required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            users = User.objects.all().order_by('-date_joined')
            user_data = []
            
            for u in users:
                user_data.append({
                    'id': u.id,
                    'name': getattr(u, 'name', u.username),
                    'email': u.email,
                    'role': getattr(u, 'role', 'user'),
                    'isActive': u.is_active,
                    'createdAt': getattr(u, 'created_at', u.date_joined),
                    'lastLogin': u.last_login
                })
            
            return Response(user_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to fetch users: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)