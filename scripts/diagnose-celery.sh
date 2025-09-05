#!/bin/bash

# Script to diagnose Celery issues
# Run this on the AWS server to identify problems

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

log "🔍 Diagnosing Celery issues..."

# Navigate to project directory
cd /var/www/html/medcor_backend2

# Check if virtual environment exists
if [ -d "venv" ]; then
    source venv/bin/activate
    log "✅ Virtual environment found and activated"
else
    error "❌ Virtual environment not found"
    exit 1
fi

# Check if .env file exists
if [ -f ".env" ]; then
    log "✅ .env file exists"
    info "Database configuration:"
    grep "DATABASE_" .env | head -5
else
    warning "⚠️  .env file not found"
fi

# Check if python-dotenv is installed
if python -c "import dotenv" 2>/dev/null; then
    log "✅ python-dotenv is installed"
else
    error "❌ python-dotenv is not installed"
fi

# Test Django settings loading
log "🧪 Testing Django settings..."
if python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
import django
django.setup()
from django.conf import settings
print('Database host:', settings.DATABASES['default']['HOST'])
print('Database name:', settings.DATABASES['default']['NAME'])
print('Celery broker:', settings.CELERY_BROKER_URL)
" 2>/dev/null; then
    log "✅ Django settings loaded successfully"
else
    error "❌ Django settings failed to load"
fi

# Test database connection
log "🧪 Testing database connection..."
if python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
import django
django.setup()
from django.db import connection
connection.ensure_connection()
print('Database connection successful!')
" 2>/dev/null; then
    log "✅ Database connection successful"
else
    error "❌ Database connection failed"
fi

# Test Celery app creation
log "🧪 Testing Celery app creation..."
if python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
import django
django.setup()
from celery import Celery
app = Celery('medcor_backend2')
print('Celery app created successfully')
" 2>/dev/null; then
    log "✅ Celery app creation successful"
else
    error "❌ Celery app creation failed"
fi

# Check Redis connection
log "🧪 Testing Redis connection..."
if python -c "
import redis
r = redis.Redis(host='localhost', port=6379, db=0)
r.ping()
print('Redis connection successful!')
" 2>/dev/null; then
    log "✅ Redis connection successful"
else
    error "❌ Redis connection failed - Redis may not be running"
fi

# Check Celery service status
log "🔍 Checking Celery service status..."
if sudo systemctl is-active --quiet celery.service; then
    log "✅ Celery service is running"
else
    error "❌ Celery service is not running"
    info "Service status:"
    sudo systemctl status celery.service --no-pager
fi

# Check Celery logs
log "📋 Checking Celery logs..."
if [ -f "/var/log/celery/worker.log" ]; then
    log "✅ Celery log file exists"
    info "Last 10 lines of Celery log:"
    tail -10 /var/log/celery/worker.log
else
    warning "⚠️  Celery log file not found"
fi

# Check systemd journal for Celery
log "📋 Checking systemd journal for Celery..."
sudo journalctl -u celery.service -n 10 --no-pager

log "🎯 Diagnosis complete!"