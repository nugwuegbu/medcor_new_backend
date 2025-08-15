# MedCor Django Multi-Tenant Deployment Guide

## Overview
This document outlines the deployment process for MedCor's Django multi-tenant backend application using django-tenant-users, with deployment to AWS EC2 using gunicorn and nginx.

## Architecture

### Django Multi-Tenant Backend
- **Technology**: Python 3.11, Django 4.2, PostgreSQL
- **Multi-Tenancy**: django-tenants with django-tenant-users for shared user management
- **Web Server**: Gunicorn (WSGI) + Nginx (reverse proxy)
- **Database**: PostgreSQL with schema-based multi-tenancy
- **API**: Django REST Framework with JWT authentication
- **Static Files**: Served via Nginx

## Prerequisites

- Ubuntu 24.04 EC2 instance (already provisioned)
- PostgreSQL database (local or RDS)
- Python 3.11+
- Git
- Domain name with DNS configured
- SSL certificate (Let's Encrypt recommended)

## Environment Variables

### Production Environment (.env)
```bash
# Django Configuration
SECRET_KEY=your-production-secret-key-generate-with-django
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,your-ec2-ip

# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://medcor_user:password@localhost:5432/medcor_db
# Or for RDS:
# DATABASE_URL=postgresql://medcor_user:password@rds-endpoint.amazonaws.com:5432/medcor_db

# Multi-Tenant Configuration
PUBLIC_SCHEMA_NAME=public
TENANT_DOMAIN_MODEL=core.Domain
TENANT_MODEL=core.Tenant
SHARED_APPS=django_tenants,django_tenant_users.tenants,core,authentication
TENANT_APPS=api,appointment,treatment,subscription

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_LIFETIME=86400

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_ALLOW_CREDENTIALS=True

# External API Keys
OPENAI_API_KEY=sk-your-openai-key
HEYGEN_API_KEY=your-heygen-key
YOUCAM_API_KEY=your-youcam-key
YOUCAM_SECRET_KEY=your-youcam-secret
AZURE_FACE_API_KEY=your-azure-face-key
AZURE_FACE_ENDPOINT=your-azure-endpoint
ELEVENLABS_API_KEY=your-elevenlabs-key
WEATHER_API_KEY=your-weather-key

# Static and Media Files
STATIC_ROOT=/var/www/medcor/static
MEDIA_ROOT=/var/www/medcor/media
STATIC_URL=/static/
MEDIA_URL=/media/

# Email Configuration (optional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

## Deployment Option 1: CI/CD Pipeline Deployment

### GitHub Actions Workflow

Create `.github/workflows/deploy-django.yml` in your repository:

```yaml
name: Deploy Django Multi-Tenant Application

on:
  push:
    branches: [main, production]
  pull_request:
    branches: [main]

env:
  EC2_HOST: ${{ secrets.EC2_HOST }}
  EC2_USER: ubuntu
  SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python 3.11
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Run Tests
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        SECRET_KEY: test-secret-key
      run: |
        cd medcor_backend
        python manage.py test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/production'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to EC2
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ubuntu
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          # Navigate to project directory
          cd /home/ubuntu/medcor-backend
          
          # Pull latest code
          git pull origin main
          
          # Activate virtual environment
          source venv/bin/activate
          
          # Install/update dependencies
          pip install -r requirements.txt
          
          # Run migrations
          cd medcor_backend
          python manage.py migrate_schemas --shared
          python manage.py migrate_schemas --tenant
          
          # Collect static files
          python manage.py collectstatic --noinput
          
          # Restart services
          sudo systemctl reload gunicorn
          sudo systemctl reload nginx
          
          # Health check
          curl -f http://localhost:8000/api/health/ || exit 1

    - name: Notify Deployment
      if: success()
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        text: 'Django backend deployed successfully to production!'
        webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Setting up GitHub Secrets

Add these secrets to your GitHub repository:

```bash
# In GitHub: Settings > Secrets > Actions

EC2_HOST=your-ec2-public-ip-or-domain
SSH_PRIVATE_KEY=your-ssh-private-key-content
DATABASE_URL=postgresql://user:pass@host:5432/db
SECRET_KEY=your-django-secret-key
SLACK_WEBHOOK_URL=your-slack-webhook-url
```

## Deployment Option 2: Manual Deployment

### Step 1: Install System Dependencies

SSH into your Ubuntu 24.04 EC2 instance:

```bash
ssh ubuntu@your-ec2-ip

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Python 3.11 and development tools
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Install PostgreSQL client libraries
sudo apt install -y postgresql-client libpq-dev

# Install nginx and other utilities
sudo apt install -y nginx git curl vim certbot python3-certbot-nginx

# Install build essentials for Python packages
sudo apt install -y build-essential
```

### Step 2: Set up PostgreSQL Database

```bash
# Install PostgreSQL (if using local database)
sudo apt install -y postgresql postgresql-contrib

# Configure PostgreSQL
sudo -u postgres psql

# Inside PostgreSQL prompt:
CREATE DATABASE medcor_db;
CREATE USER medcor_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE medcor_db TO medcor_user;
ALTER USER medcor_user CREATEDB;  # Required for multi-tenant schemas
\q

# Update PostgreSQL configuration for multi-tenant support
sudo vim /etc/postgresql/16/main/postgresql.conf
# Add: max_connections = 200

sudo systemctl restart postgresql
```

### Step 3: Clone and Set up the Application

```bash
# Create application directory
sudo mkdir -p /home/ubuntu/medcor-backend
sudo chown ubuntu:ubuntu /home/ubuntu/medcor-backend
cd /home/ubuntu

# Clone your repository
git clone https://github.com/your-username/medcor-backend.git
cd medcor-backend

# Create Python virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Python dependencies
pip install -r requirements.txt
pip install gunicorn

# Create .env file
cp .env.example .env
vim .env  # Edit with your production values

# Create necessary directories
sudo mkdir -p /var/www/medcor/static
sudo mkdir -p /var/www/medcor/media
sudo mkdir -p /var/log/medcor
sudo chown -R ubuntu:www-data /var/www/medcor
sudo chmod -R 755 /var/www/medcor
```

### Step 4: Initialize Django Application

```bash
cd medcor_backend

# Generate Django secret key
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
# Add this to your .env file

# Run initial migrations
python manage.py makemigrations
python manage.py migrate_schemas --shared
python manage.py migrate_schemas --tenant

# Create public tenant (required for django-tenants)
python manage.py shell << EOF
from core.models import Tenant, Domain
# Create public tenant
public_tenant = Tenant(
    schema_name='public',
    name='Public',
    is_primary=True
)
public_tenant.save()

# Create public domain
domain = Domain()
domain.domain = 'localhost'
domain.tenant = public_tenant
domain.is_primary = True
domain.save()
EOF

# Create superuser
python manage.py create_tenant_superuser

# Create first hospital tenant
python manage.py shell << EOF
from core.models import Tenant, Domain
# Create hospital tenant
hospital = Tenant(
    schema_name='hospital1',
    name='Hospital One',
    is_primary=False
)
hospital.save()

# Create hospital domain
domain = Domain()
domain.domain = 'hospital1.yourdomain.com'
domain.tenant = hospital
domain.is_primary = True
domain.save()
EOF

# Collect static files
python manage.py collectstatic --noinput
```

### Step 5: Configure Gunicorn

Create Gunicorn configuration file:

```bash
# Create Gunicorn config
sudo vim /etc/systemd/system/gunicorn.service
```

Add the following content:

```ini
[Unit]
Description=Gunicorn daemon for MedCor Django application
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/medcor-backend/medcor_backend
ExecStart=/home/ubuntu/medcor-backend/venv/bin/gunicorn \
          --workers 3 \
          --worker-class sync \
          --worker-connections 1000 \
          --timeout 60 \
          --bind unix:/home/ubuntu/medcor-backend/gunicorn.sock \
          --log-level debug \
          --access-logfile /var/log/medcor/gunicorn-access.log \
          --error-logfile /var/log/medcor/gunicorn-error.log \
          medcor_backend.wsgi:application

Restart=always
Environment="DJANGO_SETTINGS_MODULE=medcor_backend.settings"

[Install]
WantedBy=multi-user.target
```

```bash
# Start and enable Gunicorn
sudo systemctl daemon-reload
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
sudo systemctl status gunicorn
```

### Step 6: Configure Nginx

Create Nginx configuration:

```bash
# Create Nginx config file
sudo vim /etc/nginx/sites-available/medcor
```

Add the following configuration:

```nginx
# Backend API server block - accessible at medcor.ai:8001
server {
    listen 8001;
    server_name medcor.ai www.medcor.ai;
    client_max_body_size 100M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;

    # Static files
    location /static/ {
        alias /var/www/html/medcor_backend/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /var/www/html/medcor_backend/media/;
        expires 7d;
    }

    # Django application API
    location / {
        proxy_pass http://unix:/var/www/html/medcor_backend/gunicorn.sock;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        proxy_buffering off;
        
        # Handle OPTIONS requests for CORS
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}

# Frontend server block (if you're also serving frontend) - port 80/443
server {
    listen 80;
    server_name medcor.ai www.medcor.ai;
    client_max_body_size 100M;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name medcor.ai www.medcor.ai;
    client_max_body_size 100M;

    # SSL configuration (will be auto-configured by certbot)
    ssl_certificate /etc/letsencrypt/live/medcor.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/medcor.ai/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Frontend static files or React app
    root /var/www/html/medcor-frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to backend (optional - if frontend needs to call backend via same domain)
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Subdomain configuration for multi-tenant (if needed)
server {
    listen 80;
    server_name *.medcor.ai;
    client_max_body_size 100M;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name *.medcor.ai;
    client_max_body_size 100M;

    # SSL configuration (wildcard certificate)
    ssl_certificate /etc/letsencrypt/live/medcor.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/medcor.ai/privkey.pem;

    location /static/ {
        alias /var/www/html/medcor_backend/static/;
        expires 30d;
    }

    location /media/ {
        alias /var/www/html/medcor_backend/media/;
        expires 7d;
    }

    location / {
        proxy_pass http://unix:/var/www/html/medcor_backend/gunicorn.sock;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/medcor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: Set up SSL Certificate

```bash
# Install SSL certificate using Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d *.yourdomain.com

# Auto-renewal setup
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

### Step 8: Final Deployment Verification

```bash
# Check all services
sudo systemctl status gunicorn
sudo systemctl status nginx
sudo systemctl status postgresql

# Test the application
curl -I https://yourdomain.com/api/health/
curl -I https://yourdomain.com/api/

# Check logs
sudo tail -f /var/log/medcor/gunicorn-error.log
sudo tail -f /var/log/nginx/error.log

# Test multi-tenant functionality
curl -H "Host: hospital1.yourdomain.com" https://yourdomain.com/api/
```

## Monitoring and Maintenance

### Health Monitoring

Create a health check endpoint in Django:

```python
# medcor_backend/api/views.py
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({
            'status': 'healthy',
            'database': 'connected',
            'tenant': request.tenant.schema_name if hasattr(request, 'tenant') else 'public'
        })
    except Exception as e:
        return JsonResponse({'status': 'unhealthy', 'error': str(e)}, status=500)
```

### Log Management

```bash
# Set up log rotation
sudo vim /etc/logrotate.d/medcor

# Add configuration:
/var/log/medcor/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 640 ubuntu www-data
    sharedscripts
    postrotate
        systemctl reload gunicorn
    endscript
}
```

### Database Maintenance

```bash
# Regular backup script
#!/bin/bash
# Save as /home/ubuntu/backup-db.sh

BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="medcor_db"

mkdir -p $BACKUP_DIR
pg_dump $DB_NAME > $BACKUP_DIR/backup_$TIMESTAMP.sql
gzip $BACKUP_DIR/backup_$TIMESTAMP.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

# Add to crontab for daily backups:
# 0 2 * * * /home/ubuntu/backup-db.sh
```

### Updating the Application

```bash
# Update script
#!/bin/bash
# Save as /home/ubuntu/deploy.sh

cd /home/ubuntu/medcor-backend
git pull origin main

source venv/bin/activate
pip install -r requirements.txt

cd medcor_backend
python manage.py migrate_schemas --shared
python manage.py migrate_schemas --tenant
python manage.py collectstatic --noinput

sudo systemctl restart gunicorn
sudo systemctl reload nginx

# Health check
sleep 5
curl -f http://localhost:8000/api/health/ || exit 1
echo "Deployment successful!"
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Gunicorn Socket Issues
```bash
# Check socket permissions
ls -la /home/ubuntu/medcor-backend/gunicorn.sock

# Fix permissions
sudo chown ubuntu:www-data /home/ubuntu/medcor-backend/gunicorn.sock
```

#### 2. Static Files Not Loading
```bash
# Verify static files location
ls -la /var/www/medcor/static/

# Re-collect static files
python manage.py collectstatic --clear --noinput
```

#### 3. Database Connection Errors
```bash
# Test database connection
psql -U medcor_user -d medcor_db -h localhost

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### 4. Multi-Tenant Schema Issues
```bash
# List all schemas
psql -U medcor_user -d medcor_db -c "\dn"

# Fix schema permissions
python manage.py shell
>>> from django.db import connection
>>> with connection.cursor() as cursor:
>>>     cursor.execute("GRANT ALL ON SCHEMA hospital1 TO medcor_user")
```

#### 5. Memory Issues
```bash
# Monitor memory usage
free -h
htop

# Adjust Gunicorn workers in systemd service
# Reduce workers if memory is limited
```

## Performance Optimization

### Django Settings
```python
# Add to settings.py for production

# Cache configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.memcached.PyMemcacheCache',
        'LOCATION': '127.0.0.1:11211',
    }
}

# Database connection pooling
DATABASES['default']['CONN_MAX_AGE'] = 600
```

### Nginx Optimization
```nginx
# Add to nginx.conf
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript;
```

## Security Best Practices

1. **Firewall Configuration**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **Django Security Settings**
```python
# Add to production settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
```

3. **Regular Updates**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Python packages
pip list --outdated
pip install --upgrade package_name
```

## Rollback Procedures

### Application Rollback
```bash
# Tag releases before deployment
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Rollback to previous version
cd /home/ubuntu/medcor-backend
git fetch --tags
git checkout v0.9.0
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart gunicorn
```

### Database Rollback
```bash
# Restore from backup
gunzip < /home/ubuntu/backups/backup_20240115_020000.sql.gz | psql medcor_db
```

---

**Note**: This deployment guide is specifically tailored for Django multi-tenant applications using django-tenant-users. Ensure all environment variables are properly configured and test thoroughly in a staging environment before production deployment.