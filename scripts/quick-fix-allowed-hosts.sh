#!/bin/bash

# Quick fix for ALLOWED_HOSTS - directly update settings.py
# This is a more direct approach to fix the DisallowedHost error

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

log "🔧 Quick fix for ALLOWED_HOSTS..."

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

# Backup current settings.py
log "💾 Backing up current settings.py..."
cp medcor_backend2/settings.py medcor_backend2/settings.py.backup

# Update ALLOWED_HOSTS in settings.py
log "🔧 Updating ALLOWED_HOSTS in settings.py..."
sed -i 's/ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")/ALLOWED_HOSTS = ["api.medcor.ai", "medcor.ai", "www.medcor.ai", "test.medcor.ai", "localhost", "127.0.0.1"]/' medcor_backend2/settings.py

# Verify the change
log "🔍 Verifying ALLOWED_HOSTS update..."
if grep -q 'ALLOWED_HOSTS = \["api.medcor.ai"' medcor_backend2/settings.py; then
    log "✅ ALLOWED_HOSTS updated successfully"
    grep "ALLOWED_HOSTS" medcor_backend2/settings.py
else
    error "❌ Failed to update ALLOWED_HOSTS"
    exit 1
fi

# Restart Gunicorn to apply changes
log "🔄 Restarting Gunicorn..."

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

log "🎉 Quick ALLOWED_HOSTS fix completed!"
log "🌐 Test your API at: https://api.medcor.ai/admin/"
log "📚 API Documentation: https://api.medcor.ai/api/schema/swagger-ui/"