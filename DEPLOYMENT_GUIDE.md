# MedCor Backend 2 - AWS EC2 Deployment Guide

## Overview

This guide covers deployment of the MedCor Backend 2 Django application on AWS EC2 Ubuntu 24.04 with Nginx and Gunicorn, specifically configured for the `test.medcor.ai` subdomain.

## Prerequisites

### AWS Setup

- AWS Account with EC2 access
- Domain `medcor.ai` managed in Route 53 (or your DNS provider)
- SSL certificate for `test.medcor.ai` (we'll use Let's Encrypt)

### Local Requirements

- SSH key pair for EC2 access
- Git access to your repository

## AWS EC2 Instance Setup

### 1. Launch EC2 Instance

```bash
# Launch Ubuntu 24.04 LTS instance
Instance Type: t3.medium (2 vCPU, 4GB RAM) or larger
Storage: 20GB GP3 SSD
Security Group: Create new with rules:
  - SSH (22): Your IP
  - HTTP (80): 0.0.0.0/0
  - HTTPS (443): 0.0.0.0/0
  - Custom TCP (8000): 127.0.0.1/32 (for Gunicorn)
```

### 2. Connect to Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### 3. Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nginx postgresql-client git curl
```

## Application Deployment

### 1. Clone Repository

```bash
cd /home/ubuntu
git clone https://github.com/yourusername/medcor_backend2.git
cd medcor_backend2
```

### 2. Setup Python Environment

```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn whitenoise
```

### 3. Environment Configuration

```bash
# Create .env file
cat > .env << EOF
DEBUG=False
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=test.medcor.ai,your-ec2-public-ip
CORS_ALLOWED_ORIGINS=https://test.medcor.ai,https://your-frontend-domain.com

# Database (use your actual database)
DATABASE_URL=postgresql://username:password@your-db-host:5432/database_name

# Email (optional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# AWS S3 (optional, for file storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=medcor-files
AWS_S3_REGION_NAME=us-east-1
EOF
```

### 4. Database Setup

```bash
# If using local PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres createuser --interactive
sudo -u postgres createdb medcor_db

# Or use your existing database
# Update .env with your database credentials
```

### 5. Django Setup

```bash
source venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

## Gunicorn Configuration

### 1. Create Gunicorn Config

```bash
cat > gunicorn_config.py << EOF
# Gunicorn configuration file
bind = "127.0.0.1:8000"
workers = 3
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
preload_app = True
timeout = 120
keepalive = 2
EOF
```

### 2. Create Systemd Service

```bash
sudo tee /etc/systemd/system/medcor.service << EOF
[Unit]
Description=MedCor Backend Gunicorn
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/medcor_backend2
Environment="PATH=/home/ubuntu/medcor_backend2/venv/bin"
Environment="DJANGO_SETTINGS_MODULE=medcor_backend2.settings"
ExecStart=/home/ubuntu/medcor_backend2/venv/bin/gunicorn --config gunicorn_config.py medcor_backend2.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
```

### 3. Enable and Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable medcor
sudo systemctl start medcor
sudo systemctl status medcor
```

## Nginx Configuration

### 1. Create Nginx Site Configuration

```bash
sudo tee /etc/nginx/sites-available/test.medcor.ai << EOF
server {
    listen 80;
    server_name test.medcor.ai;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Client max body size for file uploads
    client_max_body_size 100M;

    # Static files
    location /static/ {
        alias /home/ubuntu/medcor_backend2/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /home/ubuntu/medcor_backend2/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy to Gunicorn
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health/ {
        proxy_pass http://127.0.0.1:8000/health/;
        access_log off;
    }
}
EOF
```

### 2. Enable Site and Test Configuration

```bash
sudo ln -s /etc/nginx/sites-available/test.medcor.ai /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t
sudo systemctl restart nginx
```

## SSL/TLS Setup with Let's Encrypt

### 1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
sudo certbot --nginx -d test.medcor.ai
# Follow prompts and choose option 2 (redirect all traffic to HTTPS)
```

### 3. Auto-renewal Setup

```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## DNS Configuration

### Route 53 Setup (if using AWS DNS)

1. Go to Route 53 Console
2. Select your hosted zone for `medcor.ai`
3. Create A record:
   - Name: `test`
   - Type: `A`
   - Value: Your EC2 public IP
   - TTL: 300

### Alternative DNS Providers

- Point `test.medcor.ai` to your EC2 public IP
- Wait for DNS propagation (can take up to 48 hours)

## Health Check and Monitoring

### 1. Create Health Check View

```python
# Add to core/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from django.db import connection

@api_view(['GET'])
def health_check(request):
    """Health check endpoint for load balancers and monitoring."""
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")

        return Response({
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'database': 'connected',
            'version': '2.0.0'
        })
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'timestamp': timezone.now().isoformat(),
            'error': str(e)
        }, status=500)
```

### 2. Add Health Check URL

```python
# Add to core/urls.py
from .views import health_check

urlpatterns = [
    # ... existing urls
    path('health/', health_check, name='health_check'),
]
```

### 3. Test Health Check

```bash
curl http://test.medcor.ai/health/
```

## Logging Configuration

### 1. Create Log Directory

```bash
mkdir -p /home/ubuntu/medcor_backend2/logs
```

### 2. Update Django Settings

```python
# Add to medcor_backend2/settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/home/ubuntu/medcor_backend2/logs/django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

## Backup and Maintenance

### 1. Database Backup Script

```bash
cat > /home/ubuntu/backup_db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Load environment variables
source /home/ubuntu/medcor_backend2/.env

# Backup database
pg_dump $DATABASE_URL > $BACKUP_DIR/medcor_db_$DATE.sql

# Keep only last 7 backups
find $BACKUP_DIR -name "medcor_db_*.sql" -mtime +7 -delete

echo "Database backup completed: medcor_db_$DATE.sql"
EOF

chmod +x /home/ubuntu/backup_db.sh
```

### 2. Setup Automated Backups

```bash
sudo crontab -e
# Add this line for daily backups at 2 AM:
0 2 * * * /home/ubuntu/backup_db.sh >> /home/ubuntu/backup.log 2>&1
```

### 3. Application Update Script

```bash
cat > /home/ubuntu/update_app.sh << 'EOF'
#!/bin/bash
cd /home/ubuntu/medcor_backend2

# Pull latest changes
git pull origin main

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Restart services
sudo systemctl restart medcor
sudo systemctl restart nginx

echo "Application updated successfully at $(date)"
EOF

chmod +x /home/ubuntu/update_app.sh
```

## Security Hardening

### 1. Firewall Configuration

```bash
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw status
```

### 2. Fail2ban Setup

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Regular Security Updates

```bash
sudo crontab -e
# Add this line for weekly security updates:
0 3 * * 0 sudo apt update && sudo apt upgrade -y
```

## Performance Optimization

### 1. Nginx Optimization

```bash
# Add to /etc/nginx/nginx.conf in http block
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/xml+rss
    application/atom+xml
    image/svg+xml;
```

### 2. Gunicorn Optimization

```bash
# Update gunicorn_config.py
workers = 4  # Increase based on CPU cores
worker_class = "gevent"  # Install gevent first: pip install gevent
max_requests = 2000
max_requests_jitter = 200
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Gunicorn Service Issues

```bash
# Check service status
sudo systemctl status medcor

# Check logs
sudo journalctl -u medcor -f

# Restart service
sudo systemctl restart medcor
```

#### 2. Nginx Issues

```bash
# Check configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

#### 3. Database Connection Issues

```bash
# Test database connection
source venv/bin/activate
python manage.py dbshell

# Check environment variables
cat .env | grep DATABASE
```

#### 4. Permission Issues

```bash
# Fix ownership
sudo chown -R ubuntu:ubuntu /home/ubuntu/medcor_backend2
sudo chmod -R 755 /home/ubuntu/medcor_backend2

# Fix log permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/medcor_backend2/logs
```

## Monitoring and Alerts

### 1. Basic Monitoring Script

```bash
cat > /home/ubuntu/monitor.sh << 'EOF'
#!/bin/bash
LOG_FILE="/home/ubuntu/monitor.log"

# Check Gunicorn
if ! systemctl is-active --quiet medcor; then
    echo "$(date): Gunicorn service is down!" >> $LOG_FILE
    sudo systemctl restart medcor
fi

# Check Nginx
if ! systemctl is-active --quiet nginx; then
    echo "$(date): Nginx service is down!" >> $LOG_FILE
    sudo systemctl restart nginx
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): Disk usage is high: ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory
MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ $MEM_USAGE -gt 80 ]; then
    echo "$(date): Memory usage is high: ${MEM_USAGE}%" >> $LOG_FILE
fi
EOF

chmod +x /home/ubuntu/monitor.sh
```

### 2. Setup Monitoring Cron

```bash
sudo crontab -e
# Add this line for monitoring every 5 minutes:
*/5 * * * * /home/ubuntu/monitor.sh
```

## Deployment Checklist

- [ ] EC2 instance launched and configured
- [ ] Security groups configured (22, 80, 443)
- [ ] Application code deployed
- [ ] Python virtual environment setup
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database configured and migrated
- [ ] Static files collected
- [ ] Gunicorn service configured and running
- [ ] Nginx configured and running
- [ ] SSL certificate obtained
- [ ] DNS configured (test.medcor.ai → EC2 IP)
- [ ] Health check endpoint working
- [ ] Logging configured
- [ ] Backup scripts configured
- [ ] Monitoring scripts configured
- [ ] Security hardening applied
- [ ] Firewall configured
- [ ] Regular updates scheduled

## Quick Commands Reference

```bash
# Service management
sudo systemctl start/stop/restart/status medcor
sudo systemctl start/stop/restart/status nginx

# Log viewing
sudo journalctl -u medcor -f
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Application updates
cd /home/ubuntu/medcor_backend2
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart medcor

# SSL renewal
sudo certbot renew

# Database backup
/home/ubuntu/backup_db.sh

# Health check
curl https://test.medcor.ai/health/
```

## Support and Maintenance

### Regular Maintenance Tasks

- Weekly: Security updates
- Daily: Database backups
- Every 5 minutes: Service monitoring
- Monthly: SSL certificate renewal check
- Quarterly: Performance review and optimization

### Log Locations

- Application logs: `/home/ubuntu/medcor_backend2/logs/`
- Gunicorn logs: `sudo journalctl -u medcor`
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/syslog`

### Emergency Contacts

- AWS Support: If using AWS support plans
- DNS Provider: For domain/DNS issues
- SSL Provider: Let's Encrypt community support

---

**Note**: This guide assumes Ubuntu 24.04 LTS and follows AWS best practices. Adjust paths and configurations based on your specific setup and requirements.
