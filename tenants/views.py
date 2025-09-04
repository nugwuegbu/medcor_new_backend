"""
Views for the tenants app.
"""

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    extend_schema,
    extend_schema_view,
)
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Hospital
from .serializers import (
    HospitalCreateSerializer,
    HospitalListSerializer,
    HospitalSerializer,
    HospitalUpdateSerializer,
)


@extend_schema_view(
    list=extend_schema(
        summary="List Hospitals",
        description="Retrieve a list of all hospitals with optional filtering and search capabilities.",
        parameters=[
            OpenApiParameter(
                name="search",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Search hospitals by name, city, or state",
            ),
            OpenApiParameter(
                name="hospital_type",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by hospital type (e.g., GENERAL, SPECIALTY, CLINIC)",
            ),
            OpenApiParameter(
                name="city",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by city",
            ),
            OpenApiParameter(
                name="state",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filter by state",
            ),
            OpenApiParameter(
                name="emergency_services",
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description="Filter by emergency services availability",
            ),
            OpenApiParameter(
                name="is_active",
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description="Filter by active status",
            ),
        ],
        examples=[
            OpenApiExample(
                "General Hospitals",
                value={"hospital_type": "GENERAL"},
                description="Filter to show only general hospitals",
            ),
            OpenApiExample(
                "Emergency Capable",
                value={"emergency_services": True},
                description="Filter to show hospitals with emergency services",
            ),
        ],
    ),
    create=extend_schema(
        summary="Create Hospital",
        description="Create a new hospital with all required information. No authentication required.",
        examples=[
            OpenApiExample(
                "General Hospital",
                value={
                    "name": "City General Hospital",
                    "hospital_type": "GENERAL",
                    "description": "A comprehensive general hospital serving the community",
                    "phone_number": "+1-555-123-4567",
                    "email": "info@citygeneral.com",
                    "website": "https://citygeneral.com",
                    "address_line1": "123 Medical Center Blvd",
                    "city": "Springfield",
                    "state": "IL",
                    "country": "United States",
                    "postal_code": "62701",
                    "bed_count": 250,
                    "emergency_services": True,
                    "services": [
                        "Cardiology",
                        "Pediatrics",
                        "Emergency Medicine",
                        "Surgery",
                    ],
                },
                description="Example of creating a general hospital",
            ),
        ],
    ),
    retrieve=extend_schema(
        summary="Get Hospital Details",
        description="Retrieve detailed information about a specific hospital. No authentication required.",
    ),
    update=extend_schema(
        summary="Update Hospital",
        description="Update all fields of an existing hospital. Authentication required.",
    ),
    partial_update=extend_schema(
        summary="Partial Update Hospital",
        description="Update specific fields of an existing hospital. Authentication required.",
    ),
    destroy=extend_schema(
        summary="Delete Hospital",
        description="Delete a hospital (soft delete by setting is_active=False). Authentication required.",
    ),
)
class HospitalViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing hospitals.

    Provides CRUD operations for hospital management with advanced filtering,
    search capabilities, and comprehensive validation.

    Permissions:
    - List and Retrieve: No authentication required (AllowAny)
    - Create: No authentication required (AllowAny)
    - Update, Partial Update, Delete: Authentication required (IsAuthenticated)
    """

    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = [
        "hospital_type",
        "city",
        "state",
        "country",
        "emergency_services",
        "is_active",
        "is_verified",
    ]
    search_fields = ["name", "city", "state", "description"]
    ordering_fields = ["name", "created_at", "bed_count", "city"]
    ordering = ["name"]

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ["list", "retrieve", "create"]:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        """Return appropriate serializer class based on action."""
        if self.action == "create":
            return HospitalCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return HospitalUpdateSerializer
        elif self.action == "list":
            return HospitalListSerializer
        return HospitalSerializer

    def get_queryset(self):
        """Return filtered queryset based on request parameters."""
        queryset = super().get_queryset()

        # Additional custom filtering
        hospital_type = self.request.query_params.get("hospital_type", None)
        if hospital_type:
            queryset = queryset.filter(hospital_type__iexact=hospital_type)

        emergency_services = self.request.query_params.get("emergency_services", None)
        if emergency_services is not None:
            emergency_services = emergency_services.lower() == "true"
            queryset = queryset.filter(emergency_services=emergency_services)

        return queryset

    @extend_schema(
        summary="Get Hospital Statistics",
        description="Retrieve statistics about hospitals including counts by type and location. No authentication required.",
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def statistics(self, request):
        """Get hospital statistics."""
        total_hospitals = Hospital.objects.count()
        active_hospitals = Hospital.objects.filter(is_active=True).count()
        emergency_hospitals = Hospital.objects.filter(emergency_services=True).count()

        # Count by type
        type_counts = {}
        for choice in Hospital.HOSPITAL_TYPE_CHOICES:
            type_counts[choice[1]] = Hospital.objects.filter(
                hospital_type=choice[0]
            ).count()

        # Count by state
        state_counts = {}
        for hospital in Hospital.objects.values("state").distinct():
            state = hospital["state"]
            state_counts[state] = Hospital.objects.filter(state=state).count()

        return Response(
            {
                "total_hospitals": total_hospitals,
                "active_hospitals": active_hospitals,
                "emergency_hospitals": emergency_hospitals,
                "by_type": type_counts,
                "by_state": state_counts,
            }
        )

    @extend_schema(
        summary="Search Hospitals by Location",
        description="Search for hospitals near a specific location using coordinates. No authentication required.",
        parameters=[
            OpenApiParameter(
                name="lat",
                type=OpenApiTypes.DECIMAL,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Latitude coordinate",
            ),
            OpenApiParameter(
                name="lng",
                type=OpenApiTypes.DECIMAL,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Longitude coordinate",
            ),
            OpenApiParameter(
                name="radius",
                type=OpenApiTypes.DECIMAL,
                location=OpenApiParameter.QUERY,
                default=50.0,
                description="Search radius in kilometers (default: 50)",
            ),
        ],
        responses={200: HospitalListSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def nearby(self, request):
        """Find hospitals near a specific location."""
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")
        radius = float(request.query_params.get("radius", 50.0))

        if not lat or not lng:
            return Response(
                {"error": "Latitude and longitude are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            lat = float(lat)
            lng = float(lng)
        except ValueError:
            return Response(
                {"error": "Invalid coordinates"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Simple distance calculation (for production, use PostGIS or similar)
        # This is a basic approximation - in production you'd want proper geospatial queries
        nearby_hospitals = []
        for hospital in Hospital.objects.filter(is_active=True):
            if hospital.latitude and hospital.longitude:
                # Calculate distance using Haversine formula (simplified)
                import math

                lat_diff = abs(lat - float(hospital.latitude))
                lng_diff = abs(lng - float(hospital.longitude))

                # Rough approximation (1 degree ≈ 111 km)
                distance = math.sqrt(lat_diff**2 + lng_diff**2) * 111

                if distance <= radius:
                    nearby_hospitals.append(hospital)

        # Sort by distance (closest first)
        nearby_hospitals.sort(
            key=lambda h: abs(lat - float(h.latitude)) + abs(lng - float(h.longitude))
        )

        serializer = HospitalListSerializer(nearby_hospitals, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get Emergency Hospitals",
        description="Retrieve all hospitals that provide emergency services. No authentication required.",
        responses={200: HospitalListSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def emergency(self, request):
        """Get hospitals with emergency services."""
        emergency_hospitals = Hospital.objects.filter(
            emergency_services=True, is_active=True
        ).order_by("name")

        serializer = HospitalListSerializer(emergency_hospitals, many=True)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        """Soft delete by setting is_active to False."""
        instance.is_active = False
        instance.save()
