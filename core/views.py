"""
API views for user authentication and management.
"""

from django.contrib.auth import login, logout
from django.db import connection
from django.db.models import Count, Q
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    extend_schema,
    extend_schema_view,
)
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from tenants.models import Hospital
from tenants.serializers import HospitalListSerializer

from .models import User
from .serializers import (
    ChangePasswordSerializer,
    DoctorSerializer,
    LoginSerializer,
    PatientSerializer,
    UserCreateSerializer,
    UserSerializer,
)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """Health check endpoint for load balancers and monitoring."""
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")

        return Response(
            {
                "status": "healthy",
                "timestamp": timezone.now().isoformat(),
                "database": "connected",
                "version": "2.0.0",
                "service": "MedCor Backend API",
            }
        )
    except Exception as e:
        return Response(
            {
                "status": "unhealthy",
                "timestamp": timezone.now().isoformat(),
                "error": str(e),
                "service": "MedCor Backend API",
            },
            status=500,
        )


class AvailableHospitalsView(generics.ListAPIView):
    """List available hospitals for user registration."""

    queryset = Hospital.objects.filter(is_active=True)
    serializer_class = HospitalListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Disable pagination for this endpoint

    def get_queryset(self):
        """Return only active hospitals that can accept new users."""
        queryset = super().get_queryset()
        # You can add additional filtering here if needed
        # e.g., only hospitals that haven't reached their user limit
        return queryset.order_by("name")


@extend_schema(
    tags=["Authentication"],
    summary="Register new user",
    description="Register a new user with hospital assignment. Users must select a hospital during registration.",
    responses={201: UserSerializer, 400: {"description": "Validation error"}},
)
class RegisterView(generics.CreateAPIView):
    """User registration endpoint with hospital selection."""

    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        """Return available hospitals for registration."""
        hospitals = Hospital.objects.filter(is_active=True).values(
            "id", "name", "city", "state", "hospital_type"
        )
        return Response(
            {
                "available_hospitals": list(hospitals),
                "role_choices": User.ROLE_CHOICES,
                "form_fields": {
                    "email": "required",
                    "password": "required (min 8 characters)",
                    "password_confirm": "required",
                    "first_name": "required",
                    "last_name": "required",
                    "hospital": "required (select from available_hospitals)",
                    "role": "required (select from role_choices)",
                    "phone_number": "optional",
                    "department": "optional (for staff/doctors/nurses)",
                    "specialization": "optional (for doctors)",
                },
            }
        )

    def create(self, request, *args, **kwargs):
        """Create user and return with tokens."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(
    tags=["Authentication"],
    summary="User login",
    description="Authenticate user with email and password to receive JWT tokens",
    request=LoginSerializer,
    responses={
        200: {
            "description": "Login successful",
            "example": {
                "user": {},
                "tokens": {
                    "access": "eyJ0eXAiOiJKV1Q...",
                    "refresh": "eyJ0eXAiOiJKV1Q...",
                },
            },
        },
        401: {"description": "Invalid credentials"},
    },
)
class LoginView(APIView):
    """User login endpoint."""

    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        """Authenticate user and return tokens."""
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        # Update last login
        user.save(update_fields=["last_login"])

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            }
        )


class LogoutView(APIView):
    """User logout endpoint."""

    def post(self, request):
        """Logout user and blacklist token."""
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"detail": "Successfully logged out"})
        except Exception as e:
            return Response(
                {"detail": "Error logging out"}, status=status.HTTP_400_BAD_REQUEST
            )


class ProfileView(generics.RetrieveUpdateAPIView):
    """User profile endpoint with specialization info for doctors."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Return current user with optimized queries."""
        from django.db.models import Prefetch

        from specialty.models import DoctorSpecialty

        user = self.request.user

        # If user is a doctor, prefetch specialties
        if user.role == "doctor":
            # Re-fetch with prefetch
            user = (
                User.objects.prefetch_related(
                    Prefetch(
                        "doctor_specialties",
                        queryset=DoctorSpecialty.objects.select_related(
                            "specialty"
                        ).order_by("-is_primary", "specialty__name"),
                    )
                )
                .select_related("hospital")
                .get(pk=user.pk)
            )

        return user


class ChangePasswordView(generics.UpdateAPIView):
    """Change password endpoint."""

    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        """Change user password."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response({"detail": "Password changed successfully"})


@extend_schema_view(
    list=extend_schema(
        tags=["Users"],
        summary="List users",
        description="List all users with optional filtering by role, hospital, and search",
        parameters=[
            OpenApiParameter(
                name="role",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by user role (admin, doctor, nurse, patient)",
                enum=["admin", "doctor", "nurse", "patient"],
            ),
            OpenApiParameter(
                name="search",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Search in first name, last name, or email",
            ),
            OpenApiParameter(
                name="hospital",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Filter by hospital ID",
            ),
        ],
    ),
    create=extend_schema(
        tags=["Users"],
        summary="Create new user",
        description="Create a new user (admin only). Assign to hospital and set role.",
    ),
    retrieve=extend_schema(
        tags=["Users"],
        summary="Get user details",
        description="Get detailed information about a specific user including specialties for doctors",
    ),
    update=extend_schema(
        tags=["Users"],
        summary="Update user",
        description="Update user information (admin only)",
    ),
    partial_update=extend_schema(
        tags=["Users"],
        summary="Partially update user",
        description="Partially update user information (admin only)",
    ),
    destroy=extend_schema(
        tags=["Users"],
        summary="Deactivate user",
        description="Deactivate a user account (admin only). User is not deleted but marked inactive.",
    ),
)
class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for user management (admin only)."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter users by current hospital with optimized queries."""
        from django.db.models import Prefetch

        from specialty.models import DoctorSpecialty

        queryset = User.objects.all()

        # Filter by hospital if not superadmin
        if not self.request.user.is_superuser:
            if hasattr(self.request, "hospital") and self.request.hospital:
                queryset = queryset.filter(hospital=self.request.hospital)
            else:
                queryset = queryset.filter(hospital=self.request.user.hospital)

        # Filter by role if specified
        role = self.request.query_params.get("role")
        if role:
            queryset = queryset.filter(role=role.lower())  # Ensure lowercase

        # Search functionality
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
            )

        # Always select related hospital
        queryset = queryset.select_related("hospital")

        # If fetching doctors, prefetch specialties
        if role and role.lower() == "doctor":
            queryset = queryset.prefetch_related(
                Prefetch(
                    "doctor_specialties",
                    queryset=DoctorSpecialty.objects.select_related(
                        "specialty"
                    ).order_by("-is_primary", "specialty__name"),
                )
            )

        return queryset

    def get_serializer_class(self):
        """Return appropriate serializer based on action and user role."""
        if self.action == "create":
            return UserCreateSerializer

        # Check if we're retrieving a specific user
        if self.action == "retrieve":
            user = self.get_object()
            if user.role == "doctor":
                return DoctorSerializer
            elif user.role == "patient":
                return PatientSerializer

        # Check query params for role filtering
        role = self.request.query_params.get("role")
        if role and role.lower() == "doctor":
            return DoctorSerializer
        elif role and role.lower() == "patient":
            return PatientSerializer

        return UserSerializer

    def retrieve(self, request, *args, **kwargs):
        """Retrieve user with optimized queries for specialization."""
        from django.db.models import Prefetch

        from specialty.models import DoctorSpecialty

        instance = self.get_object()

        # If it's a doctor, refetch with prefetch
        if instance.role == "doctor":
            instance = (
                User.objects.prefetch_related(
                    Prefetch(
                        "doctor_specialties",
                        queryset=DoctorSpecialty.objects.select_related(
                            "specialty"
                        ).order_by("-is_primary", "specialty__name"),
                    )
                )
                .select_related("hospital")
                .get(pk=instance.pk)
            )

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @extend_schema(
        tags=["Users"],
        summary="List all doctors",
        description="Get all doctors in the hospital with their specialization information, appointment counts, and patient statistics",
    )
    @action(detail=False, methods=["get"])
    def doctors(self, request):
        """Get all doctors in the hospital with specialization info."""
        from django.db.models import Prefetch

        from specialty.models import DoctorSpecialty

        doctors = self.get_queryset().filter(role="doctor")  # Use lowercase 'doctor'

        # Prefetch doctor specialties for efficient querying
        doctors = doctors.prefetch_related(
            Prefetch(
                "doctor_specialties",
                queryset=DoctorSpecialty.objects.select_related("specialty").order_by(
                    "-is_primary", "specialty__name"
                ),
            )
        )

        doctors = doctors.annotate(
            appointments_count=Count("doctor_appointments"),
            patients_count=Count("doctor_appointments__patient", distinct=True),
        )
        serializer = DoctorSerializer(doctors, many=True)
        return Response(serializer.data)

    @extend_schema(
        tags=["Users"],
        summary="List all patients",
        description="Get all patients in the hospital with their medical record counts",
    )
    @action(detail=False, methods=["get"])
    def patients(self, request):
        """Get all patients in the hospital."""
        patients = self.get_queryset().filter(role="patient")  # Use lowercase 'patient'
        serializer = PatientSerializer(patients, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        """Activate a user account."""
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({"detail": "User activated successfully"})

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        """Deactivate a user account."""
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({"detail": "User deactivated successfully"})
