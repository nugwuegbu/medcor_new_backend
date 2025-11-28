#!/bin/bash

# Script to fix Nginx-Gunicorn socket connection issue
# This addresses the 502 Bad Gateway caused by socket mismatch

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

log "🔧 Fixing Nginx-Gunicorn socket connection..."

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

# Stop current Gunicorn processes
log "🛑 Stopping current Gunicorn processes..."
sudo systemctl stop gunicorn.service 2>/dev/null || true
pkill -f gunicorn 2>/dev/null || true
log "✅ Gunicorn processes stopped"

# Remove old socket file if it exists
if [ -S "gunicorn.sock" ]; then
    log "🗑️  Removing old socket file..."
    rm -f gunicorn.sock
fi

# Start Gunicorn with Unix socket
log "🚀 Starting Gunicorn with Unix socket..."
gunicorn --bind unix:/var/www/html/medcor_backend2/gunicorn.sock medcor_backend2.wsgi:application --daemon

# Wait for Gunicorn to start
sleep 3

# Check if socket file was created
if [ -S "gunicorn.sock" ]; then
    log "✅ Gunicorn socket file created successfully"
else
    error "❌ Gunicorn socket file not created"
    log "Trying alternative approach with TCP port..."
    
    # Fallback to TCP port
    gunicorn --bind 127.0.0.1:8000 medcor_backend2.wsgi:application --daemon
    log "✅ Gunicorn started on TCP port 8000"
fi

# Set proper permissions for socket file
if [ -S "gunicorn.sock" ]; then
    chmod 666 gunicorn.sock
    log "✅ Socket file permissions set"
fi

# Restart Nginx
log "🔄 Restarting Nginx..."
sudo systemctl restart nginx
log "✅ Nginx restarted"

# Wait for services to stabilize
sleep 5

# Test the connection
log "🧪 Testing connection..."

# Test socket connection
if [ -S "gunicorn.sock" ]; then
    if curl -f --unix-socket gunicorn.sock http://localhost/ > /dev/null 2>&1; then
        log "✅ Socket connection works"
    else
        warning "⚠️  Socket connection failed"
    fi
fi

# Test TCP connection
if curl -f http://localhost:8000 > /dev/null 2>&1; then
    log "✅ TCP connection works"
else
    warning "⚠️  TCP connection failed"
fi

# Test external API
if curl -f http://api.medcor.ai > /dev/null 2>&1; then
    log "✅ External API works (HTTP)"
elif curl -f https://api.medcor.ai > /dev/null 2>&1; then
    log "✅ External API works (HTTPS)"
else
    warning "⚠️  External API still not working"
fi

log "🎉 Socket connection fix completed!"
log "🌐 Test your API at: https://api.medcor.ai"