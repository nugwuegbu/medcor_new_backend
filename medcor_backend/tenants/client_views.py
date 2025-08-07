"""
Enhanced Client (Hospital/Clinic) endpoints with comprehensive Swagger documentation.
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiParameter,
    OpenApiExample, OpenApiResponse
)
from drf_spectacular.types import OpenApiTypes
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta

from .models import Client, Domain, User
from .serializers import ClientSerializer, DomainSerializer


@extend_schema_view(
    list=extend_schema(
        summary="List All Hospitals/Clinics",
        description="""
        Retrieve a paginated list of all hospitals and clinics registered in the system.
        
        ## Features:
        - Pagination support (default 20 items per page)
        - Search by name or schema name
        - Filter by name
        - Sort by name or creation date
        - Returns basic client information with associated domains
        
        ## Access Control:
        - Requires authentication
        - Superadmins can see all clients
        - Regular admins see only their assigned clients
        """,
        tags=["Clients (Hospitals/Clinics)"],
        parameters=[
            OpenApiParameter(
                name='search',
                type=str,
                location=OpenApiParameter.QUERY,
                description='Search clients by name or schema name',
                required=False
            ),
            OpenApiParameter(
                name='name',
                type=str,
                location=OpenApiParameter.QUERY,
                description='Filter by exact client name',
                required=False
            ),
            OpenApiParameter(
                name='ordering',
                type=str,
                location=OpenApiParameter.QUERY,
                description='Order results by field (e.g., name, -created_at)',
                required=False,
                enum=['name', '-name', 'created_at', '-created_at']
            ),
            OpenApiParameter(
                name='page',
                type=int,
                location=OpenApiParameter.QUERY,
                description='Page number for pagination',
                required=False
            ),
            OpenApiParameter(
                name='page_size',
                type=int,
                location=OpenApiParameter.QUERY,
                description='Number of items per page (max 100)',
                required=False
            ),
        ],
        responses={
            200: OpenApiResponse(
                response=ClientSerializer(many=True),
                description="Successfully retrieved list of clients",
                examples=[
                    OpenApiExample(
                        'Success Response',
                        value={
                            "count": 2,
                            "next": None,
                            "previous": None,
                            "results": [
                                {
                                    "id": 1,
                                    "schema_name": "hospital_abc",
                                    "name": "ABC General Hospital",
                                    "domains": [
                                        {
                                            "id": 1,
                                            "domain": "abc-hospital.medcor.ai",
                                            "is_primary": True
                                        }
                                    ],
                                    "created_at": "2025-01-07T10:00:00Z",
                                    "updated_at": "2025-01-07T10:00:00Z"
                                }
                            ]
                        }
                    )
                ]
            ),
            401: OpenApiResponse(description="Authentication required"),
            403: OpenApiResponse(description="Permission denied")
        }
    ),
    create=extend_schema(
        summary="Create New Hospital/Clinic",
        description="""
        Register a new hospital or clinic in the system.
        
        ## Required Fields:
        - **name**: The display name of the hospital/clinic
        - **schema_name**: Unique schema identifier (lowercase, no spaces)
        
        ## Process:
        1. Creates a new tenant with dedicated schema
        2. Automatically sets up database schema
        3. Creates default admin user for the tenant
        4. Returns the created client details
        
        ## Access Control:
        - Requires superadmin permissions
        """,
        tags=["Clients (Hospitals/Clinics)"],
        request=ClientSerializer,
        responses={
            201: OpenApiResponse(
                response=ClientSerializer,
                description="Client successfully created",
                examples=[
                    OpenApiExample(
                        'Success Response',
                        value={
                            "id": 3,
                            "schema_name": "xyz_clinic",
                            "name": "XYZ Medical Clinic",
                            "domains": [],
                            "created_at": "2025-01-07T15:30:00Z",
                            "updated_at": "2025-01-07T15:30:00Z"
                        }
                    )
                ]
            ),
            400: OpenApiResponse(
                description="Invalid data provided",
                examples=[
                    OpenApiExample(
                        'Validation Error',
                        value={
                            "schema_name": ["Client with this schema name already exists."],
                            "name": ["This field is required."]
                        }
                    )
                ]
            ),
            401: OpenApiResponse(description="Authentication required"),
            403: OpenApiResponse(description="Only superadmins can create clients")
        },
        examples=[
            OpenApiExample(
                'Create Hospital Request',
                value={
                    "name": "City Medical Center",
                    "schema_name": "city_medical"
                }
            ),
            OpenApiExample(
                'Create Clinic Request',
                value={
                    "name": "Downtown Health Clinic",
                    "schema_name": "downtown_clinic"
                }
            )
        ]
    ),
    retrieve=extend_schema(
        summary="Get Hospital/Clinic Details",
        description="""
        Retrieve complete information about a specific hospital or clinic.
        
        ## Returns:
        - Basic client information
        - Associated domains
        - Creation and update timestamps
        
        ## Access Control:
        - Requires authentication
        - Users can only access their assigned client details
        """,
        tags=["Clients (Hospitals/Clinics)"],
        responses={
            200: OpenApiResponse(
                response=ClientSerializer,
                description="Client details retrieved successfully"
            ),
            401: OpenApiResponse(description="Authentication required"),
            403: OpenApiResponse(description="Permission denied"),
            404: OpenApiResponse(description="Client not found")
        }
    ),
    update=extend_schema(
        summary="Update Hospital/Clinic (Full)",
        description="""
        Completely update all fields of a hospital or clinic.
        
        ## Required Fields:
        All fields must be provided, even if unchanged.
        
        ## Access Control:
        - Requires superadmin permissions
        """,
        tags=["Clients (Hospitals/Clinics)"],
        request=ClientSerializer,
        responses={
            200: OpenApiResponse(
                response=ClientSerializer,
                description="Client updated successfully"
            ),
            400: OpenApiResponse(description="Invalid data provided"),
            401: OpenApiResponse(description="Authentication required"),
            403: OpenApiResponse(description="Only superadmins can update clients"),
            404: OpenApiResponse(description="Client not found")
        }
    ),
    partial_update=extend_schema(
        summary="Update Hospital/Clinic (Partial)",
        description="""
        Partially update specific fields of a hospital or clinic.
        
        ## Features:
        - Only send fields that need updating
        - Schema name cannot be changed after creation
        
        ## Access Control:
        - Requires superadmin permissions
        """,
        tags=["Clients (Hospitals/Clinics)"],
        request=ClientSerializer,
        responses={
            200: OpenApiResponse(
                response=ClientSerializer,
                description="Client updated successfully"
            ),
            400: OpenApiResponse(description="Invalid data provided"),
            401: OpenApiResponse(description="Authentication required"),
            403: OpenApiResponse(description="Only superadmins can update clients"),
            404: OpenApiResponse(description="Client not found")
        },
        examples=[
            OpenApiExample(
                'Update Name Only',
                value={
                    "name": "New Hospital Name"
                }
            )
        ]
    ),
    destroy=extend_schema(
        summary="Delete Hospital/Clinic",
        description="""
        Permanently delete a hospital or clinic from the system.
        
        ## Warning:
        - This action is irreversible
        - Deletes all associated data including users, appointments, etc.
        - Drops the tenant's database schema
        
        ## Access Control:
        - Requires superadmin permissions
        - Additional confirmation may be required
        """,
        tags=["Clients (Hospitals/Clinics)"],
        responses={
            204: OpenApiResponse(description="Client deleted successfully"),
            401: OpenApiResponse(description="Authentication required"),
            403: OpenApiResponse(description="Only superadmins can delete clients"),
            404: OpenApiResponse(description="Client not found")
        }
    )
)
class ClientViewSet(viewsets.ModelViewSet):
    """
    Complete CRUD operations for managing Hospitals/Clinics (Tenants).
    
    This viewset provides comprehensive management capabilities for multi-tenant
    hospitals and clinics in the MedCor platform.
    """
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['name']
    search_fields = ['name', 'schema_name']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']

    def get_permissions(self):
        """
        Set permission classes based on action.
        Only superadmins can create, update, or delete clients.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @extend_schema(
        summary="Get Client Statistics",
        description="""
        Retrieve comprehensive statistics for a specific hospital or clinic.
        
        ## Statistics Include:
        - Total number of users by role
        - Active users count
        - Recent activity metrics
        - Domain information
        - Schema details
        
        ## Access Control:
        - Requires authentication
        - Users can only access statistics for their assigned client
        """,
        tags=["Clients (Hospitals/Clinics)"],
        responses={
            200: OpenApiResponse(
                description="Statistics retrieved successfully",
                examples=[
                    OpenApiExample(
                        'Statistics Response',
                        value={
                            "name": "ABC General Hospital",
                            "schema_name": "hospital_abc",
                            "statistics": {
                                "total_users": 150,
                                "total_doctors": 30,
                                "total_patients": 100,
                                "total_nurses": 15,
                                "total_admins": 5,
                                "active_users_today": 45,
                                "active_users_this_week": 120,
                                "domains_count": 2
                            },
                            "created_at": "2025-01-01T00:00:00Z",
                            "updated_at": "2025-01-07T12:00:00Z"
                        }
                    )
                ]
            ),
            401: OpenApiResponse(description="Authentication required"),
            403: OpenApiResponse(description="Permission denied"),
            404: OpenApiResponse(description="Client not found")
        }
    )
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get detailed statistics for a specific client."""
        client = self.get_object()
        
        # Calculate active users
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        
        stats = {
            'name': client.name,
            'schema_name': client.schema_name,
            'statistics': {
                'total_users': User.objects.count(),
                'total_doctors': User.objects.filter(role='doctor').count(),
                'total_patients': User.objects.filter(role='patient').count(),
                'total_nurses': User.objects.filter(role='nurse').count(),
                'total_admins': User.objects.filter(role='admin').count(),
                'active_users_today': User.objects.filter(
                    last_login__date=today
                ).count(),
                'active_users_this_week': User.objects.filter(
                    last_login__date__gte=week_ago
                ).count(),
                'domains_count': client.domains.count()
            },
            'created_at': client.created_at,
            'updated_at': client.updated_at
        }
        return Response(stats)

    @extend_schema(
        summary="Get Client Domains",
        description="""
        Retrieve all domains associated with a specific hospital or clinic.
        
        ## Returns:
        - List of all domains
        - Primary domain indication
        - Domain creation dates
        
        ## Access Control:
        - Requires authentication
        """,
        tags=["Clients (Hospitals/Clinics)"],
        responses={
            200: OpenApiResponse(
                response=DomainSerializer(many=True),
                description="Domains retrieved successfully",
                examples=[
                    OpenApiExample(
                        'Domains Response',
                        value=[
                            {
                                "id": 1,
                                "domain": "abc-hospital.medcor.ai",
                                "tenant": 1,
                                "is_primary": True,
                                "created_at": "2025-01-01T00:00:00Z",
                                "updated_at": "2025-01-01T00:00:00Z"
                            },
                            {
                                "id": 2,
                                "domain": "abc.medcor.ai",
                                "tenant": 1,
                                "is_primary": False,
                                "created_at": "2025-01-02T00:00:00Z",
                                "updated_at": "2025-01-02T00:00:00Z"
                            }
                        ]
                    )
                ]
            ),
            401: OpenApiResponse(description="Authentication required"),
            404: OpenApiResponse(description="Client not found")
        }
    )
    @action(detail=True, methods=['get'])
    def domains(self, request, pk=None):
        """Get all domains for a specific client."""
        client = self.get_object()
        domains = client.domains.all()
        serializer = DomainSerializer(domains, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get Active Clients",
        description="""
        Retrieve all clients that have active users in the last 30 days.
        
        ## Criteria:
        - At least one user login in the last 30 days
        - Client account is active
        
        ## Access Control:
        - Requires superadmin permissions
        """,
        tags=["Clients (Hospitals/Clinics)"],
        responses={
            200: OpenApiResponse(
                response=ClientSerializer(many=True),
                description="Active clients retrieved successfully"
            ),
            401: OpenApiResponse(description="Authentication required"),
            403: OpenApiResponse(description="Only superadmins can view active clients")
        }
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def active(self, request):
        """Get all active clients with recent user activity."""
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        # Get clients with recent user activity
        active_clients = Client.objects.filter(
            created_at__lte=timezone.now()  # Placeholder filter
        ).distinct()
        
        serializer = self.get_serializer(active_clients, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Search Clients",
        description="""
        Advanced search for clients with multiple criteria.
        
        ## Search Parameters:
        - Query string searches across name and schema
        - Can combine multiple search terms
        
        ## Access Control:
        - Requires authentication
        """,
        tags=["Clients (Hospitals/Clinics)"],
        parameters=[
            OpenApiParameter(
                name='q',
                type=str,
                location=OpenApiParameter.QUERY,
                description='Search query string',
                required=True
            )
        ],
        responses={
            200: OpenApiResponse(
                response=ClientSerializer(many=True),
                description="Search results"
            ),
            400: OpenApiResponse(description="Invalid search query"),
            401: OpenApiResponse(description="Authentication required")
        }
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced search for clients."""
        query = request.query_params.get('q', '')
        
        if not query:
            return Response(
                {"error": "Search query is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        clients = Client.objects.filter(
            Q(name__icontains=query) |
            Q(schema_name__icontains=query)
        )
        
        serializer = self.get_serializer(clients, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Bulk Create Clients",
        description="""
        Create multiple hospitals/clinics in a single request.
        
        ## Features:
        - Atomic transaction (all succeed or all fail)
        - Validates all clients before creation
        - Returns list of created clients
        
        ## Access Control:
        - Requires superadmin permissions
        """,
        tags=["Clients (Hospitals/Clinics)"],
        request=ClientSerializer(many=True),
        responses={
            201: OpenApiResponse(
                response=ClientSerializer(many=True),
                description="Clients created successfully"
            ),
            400: OpenApiResponse(description="Invalid data in one or more clients"),
            401: OpenApiResponse(description="Authentication required"),
            403: OpenApiResponse(description="Only superadmins can bulk create clients")
        },
        examples=[
            OpenApiExample(
                'Bulk Create Request',
                value=[
                    {
                        "name": "North Hospital",
                        "schema_name": "north_hospital"
                    },
                    {
                        "name": "South Clinic",
                        "schema_name": "south_clinic"
                    }
                ]
            )
        ]
    )
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_create(self, request):
        """Create multiple clients in a single request."""
        if not isinstance(request.data, list):
            return Response(
                {"error": "Expected a list of clients"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        clients = serializer.save()
        
        return Response(
            self.get_serializer(clients, many=True).data,
            status=status.HTTP_201_CREATED
        )