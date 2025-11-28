#!/bin/bash

# Script to update only the Email Configuration on AWS server
# This focuses specifically on email settings

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

log "📧 Updating Email Configuration on AWS server..."

# Navigate to project directory
cd /var/www/html/medcor_backend2

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
    log "✅ Virtual environment activated"
else
    error "❌ Virtual environment not found"
    exit 1
fi

# Update .env file with email configuration
log "🔧 Updating .env file with email configuration..."

# Check if .env file exists
if [ -f ".env" ]; then
    # Backup current .env
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    log "✅ Backed up current .env file"
    
    # Update email configuration in .env
    if grep -q "EMAIL_HOST" .env; then
        # Update existing email configuration
        sed -i 's|EMAIL_HOST=.*|EMAIL_HOST=smtp.gmail.com|' .env
        sed -i 's|EMAIL_PORT=.*|EMAIL_PORT=587|' .env
        sed -i 's|EMAIL_USE_TLS=.*|EMAIL_USE_TLS=True|' .env
        sed -i 's|EMAIL_HOST_USER=.*|EMAIL_HOST_USER=nugwuegbu089@gmail.com|' .env
        log "✅ Updated email configuration in .env"
    else
        # Add email configuration to .env
        cat >> .env << 'EOF'

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=nugwuegbu089@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
EOF
        log "✅ Added email configuration to .env"
    fi
else
    # Create new .env file with email configuration
    cat > .env << 'EOF'
# Django Settings
SECRET_KEY=django-insecure-your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,your-server-ip,test.medcor.ai,medcor.ai,www.medcor.ai
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000,https://test.medcor.ai,https://medcor.ai,https://www.medcor.ai

# Database Configuration (AWS RDS)
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=medcor_db2
DATABASE_USER=postgres
DATABASE_PASS=3765R7vmFQwF6ddlNyWa
DATABASE_HOST=medcore.czouassyu7f2.il-central-1.rds.amazonaws.com
DATABASE_PORT=5432

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=nugwuegbu089@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
EOF
    log "✅ Created new .env file with email configuration"
fi

# Test Django settings with email configuration
log "🧪 Testing Django settings with email configuration..."
if python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
import django
django.setup()
from django.conf import settings
print('Email Host:', settings.EMAIL_HOST)
print('Email Port:', settings.EMAIL_PORT)
print('Email Use TLS:', settings.EMAIL_USE_TLS)
print('Email Host User:', settings.EMAIL_HOST_USER)
print('Email configuration loaded successfully')
" 2>/dev/null; then
    log "✅ Django settings loaded successfully with email configuration"
else
    error "❌ Django settings failed to load"
fi

# Test email configuration (optional)
log "🧪 Testing email configuration..."
if python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
import django
django.setup()
from django.core.mail import get_connection
from django.conf import settings

try:
    connection = get_connection()
    connection.open()
    print('Email connection test successful')
    connection.close()
except Exception as e:
    print('Email connection test failed (this is normal if Gmail app password is not set):', str(e))
" 2>/dev/null; then
    log "✅ Email configuration test completed"
else
    warning "⚠️  Email configuration test failed (this is normal if Gmail app password is not set)"
fi

# Restart services to apply email configuration
log "🔄 Restarting services to apply email configuration..."
sudo systemctl restart gunicorn
sudo systemctl restart celery

# Check service status
log "🔍 Checking service status..."
if sudo systemctl is-active --quiet gunicorn; then
    log "✅ Gunicorn service is running"
else
    error "❌ Gunicorn service failed to start"
fi

if sudo systemctl is-active --quiet celery; then
    log "✅ Celery service is running"
else
    error "❌ Celery service failed to start"
fi

log "🎉 Email configuration update completed!"
log "📧 Email settings configured:"
log "   - Host: smtp.gmail.com"
log "   - Port: 587"
log "   - TLS: True"
log "   - User: nugwuegbu089@gmail.com"
log "   - Password: [Set your Gmail app password]"
log "📝 To complete email setup, set your Gmail app password in the .env file"
log "🔧 Edit .env file and replace 'your-gmail-app-password' with your actual Gmail app password"