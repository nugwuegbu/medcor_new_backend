from django.contrib.auth import authenticate
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from core.models import Doctor, Appointment

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