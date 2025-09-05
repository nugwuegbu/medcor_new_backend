#!/bin/bash

# Complete service restoration script
# This fixes all services: Gunicorn, Celery, RabbitMQ, and Nginx

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

log "🔧 Complete service restoration starting..."

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

# Install all required dependencies
log "📦 Installing all required dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install celery redis amqp

# Create necessary directories
log "📁 Creating necessary directories..."
sudo mkdir -p /var/log/celery
sudo mkdir -p /var/run/celery
sudo mkdir -p /var/log/gunicorn
sudo chown -R $USER:$USER /var/log/celery
sudo chown -R $USER:$USER /var/run/celery
sudo chown -R $USER:$USER /var/log/gunicorn

# Ensure .env file exists
log "🔧 Ensuring environment configuration..."
if [ -f "env.prod" ] && [ ! -f ".env" ]; then
    cp env.prod .env
    log "✅ Environment file copied from env.prod"
fi

# Run database migrations
log "🗄️ Running database migrations..."
python manage.py migrate

# Collect static files
log "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Stop all services
log "🛑 Stopping all services..."
sudo systemctl stop gunicorn.service 2>/dev/null || true
sudo systemctl stop celery.service 2>/dev/null || true
pkill -f gunicorn 2>/dev/null || true
pkill -f celery 2>/dev/null || true

# Start RabbitMQ
log "🐰 Starting RabbitMQ..."
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server
log "✅ RabbitMQ started"

# Start Gunicorn with Unix socket
log "🚀 Starting Gunicorn with Unix socket..."
gunicorn --bind unix:/var/www/html/medcor_backend2/gunicorn.sock medcor_backend2.wsgi:application --daemon

# Set proper permissions for socket file
if [ -S "gunicorn.sock" ]; then
    chmod 666 gunicorn.sock
    log "✅ Gunicorn socket file permissions set"
fi

# Wait for Gunicorn to start
sleep 3

# Test Gunicorn
if pgrep -f gunicorn > /dev/null; then
    log "✅ Gunicorn is running"
else
    error "❌ Gunicorn failed to start"
fi

# Start Celery worker manually
log "🚀 Starting Celery worker..."
nohup celery -A medcor_backend2 worker --loglevel=info --pidfile=/var/run/celery/worker.pid --logfile=/var/log/celery/worker.log --daemon 2>/dev/null || true

# Wait for Celery to start
sleep 3

# Test Celery
if pgrep -f celery > /dev/null; then
    log "✅ Celery worker is running"
else
    warning "⚠️  Celery worker failed to start manually"
fi

# Restart Nginx
log "🔄 Restarting Nginx..."
sudo systemctl restart nginx
log "✅ Nginx restarted"

# Wait for services to stabilize
sleep 5

# Test all connections
log "🧪 Testing all connections..."

# Test local Gunicorn
if curl -f --unix-socket gunicorn.sock http://localhost/ > /dev/null 2>&1; then
    log "✅ Local Gunicorn connection works"
else
    warning "⚠️  Local Gunicorn connection failed"
fi

# Test external API
if curl -f http://api.medcor.ai/admin/ > /dev/null 2>&1; then
    log "✅ External API works (HTTP)"
elif curl -f https://api.medcor.ai/admin/ > /dev/null 2>&1; then
    log "✅ External API works (HTTPS)"
else
    warning "⚠️  External API connection failed"
fi

# Test Celery functionality
if python -c "from medcor_backend2.celery import app; result = app.send_task('celery.ping'); print('Celery ping successful')" 2>/dev/null; then
    log "✅ Celery functionality test passed"
else
    warning "⚠️  Celery functionality test failed"
fi

# Show service status
log "📊 Service status summary:"
echo "Gunicorn processes:"
ps aux | grep gunicorn | grep -v grep || echo "No Gunicorn processes found"

echo "Celery processes:"
ps aux | grep celery | grep -v grep || echo "No Celery processes found"

echo "Nginx status:"
sudo systemctl is-active nginx || echo "Nginx not active"

echo "RabbitMQ status:"
sudo systemctl is-active rabbitmq-server || echo "RabbitMQ not active"

log "🎉 Complete service restoration completed!"
log "🌐 Test your API at: https://api.medcor.ai/admin/"
log "📚 API Documentation: https://api.medcor.ai/api/schema/swagger-ui/"

# Create a simple health check script
log "📝 Creating health check script..."
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash
echo "=== MedCor Backend Health Check ==="
echo "Gunicorn processes:"
ps aux | grep gunicorn | grep -v grep || echo "No Gunicorn processes"
echo ""
echo "Celery processes:"
ps aux | grep celery | grep -v grep || echo "No Celery processes"
echo ""
echo "Nginx status:"
systemctl is-active nginx
echo ""
echo "RabbitMQ status:"
systemctl is-active rabbitmq-server
echo ""
echo "API test:"
curl -f http://api.medcor.ai/admin/ > /dev/null 2>&1 && echo "API working" || echo "API not working"
EOF

chmod +x scripts/health-check.sh
log "✅ Health check script created at scripts/health-check.sh"