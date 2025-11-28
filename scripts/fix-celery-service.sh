#!/bin/bash

# Script to fix Celery service issues
# This addresses the Celery service failing to start

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

log "🔧 Fixing Celery service..."

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

# Install Celery and related dependencies
log "📦 Installing Celery dependencies..."
pip install celery redis amqp

# Create necessary directories
log "📁 Creating Celery directories..."
sudo mkdir -p /var/log/celery
sudo mkdir -p /var/run/celery
sudo chown -R $USER:$USER /var/log/celery
sudo chown -R $USER:$USER /var/run/celery

# Check if RabbitMQ is running
log "🐰 Checking RabbitMQ status..."
if systemctl is-active --quiet rabbitmq-server; then
    log "✅ RabbitMQ is running"
else
    log "⚠️  Starting RabbitMQ..."
    sudo systemctl start rabbitmq-server
    sudo systemctl enable rabbitmq-server
    log "✅ RabbitMQ started"
fi

# Test Celery configuration
log "🧪 Testing Celery configuration..."
if python -c "from medcor_backend2.celery import app; print('Celery app loaded successfully')" 2>/dev/null; then
    log "✅ Celery configuration is valid"
else
    warning "⚠️  Celery configuration has issues"
    log "Checking Celery app..."
    python -c "from medcor_backend2.celery import app; print(app)"
fi

# Stop current Celery service
log "🛑 Stopping current Celery service..."
sudo systemctl stop celery.service 2>/dev/null || true
pkill -f celery 2>/dev/null || true

# Test Celery worker manually
log "🧪 Testing Celery worker manually..."
cd /var/www/html/medcor_backend2
source venv/bin/activate

# Test with a simple command
if timeout 10 celery -A medcor_backend2 worker --loglevel=info --dry-run 2>/dev/null; then
    log "✅ Celery worker test successful"
else
    warning "⚠️  Celery worker test failed, checking logs..."
    celery -A medcor_backend2 worker --loglevel=info --dry-run 2>&1 | head -10
fi

# Start Celery worker manually as a test
log "🚀 Starting Celery worker manually for testing..."
nohup celery -A medcor_backend2 worker --loglevel=info --pidfile=/var/run/celery/worker.pid --logfile=/var/log/celery/worker.log --daemon 2>/dev/null || true

# Wait a moment
sleep 3

# Check if Celery is running
if pgrep -f celery > /dev/null; then
    log "✅ Celery worker started successfully"
else
    warning "⚠️  Celery worker failed to start manually"
    log "Checking Celery logs..."
    if [ -f "/var/log/celery/worker.log" ]; then
        tail -20 /var/log/celery/worker.log
    fi
fi

# Try to start the systemd service
log "🔄 Starting Celery systemd service..."
sudo systemctl start celery.service

# Wait a moment
sleep 3

# Check service status
if systemctl is-active --quiet celery.service; then
    log "✅ Celery systemd service is running"
else
    warning "⚠️  Celery systemd service failed to start"
    log "Checking service status..."
    sudo systemctl status celery.service --no-pager -l
fi

# Check Celery processes
log "🔍 Checking Celery processes..."
if pgrep -f celery > /dev/null; then
    log "✅ Celery processes are running"
    ps aux | grep celery | grep -v grep
else
    warning "⚠️  No Celery processes found"
fi

# Test Celery functionality
log "🧪 Testing Celery functionality..."
if python -c "from medcor_backend2.celery import app; result = app.send_task('celery.ping'); print('Celery ping successful')" 2>/dev/null; then
    log "✅ Celery functionality test passed"
else
    warning "⚠️  Celery functionality test failed"
fi

log "🎉 Celery service fix completed!"
log "📊 Check Celery status with: sudo systemctl status celery.service"
log "📋 Check Celery logs with: tail -f /var/log/celery/worker.log"