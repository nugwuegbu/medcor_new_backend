#!/bin/bash

# Diagnostic script to troubleshoot 502 Bad Gateway error
# Run this on your AWS server to identify the issue

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

log "🔍 Diagnosing 502 Bad Gateway error..."

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    error "Not in Django project directory. Please run from /var/www/html/medcor_backend2"
    exit 1
fi

log "✅ In correct Django project directory"

# Check if venv exists
if [ -d "venv" ]; then
    log "✅ Virtual environment exists"
    source venv/bin/activate
    log "✅ Virtual environment activated"
else
    error "❌ Virtual environment not found"
    exit 1
fi

# Check if Gunicorn is installed
if python -c "import gunicorn" 2>/dev/null; then
    log "✅ Gunicorn is installed"
else
    error "❌ Gunicorn not installed"
    log "Installing Gunicorn..."
    pip install gunicorn
fi

# Check if Django app can start
log "🔍 Testing Django application..."
if python manage.py check --deploy 2>/dev/null; then
    log "✅ Django application is healthy"
else
    warning "⚠️  Django application has issues"
    python manage.py check
fi

# Check if port 8000 is in use
log "🔍 Checking port 8000..."
if netstat -tlnp 2>/dev/null | grep :8000 > /dev/null; then
    log "✅ Port 8000 is in use"
    netstat -tlnp | grep :8000
else
    warning "⚠️  Port 8000 is not in use"
fi

# Check if Gunicorn process is running
log "🔍 Checking Gunicorn processes..."
if pgrep -f gunicorn > /dev/null; then
    log "✅ Gunicorn process is running"
    ps aux | grep gunicorn | grep -v grep
else
    warning "⚠️  No Gunicorn process found"
fi

# Check systemd services
log "🔍 Checking systemd services..."
if systemctl is-active --quiet gunicorn.service 2>/dev/null; then
    log "✅ Gunicorn systemd service is active"
else
    warning "⚠️  Gunicorn systemd service is not active"
fi

# Check Nginx status
log "🔍 Checking Nginx status..."
if systemctl is-active --quiet nginx 2>/dev/null; then
    log "✅ Nginx is running"
else
    error "❌ Nginx is not running"
fi

# Test local connection
log "🔍 Testing local connection to port 8000..."
if curl -f http://localhost:8000 > /dev/null 2>&1; then
    log "✅ Local connection to port 8000 works"
else
    error "❌ Local connection to port 8000 failed"
    log "Trying to start Gunicorn manually..."
    
    # Try to start Gunicorn manually
    log "🚀 Starting Gunicorn manually..."
    nohup gunicorn --bind 127.0.0.1:8000 medcor_backend2.wsgi:application --daemon 2>/dev/null || true
    
    # Wait a moment
    sleep 3
    
    # Test again
    if curl -f http://localhost:8000 > /dev/null 2>&1; then
        log "✅ Gunicorn started successfully"
    else
        error "❌ Failed to start Gunicorn"
        log "Checking Gunicorn logs..."
        tail -n 20 /var/log/gunicorn/error.log 2>/dev/null || echo "No Gunicorn error log found"
    fi
fi

# Test external connection
log "🔍 Testing external API connection..."
if curl -f http://api.medcor.ai > /dev/null 2>&1; then
    log "✅ External API connection works"
elif curl -f https://api.medcor.ai > /dev/null 2>&1; then
    log "✅ External HTTPS API connection works"
else
    warning "⚠️  External API connection failed"
fi

# Check Nginx configuration
log "🔍 Checking Nginx configuration..."
if nginx -t 2>/dev/null; then
    log "✅ Nginx configuration is valid"
else
    error "❌ Nginx configuration has errors"
    nginx -t
fi

# Show Nginx error logs
log "🔍 Checking Nginx error logs..."
if [ -f "/var/log/nginx/error.log" ]; then
    log "Recent Nginx errors:"
    tail -n 10 /var/log/nginx/error.log
else
    warning "No Nginx error log found"
fi

log "🎯 Diagnosis complete!"
log "If Gunicorn is not running, try:"
log "1. sudo systemctl start gunicorn.service"
log "2. Or manually: gunicorn --bind 127.0.0.1:8000 medcor_backend2.wsgi:application"
log "3. Check logs: sudo journalctl -u gunicorn.service -f"