# 🏥 Subdomain-Based Multi-Tenancy Implementation Guide

This guide explains how to implement and use subdomain-based multi-tenancy for the MedCor Healthcare Platform, where each hospital gets its own subdomain (e.g., `hospital1.medcor.ai`, `citygeneral.medcor.ai`).

## 🎯 Overview

The subdomain tenancy system allows:

- Each hospital to have a unique subdomain
- Hospital-specific data isolation
- Custom branding and content per hospital
- Centralized management with tenant-specific views

## 🚀 Quick Start

### 1. Run the Implementation Script

```bash
# Copy the script to your server
scp scripts/implement_subdomain_tenancy.sh root@51.16.221.91:/tmp/

# Run the script on your server
ssh root@51.16.221.91 "chmod +x /tmp/implement_subdomain_tenancy.sh && /tmp/implement_subdomain_tenancy.sh"
```

### 2. Configure DNS

Add these DNS records to your domain:

```
# A record for main domain
medcor.ai.          A      51.16.221.91
www.medcor.ai.      A      51.16.221.91

# Wildcard subdomain
*.medcor.ai.        A      51.16.221.91
```

### 3. Update Nginx Configuration

```bash
# Copy the nginx configuration
sudo cp nginx/subdomain.conf /etc/nginx/sites-available/medcor-subdomains

# Enable the site
sudo ln -s /etc/nginx/sites-available/medcor-subdomains /etc/nginx/sites-enabled/

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

## 🏗️ Architecture

### Database Schema

The `Hospital` model now includes:

- `subdomain`: Unique subdomain identifier
- `name`: Hospital name
- `slug`: URL-friendly identifier
- All existing hospital fields

### Middleware Flow

1. **Request comes in** with subdomain (e.g., `citygeneral.medcor.ai`)
2. **TenantMiddleware** extracts subdomain
3. **Looks up hospital** by subdomain
4. **Sets `request.hospital`** for the current request
5. **All views** can access `request.hospital`

### URL Structure

```
Main Domain:
- https://medcor.ai/                    # Main site
- https://medcor.ai/api/                # Main API

Hospital Subdomains:
- https://citygeneral.medcor.ai/        # Hospital public page
- https://citygeneral.medcor.ai/api/info/    # Hospital info API
- https://citygeneral.medcor.ai/api/dashboard/ # Hospital dashboard
```

## 🛠️ Usage

### Creating a New Hospital

#### Using Management Command

```bash
python manage.py create_hospital \
    --name "City General Hospital" \
    --subdomain "citygeneral" \
    --type "GENERAL" \
    --address "123 Main Street" \
    --city "New York" \
    --state "NY" \
    --phone "+1-555-0101" \
    --email "info@citygeneral.medcor.ai" \
    --description "Leading general hospital in the city"
```

#### Using Django Admin

1. Go to `/admin/tenants/hospital/`
2. Add new hospital
3. Set the `subdomain` field
4. Save

#### Using API

```bash
curl -X POST https://medcor.ai/api/tenants/hospitals/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Metro Medical Center",
    "subdomain": "metro",
    "hospital_type": "MEDICAL_CENTER",
    "address_line1": "456 Oak Avenue",
    "city": "Los Angeles",
    "state": "CA",
    "phone_number": "+1-555-0202",
    "email": "contact@metro.medcor.ai"
  }'
```

### Accessing Hospital-Specific Data

#### In Views

```python
def my_view(request):
    if hasattr(request, 'hospital') and request.hospital:
        hospital = request.hospital
        # Access hospital-specific data
        print(f"Current hospital: {hospital.name}")
        print(f"Subdomain: {hospital.subdomain}")

        # Filter data by hospital
        appointments = Appointment.objects.filter(hospital=hospital)
    else:
        # No hospital context (main domain)
        pass
```

#### In Templates

```html
{% if request.hospital %}
<h1>Welcome to {{ request.hospital.name }}</h1>
<p>Subdomain: {{ request.hospital.subdomain }}</p>
{% else %}
<h1>MedCor Healthcare Platform</h1>
{% endif %}
```

### API Endpoints

#### Hospital Information

```bash
# Get current hospital info
curl https://citygeneral.medcor.ai/api/info/

# Response:
{
    "id": "uuid-here",
    "name": "City General Hospital",
    "subdomain": "citygeneral",
    "hospital_type": "General Hospital",
    "address": "123 Main Street, New York, NY, 10001, United States",
    "phone_number": "+1-555-0101",
    "email": "info@citygeneral.medcor.ai",
    "is_active": true,
    "is_verified": true
}
```

#### Hospital Dashboard

```bash
# Get hospital dashboard data
curl https://citygeneral.medcor.ai/api/dashboard/

# Response includes:
{
    "name": "City General Hospital",
    "subdomain": "citygeneral",
    "services": ["Emergency Medicine", "Cardiology", "Pediatrics"],
    "operating_hours": {"monday": "8:00-18:00", "tuesday": "8:00-18:00"},
    "is_emergency_capable": true,
    "bed_count": 200
}
```

## 🔧 Configuration

### Settings

Add to your `settings.py`:

```python
# Main domains for subdomain handling
MAIN_DOMAINS = ['medcor.ai', 'localhost', '127.0.0.1']

# Update ALLOWED_HOSTS to include wildcard
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '51.16.221.91',
    'medcor.ai',
    '*.medcor.ai',  # Wildcard for subdomains
]
```

### Middleware Order

Ensure `TenantMiddleware` is early in the middleware stack:

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'tenants.middleware.TenantMiddleware',  # Add this early
    'django.middleware.security.SecurityMiddleware',
    # ... other middleware
]
```

## 🧪 Testing

### Local Development

For local testing, you can use:

```bash
# Test with Host header
curl -H "Host: citygeneral.medcor.ai" http://localhost:8000/api/info/

# Or add to /etc/hosts
echo "127.0.0.1 citygeneral.localhost" >> /etc/hosts
echo "127.0.0.1 metro.localhost" >> /etc/hosts

# Then test
curl http://citygeneral.localhost:8000/api/info/
```

### Production Testing

```bash
# Test subdomains
curl https://citygeneral.medcor.ai/api/info/
curl https://metro.medcor.ai/api/info/
curl https://sunshine.medcor.ai/api/info/

# Test main domain
curl https://medcor.ai/api/
```

## 🚨 Troubleshooting

### Common Issues

1. **Subdomain not working**

   - Check DNS configuration
   - Verify nginx configuration
   - Check if subdomain exists in database

2. **Hospital not found**

   - Verify subdomain spelling
   - Check if hospital is active
   - Check middleware order

3. **SSL issues**
   - Use wildcard SSL certificate
   - Update nginx SSL configuration

### Debug Commands

```bash
# Check if hospital exists
python manage.py shell
>>> from tenants.models import Hospital
>>> Hospital.objects.filter(subdomain='citygeneral')

# Test middleware
python manage.py shell
>>> from django.test import RequestFactory
>>> from tenants.middleware import TenantMiddleware
>>> factory = RequestFactory()
>>> request = factory.get('/', HTTP_HOST='citygeneral.medcor.ai')
>>> middleware = TenantMiddleware(lambda r: None)
>>> middleware.process_request(request)
>>> print(request.hospital)
```

## 📋 Sample Hospitals

The implementation script creates these sample hospitals:

1. **City General Hospital**

   - Subdomain: `citygeneral`
   - URL: `https://citygeneral.medcor.ai`
   - Type: General Hospital

2. **Metro Medical Center**

   - Subdomain: `metro`
   - URL: `https://metro.medcor.ai`
   - Type: Medical Center

3. **Sunshine Children Hospital**
   - Subdomain: `sunshine`
   - URL: `https://sunshine.medcor.ai`
   - Type: Children's Hospital

## 🔐 Security Considerations

1. **Subdomain Validation**: Ensure subdomains are properly validated
2. **Data Isolation**: Verify hospital data is properly isolated
3. **SSL Certificates**: Use wildcard SSL certificates
4. **Rate Limiting**: Implement per-subdomain rate limiting
5. **Access Control**: Ensure proper authentication and authorization

## 🚀 Next Steps

1. **Custom Branding**: Add hospital-specific themes and branding
2. **Custom Domains**: Allow hospitals to use their own domains
3. **Advanced Routing**: Implement more complex routing rules
4. **Analytics**: Add per-hospital analytics and reporting
5. **Mobile Apps**: Update mobile apps to handle subdomains

## 📞 Support

For issues or questions:

- Check the logs: `sudo journalctl -u gunicorn -f`
- Test API endpoints: `curl -v https://subdomain.medcor.ai/api/info/`
- Verify database: `python manage.py shell` and check Hospital model
