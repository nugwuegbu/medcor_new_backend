from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Avg, Count, Prefetch, Q
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import DoctorSpecialty, Specialty, SpecialtyStatistics
from .serializers import (
    BulkSpecialtyAssignSerializer,
    DoctorSpecialtyCreateSerializer,
    DoctorSpecialtySerializer,
    DoctorWithSpecialtiesSerializer,
    SpecialtyListSerializer,
    SpecialtySerializer,
    SpecialtyStatisticsSerializer,
)

User = get_user_model()


class LargeResultsSetPagination(PageNumberPagination):
    """Pagination for large result sets"""

    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 100


class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination"""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 50


class SmallResultsSetPagination(PageNumberPagination):
    """Pagination for small result sets"""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 25


class SpecialtyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing medical specialties
    Supports lazy loading with pagination and filtering
    """

    queryset = Specialty.objects.all()
    serializer_class = SpecialtySerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "code", "description"]
    ordering_fields = ["name", "created_at", "years_of_training"]
    ordering = ["name"]

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ["list", "retrieve", "popular", "search"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == "list":
            return SpecialtyListSerializer
        return SpecialtySerializer

    def get_queryset(self):
        """Optimize queryset with prefetch and annotations"""
        queryset = super().get_queryset()

        # Add annotations for better performance
        queryset = queryset.annotate(doctor_count=Count("specialists", distinct=True))

        # Filter by active status if specified
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        # Filter by certification requirement
        cert_required = self.request.query_params.get("certification_required")
        if cert_required is not None:
            queryset = queryset.filter(
                certification_required=cert_required.lower() == "true"
            )

        # Filter by minimum years of training
        min_years = self.request.query_params.get("min_years_training")
        if min_years:
            queryset = queryset.filter(years_of_training__gte=int(min_years))

        # Lazy loading optimization with select_related and prefetch_related
        if self.action == "retrieve":
            queryset = queryset.prefetch_related(
                Prefetch(
                    "specialists",
                    queryset=DoctorSpecialty.objects.select_related("doctor"),
                )
            )

        return queryset

    @action(detail=False, methods=["get"])
    def popular(self, request):
        """Get most popular specialties based on doctor count"""
        # Try to get from cache first
        cache_key = "popular_specialties"
        cached_data = cache.get(cache_key)

        if cached_data:
            return Response(cached_data)

        # Get top 10 specialties by doctor count
        specialties = (
            self.get_queryset()
            .annotate(total_doctors=Count("specialists"))
            .order_by("-total_doctors")[:10]
        )

        serializer = SpecialtyListSerializer(specialties, many=True)
        cache.set(cache_key, serializer.data, 3600)  # Cache for 1 hour

        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def doctors(self, request, pk=None):
        """Get all doctors with this specialty (paginated)"""
        specialty = self.get_object()

        # Get doctor specialties with this specialty
        doctor_specialties = (
            DoctorSpecialty.objects.filter(specialty=specialty)
            .select_related("doctor", "specialty")
            .order_by("-is_primary", "doctor__last_name")
        )

        # Apply pagination
        paginator = SmallResultsSetPagination()
        page = paginator.paginate_queryset(doctor_specialties, request)

        if page is not None:
            serializer = DoctorSpecialtySerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = DoctorSpecialtySerializer(doctor_specialties, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def update_statistics(self, request, pk=None):
        """Update statistics for a specialty"""
        specialty = self.get_object()

        # Get or create statistics
        stats, created = SpecialtyStatistics.objects.get_or_create(specialty=specialty)

        # Update statistics
        stats.update_statistics()

        serializer = SpecialtyStatisticsSerializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def bulk_create(self, request):
        """Bulk create specialties"""
        specialties_data = request.data.get("specialties", [])

        if not specialties_data:
            return Response(
                {"error": "No specialties provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        created_specialties = []
        errors = []

        for spec_data in specialties_data:
            serializer = SpecialtySerializer(data=spec_data)
            if serializer.is_valid():
                created_specialties.append(serializer.save())
            else:
                errors.append({"data": spec_data, "errors": serializer.errors})

        return Response(
            {
                "created": SpecialtySerializer(created_specialties, many=True).data,
                "errors": errors,
            }
        )

    @action(detail=False, methods=["get"])
    def search(self, request):
        """Advanced search for specialties with chunked results"""
        query = request.query_params.get("q", "")

        if not query:
            return Response(
                {"error": "Search query required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Perform search with multiple fields
        specialties = self.get_queryset().filter(
            Q(name__icontains=query)
            | Q(code__icontains=query)
            | Q(description__icontains=query)
        )

        # Apply pagination for chunked results
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(specialties, request)

        if page is not None:
            serializer = SpecialtyListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = SpecialtyListSerializer(specialties, many=True)
        return Response(serializer.data)


class DoctorSpecialtyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing doctor-specialty relationships
    Includes lazy loading and pagination
    """

    queryset = DoctorSpecialty.objects.all()
    serializer_class = DoctorSpecialtySerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "doctor__first_name",
        "doctor__last_name",
        "specialty__name",
        "certification_number",
    ]
    ordering_fields = ["created_at", "years_of_experience", "certification_date"]
    ordering = ["-is_primary", "specialty__name"]
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == "create":
            return DoctorSpecialtyCreateSerializer
        return DoctorSpecialtySerializer

    def get_queryset(self):
        """Optimize queryset with select_related for lazy loading"""
        queryset = super().get_queryset().select_related("doctor", "specialty")

        # Filter by doctor if specified
        doctor_id = self.request.query_params.get("doctor_id")
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)

        # Filter by specialty if specified
        specialty_id = self.request.query_params.get("specialty_id")
        if specialty_id:
            queryset = queryset.filter(specialty_id=specialty_id)

        # Filter by primary status
        is_primary = self.request.query_params.get("is_primary")
        if is_primary is not None:
            queryset = queryset.filter(is_primary=is_primary.lower() == "true")

        # Filter by years of experience
        min_experience = self.request.query_params.get("min_experience")
        if min_experience:
            queryset = queryset.filter(years_of_experience__gte=int(min_experience))

        return queryset

    def create(self, request, *args, **kwargs):
        """Create doctor specialty with default if not specified"""
        data = request.data.copy()

        # If no specialty specified, use default
        if "specialty" not in data:
            default_specialty = Specialty.get_default_specialty()
            data["specialty"] = default_specialty.id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Return full details
        instance = serializer.instance
        detail_serializer = DoctorSpecialtySerializer(instance)

        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def bulk_assign(self, request):
        """Bulk assign specialty to multiple doctors"""
        serializer = BulkSpecialtyAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        doctor_ids = serializer.validated_data["doctor_ids"]
        specialty_id = serializer.validated_data["specialty_id"]
        is_primary = serializer.validated_data.get("is_primary", False)

        specialty = Specialty.objects.get(id=specialty_id)
        created_assignments = []

        for doctor_id in doctor_ids:
            doctor = User.objects.get(id=doctor_id)

            # Create or update the doctor specialty
            doc_specialty, created = DoctorSpecialty.objects.update_or_create(
                doctor=doctor, specialty=specialty, defaults={"is_primary": is_primary}
            )

            if created:
                created_assignments.append(doc_specialty)

        serializer = DoctorSpecialtySerializer(created_assignments, many=True)
        return Response(
            {
                "message": f"Assigned {len(created_assignments)} doctors to {specialty.name}",
                "assignments": serializer.data,
            }
        )

    @action(detail=False, methods=["get"])
    def by_doctor(self, request):
        """Get specialties for a specific doctor (lazy loaded)"""
        doctor_id = request.query_params.get("doctor_id")

        if not doctor_id:
            return Response(
                {"error": "doctor_id parameter required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get doctor with prefetched specialties
        try:
            doctor = User.objects.prefetch_related(
                Prefetch(
                    "doctor_specialties",
                    queryset=DoctorSpecialty.objects.select_related("specialty"),
                )
            ).get(id=doctor_id, role="doctor")
        except User.DoesNotExist:
            return Response(
                {"error": "Doctor not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = DoctorWithSpecialtiesSerializer(doctor)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def set_primary(self, request, pk=None):
        """Set a doctor specialty as primary"""
        doctor_specialty = self.get_object()
        doctor_specialty.is_primary = True
        doctor_specialty.save()

        serializer = DoctorSpecialtySerializer(doctor_specialty)
        return Response(serializer.data)


class SpecialtyStatisticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing specialty statistics
    Read-only with pagination for performance
    """

    queryset = SpecialtyStatistics.objects.all()
    serializer_class = SpecialtyStatisticsSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = [
        "total_doctors",
        "total_appointments",
        "average_rating",
        "average_wait_days",
    ]
    ordering = ["-total_doctors"]
    permission_classes = [AllowAny]

    def get_queryset(self):
        """Optimize queryset with select_related"""
        queryset = super().get_queryset().select_related("specialty")

        # Filter by minimum doctors
        min_doctors = self.request.query_params.get("min_doctors")
        if min_doctors:
            queryset = queryset.filter(total_doctors__gte=int(min_doctors))

        # Filter by minimum rating
        min_rating = self.request.query_params.get("min_rating")
        if min_rating:
            queryset = queryset.filter(average_rating__gte=float(min_rating))

        return queryset

    @action(detail=False, methods=["get"])
    def top_rated(self, request):
        """Get top-rated specialties"""
        # Cache key for top rated specialties
        cache_key = "top_rated_specialties"
        cached_data = cache.get(cache_key)

        if cached_data:
            return Response(cached_data)

        # Get top 10 by rating
        top_specialties = (
            self.get_queryset()
            .filter(average_rating__gt=0)
            .order_by("-average_rating")[:10]
        )

        serializer = self.get_serializer(top_specialties, many=True)
        cache.set(cache_key, serializer.data, 3600)  # Cache for 1 hour

        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def high_demand(self, request):
        """Get specialties with high demand (low wait times, high requests)"""
        high_demand = (
            self.get_queryset()
            .filter(appointment_requests_last_month__gt=50)
            .order_by("average_wait_days")[:10]
        )

        serializer = self.get_serializer(high_demand, many=True)
        return Response(serializer.data)
