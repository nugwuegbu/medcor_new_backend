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
from django.shortcuts import get_object_or_404

from tenants.models import Hospital
from tenants.serializers import HospitalListSerializer

from .models import User, Certification
from .serializers import (
    ChangePasswordSerializer,
    CertificationSerializer,
    CertificationCreateSerializer,
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
    description="Register a new user with hospital assignment, professional information, and social media links. Users must select a hospital during registration.",
    request=UserCreateSerializer,
    responses={
        201: UserSerializer, 
        400: {"description": "Validation error"}
    },
    examples=[
        OpenApiExample(
            "Doctor Registration",
            summary="Register a new doctor",
            description="Example of registering a new doctor with social media links",
            value={
                "email": "doctor@example.com",
                "password": "securepassword123",
                "password_confirm": "securepassword123",
                "first_name": "John",
                "last_name": "Doe",
                "phone_number": "+1234567890",
                "role": "DOCTOR",
                "hospital": "hospital-uuid-here",
                "department": "Cardiology",
                "specialization": 1,
                "linkedin_url": "https://linkedin.com/in/johndoe",
                "facebook_url": "https://facebook.com/johndoe",
                "twitter_url": "https://twitter.com/johndoe"
            }
        ),
        OpenApiExample(
            "Patient Registration",
            summary="Register a new patient",
            description="Example of registering a new patient with social media links",
            value={
                "email": "patient@example.com",
                "password": "securepassword123",
                "password_confirm": "securepassword123",
                "first_name": "Jane",
                "last_name": "Smith",
                "phone_number": "+1234567890",
                "role": "PATIENT",
                "hospital": "hospital-uuid-here",
                "linkedin_url": "https://linkedin.com/in/janesmith",
                "facebook_url": "https://facebook.com/janesmith",
                "twitter_url": "https://twitter.com/janesmith"
            }
        )
    ]
)
class RegisterView(generics.CreateAPIView):
    """User registration endpoint with hospital selection."""

    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]


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


@extend_schema(
    tags=["Profile"],
    summary="Get/Update user profile",
    description="Retrieve or update the current user's profile including personal information, professional details, social media links, and certifications.",
    responses={
        200: UserSerializer,
        400: {"description": "Validation error"},
        401: {"description": "Authentication required"}
    },
    examples=[
        OpenApiExample(
            "Profile Response",
            summary="User profile with social media and certifications",
            description="Example response showing user profile with social media links and certifications",
            value={
                "id": "user-uuid",
                "email": "doctor@example.com",
                "first_name": "John",
                "last_name": "Doe",
                "full_name": "John Doe",
                "phone_number": "+1234567890",
                "role": "DOCTOR",
                "hospital": "hospital-uuid",
                "hospital_name": "General Hospital",
                "department": "Cardiology",
                "specialization": 1,
                "specialization_name": "Cardiology",
                "specialization_code": "CARD",
                "is_active": True,
                "is_verified": True,
                "profile_picture": "https://example.com/media/profiles/doctor.jpg",
                "bio": "Experienced cardiologist with 10+ years of practice.",
                "linkedin_url": "https://linkedin.com/in/johndoe",
                "facebook_url": "https://facebook.com/johndoe",
                "twitter_url": "https://twitter.com/johndoe",
                "preferred_language": "en",
                "timezone": "UTC",
                "doctor_specialties": [
                    {
                        "id": 1,
                        "code": "CARD",
                        "name": "Cardiology",
                        "is_primary": True,
                        "years_of_experience": 10,
                        "certification_date": "2020-01-15"
                    }
                ],
                "primary_specialty": {
                    "id": 1,
                    "code": "CARD",
                    "name": "Cardiology"
                },
                "certifications": [
                    {
                        "id": "cert-uuid",
                        "certification_name": "Medical License",
                        "certification_type": "MEDICAL_LICENSE",
                        "certification_license_id": "MD123456",
                        "issue_date": "2020-01-15",
                        "expiry_date": "2025-01-15",
                        "is_verified": True,
                        "is_active": True,
                        "is_expired": False,
                        "days_until_expiry": 365,
                        "file_document_url": "https://example.com/media/certifications/license.pdf",
                        "created_at": "2024-01-01T00:00:00Z"
                    }
                ],
                "created_at": "2020-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            }
        )
    ]
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

        # Build prefetch queries
        prefetch_queries = []
        
        # If user is a doctor, prefetch specialties
        if user.role == "doctor":
            prefetch_queries.append(
                Prefetch(
                    "doctor_specialties",
                    queryset=DoctorSpecialty.objects.select_related(
                        "specialty"
                    ).order_by("-is_primary", "specialty__name"),
                )
            )
        
        # Always prefetch certifications for all users
        prefetch_queries.append(
            Prefetch(
                "certifications",
                queryset=user.certifications.filter(is_active=True).order_by("-created_at")
            )
        )

        # Re-fetch with prefetch
        user = (
            User.objects.prefetch_related(*prefetch_queries)
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
        description="Create a new user with hospital assignment, professional information, and social media links (admin only).",
        request=UserCreateSerializer,
        responses={
            201: UserSerializer,
            400: {"description": "Validation error"},
            403: {"description": "Admin access required"}
        },
        examples=[
            OpenApiExample(
                "Create Doctor",
                summary="Create a new doctor",
                description="Example of creating a new doctor with social media links",
                value={
                    "email": "newdoctor@example.com",
                    "password": "securepassword123",
                    "password_confirm": "securepassword123",
                    "first_name": "Dr. Sarah",
                    "last_name": "Johnson",
                    "phone_number": "+1234567890",
                    "role": "DOCTOR",
                    "hospital": "hospital-uuid-here",
                    "department": "Neurology",
                    "specialization": 2,
                    "linkedin_url": "https://linkedin.com/in/sarahjohnson",
                    "facebook_url": "https://facebook.com/sarahjohnson",
                    "twitter_url": "https://twitter.com/sarahjohnson"
                }
            )
        ]
    ),
    retrieve=extend_schema(
        tags=["Users"],
        summary="Get user details",
        description="Get detailed information about a specific user including specialties for doctors, certifications, and social media links.",
        responses={
            200: UserSerializer,
            404: {"description": "User not found"},
            403: {"description": "Permission denied"}
        },
        examples=[
            OpenApiExample(
                "User Details Response",
                summary="Complete user profile",
                description="Example response showing complete user profile with all fields",
                value={
                    "id": "user-uuid",
                    "email": "doctor@example.com",
                    "first_name": "John",
                    "last_name": "Doe",
                    "full_name": "John Doe",
                    "phone_number": "+1234567890",
                    "role": "DOCTOR",
                    "hospital": "hospital-uuid",
                    "hospital_name": "General Hospital",
                    "department": "Cardiology",
                    "specialization": 1,
                    "specialization_name": "Cardiology",
                    "specialization_code": "CARD",
                    "is_active": True,
                    "is_verified": True,
                    "profile_picture": "https://example.com/media/profiles/doctor.jpg",
                    "bio": "Experienced cardiologist with 10+ years of practice.",
                    "linkedin_url": "https://linkedin.com/in/johndoe",
                    "facebook_url": "https://facebook.com/johndoe",
                    "twitter_url": "https://twitter.com/johndoe",
                    "preferred_language": "en",
                    "timezone": "UTC",
                    "doctor_specialties": [],
                    "primary_specialty": {},
                    "certifications": [],
                    "created_at": "2020-01-01T00:00:00Z",
                    "updated_at": "2024-01-01T00:00:00Z"
                }
            )
        ]
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
        """Retrieve user with optimized queries for specialization and certifications."""
        from django.db.models import Prefetch

        from specialty.models import DoctorSpecialty

        instance = self.get_object()

        # Build prefetch queries
        prefetch_queries = []
        
        # If it's a doctor, prefetch specialties
        if instance.role == "doctor":
            prefetch_queries.append(
                Prefetch(
                    "doctor_specialties",
                    queryset=DoctorSpecialty.objects.select_related(
                        "specialty"
                    ).order_by("-is_primary", "specialty__name"),
                )
            )
        
        # Always prefetch certifications for all users
        prefetch_queries.append(
            Prefetch(
                "certifications",
                queryset=instance.certifications.filter(is_active=True).order_by("-created_at")
            )
        )

        # Refetch with prefetch
        instance = (
            User.objects.prefetch_related(*prefetch_queries)
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
            appointments_count=Count("appointments_as_doctor"),
            patients_count=Count("appointments_as_doctor__patient", distinct=True),
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


@extend_schema(
    tags=["Hospital Users"],
    summary="List doctors by hospital",
    description="Get list of all doctors belonging to a specific hospital. No authentication required.",
    parameters=[
        OpenApiParameter(
            name="specialization",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Filter by specialization name",
            required=False,
        ),
        OpenApiParameter(
            name="search",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Search in doctor name or email",
            required=False,
        ),
    ],
)
class HospitalDoctorsView(generics.ListAPIView):
    """List all doctors belonging to a specific hospital."""

    serializer_class = DoctorSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        """Filter doctors by hospital_id and optional parameters."""
        hospital_id = self.kwargs.get('hospital_id')
        hospital = get_object_or_404(Hospital, id=hospital_id, is_active=True)
        
        queryset = User.objects.filter(
            hospital=hospital,
            role='DOCTOR',
            is_active=True
        ).select_related('hospital', 'specialization')
        
        # Filter by specialization if provided
        specialization = self.request.query_params.get('specialization')
        if specialization:
            queryset = queryset.filter(specialization__name__icontains=specialization)
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Prefetch doctor specialties for efficient querying
        from django.db.models import Prefetch
        from specialty.models import DoctorSpecialty
        
        queryset = queryset.prefetch_related(
            Prefetch(
                'doctor_specialties',
                queryset=DoctorSpecialty.objects.select_related('specialty').order_by(
                    '-is_primary', 'specialty__name'
                ),
            )
        )
        
        # Add appointment and patient counts
        queryset = queryset.annotate(
            appointments_count=Count('appointments_as_doctor'),
            patients_count=Count('appointments_as_doctor__patient', distinct=True),
        )
        
        return queryset.order_by('first_name', 'last_name')


@extend_schema(
    tags=["Hospital Users"],
    summary="List patients by hospital",
    description="Get list of all patients belonging to a specific hospital. No authentication required.",
    parameters=[
        OpenApiParameter(
            name="search",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Search in patient name or email",
            required=False,
        ),
        OpenApiParameter(
            name="gender",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Filter by gender",
            enum=["M", "F", "O"],
            required=False,
        ),
    ],
)
class HospitalPatientsView(generics.ListAPIView):
    """List all patients belonging to a specific hospital."""

    serializer_class = PatientSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        """Filter patients by hospital_id and optional parameters."""
        hospital_id = self.kwargs.get('hospital_id')
        hospital = get_object_or_404(Hospital, id=hospital_id, is_active=True)
        
        queryset = User.objects.filter(
            hospital=hospital,
            role='PATIENT',
            is_active=True
        ).select_related('hospital')
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Filter by gender if provided
        gender = self.request.query_params.get('gender')
        if gender:
            queryset = queryset.filter(gender=gender)
        
        return queryset.order_by('first_name', 'last_name')


@extend_schema_view(
    list=extend_schema(
        tags=["Doctors Certifications"],
        summary="List certifications",
        description="List all certifications with optional filtering by user, type, and status",
        parameters=[
            OpenApiParameter(
                name="user",
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.QUERY,
                description="Filter by user ID",
            ),
            OpenApiParameter(
                name="certification_type",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by certification type",
                enum=["PROFESSIONAL_CERTIFICATION", "MEDICAL_LICENSE", "TRAINING_CERTIFICATE", "SPECIALTY_BOARD", "CV_RESUME", "OTHERS"],
            ),
            OpenApiParameter(
                name="is_verified",
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description="Filter by verification status",
            ),
            OpenApiParameter(
                name="is_active",
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description="Filter by active status",
            ),
        ],
    ),
    create=extend_schema(
        tags=["Doctors Certifications"],
        summary="Create certification",
        description="Create a new certification for a user",
    ),
    retrieve=extend_schema(
        tags=["Doctors Certifications"],
        summary="Get certification details",
        description="Get detailed information about a specific certification",
    ),
    update=extend_schema(
        tags=["Doctors Certifications"],
        summary="Update certification",
        description="Update certification information",
    ),
    partial_update=extend_schema(
        tags=["Doctors Certifications"],
        summary="Partially update certification",
        description="Partially update certification information",
    ),
    destroy=extend_schema(
        tags=["Doctors Certifications"],
        summary="Delete certification",
        description="Delete a certification",
    ),
)
class CertificationViewSet(viewsets.ModelViewSet):
    """ViewSet for certification management."""

    serializer_class = CertificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter certifications based on user permissions."""
        queryset = Certification.objects.select_related('user')
        
        # Filter by hospital if not superuser
        if not self.request.user.is_superuser:
            if hasattr(self.request, "hospital") and self.request.hospital:
                queryset = queryset.filter(user__hospital=self.request.hospital)
            else:
                queryset = queryset.filter(user__hospital=self.request.user.hospital)
        
        # Filter by user if specified
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by certification type if specified
        cert_type = self.request.query_params.get('certification_type')
        if cert_type:
            queryset = queryset.filter(certification_type=cert_type)
        
        # Filter by verification status if specified
        is_verified = self.request.query_params.get('is_verified')
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified.lower() == 'true')
        
        # Filter by active status if specified
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "create":
            return CertificationCreateSerializer
        return CertificationSerializer

    def perform_create(self, serializer):
        """Set the user for the certification."""
        # If user is not specified in the data, use the current user
        if not serializer.validated_data.get('user'):
            serializer.save(user=self.request.user)
        else:
            serializer.save()

    @extend_schema(
        tags=["Doctors Certifications"],
        summary="List user certifications",
        description="Get all certifications for a specific user",
    )
    @action(detail=False, methods=["get"], url_path="user/(?P<user_id>[^/.]+)")
    def user_certifications(self, request, user_id=None):
        """Get all certifications for a specific user."""
        user = get_object_or_404(User, id=user_id)
        
        # Check permissions
        if not request.user.is_superuser:
            if hasattr(request.user, 'hospital') and request.user.hospital:
                if user.hospital != request.user.hospital:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You don't have permission to access this user's certifications.")
        
        certifications = Certification.objects.filter(
            user=user,
            is_active=True
        ).order_by('-created_at')
        
        serializer = self.get_serializer(certifications, many=True)
        return Response(serializer.data)

    @extend_schema(
        tags=["Doctors Certifications"],
        summary="Verify certification",
        description="Mark a certification as verified",
    )
    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        """Mark a certification as verified."""
        certification = self.get_object()
        certification.is_verified = True
        certification.save()
        return Response({"detail": "Certification verified successfully"})

    @extend_schema(
        tags=["Doctors Certifications"],
        summary="Deactivate certification",
        description="Deactivate a certification",
    )
    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        """Deactivate a certification."""
        certification = self.get_object()
        certification.is_active = False
        certification.save()
        return Response({"detail": "Certification deactivated successfully"})
