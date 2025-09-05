#!/bin/bash

# Traditional Deployment Script for MedCor Backend
# This script deploys using existing systemd services (gunicorn, celery, nginx)
# Instead of Docker containers

set -e

# Configuration
PROJECT_DIR="/var/www/html/medcor_backend2"
BACKUP_DIR="/var/www/html/backups"
LOG_FILE="/var/log/medcor-deploy.log"
SERVICE_NAME="medcor"
NGINX_SITE="api.medcor.ai"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Function to create backup
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/medcor_backup_$timestamp"
    
    log "📦 Creating backup..."
    sudo mkdir -p "$BACKUP_DIR" 2>/dev/null || mkdir -p "$BACKUP_DIR" 2>/dev/null || true
    sudo chown -R $USER:$USER "$BACKUP_DIR" 2>/dev/null || true
    
    # Copy current deployment
    if [ -d "$PROJECT_DIR" ]; then
        cp -r "$PROJECT_DIR" "$backup_path" 2>/dev/null || {
            warning "Backup failed, continuing without backup..."
            return 0
        }
        log "✅ Backup created successfully"
    else
        warning "No existing deployment found to backup"
    fi
}

# Function to stop services
stop_services() {
    log "🛑 Stopping services..."
    
    # Stop gunicorn service
    if systemctl is-active --quiet $SERVICE_NAME; then
        sudo systemctl stop $SERVICE_NAME
        log "✅ Gunicorn service stopped"
    else
        warning "Gunicorn service not running"
    fi
    
    # Stop celery service
    if systemctl is-active --quiet celery.service; then
        sudo systemctl stop celery.service
        log "✅ Celery service stopped"
    else
        warning "Celery service not running"
    fi
}

# Function to update code
update_code() {
    log "📥 Updating code..."
    
    cd "$PROJECT_DIR"
    
    # Pull latest changes
    git fetch origin
    git reset --hard origin/main
    log "✅ Code updated from repository"
    
    # Set proper permissions
    sudo chown -R $USER:$USER .
    chmod -R 755 .
    log "✅ Permissions updated"
}

# Function to setup environment
setup_environment() {
    log "🔧 Setting up environment..."
    
    cd "$PROJECT_DIR"
    
    # Check for existing virtual environment
    if [ -d "venv" ]; then
        log "✅ Using existing virtual environment"
        source venv/bin/activate
    else
        log "⚠️  Virtual environment not found, creating one..."
        python3 -m venv venv
        source venv/bin/activate
        log "✅ Virtual environment created"
    fi
    
    # Install/update dependencies
    pip install --upgrade pip
    pip install -r requirements.txt
    log "✅ Dependencies installed"
    
    # Copy environment file if needed
    if [ -f "env.prod" ] && [ ! -f ".env" ]; then
        cp env.prod .env
        log "✅ Environment file copied"
    fi
}

# Function to run database migrations
run_migrations() {
    log "🗄️ Running database migrations..."
    
    cd "$PROJECT_DIR"
    source venv/bin/activate
    
    # Run migrations
    python manage.py migrate
    log "✅ Database migrations completed"
    
    # Collect static files
    python manage.py collectstatic --noinput
    log "✅ Static files collected"
}

# Function to update systemd services
update_services() {
    log "⚙️ Updating systemd services..."
    
    # Update gunicorn service
    sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << EOF
[Unit]
Description=MedCor Backend Gunicorn
After=network.target

[Service]
Type=notify
User=$USER
Group=$USER
WorkingDirectory=$PROJECT_DIR
Environment=PATH=$PROJECT_DIR/venv/bin
ExecStart=$PROJECT_DIR/venv/bin/gunicorn --bind 127.0.0.1:8000 --workers 3 --timeout 120 medcor_backend2.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

    # Update celery service
    sudo tee /etc/systemd/system/celery.service > /dev/null << EOF
[Unit]
Description=MedCor Backend Celery Worker
After=network.target

[Service]
Type=forking
User=$USER
Group=$USER
WorkingDirectory=$PROJECT_DIR
Environment=PATH=$PROJECT_DIR/venv/bin
ExecStart=$PROJECT_DIR/venv/bin/celery -A medcor_backend2 worker --loglevel=info --detach
ExecStop=$PROJECT_DIR/venv/bin/celery -A medcor_backend2 control shutdown
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd
    sudo systemctl daemon-reload
    log "✅ Systemd services updated"
}

# Function to check nginx status (no configuration changes)
check_nginx() {
    log "🌐 Checking nginx status..."
    
    # Check if nginx is running
    if sudo systemctl is-active --quiet nginx; then
        log "✅ Nginx is running"
    else
        log "⚠️  Nginx is not running, starting it..."
        sudo systemctl start nginx
        if sudo systemctl is-active --quiet nginx; then
            log "✅ Nginx started successfully"
        else
            error "❌ Failed to start nginx"
            return 1
        fi
    fi
    
    # Test nginx configuration
    if sudo nginx -t; then
        log "✅ Nginx configuration is valid"
    else
        error "❌ Nginx configuration has errors"
        return 1
    fi
}

# Function to check RabbitMQ service
check_rabbitmq() {
    log "🐰 Checking RabbitMQ service..."
    
    # Check if RabbitMQ is running
    if sudo systemctl is-active --quiet rabbitmq-server; then
        log "✅ RabbitMQ is running"
    else
        log "⚠️  RabbitMQ is not running, starting it..."
        sudo systemctl start rabbitmq-server
        if sudo systemctl is-active --quiet rabbitmq-server; then
            log "✅ RabbitMQ started successfully"
        else
            error "❌ Failed to start RabbitMQ"
            return 1
        fi
    fi
}

# Function to start services
start_services() {
    log "🚀 Starting services..."
    
    # Start gunicorn service
    sudo systemctl enable $SERVICE_NAME
    sudo systemctl start $SERVICE_NAME
    log "✅ Gunicorn service started"
    
    # Start celery service
    sudo systemctl enable celery.service
    sudo systemctl start celery.service
    log "✅ Celery service started"
    
    # Restart nginx
    sudo systemctl restart nginx
    log "✅ Nginx restarted"
}

# Function to check service health
check_health() {
    log "🏥 Checking service health..."
    
    # Wait for services to start
    sleep 10
    
    # Check gunicorn
    if systemctl is-active --quiet $SERVICE_NAME; then
        log "✅ Gunicorn service is running"
    else
        error "❌ Gunicorn service failed to start"
        return 1
    fi
    
    # Check celery
    if systemctl is-active --quiet celery.service; then
        log "✅ Celery service is running"
    else
        error "❌ Celery service failed to start"
        return 1
    fi
    
    # Check nginx
    if systemctl is-active --quiet nginx; then
        log "✅ Nginx service is running"
    else
        error "❌ Nginx service failed to start"
        return 1
    fi
    
    # Check RabbitMQ
    if systemctl is-active --quiet rabbitmq-server; then
        log "✅ RabbitMQ service is running"
    else
        error "❌ RabbitMQ service failed to start"
        return 1
    fi
    
    # Test API endpoint (try HTTPS first, then HTTP)
    if curl -f https://$NGINX_SITE/api/health/ > /dev/null 2>&1; then
        log "✅ API endpoint is responding (HTTPS)"
    elif curl -f http://$NGINX_SITE/api/health/ > /dev/null 2>&1; then
        log "✅ API endpoint is responding (HTTP)"
    elif curl -f http://localhost/api/health/ > /dev/null 2>&1; then
        log "✅ API endpoint is responding (localhost)"
    else
        error "❌ API endpoint is not responding"
        return 1
    fi
}

# Main deployment function
main() {
    log "🚀 Starting MedCor Backend deployment..."
    
    # Create backup
    create_backup
    
    # Stop services
    stop_services
    
    # Update code
    update_code
    
    # Setup environment
    setup_environment
    
    # Run migrations
    run_migrations
    
    # Update services
    update_services
    
    # Check nginx (no configuration changes)
    check_nginx
    
    # Check RabbitMQ
    check_rabbitmq
    
    # Start services
    start_services
    
    # Check health
    if check_health; then
        log "🎉 Deployment completed successfully!"
        log "🌐 API is available at: https://$NGINX_SITE"
        log "📚 API Documentation: https://$NGINX_SITE/api/schema/swagger-ui/"
        log "🔧 Admin Interface: https://$NGINX_SITE/admin/"
    else
        error "❌ Deployment failed health checks"
        exit 1
    fi
}

# Run main function
main "$@"