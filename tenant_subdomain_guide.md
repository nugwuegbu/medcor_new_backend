# Tenant-Specific Subdomain Access Guide

## Overview
The MedCor Django backend now supports tenant-specific subdomain access, allowing each hospital/clinic to access their dedicated API documentation and admin panels using their schema name as a subdomain.

## Available Tenants

### 1. Public Tenant (Default)
- **Schema**: `public`
- **Base URL**: `https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000`
- **API Docs**: `https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/api/docs/`
- **Admin Panel**: `https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/admin/`

### 2. Medcor Hospital
- **Schema**: `medcorhospital`
- **Base URL**: `https://medcorhospital.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000`
- **API Docs**: `https://medcorhospital.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/api/docs/`
- **Admin Panel**: `https://medcorhospital.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/admin/`

### 3. Medcor Clinic
- **Schema**: `medcorclinic`
- **Base URL**: `https://medcorclinic.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000`
- **API Docs**: `https://medcorclinic.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/api/docs/`
- **Admin Panel**: `https://medcorclinic.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/admin/`

## How It Works

### Domain Routing
- Django-tenants automatically routes requests based on the subdomain
- Each tenant has isolated database schemas
- URLs are dynamically resolved to the correct tenant context

### Schema-Based Access
```
{schema_name}.{base_domain}:8000/{endpoint}
```

Examples:
- `medcorhospital.domain:8000/api/docs/` → Medcor Hospital's API docs
- `medcorclinic.domain:8000/admin/` → Medcor Clinic's admin panel

## Testing Commands

### Using cURL
```bash
# Test Medcor Hospital API
curl -k -I "https://medcorhospital.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/api/"

# Test Medcor Clinic Admin
curl -k -I "https://medcorclinic.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/admin/"

# Test API Documentation
curl -k -I "https://medcorhospital.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/api/docs/"
```

### Using Python Test Script
```bash
cd medcor_backend
python test_tenant_subdomain_access.py
```

## Adding New Tenants

### Step 1: Create Tenant
```python
from tenants.models import Client, Domain

# Create new tenant
tenant = Client.objects.create(
    name="New Hospital",
    schema_name="newhospital"
)

# Create domain
Domain.objects.create(
    domain="newhospital.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev",
    tenant=tenant,
    is_primary=True
)
```

### Step 2: Access URLs
- **API Docs**: `https://newhospital.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/api/docs/`
- **Admin Panel**: `https://newhospital.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/admin/`

## Configuration Details

### Django Settings
- **ALLOWED_HOSTS**: Configured to accept all subdomains
- **CSRF_TRUSTED_ORIGINS**: Includes wildcard subdomain support
- **django-tenants**: Handles automatic tenant routing

### Middleware Stack
1. `TenantMainMiddleware` - Routes to correct tenant schema
2. `CorsMiddleware` - Handles cross-origin requests
3. Standard Django middleware stack

## Security Notes
- Each tenant has isolated data access
- Admin panels require tenant-specific authentication
- API endpoints respect tenant boundaries
- HTTPS is enforced for all subdomain access

## Troubleshooting

### Common Issues
1. **404 Not Found**: Check domain configuration in Django admin
2. **CSRF Errors**: Verify CSRF_TRUSTED_ORIGINS includes the subdomain
3. **Schema Not Found**: Ensure tenant exists and schema is created

### Debug Commands
```bash
# Check tenant configuration
python manage.py shell -c "from tenants.models import Client, Domain; print(Domain.objects.all())"

# Test specific tenant
python manage.py tenant_command shell --schema=medcorhospital
```

## Production Deployment
- Configure DNS to point subdomains to the server
- Update ALLOWED_HOSTS and CSRF_TRUSTED_ORIGINS with production domains
- Use proper SSL certificates for subdomain wildcards
- Set up load balancing if needed for multiple tenants