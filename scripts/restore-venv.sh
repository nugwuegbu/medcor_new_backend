#!/bin/bash

# Script to restore venv and start services on production server
# Run this on your AWS server to fix the 502 Bad Gateway error

set -e

# Configuration
PROJECT_DIR="/var/www/html/medcor_backend2"

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

log "🔧 Restoring virtual environment and starting services..."

# Navigate to project directory
cd "$PROJECT_DIR"

# Check if venv exists
if [ -d "venv" ]; then
    log "✅ Virtual environment already exists"
else
    log "⚠️  Virtual environment missing, creating new one..."
    python3 -m venv venv
    log "✅ Virtual environment created"
fi

# Activate virtual environment
log "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
log "📦 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
log "✅ Dependencies installed"

# Copy environment file if needed
if [ -f "env.prod" ] && [ ! -f ".env" ]; then
    cp env.prod .env
    log "✅ Environment file copied"
fi

# Run database migrations
log "🗄️ Running database migrations..."
python manage.py migrate
log "✅ Database migrations completed"

# Collect static files
log "📁 Collecting static files..."
python manage.py collectstatic --noinput
log "✅ Static files collected"

# Start services
log "🚀 Starting services..."

# Start gunicorn service
log "Starting Gunicorn service..."
sudo systemctl enable gunicorn.service 2>/dev/null || true
sudo systemctl start gunicorn.service 2>/dev/null || {
    warning "Failed to start gunicorn.service, trying manual start..."
    cd "$PROJECT_DIR"
    source venv/bin/activate
    nohup gunicorn --bind 127.0.0.1:8000 medcor_backend2.wsgi:application --daemon 2>/dev/null || true
}
log "✅ Gunicorn service started"

# Start celery service
log "Starting Celery service..."
sudo systemctl enable celery.service 2>/dev/null || true
sudo systemctl start celery.service 2>/dev/null || {
    warning "Failed to start celery.service, trying manual start..."
    cd "$PROJECT_DIR"
    source venv/bin/activate
    nohup celery -A medcor_backend2 worker --loglevel=info --daemon 2>/dev/null || true
}
log "✅ Celery service started"

# Start RabbitMQ
log "Starting RabbitMQ..."
sudo systemctl start rabbitmq-server 2>/dev/null || true
log "✅ RabbitMQ started"

# Restart nginx
log "Restarting Nginx..."
sudo systemctl restart nginx 2>/dev/null || true
log "✅ Nginx restarted"

# Wait for services to start
log "⏳ Waiting for services to start..."
sleep 10

# Check service health
log "🏥 Checking service health..."

# Check gunicorn
if systemctl is-active --quiet gunicorn.service 2>/dev/null || pgrep -f gunicorn > /dev/null 2>&1; then
    log "✅ Gunicorn service is running"
else
    warning "Gunicorn service may not be running properly"
fi

# Check celery
if systemctl is-active --quiet celery.service 2>/dev/null || pgrep -f celery > /dev/null 2>&1; then
    log "✅ Celery service is running"
else
    warning "Celery service may not be running properly"
fi

# Check nginx
if systemctl is-active --quiet nginx 2>/dev/null; then
    log "✅ Nginx service is running"
else
    warning "Nginx service may not be running properly"
fi

# Check RabbitMQ
if systemctl is-active --quiet rabbitmq-server 2>/dev/null; then
    log "✅ RabbitMQ service is running"
else
    warning "RabbitMQ service may not be running properly"
fi

# Test API endpoint
log "🌐 Testing API endpoints..."
if curl -f https://api.medcor.ai/api/health/ > /dev/null 2>&1; then
    log "✅ API endpoint is responding (HTTPS)"
elif curl -f http://api.medcor.ai/api/health/ > /dev/null 2>&1; then
    log "✅ API endpoint is responding (HTTP)"
elif curl -f http://localhost:8000/api/health/ > /dev/null 2>&1; then
    log "✅ API endpoint is responding (localhost)"
else
    warning "API endpoint is not responding - check service logs"
fi

log "🎉 Service restoration completed!"
log "🌐 API should be available at: https://api.medcor.ai"
log "📚 API Documentation: https://api.medcor.ai/api/schema/swagger-ui/"
log "🔧 Admin Interface: https://api.medcor.ai/admin/"