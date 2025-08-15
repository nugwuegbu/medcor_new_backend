"""
API views for user authentication and management.
"""

from rest_framework import generics, status, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login, logout
from django.db.models import Q, Count
from .models import User
from tenants.models import Hospital
from tenants.serializers import HospitalBasicSerializer
from .serializers import (
    UserSerializer, UserCreateSerializer, LoginSerializer,
    ChangePasswordSerializer, DoctorSerializer, PatientSerializer
)


class AvailableHospitalsView(generics.ListAPIView):
    """List available hospitals for user registration."""
    
    queryset = Hospital.objects.filter(is_active=True)
    serializer_class = HospitalBasicSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Disable pagination for this endpoint
    
    def get_queryset(self):
        """Return only active hospitals that can accept new users."""
        queryset = super().get_queryset()
        # You can add additional filtering here if needed
        # e.g., only hospitals that haven't reached their user limit
        return queryset.order_by('name')


class RegisterView(generics.CreateAPIView):
    """User registration endpoint with hospital selection."""
    
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, *args, **kwargs):
        """Return available hospitals for registration."""
        hospitals = Hospital.objects.filter(is_active=True).values(
            'id', 'name', 'city', 'state', 'hospital_type'
        )
        return Response({
            'available_hospitals': list(hospitals),
            'role_choices': User.ROLE_CHOICES,
            'form_fields': {
                'email': 'required',
                'password': 'required (min 8 characters)',
                'password_confirm': 'required',
                'first_name': 'required',
                'last_name': 'required',
                'hospital': 'required (select from available_hospitals)',
                'role': 'required (select from role_choices)',
                'phone_number': 'optional',
                'department': 'optional (for staff/doctors/nurses)',
                'specialization': 'optional (for doctors)'
            }
        })
    
    def create(self, request, *args, **kwargs):
        """Create user and return with tokens."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """User login endpoint."""
    
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer
    
    def post(self, request):
        """Authenticate user and return tokens."""
        serializer = LoginSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Update last login
        user.save(update_fields=['last_login'])
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })


class LogoutView(APIView):
    """User logout endpoint."""
    
    def post(self, request):
        """Logout user and blacklist token."""
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'detail': 'Successfully logged out'})
        except Exception as e:
            return Response(
                {'detail': 'Error logging out'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ProfileView(generics.RetrieveUpdateAPIView):
    """User profile endpoint."""
    
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Return current user."""
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """Change password endpoint."""
    
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        """Change user password."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'detail': 'Password changed successfully'})


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for user management (admin only)."""
    
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter users by current hospital."""
        queryset = User.objects.all()
        
        # Filter by hospital if not superadmin
        if not self.request.user.is_superuser:
            if hasattr(self.request, 'hospital') and self.request.hospital:
                queryset = queryset.filter(hospital=self.request.hospital)
            else:
                queryset = queryset.filter(hospital=self.request.user.hospital)
        
        # Filter by role if specified
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        return queryset.select_related('hospital')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return UserCreateSerializer
        elif self.request.query_params.get('role') == 'DOCTOR':
            return DoctorSerializer
        elif self.request.query_params.get('role') == 'PATIENT':
            return PatientSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get'])
    def doctors(self, request):
        """Get all doctors in the hospital."""
        doctors = self.get_queryset().filter(role='DOCTOR')
        doctors = doctors.annotate(
            appointments_count=Count('doctor_appointments'),
            patients_count=Count('doctor_appointments__patient', distinct=True)
        )
        serializer = DoctorSerializer(doctors, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def patients(self, request):
        """Get all patients in the hospital."""
        patients = self.get_queryset().filter(role='PATIENT')
        serializer = PatientSerializer(patients, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a user account."""
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'detail': 'User activated successfully'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a user account."""
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({'detail': 'User deactivated successfully'})