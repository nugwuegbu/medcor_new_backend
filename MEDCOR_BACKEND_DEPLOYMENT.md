# MedCor Backend Multi-Tenant Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Environment Setup](#environment-setup)
5. [Database Configuration](#database-configuration)
6. [Multi-Tenant Configuration](#multi-tenant-configuration)
7. [Deployment Steps](#deployment-steps)
8. [Domain & Subdomain Setup](#domain--subdomain-setup)
9. [Security Configuration](#security-configuration)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)

## Overview

MedCor Backend is a sophisticated multi-tenant healthcare platform built with Django that supports multiple hospitals/clinics, each with their own isolated data, users, and configurations. This document provides comprehensive instructions for deploying the backend in a production environment.

### Key Features
- **Multi-tenant Architecture**: Each hospital/clinic operates in isolation
- **Role-based Access Control**: Superadmin, Admin, Doctor, Patient roles
- **Secure Authentication**: JWT-based with face recognition support
- **API Documentation**: Built-in Swagger/OpenAPI documentation
- **Subscription Management**: Tenant-specific billing and plans

## Architecture

```
┌─────────────────────────────────────────────┐
│            Load Balancer/Nginx              │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│         Django Application Server           │
│                                             │
│  ┌──────────────┐  ┌──────────────┐       │
│  │ Tenant Router│  │ Middleware   │       │
│  └──────────────┘  └──────────────┘       │
│                                             │
│  ┌──────────────────────────────────┐      │
│  │       Multi-Tenant Apps          │      │
│  │  - User Auth                     │      │
│  │  - Appointments                  │      │
│  │  - Treatments                    │      │
│  │  - Subscription Plans            │      │
│  └──────────────────────────────────┘      │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│          PostgreSQL Database                │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Public   │  │ Tenant 1 │  │ Tenant 2 │ │
│  │ Schema   │  │ Schema   │  │ Schema   │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────┘
```

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04 LTS or later (recommended)
- **Python**: 3.11 or higher
- **PostgreSQL**: 14 or higher
- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: 20GB+ for application and database

### Required Services
- PostgreSQL database server
- Redis (optional, for caching)
- SMTP server for email notifications
- Domain with DNS management access

### Python Dependencies
```bash
# Core dependencies
Django>=4.2
djangorestframework>=3.14
django-cors-headers>=4.0
django-tenants>=3.4
psycopg2-binary>=2.9
python-dotenv>=1.0
PyJWT>=2.8
bcrypt>=4.0
drf-spectacular>=0.26
```

## Environment Setup

### 1. Create Production Environment File

Create a `.env.production` file with the following variables:

```bash
# Django Settings
DJANGO_SECRET_KEY=your-secure-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,*.yourdomain.com
DJANGO_SETTINGS_MODULE=medcor_backend.settings

# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/medcor_db
DATABASE_NAME=medcor_db
DATABASE_USER=medcor_user
DATABASE_PASSWORD=secure_password_here
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Multi-Tenant Configuration
TENANT_DOMAIN=yourdomain.com
PUBLIC_SCHEMA_NAME=public

# JWT Authentication
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DELTA=3600

# CORS Settings
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# External Services
OPENAI_API_KEY=your-openai-api-key
HEYGEN_API_KEY=your-heygen-api-key
YOUCAM_API_KEY=your-youcam-api-key
YOUCAM_API_SECRET=your-youcam-secret

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_BROWSER_XSS_FILTER=True
SECURE_CONTENT_TYPE_NOSNIFF=True

# Static Files
STATIC_URL=/static/
STATIC_ROOT=/var/www/medcor/static/
MEDIA_URL=/media/
MEDIA_ROOT=/var/www/medcor/media/
```

### 2. Directory Structure

Create the following directory structure:

```bash
/var/www/medcor/
├── backend/          # Django application
├── static/           # Static files
├── media/           # Uploaded files
├── logs/            # Application logs
└── backups/         # Database backups
```

## Database Configuration

### 1. Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database and User

```sql
-- Connect to PostgreSQL as superuser
sudo -u postgres psql

-- Create database user
CREATE USER medcor_user WITH PASSWORD 'secure_password_here';

-- Create database
CREATE DATABASE medcor_db OWNER medcor_user;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE medcor_db TO medcor_user;

-- Enable required extensions
\c medcor_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Exit
\q
```

### 3. Configure PostgreSQL for Multi-Tenancy

Edit PostgreSQL configuration:

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Add or modify:
```conf
# Connection settings
max_connections = 200
shared_buffers = 256MB

# Performance settings
effective_cache_size = 1GB
maintenance_work_mem = 128MB
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

## Multi-Tenant Configuration

### 1. Update Django Settings

Ensure `medcor_backend/settings.py` includes:

```python
# Multi-tenant settings
TENANT_MODEL = "tenants.Tenant"
TENANT_DOMAIN_MODEL = "tenants.Domain"

PUBLIC_SCHEMA_NAME = 'public'
TENANT_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'user_auth',
    'appointment',
    'treatment',
    'subscription_plan',
]

SHARED_APPS = [
    'django_tenants',
    'tenants',
    'django.contrib.admin',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'drf_spectacular',
]

INSTALLED_APPS = list(SHARED_APPS) + [app for app in TENANT_APPS if app not in SHARED_APPS]

# Database routing
DATABASE_ROUTERS = (
    'django_tenants.routers.TenantSyncRouter',
)

# Middleware configuration
MIDDLEWARE = [
    'django_tenants.middleware.main.TenantMainMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

### 2. Initialize Database Schema

```bash
# Navigate to project directory
cd /var/www/medcor/backend

# Create public schema migrations
python manage.py makemigrations

# Apply public schema migrations
python manage.py migrate_schemas --shared

# Create initial superuser
python manage.py createsuperuser --schema=public
```

### 3. Create Default Tenant

Create a Python script `create_default_tenant.py`:

```python
from django.core.management import execute_from_command_line
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
django.setup()

from tenants.models import Tenant, Domain

# Create MedCor main tenant
tenant = Tenant(
    schema_name='medcor',
    name='MedCor Platform',
    tenant_type='platform',
    is_active=True
)
tenant.save()

# Add domain
domain = Domain()
domain.domain = 'app.yourdomain.com'
domain.tenant = tenant
domain.is_primary = True
domain.save()

print(f"Created tenant: {tenant.name}")
print(f"Domain: {domain.domain}")
```

Run the script:
```bash
python create_default_tenant.py
```

## Deployment Steps

### 1. Clone and Setup Repository

```bash
# Clone repository
git clone https://github.com/your-repo/medcor-backend.git /var/www/medcor/backend
cd /var/www/medcor/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### 2. Configure Gunicorn

Create `/etc/systemd/system/medcor.service`:

```ini
[Unit]
Description=MedCor Django Backend
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/medcor/backend
Environment="PATH=/var/www/medcor/backend/venv/bin"
ExecStart=/var/www/medcor/backend/venv/bin/gunicorn \
    --workers 4 \
    --worker-class sync \
    --bind unix:/var/www/medcor/backend/medcor.sock \
    --error-logfile /var/www/medcor/logs/gunicorn-error.log \
    --access-logfile /var/www/medcor/logs/gunicorn-access.log \
    --log-level info \
    medcor_backend.wsgi:application

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable medcor
sudo systemctl start medcor
```

### 3. Configure Nginx

Create `/etc/nginx/sites-available/medcor`:

```nginx
# Main application server
server {
    listen 80;
    server_name yourdomain.com *.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com *.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Logging
    access_log /var/www/medcor/logs/nginx-access.log;
    error_log /var/www/medcor/logs/nginx-error.log;
    
    # Static files
    location /static/ {
        alias /var/www/medcor/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    location /media/ {
        alias /var/www/medcor/media/;
        expires 7d;
    }
    
    # Django application
    location / {
        proxy_pass http://unix:/var/www/medcor/backend/medcor.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # API documentation
    location /api/docs/ {
        proxy_pass http://unix:/var/www/medcor/backend/medcor.sock;
        proxy_set_header Host $host;
    }
    
    # Django admin
    location /admin/ {
        proxy_pass http://unix:/var/www/medcor/backend/medcor.sock;
        proxy_set_header Host $host;
        
        # Additional security for admin
        # allow 192.168.1.0/24;  # Allow specific IP range
        # deny all;              # Deny all others
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/medcor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL Certificate Setup

Install Certbot and obtain SSL certificate:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d *.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

## Domain & Subdomain Setup

### 1. DNS Configuration

Configure DNS records for multi-tenant subdomains:

```
Type    Name                Value                   TTL
A       @                   YOUR_SERVER_IP          300
A       *.                  YOUR_SERVER_IP          300
CNAME   www                 yourdomain.com          300
```

### 2. Tenant Domain Creation

For each new hospital/clinic tenant:

```python
# Django shell script for creating tenant
from tenants.models import Tenant, Domain

# Create hospital tenant
tenant = Tenant(
    schema_name='hospital_xyz',  # Must be valid PostgreSQL schema name
    name='Hospital XYZ',
    tenant_type='hospital',
    admin_email='admin@hospitalxyz.com',
    is_active=True
)
tenant.save()

# Create subdomain
domain = Domain()
domain.domain = 'hospitalxyz.yourdomain.com'
domain.tenant = tenant
domain.is_primary = True
domain.save()

# Migrate tenant schema
from django.core.management import call_command
call_command('migrate_schemas', schema_name=tenant.schema_name)
```

### 3. Automated Tenant Creation Script

Create `scripts/create_tenant.py`:

```python
#!/usr/bin/env python
import os
import sys
import django
from django.core.management import call_command

# Setup Django
sys.path.append('/var/www/medcor/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
django.setup()

from tenants.models import Tenant, Domain

def create_tenant(schema_name, name, domain_url, admin_email):
    """
    Create a new tenant with domain and migrate schema
    """
    try:
        # Check if tenant exists
        if Tenant.objects.filter(schema_name=schema_name).exists():
            print(f"Tenant {schema_name} already exists")
            return False
        
        # Create tenant
        tenant = Tenant(
            schema_name=schema_name,
            name=name,
            tenant_type='hospital',
            admin_email=admin_email,
            is_active=True
        )
        tenant.save()
        
        # Create domain
        domain = Domain(
            domain=domain_url,
            tenant=tenant,
            is_primary=True
        )
        domain.save()
        
        # Migrate schema
        call_command('migrate_schemas', schema_name=schema_name)
        
        print(f"Successfully created tenant: {name}")
        print(f"Domain: {domain_url}")
        print(f"Schema: {schema_name}")
        
        return True
        
    except Exception as e:
        print(f"Error creating tenant: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python create_tenant.py <schema_name> <name> <domain> <admin_email>")
        sys.exit(1)
    
    create_tenant(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
```

Usage:
```bash
python scripts/create_tenant.py hospital_abc "Hospital ABC" "hospitalabc.yourdomain.com" "admin@hospitalabc.com"
```

## Security Configuration

### 1. Firewall Setup

```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Database Security

```sql
-- Restrict tenant access
ALTER DATABASE medcor_db SET search_path TO "$user", public;

-- Create read-only user for reporting
CREATE USER medcor_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE medcor_db TO medcor_readonly;
GRANT USAGE ON SCHEMA public TO medcor_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO medcor_readonly;
```

### 3. Application Security Checklist

- [ ] Change all default passwords
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Implement backup strategy
- [ ] Configure fail2ban
- [ ] Set up monitoring alerts

## Monitoring & Maintenance

### 1. Health Check Endpoint

Create a health check view in Django:

```python
# medcor_backend/health/views.py
from django.http import JsonResponse
from django.db import connection
from django.views.decorators.http import require_http_methods
import datetime

@require_http_methods(["GET"])
def health_check(request):
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return JsonResponse({
            'status': 'healthy',
            'timestamp': datetime.datetime.now().isoformat(),
            'database': 'connected',
            'version': '1.0.0'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=503)
```

### 2. Logging Configuration

Configure Django logging in settings.py:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/www/medcor/logs/django.log',
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/www/medcor/logs/django-error.log',
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['file', 'error_file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['error_file'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}
```

### 3. Backup Strategy

Create automated backup script `/scripts/backup.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/www/medcor/backups"
DB_NAME="medcor_db"
DB_USER="medcor_user"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Media files backup
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz /var/www/medcor/media/

# Keep only last 30 days of backups
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * /scripts/backup.sh >> /var/www/medcor/logs/backup.log 2>&1
```

### 4. Monitoring Tools

Install and configure monitoring:

```bash
# Install monitoring tools
sudo apt install htop nethogs iotop

# Install Python monitoring
pip install django-debug-toolbar django-silk

# System monitoring with Prometheus (optional)
# Add to requirements.txt:
# django-prometheus==2.2.0
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Tenant Not Found Error

**Problem**: "No tenant for hostname" error

**Solution**:
```python
# Check if domain exists
from tenants.models import Domain
Domain.objects.filter(domain='problematic-domain.com')

# Update domain if needed
domain = Domain.objects.get(domain='old-domain.com')
domain.domain = 'new-domain.com'
domain.save()
```

#### 2. Migration Issues

**Problem**: Schema migration fails

**Solution**:
```bash
# Migrate specific schema
python manage.py migrate_schemas --schema=schema_name

# Force migration
python manage.py migrate_schemas --shared --verbosity=3

# Check migration status
python manage.py showmigrations --schema=schema_name
```

#### 3. Performance Issues

**Problem**: Slow response times

**Solution**:
```bash
# Check database queries
python manage.py shell
>>> from django.db import connection
>>> connection.queries

# Enable query optimization
# In settings.py:
DEBUG = False
CONN_MAX_AGE = 600

# Add database indexes
python manage.py dbshell
CREATE INDEX idx_tenant_id ON your_table(tenant_id);
```

#### 4. Memory Issues

**Problem**: High memory usage

**Solution**:
```bash
# Adjust Gunicorn workers
# In medcor.service:
--workers 2  # Reduce workers
--max-requests 1000  # Restart workers after 1000 requests
--max-requests-jitter 50
```

### Diagnostic Commands

```bash
# Check service status
sudo systemctl status medcor

# View logs
sudo journalctl -u medcor -f
tail -f /var/www/medcor/logs/django.log

# Database connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE datname = 'medcor_db';"

# Nginx status
sudo nginx -t
sudo systemctl status nginx

# Disk usage
df -h
du -sh /var/www/medcor/*

# Memory usage
free -h
ps aux | grep python

# Network connections
netstat -tulpn | grep LISTEN
```

## Performance Optimization

### 1. Database Optimization

```python
# Add to settings.py
DATABASES['default']['CONN_MAX_AGE'] = 600
DATABASES['default']['OPTIONS'] = {
    'connect_timeout': 10,
    'options': '-c statement_timeout=30000'  # 30 seconds
}
```

### 2. Caching Configuration

```python
# Redis caching
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'TIMEOUT': 300,
    }
}

# Session caching
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
```

### 3. Static File Optimization

```bash
# Compress static files
python manage.py collectstatic --noinput
python manage.py compress  # If using django-compressor

# Nginx gzip compression
# In nginx config:
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

## Scaling Considerations

### Horizontal Scaling

For high-traffic deployments:

1. **Load Balancer**: Use HAProxy or Nginx as load balancer
2. **Multiple App Servers**: Deploy Django on multiple servers
3. **Database Replication**: Set up PostgreSQL master-slave replication
4. **Shared Cache**: Use Redis cluster for session/cache sharing
5. **CDN**: Use CloudFlare or AWS CloudFront for static files

### Vertical Scaling

Resource recommendations by tenant count:

| Tenants | CPU Cores | RAM  | Database Storage |
|---------|-----------|------|------------------|
| 1-10    | 2         | 4GB  | 20GB            |
| 10-50   | 4         | 8GB  | 50GB            |
| 50-200  | 8         | 16GB | 200GB           |
| 200+    | 16+       | 32GB+| 500GB+          |

## Support and Maintenance

### Regular Maintenance Tasks

**Daily**:
- Monitor error logs
- Check disk space
- Verify backup completion

**Weekly**:
- Review performance metrics
- Update security patches
- Test backup restoration

**Monthly**:
- Full system audit
- Database optimization
- SSL certificate renewal check
- Tenant usage reports

### Emergency Procedures

**System Recovery**:
1. Stop application server: `sudo systemctl stop medcor`
2. Restore database: `gunzip < backup.sql.gz | psql medcor_db`
3. Restore media files: `tar -xzf media_backup.tar.gz -C /`
4. Start application: `sudo systemctl start medcor`

**Rollback Deployment**:
```bash
# Keep previous version
cd /var/www/medcor
mv backend backend_new
mv backend_old backend
sudo systemctl restart medcor
```

## Conclusion

This deployment guide provides comprehensive instructions for deploying MedCor Backend as a production-ready multi-tenant application. Follow security best practices, maintain regular backups, and monitor system health for optimal performance.

For additional support or custom deployment scenarios, consult the development team or refer to Django and django-tenants documentation.

---

**Document Version**: 1.0.0  
**Last Updated**: January 2025  
**Maintained by**: MedCor DevOps Team