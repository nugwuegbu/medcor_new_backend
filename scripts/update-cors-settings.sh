#!/bin/bash

# Script to update CORS settings for MedCor domains
# This ensures test.medcor.ai and other MedCor domains are always allowed

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

log "🌐 Updating CORS settings for MedCor domains..."

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

# Update .env file with MedCor domains
log "🔧 Updating .env file with MedCor domains..."

# Check if .env file exists
if [ -f ".env" ]; then
    # Backup current .env
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    log "✅ Backed up current .env file"
    
    # Update CORS_ALLOWED_ORIGINS in .env
    if grep -q "CORS_ALLOWED_ORIGINS" .env; then
        # Update existing CORS_ALLOWED_ORIGINS
        sed -i 's|CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000,https://test.medcor.ai,https://medcor.ai,https://www.medcor.ai|' .env
        log "✅ Updated CORS_ALLOWED_ORIGINS in .env"
    else
        # Add CORS_ALLOWED_ORIGINS to .env
        echo "CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000,https://test.medcor.ai,https://medcor.ai,https://www.medcor.ai" >> .env
        log "✅ Added CORS_ALLOWED_ORIGINS to .env"
    fi
    
    # Update ALLOWED_HOSTS in .env
    if grep -q "ALLOWED_HOSTS" .env; then
        # Update existing ALLOWED_HOSTS
        sed -i 's|ALLOWED_HOSTS=.*|ALLOWED_HOSTS=localhost,127.0.0.1,your-server-ip,test.medcor.ai,medcor.ai,www.medcor.ai|' .env
        log "✅ Updated ALLOWED_HOSTS in .env"
    else
        # Add ALLOWED_HOSTS to .env
        echo "ALLOWED_HOSTS=localhost,127.0.0.1,your-server-ip,test.medcor.ai,medcor.ai,www.medcor.ai" >> .env
        log "✅ Added ALLOWED_HOSTS to .env"
    fi
else
    # Create new .env file with MedCor domains
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
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EOF
    log "✅ Created new .env file with MedCor domains"
fi

# Test Django settings with updated CORS
log "🧪 Testing Django settings with updated CORS..."
if python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
import django
django.setup()
from django.conf import settings
print('CORS Allowed Origins:', settings.CORS_ALLOWED_ORIGINS)
print('Allowed Hosts:', settings.ALLOWED_HOSTS)
" 2>/dev/null; then
    log "✅ Django settings loaded successfully with MedCor domains"
else
    error "❌ Django settings failed to load"
fi

# Restart services to apply CORS changes
log "🔄 Restarting services to apply CORS changes..."
sudo systemctl restart gunicorn
sudo systemctl restart nginx

# Check service status
log "🔍 Checking service status..."
if sudo systemctl is-active --quiet gunicorn; then
    log "✅ Gunicorn service is running"
else
    error "❌ Gunicorn service failed to start"
fi

if sudo systemctl is-active --quiet nginx; then
    log "✅ Nginx service is running"
else
    error "❌ Nginx service failed to start"
fi

log "🎉 CORS settings updated successfully!"
log "🌐 MedCor domains (test.medcor.ai, medcor.ai, www.medcor.ai) are now allowed"
log "📊 Test your API from https://test.medcor.ai"