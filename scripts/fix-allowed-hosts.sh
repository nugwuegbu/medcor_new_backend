#!/bin/bash

# Script to fix ALLOWED_HOSTS configuration for Django
# This addresses the DisallowedHost error for api.medcor.ai

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

log "🔧 Fixing ALLOWED_HOSTS configuration..."

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

# Check if .env file exists
if [ -f ".env" ]; then
    log "✅ .env file exists"
else
    log "⚠️  .env file not found, copying from env.prod"
    if [ -f "env.prod" ]; then
        cp env.prod .env
        log "✅ .env file created from env.prod"
    else
        error "❌ env.prod file not found"
        exit 1
    fi
fi

# Verify ALLOWED_HOSTS in .env file
log "🔍 Checking ALLOWED_HOSTS in .env file..."
if grep -q "ALLOWED_HOSTS" .env; then
    log "✅ ALLOWED_HOSTS found in .env file"
    grep "ALLOWED_HOSTS" .env
else
    error "❌ ALLOWED_HOSTS not found in .env file"
    exit 1
fi

# Restart Gunicorn to pick up new environment variables
log "🔄 Restarting Gunicorn to apply new settings..."

# Stop current Gunicorn
pkill -f gunicorn 2>/dev/null || true
sudo systemctl stop gunicorn.service 2>/dev/null || true

# Wait a moment
sleep 2

# Start Gunicorn with Unix socket
log "🚀 Starting Gunicorn with updated settings..."
gunicorn --bind unix:/var/www/html/medcor_backend2/gunicorn.sock medcor_backend2.wsgi:application --daemon

# Set proper permissions for socket file
if [ -S "gunicorn.sock" ]; then
    chmod 666 gunicorn.sock
    log "✅ Socket file permissions set"
fi

# Wait for Gunicorn to start
sleep 3

# Restart Nginx
log "🔄 Restarting Nginx..."
sudo systemctl restart nginx
log "✅ Nginx restarted"

# Wait for services to stabilize
sleep 5

# Test the connection
log "🧪 Testing API connection..."

# Test local connection
if curl -f --unix-socket gunicorn.sock http://localhost/ > /dev/null 2>&1; then
    log "✅ Local socket connection works"
else
    warning "⚠️  Local socket connection failed"
fi

# Test external API
log "🌐 Testing external API..."
if curl -f http://api.medcor.ai/admin/ > /dev/null 2>&1; then
    log "✅ External API works (HTTP)"
elif curl -f https://api.medcor.ai/admin/ > /dev/null 2>&1; then
    log "✅ External API works (HTTPS)"
else
    warning "⚠️  External API still not working"
    log "Testing with verbose curl..."
    curl -v https://api.medcor.ai/admin/ 2>&1 | head -20
fi

log "🎉 ALLOWED_HOSTS fix completed!"
log "🌐 Test your API at: https://api.medcor.ai/admin/"
log "📚 API Documentation: https://api.medcor.ai/api/schema/swagger-ui/"