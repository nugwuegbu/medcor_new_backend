#!/bin/bash

# MedCor Backend AWS EC2 Deployment Script
# This script automates the deployment process for AWS EC2 Ubuntu 24.04

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="medcor"
APP_USER="ubuntu"
APP_DIR="/home/$APP_USER/medcor_backend2"
SERVICE_NAME="medcor"
DOMAIN="test.medcor.ai"

echo -e "${GREEN}🚀 Starting MedCor Backend Deployment to AWS EC2${NC}"
echo "=================================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as ubuntu user."
   exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y python3 python3-pip python3-venv nginx postgresql-client git curl

# Create application directory if it doesn't exist
if [ ! -d "$APP_DIR" ]; then
    print_status "Creating application directory..."
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    # Clone repository (update with your actual repo URL)
    print_status "Cloning repository..."
    git clone https://github.com/yourusername/medcor_backend2.git .
else
    print_status "Application directory exists, updating code..."
    cd "$APP_DIR"
    git pull origin main
fi

# Setup Python virtual environment
print_status "Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn whitenoise

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_warning "Creating .env file. Please update it with your actual configuration."
    cat > .env << EOF
DEBUG=False
SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(50))')
ALLOWED_HOSTS=$DOMAIN,$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
CORS_ALLOWED_ORIGINS=https://$DOMAIN,https://your-frontend-domain.com

# Database (update with your actual database)
DATABASE_URL=postgresql://username:password@your-db-host:5432/database_name

# Email (optional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# AWS S3 (optional, for file storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=medcor-files
AWS_S3_REGION_NAME=us-east-1
EOF
    print_warning "Please edit .env file with your actual configuration before continuing."
    read -p "Press Enter after updating .env file..."
fi

# Run Django setup
print_status "Running Django setup..."
python manage.py migrate
python manage.py collectstatic --noinput

# Create Gunicorn configuration
print_status "Creating Gunicorn configuration..."
cat > gunicorn_config.py << EOF
# Gunicorn configuration file
bind = "127.0.0.1:8000"
workers = 3
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
preload_app = True
timeout = 120
keepalive = 2
EOF

# Create systemd service
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=MedCor Backend Gunicorn
After=network.target

[Service]
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/venv/bin"
Environment="DJANGO_SETTINGS_MODULE=medcor_backend2.settings"
ExecStart=$APP_DIR/venv/bin/gunicorn --config gunicorn_config.py medcor_backend2.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Create Nginx configuration
print_status "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
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
        alias $APP_DIR/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias $APP_DIR/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy to Gunicorn
    location / {
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
    
    # Health check endpoint
    location /health/ {
        proxy_pass http://127.0.0.1:8000/health/;
        access_log off;
    }
}
EOF

# Create log directory
print_status "Creating log directory..."
mkdir -p "$APP_DIR/logs"

# Set proper permissions
print_status "Setting proper permissions..."
sudo chown -R $APP_USER:$APP_USER "$APP_DIR"
sudo chmod -R 755 "$APP_DIR"

# Enable and start services
print_status "Enabling and starting services..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

# Enable Nginx site
print_status "Configuring Nginx..."
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Setup firewall
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Create backup script
print_status "Creating backup script..."
cat > /home/$APP_USER/backup_db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Load environment variables
source /home/ubuntu/medcor_backend2/.env

# Backup database
pg_dump $DATABASE_URL > $BACKUP_DIR/medcor_db_$DATE.sql

# Keep only last 7 backups
find $BACKUP_DIR -name "medcor_db_*.sql" -mtime +7 -delete

echo "Database backup completed: medcor_db_$DATE.sql"
EOF

chmod +x /home/$APP_USER/backup_db.sh

# Create update script
print_status "Creating update script..."
cat > /home/$APP_USER/update_app.sh << 'EOF'
#!/bin/bash
cd /home/ubuntu/medcor_backend2

# Pull latest changes
git pull origin main

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Restart services
sudo systemctl restart medcor
sudo systemctl restart nginx

echo "Application updated successfully at $(date)"
EOF

chmod +x /home/$APP_USER/update_app.sh

# Create monitoring script
print_status "Creating monitoring script..."
cat > /home/$APP_USER/monitor.sh << 'EOF'
#!/bin/bash
LOG_FILE="/home/ubuntu/monitor.log"

# Check Gunicorn
if ! systemctl is-active --quiet medcor; then
    echo "$(date): Gunicorn service is down!" >> $LOG_FILE
    sudo systemctl restart medcor
fi

# Check Nginx
if ! systemctl is-active --quiet nginx; then
    echo "$(date): Nginx service is down!" >> $LOG_FILE
    sudo systemctl restart nginx
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): Disk usage is high: ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory
MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ $MEM_USAGE -gt 80 ]; then
    echo "$(date): Memory usage is high: ${MEM_USAGE}%" >> $LOG_FILE
fi
EOF

chmod +x /home/$APP_USER/monitor.sh

# Setup cron jobs
print_status "Setting up cron jobs..."
(crontab -l 2>/dev/null; echo "0 2 * * * /home/$APP_USER/backup_db.sh >> /home/$APP_USER/backup.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/$APP_USER/monitor.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * 0 sudo apt update && sudo apt upgrade -y") | crontab -

# Check service status
print_status "Checking service status..."
sudo systemctl status $SERVICE_NAME --no-pager
sudo systemctl status nginx --no-pager

# Test health check
print_status "Testing health check endpoint..."
sleep 5  # Wait for service to start
if curl -s http://localhost:8000/health/ > /dev/null; then
    print_status "Health check endpoint is working!"
else
    print_warning "Health check endpoint might not be working yet. Check logs."
fi

# Final instructions
echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Update your DNS to point $DOMAIN to this server's IP:"
echo "   IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo ""
echo "2. Obtain SSL certificate:"
echo "   sudo apt install -y certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d $DOMAIN"
echo ""
echo "3. Test your application:"
echo "   curl https://$DOMAIN/health/"
echo ""
echo "4. Check logs if needed:"
echo "   sudo journalctl -u $SERVICE_NAME -f"
echo "   sudo tail -f /var/log/nginx/error.log"
echo ""
echo "5. Update application:"
echo "   /home/$APP_USER/update_app.sh"
echo ""
echo "6. Monitor services:"
echo "   /home/$APP_USER/monitor.sh"
echo ""
echo -e "${GREEN}🎉 Your MedCor Backend is now running on AWS EC2!${NC}" 