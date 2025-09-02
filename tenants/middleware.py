"""
Tenant middleware for multi-tenant request handling.
Identifies and sets the current tenant based on subdomain or headers.
"""

from django.http import Http404
from django.utils.deprecation import MiddlewareMixin
from .models import Hospital


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware to identify the current tenant (hospital) for each request.
    Sets request.hospital based on subdomain or header.
    """
    
    def process_request(self, request):
        """Process incoming request to identify tenant."""
        request.hospital = None
        
        # Try to get tenant from subdomain
        host = request.get_host().lower()
        
        # Remove port if present
        if ':' in host:
            host = host.split(':')[0]
        
        # Extract subdomain
        parts = host.split('.')
        
        # Skip for localhost and IP addresses
        if host in ['localhost', '127.0.0.1'] or host.replace('.', '').isdigit():
            # For local development, check header or use default
            tenant_id = request.headers.get('X-Tenant-ID')
            if tenant_id:
                try:
                    request.hospital = Hospital.objects.get(
                        subdomain=tenant_id,
                        is_active=True
                    )
                except Hospital.DoesNotExist:
                    pass
            return
        
        # Extract subdomain (assuming format: subdomain.domain.com)
        if len(parts) >= 3:
            subdomain = parts[0]
            
            # Skip www
            if subdomain == 'www':
                if len(parts) >= 4:
                    subdomain = parts[1]
                else:
                    return
            
            # Skip public/admin subdomains
            if subdomain in ['public', 'admin', 'api']:
                return
            
            # Try to find hospital by subdomain
            try:
                request.hospital = Hospital.objects.get(
                    subdomain=subdomain,
                    is_active=True
                )
            except Hospital.DoesNotExist:
                # Hospital not found - could redirect to public site
                pass
        
        # Alternative: Check for tenant header (useful for API access)
        if not request.hospital:
            tenant_header = request.headers.get('X-Tenant-Subdomain')
            if tenant_header:
                try:
                    request.hospital = Hospital.objects.get(
                        subdomain=tenant_header,
                        is_active=True
                    )
                except Hospital.DoesNotExist:
                    pass
    
    def process_response(self, request, response):
        """Add tenant information to response headers if available."""
        if hasattr(request, 'hospital') and request.hospital:
            response['X-Tenant-ID'] = str(request.hospital.id)
            response['X-Tenant-Subdomain'] = request.hospital.subdomain
        return response