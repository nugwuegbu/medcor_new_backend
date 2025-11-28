#!/bin/bash
echo "🏥 Implementing Subdomain-Based Multi-Tenancy"
echo "============================================="

cd /var/www/html/medcor_backend2

# 1. Backup current files
echo "📦 Creating backups..."
cp tenants/models.py tenants/models.py.backup.subdomain.$(date +%Y%m%d_%H%M%S)
cp tenants/middleware.py tenants/middleware.py.backup.subdomain.$(date +%Y%m%d_%H%M%S)

# 2. Add subdomain field to Hospital model
echo "🔧 Adding subdomain field to Hospital model..."
python3 -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

from django.db import migrations, models

# Create migration for subdomain field
migration_content = '''from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('tenants', '0002_make_postal_code_optional'),
    ]

    operations = [
        migrations.AddField(
            model_name='hospital',
            name='subdomain',
            field=models.CharField(max_length=100, unique=True, blank=True, null=True, help_text='Unique subdomain for this hospital (e.g., hospital1, city-medical)'),
        ),
        migrations.AddIndex(
            model_name='hospital',
            index=models.Index(fields=['subdomain'], name='tenants_hospital_subdomain_idx'),
        ),
    ]
'''

with open('tenants/migrations/0003_add_subdomain_field.py', 'w') as f:
    f.write(migration_content)

print('✅ Migration created for subdomain field')
"

# 3. Update Hospital model to include subdomain field
echo "🔧 Updating Hospital model..."
python3 -c "
# Read the current models.py
with open('tenants/models.py', 'r') as f:
    content = f.read()

# Add subdomain field after slug field
updated_content = content.replace(
    'slug = models.SlugField(max_length=200, unique=True, blank=True)',
    '''slug = models.SlugField(max_length=200, unique=True, blank=True)
    subdomain = models.CharField(
        max_length=100, 
        unique=True, 
        blank=True, 
        null=True,
        help_text='Unique subdomain for this hospital (e.g., hospital1, city-medical)'
    )'''
)

# Add subdomain to indexes
updated_content = updated_content.replace(
    'models.Index(fields=[\"is_active\"]),',
    '''models.Index(fields=[\"is_active\"]),
            models.Index(fields=[\"subdomain\"]),'''
)

# Update save method to auto-generate subdomain
updated_content = updated_content.replace(
    'def save(self, *args, **kwargs):',
    '''def save(self, *args, **kwargs):
        # Auto-generate subdomain if not provided
        if not self.subdomain and self.name:
            base_subdomain = slugify(self.name).replace('-', '')[:20]  # Limit length
            unique_subdomain = base_subdomain
            suffix = 1
            while (
                Hospital.objects.filter(subdomain=unique_subdomain).exclude(pk=self.pk).exists()
            ):
                suffix += 1
                unique_subdomain = f\"{base_subdomain}{suffix}\"
            self.subdomain = unique_subdomain
        super().save(*args, **kwargs)'''
)

# Write the updated content
with open('tenants/models.py', 'w') as f:
    f.write(updated_content)

print('✅ Hospital model updated with subdomain field')
"

# 4. Update middleware for better subdomain handling
echo "🔧 Updating tenant middleware..."
cat > tenants/middleware.py << 'EOF'
"""
Enhanced Tenant middleware for subdomain-based multi-tenancy.
Identifies and sets the current tenant based on subdomain.
"""

import re
from django.http import Http404, HttpResponseRedirect
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

from .models import Hospital


class TenantMiddleware(MiddlewareMixin):
    """
    Enhanced middleware to identify the current tenant (hospital) for each request.
    Sets request.hospital based on subdomain.
    """

    def process_request(self, request):
        """Process incoming request to identify tenant."""
        request.hospital = None
        request.subdomain = None

        # Get the host from the request
        host = request.get_host().lower()
        
        # Remove port if present
        if ":" in host:
            host = host.split(":")[0]

        # Skip for localhost and IP addresses
        if host in ["localhost", "127.0.0.1"] or host.replace(".", "").isdigit():
            # For local development, check header or use default
            tenant_id = request.headers.get("X-Tenant-ID")
            if tenant_id:
                try:
                    request.hospital = Hospital.objects.get(
                        id=tenant_id, is_active=True
                    )
                    request.subdomain = request.hospital.subdomain
                except Hospital.DoesNotExist:
                    pass
            return

        # Extract subdomain using regex for better handling
        subdomain_pattern = r'^([^.]+)\.(.+)$'
        match = re.match(subdomain_pattern, host)
        
        if match:
            subdomain = match.group(1)
            domain = match.group(2)
            
            # Skip www and common non-tenant subdomains
            if subdomain in ["www", "api", "admin", "public", "app", "www-api"]:
                return
            
            # Check if this is our main domain
            main_domains = getattr(settings, 'MAIN_DOMAINS', ['medcor.ai', 'localhost'])
            if domain not in main_domains:
                return
            
            request.subdomain = subdomain
            
            # Try to find hospital by subdomain
            try:
                request.hospital = Hospital.objects.get(
                    subdomain=subdomain, 
                    is_active=True
                )
            except Hospital.DoesNotExist:
                # Hospital not found - could redirect to main site or show 404
                if not request.path.startswith('/api/'):
                    # For non-API requests, redirect to main site
                    main_domain = f"https://{domain}"
                    return HttpResponseRedirect(main_domain)
                else:
                    # For API requests, return 404
                    raise Http404(f"Hospital with subdomain '{subdomain}' not found")

        # Alternative: Check for tenant header (useful for API access)
        if not request.hospital:
            tenant_header = request.headers.get("X-Tenant-Subdomain")
            if tenant_header:
                try:
                    request.hospital = Hospital.objects.get(
                        subdomain=tenant_header, is_active=True
                    )
                    request.subdomain = tenant_header
                except Hospital.DoesNotExist:
                    pass

    def process_response(self, request, response):
        """Add tenant information to response headers if available."""
        if hasattr(request, "hospital") and request.hospital:
            response["X-Tenant-ID"] = str(request.hospital.id)
            response["X-Tenant-Subdomain"] = request.hospital.subdomain
            response["X-Tenant-Name"] = request.hospital.name
        return response
EOF

# 5. Create hospital-specific views
echo "🔧 Creating hospital-specific views..."
cat > tenants/views.py << 'EOF'
"""
Hospital-specific views for subdomain-based access.
"""

from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Hospital
from .serializers import HospitalSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def hospital_info(request):
    """Get current hospital information based on subdomain."""
    if not hasattr(request, 'hospital') or not request.hospital:
        return Response({
            'error': 'Hospital not found for this subdomain'
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = HospitalSerializer(request.hospital)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def hospital_dashboard(request):
    """Hospital dashboard view."""
    if not hasattr(request, 'hospital') or not request.hospital:
        return Response({
            'error': 'Hospital not found for this subdomain'
        }, status=status.HTTP_404_NOT_FOUND)
    
    hospital = request.hospital
    
    # Get basic hospital stats
    stats = {
        'name': hospital.name,
        'subdomain': hospital.subdomain,
        'hospital_type': hospital.get_hospital_type_display(),
        'address': hospital.get_full_address(),
        'phone': hospital.phone_number,
        'email': hospital.email,
        'website': hospital.website,
        'services': hospital.services,
        'operating_hours': hospital.operating_hours,
        'is_emergency_capable': hospital.is_emergency_capable,
        'is_trauma_center': hospital.is_trauma_center,
        'bed_count': hospital.bed_count,
        'is_active': hospital.is_active,
        'is_verified': hospital.is_verified,
    }
    
    return Response(stats)


class HospitalPublicView(View):
    """Public hospital information view."""
    
    def get(self, request):
        """Display hospital public information."""
        if not hasattr(request, 'hospital') or not request.hospital:
            return render(request, 'tenants/hospital_not_found.html', {
                'subdomain': getattr(request, 'subdomain', 'unknown')
            })
        
        hospital = request.hospital
        context = {
            'hospital': hospital,
            'subdomain': request.subdomain,
        }
        
        return render(request, 'tenants/hospital_public.html', context)
EOF

# 6. Create hospital-specific URLs
echo "🔧 Creating hospital-specific URLs..."
cat > tenants/urls.py << 'EOF'
"""
URL patterns for tenant-specific views.
"""

from django.urls import path
from . import views

app_name = 'tenants'

urlpatterns = [
    # Hospital-specific API endpoints
    path('api/info/', views.hospital_info, name='hospital-info'),
    path('api/dashboard/', views.hospital_dashboard, name='hospital-dashboard'),
    
    # Public hospital pages
    path('', views.HospitalPublicView.as_view(), name='hospital-public'),
    path('about/', views.HospitalPublicView.as_view(), name='hospital-about'),
]
EOF

# 7. Update main URLs to include tenant URLs
echo "🔧 Updating main URLs..."
python3 -c "
# Read the main urls.py
with open('medcor_backend2/urls.py', 'r') as f:
    content = f.read()

# Add tenant URLs if not already present
if 'path(\"\", include(\"tenants.urls\"))' not in content:
    # Add tenant URLs at the root level for subdomain handling
    updated_content = content.replace(
        'urlpatterns = [',
        '''urlpatterns = [
    # Tenant-specific URLs (subdomain-based)
    path(\"\", include(\"tenants.urls\")),'''
    )
    
    with open('medcor_backend2/urls.py', 'w') as f:
        f.write(updated_content)
    
    print('✅ Added tenant URLs to main URL configuration')
else:
    print('✅ Tenant URLs already configured')
"

# 8. Add MAIN_DOMAINS to settings
echo "🔧 Adding MAIN_DOMAINS to settings..."
python3 -c "
# Read settings.py
with open('medcor_backend2/settings.py', 'r') as f:
    content = f.read()

# Add MAIN_DOMAINS if not present
if 'MAIN_DOMAINS' not in content:
    # Add after ALLOWED_HOSTS
    updated_content = content.replace(
        'ALLOWED_HOSTS = [',
        '''# Main domains for subdomain handling
MAIN_DOMAINS = ['medcor.ai', 'localhost', '127.0.0.1']

ALLOWED_HOSTS = ['''
    )
    
    with open('medcor_backend2/settings.py', 'w') as f:
        f.write(updated_content)
    
    print('✅ Added MAIN_DOMAINS to settings')
else:
    print('✅ MAIN_DOMAINS already configured')
"

# 9. Run migrations
echo "🔄 Running migrations..."
source venv/bin/activate
python3 manage.py makemigrations tenants
python3 manage.py migrate

# 10. Create sample hospitals with subdomains
echo "🏥 Creating sample hospitals with subdomains..."
python3 manage.py shell << 'EOF'
from tenants.models import Hospital

# Create sample hospitals
hospitals_data = [
    {
        'name': 'City General Hospital',
        'subdomain': 'citygeneral',
        'hospital_type': 'GENERAL',
        'address_line1': '123 Main Street',
        'city': 'New York',
        'state': 'NY',
        'postal_code': '10001',
        'phone_number': '+1-555-0101',
        'email': 'info@citygeneral.medcor.ai',
        'description': 'Leading general hospital in the city',
        'services': ['Emergency Medicine', 'Cardiology', 'Pediatrics', 'Surgery'],
        'is_active': True,
        'is_verified': True,
    },
    {
        'name': 'Metro Medical Center',
        'subdomain': 'metro',
        'hospital_type': 'MEDICAL_CENTER',
        'address_line1': '456 Oak Avenue',
        'city': 'Los Angeles',
        'state': 'CA',
        'postal_code': '90210',
        'phone_number': '+1-555-0202',
        'email': 'contact@metro.medcor.ai',
        'description': 'Comprehensive medical center serving the metro area',
        'services': ['Oncology', 'Neurology', 'Orthopedics', 'Radiology'],
        'is_active': True,
        'is_verified': True,
    },
    {
        'name': 'Sunshine Children Hospital',
        'subdomain': 'sunshine',
        'hospital_type': 'CHILDREN',
        'address_line1': '789 Pine Street',
        'city': 'Miami',
        'state': 'FL',
        'postal_code': '33101',
        'phone_number': '+1-555-0303',
        'email': 'hello@sunshine.medcor.ai',
        'description': 'Specialized care for children and families',
        'services': ['Pediatrics', 'Neonatology', 'Child Psychology', 'Family Medicine'],
        'is_active': True,
        'is_verified': True,
    }
]

for hospital_data in hospitals_data:
    hospital, created = Hospital.objects.get_or_create(
        subdomain=hospital_data['subdomain'],
        defaults=hospital_data
    )
    if created:
        print(f"✅ Created hospital: {hospital.name} (subdomain: {hospital.subdomain})")
    else:
        print(f"ℹ️ Hospital already exists: {hospital.name} (subdomain: {hospital.subdomain})")
EOF

# 11. Test the implementation
echo "🧪 Testing the implementation..."
python3 manage.py check

# 12. Restart gunicorn
echo "🔄 Restarting gunicorn..."
sudo systemctl restart gunicorn
sleep 5

# 13. Test subdomain access
echo "🧪 Testing subdomain access..."
echo "Testing citygeneral.medcor.ai:"
curl -H "Host: citygeneral.medcor.ai" http://localhost:8000/api/info/ || echo "❌ Test failed"

echo "Testing metro.medcor.ai:"
curl -H "Host: metro.medcor.ai" http://localhost:8000/api/info/ || echo "❌ Test failed"

echo "Testing sunshine.medcor.ai:"
curl -H "Host: sunshine.medcor.ai" http://localhost:8000/api/info/ || echo "❌ Test failed"

echo "🎉 Subdomain-based multi-tenancy implementation completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure DNS to point *.medcor.ai to your server"
echo "2. Update nginx configuration for subdomain handling"
echo "3. Test with real subdomains"
echo ""
echo "🔗 Test URLs:"
echo "- http://citygeneral.medcor.ai/api/info/"
echo "- http://metro.medcor.ai/api/info/"
echo "- http://sunshine.medcor.ai/api/info/"