"""
Simplified API views for user authentication and management without multi-tenancy.
"""

from django.contrib.auth import login, logout
from django.db.models import Count, Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    extend_schema,
    extend_schema_view,
)
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import (
    ChangePasswordSerializer,
    DoctorSerializer,
    LoginSerializer,
    PatientSerializer,
    UserCreateSerializer,
    UserSerializer,
)


@extend_schema(
    tags=["Authentication"],
    summary="Register new user",
    description="Register a new user with role assignment.",
    responses={201: UserSerializer, 400: {"description": "Validation error"}},
)
class RegisterView(generics.CreateAPIView):
    """User registration endpoint."""

    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        """Return available roles for registration."""
        return Response(
            {
                "role_choices": User.ROLE_CHOICES,
                "form_fields": {
                    "email": "required",
                    "password": "required (min 8 characters)",
                    "password_confirm": "required",
                    "first_name": "required",
                    "last_name": "required",
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
            "type": "object",
            "properties": {
                "user": {"$ref": "#/components/schemas/User"},
                "tokens": {
                    "type": "object",
                    "properties": {
                        "access": {"type": "string"},
                        "refresh": {"type": "string"},
                    },
                },
            },
        },
        400: {"description": "Invalid credentials"},
    },
)
class LoginView(APIView):
    """User login endpoint."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """Authenticate user and return tokens."""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            login(request, user)

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
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=["Authentication"],
    summary="User logout",
    description="Logout user and invalidate session",
)
class LogoutView(APIView):
    """User logout endpoint."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Logout user."""
        logout(request)
        return Response({"message": "Successfully logged out"})


@extend_schema(
    tags=["Authentication"],
    summary="Refresh token",
    description="Get new access token using refresh token",
)
class TokenRefreshView(APIView):
    """Token refresh endpoint."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """Refresh access token."""
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            refresh = RefreshToken(refresh_token)
            return Response({"access": str(refresh.access_token)})
        except Exception as e:
            return Response(
                {"error": "Invalid refresh token"}, status=status.HTTP_400_BAD_REQUEST
            )


@extend_schema(
    tags=["Users"],
    summary="Change password",
    description="Change user password (requires current password)",
    request=ChangePasswordSerializer,
)
class ChangePasswordView(generics.UpdateAPIView):
    """Change password endpoint."""

    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


@extend_schema(
    tags=["Users"],
    summary="User profile",
    description="Get and update user profile information",
)
class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile endpoint."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


@extend_schema(
    tags=["Users"],
    summary="List doctors",
    description="Get list of all doctors in the system",
)
class DoctorListView(generics.ListAPIView):
    """List all doctors."""

    queryset = User.objects.filter(role="doctor", is_active=True)
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter doctors by specialization if provided."""
        queryset = super().get_queryset()
        specialization = self.request.query_params.get("specialization")
        if specialization:
            queryset = queryset.filter(specialization__icontains=specialization)
        return queryset


@extend_schema(
    tags=["Users"],
    summary="List patients",
    description="Get list of all patients in the system",
)
class PatientListView(generics.ListAPIView):
    """List all patients."""

    queryset = User.objects.filter(role="patient", is_active=True)
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter patients by search query if provided."""
        queryset = super().get_queryset()
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
            )
        return queryset


@extend_schema(
    tags=["Users"],
    summary="User statistics",
    description="Get user statistics and counts",
)
class UserStatsView(APIView):
    """User statistics endpoint."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Return user statistics."""
        stats = {
            "total_users": User.objects.count(),
            "doctors": User.objects.filter(role="doctor", is_active=True).count(),
            "patients": User.objects.filter(role="patient", is_active=True).count(),
            "nurses": User.objects.filter(role="nurse", is_active=True).count(),
            "staff": User.objects.filter(role="staff", is_active=True).count(),
            "active_users": User.objects.filter(is_active=True).count(),
        }
        return Response(stats)
