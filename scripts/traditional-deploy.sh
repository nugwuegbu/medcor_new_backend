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
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Function to create backup
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/medcor_backup_$timestamp"
    
    log "📦 Creating backup..."
    mkdir -p "$BACKUP_DIR"
    
    # Copy current deployment
    if [ -d "$PROJECT_DIR" ]; then
        cp -r "$PROJECT_DIR" "$backup_path"
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
    
    # Use existing virtual environment
    if [ -d "venv" ]; then
        log "✅ Using existing virtual environment"
    else
        error "❌ Virtual environment not found at $PROJECT_DIR/venv"
        error "Please ensure the existing venv is present before deployment"
        exit 1
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
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

# Function to update nginx configuration
update_nginx() {
    log "🌐 Updating nginx configuration..."
    
    # Check if SSL certificates exist
    SSL_CERT="/etc/letsencrypt/live/$NGINX_SITE/fullchain.pem"
    SSL_KEY="/etc/letsencrypt/live/$NGINX_SITE/privkey.pem"
    
    if [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
        log "✅ SSL certificates found, configuring HTTPS"
        SSL_CONFIGURED=true
    else
        log "⚠️  SSL certificates not found, using HTTP only"
        SSL_CONFIGURED=false
    fi
    
    # Update nginx site configuration
    if [ "$SSL_CONFIGURED" = true ]; then
        # HTTPS configuration with SSL
        sudo tee /etc/nginx/sites-available/$NGINX_SITE > /dev/null << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $NGINX_SITE;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $NGINX_SITE;
    
    # SSL configuration
    ssl_certificate $SSL_CERT;
    ssl_certificate_key $SSL_KEY;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Client max body size for file uploads
    client_max_body_size 100M;
    
    # Static files
    location /static/ {
        alias $PROJECT_DIR/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias $PROJECT_DIR/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Admin interface
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
    }
    
    # Health check endpoint
    location /health/ {
        proxy_pass http://127.0.0.1:8000/api/health/;
        access_log off;
    }
    
    # Root redirect to API docs
    location = / {
        return 301 /api/schema/swagger-ui/;
    }
    
    # Default location
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
    }
}
EOF
    else
        # HTTP only configuration
        sudo tee /etc/nginx/sites-available/$NGINX_SITE > /dev/null << EOF
server {
    listen 80;
    server_name $NGINX_SITE;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Client max body size for file uploads
    client_max_body_size 100M;
    
    # Static files
    location /static/ {
        alias $PROJECT_DIR/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias $PROJECT_DIR/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Admin interface
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
    }
    
    # Health check endpoint
    location /health/ {
        proxy_pass http://127.0.0.1:8000/api/health/;
        access_log off;
    }
    
    # Root redirect to API docs
    location = / {
        return 301 /api/schema/swagger-ui/;
    }
    
    # Default location
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
    }
}
EOF
    fi

    # Enable site if not already enabled
    if [ ! -L "/etc/nginx/sites-enabled/$NGINX_SITE" ]; then
        sudo ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
    fi
    
    # Test nginx configuration
    sudo nginx -t
    log "✅ Nginx configuration updated"
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
    
    # Update nginx
    update_nginx
    
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