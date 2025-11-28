#!/bin/bash
echo "🔧 Fixing Knowledge Base API Response Issue"
echo "==========================================="

cd /var/www/html/medcor_backend2

# 1. Backup current views
echo "📦 Creating backup of knowledgebase views..."
cp knowledgebase/views.py knowledgebase/views.py.backup.api_fix.$(date +%Y%m%d_%H%M%S)

# 2. Show the current by_hospital method
echo "📋 Current by_hospital method in Ai_IdentityViewSet:"
grep -A 20 "def by_hospital(self, request):" knowledgebase/views.py | head -n 25

# 3. Create the fixed views.py content
echo "🔧 Creating fixed views.py..."
cat > /tmp/fixed_views.py << 'EOF'
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import Ai_Identity, Behavior, Response, Source
from .serializers import (
    Ai_IdentitySerializer,
    Ai_IdentityListSerializer,
    BehaviorSerializer,
    BehaviorListSerializer,
    ResponseSerializer,
    ResponseListSerializer,
    ResponseTemplateSerializer,
    SourceSerializer,
    SourceListSerializer,
    AIIdentityStatisticsSerializer,
    BehaviorStatisticsSerializer,
    ResponseStatisticsSerializer,
    SourceStatisticsSerializer,
)

User = get_user_model()


class KnowledgeBasePagination(PageNumberPagination):
    """Custom pagination for knowledge base"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@extend_schema(tags=["Knowledge Base "])
class Ai_IdentityViewSet(ModelViewSet):
    """ViewSet for Ai_Identity CRUD operations"""
    permission_classes = [IsAuthenticated]
    pagination_class = KnowledgeBasePagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'hospital']
    search_fields = ['agent_name', 'agent_title', 'system_prompt']
    ordering_fields = ['created_at', 'updated_at', 'agent_name']
    ordering = ['hospital', 'agent_name']

    def get_queryset(self):
        """Filter AI identities based on user permissions and hospital context"""
        queryset = Ai_Identity.objects.select_related('hospital')
        
        # Filter by hospital if user is not superuser
        if not self.request.user.is_superuser:
            if hasattr(self.request.user, 'hospital'):
                queryset = queryset.filter(hospital=self.request.user.hospital)
            else:
                # If user has no hospital, return empty queryset
                queryset = queryset.none()
        
        return queryset

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ['list']:
            return Ai_IdentityListSerializer
        return Ai_IdentitySerializer

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate an AI Identity"""
        ai_identity = self.get_object()
        ai_identity.is_active = True
        ai_identity.save()
        
        return Response({
            'message': 'AI Identity activated successfully',
            'is_active': ai_identity.is_active
        })

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate an AI Identity"""
        ai_identity = self.get_object()
        ai_identity.is_active = False
        ai_identity.save()
        
        return Response({
            'message': 'AI Identity deactivated successfully',
            'is_active': ai_identity.is_active
        })

    @action(detail=False, methods=['get'])
    def by_hospital(self, request):
        """Get AI identities grouped by hospital"""
        try:
            queryset = self.get_queryset()
            
            # Group by hospital
            hospitals = {}
            for ai_identity in queryset:
                hospital_name = ai_identity.hospital.name
                if hospital_name not in hospitals:
                    hospitals[hospital_name] = {
                        'hospital_id': str(ai_identity.hospital.id),
                        'hospital_name': hospital_name,
                        'ai_identities': []
                    }
                
                serializer = Ai_IdentityListSerializer(ai_identity, context={'request': request})
                hospitals[hospital_name]['ai_identities'].append(serializer.data)
            
            return Response(list(hospitals.values()))
        except Exception as e:
            return Response({
                'error': f'An error occurred while fetching AI identities by hospital: {str(e)}'
            }, status=500)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active AI identities"""
        queryset = self.get_queryset().filter(is_active=True)
        
        # Paginate results
        paginator = KnowledgeBasePagination()
        page = paginator.paginate_queryset(queryset, request)
        
        if page is not None:
            serializer = Ai_IdentityListSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        
        serializer = Ai_IdentityListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
EOF

# 4. Apply the fix using Python to replace the by_hospital method
echo "🔄 Applying the fix to by_hospital method..."
python3 -c "
import re

# Read the current views.py
with open('knowledgebase/views.py', 'r') as f:
    content = f.read()

# Read the fixed content
with open('/tmp/fixed_views.py', 'r') as f:
    fixed_content = f.read()

# Extract the fixed by_hospital method
fixed_method = '''    @action(detail=False, methods=['get'])
    def by_hospital(self, request):
        \"\"\"Get AI identities grouped by hospital\"\"\"
        try:
            queryset = self.get_queryset()
            
            # Group by hospital
            hospitals = {}
            for ai_identity in queryset:
                hospital_name = ai_identity.hospital.name
                if hospital_name not in hospitals:
                    hospitals[hospital_name] = {
                        'hospital_id': str(ai_identity.hospital.id),
                        'hospital_name': hospital_name,
                        'ai_identities': []
                    }
                
                serializer = Ai_IdentityListSerializer(ai_identity, context={'request': request})
                hospitals[hospital_name]['ai_identities'].append(serializer.data)
            
            return Response(list(hospitals.values()))
        except Exception as e:
            return Response({
                'error': f'An error occurred while fetching AI identities by hospital: {str(e)}'
            }, status=500)'''

# Find and replace the by_hospital method in Ai_IdentityViewSet
pattern = r'@action\(detail=False, methods=\[\'get\'\]\)\s*def by_hospital\(self, request\):.*?(?=    @action|\Z)'
new_content = re.sub(pattern, fixed_method, content, flags=re.DOTALL)

# Write the updated content
with open('knowledgebase/views.py', 'w') as f:
    f.write(new_content)

print('✅ by_hospital method fixed in Ai_IdentityViewSet')
"

# 5. Test Django configuration
echo "🧪 Testing Django configuration..."
source venv/bin/activate
python3 manage.py check --deploy

# 6. Restart gunicorn
echo "🔄 Restarting gunicorn..."
sudo systemctl restart gunicorn
sleep 5

# 7. Check status
echo "📊 Checking gunicorn status..."
sudo systemctl status gunicorn --no-pager

# 8. Test the API endpoint
echo "🧪 Testing the API endpoint..."
curl -I "http://localhost:8000/api/knowledgebase/ai-identities/by_hospital/" || echo "❌ Local test failed"

# 9. Show recent logs
echo "📋 Recent gunicorn logs:"
sudo journalctl -u gunicorn --no-pager -n 10

echo "🎉 Knowledge Base API fix completed!"
echo "📝 The by_hospital endpoint should now return proper HTTP responses"