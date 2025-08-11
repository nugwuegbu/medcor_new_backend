#!/bin/bash

# Medcor Hospital Application Deployment Script for AWS EC2
# This script automates the deployment process

set -e  # Exit on error

echo "🏥 Starting Medcor Hospital Application Deployment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if running as ubuntu user
if [ "$USER" != "ubuntu" ]; then
    print_warning "This script should be run as the ubuntu user"
fi

# Step 1: Update System
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Step 2: Install Python 3.11
print_status "Installing Python 3.11..."
sudo apt install -y python3.11 python3.11-venv python3-pip python3.11-dev

# Step 3: Install Node.js 20
print_status "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Step 4: Install other dependencies
print_status "Installing build tools and PostgreSQL client..."
sudo apt install -y build-essential postgresql-client git nginx

# Step 5: Create directory structure
print_status "Creating application directories..."
sudo mkdir -p /var/www/medcor
sudo mkdir -p /var/www/medcor/backend
sudo mkdir -p /var/www/medcor/frontend
sudo mkdir -p /var/log/medcor
sudo mkdir -p /var/www/medcor/staticfiles
sudo mkdir -p /var/www/medcor/media

# Set permissions
sudo chown -R ubuntu:ubuntu /var/www/medcor
sudo chown -R ubuntu:ubuntu /var/log/medcor

# Step 6: Check if application files exist
if [ ! -f "/home/ubuntu/medcor-deploy.tar.gz" ]; then
    print_error "Application files not found. Please upload medcor-deploy.tar.gz to /home/ubuntu/"
    exit 1
fi

# Step 7: Extract application files
print_status "Extracting application files..."
cd /var/www/medcor
tar -xzf /home/ubuntu/medcor-deploy.tar.gz

# Step 8: Setup Python virtual environment
print_status "Setting up Python virtual environment..."
python3.11 -m venv venv
source venv/bin/activate

# Step 9: Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip

# Check if requirements.txt exists
if [ -f "deployment/requirements.txt" ]; then
    pip install -r deployment/requirements.txt
else
    # Install dependencies manually
    pip install Django==5.0.1
    pip install djangorestframework==3.14.0
    pip install django-cors-headers==4.3.1
    pip install psycopg2-binary==2.9.9
    pip install dj-database-url==2.1.0
    pip install django-tenants==3.5.0
    pip install PyJWT==2.8.0
    pip install bcrypt==4.1.2
    pip install python-dotenv==1.0.0
    pip install drf-spectacular==0.27.0
    pip install Pillow==10.2.0
    pip install requests==2.31.0
    pip install gunicorn==21.2.0
    pip install whitenoise==6.6.0
fi

# Step 10: Install Node dependencies and build frontend
print_status "Installing Node.js dependencies..."
npm install

print_status "Building frontend..."
npm run build

# Step 11: Check for .env file
if [ ! -f "/var/www/medcor/.env" ]; then
    print_warning "Environment file not found. Creating template..."
    cat > /var/www/medcor/.env << 'EOF'
# Django Settings
DJANGO_SECRET_KEY=your-very-long-random-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-ec2-public-ip,your-domain.com

# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/dbname
DB_HOST=your-rds-endpoint.amazonaws.com
DB_NAME=medcor_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_PORT=5432

# Application Settings
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://your-domain.com/api

# API Keys (if needed)
OPENAI_API_KEY=your-openai-key
HEYGEN_API_KEY=your-heygen-key
EOF
    print_error "Please edit /var/www/medcor/.env with your actual values"
    exit 1
fi

# Step 12: Setup Django
print_status "Collecting static files..."
python medcor_backend/manage.py collectstatic --noinput

print_status "Running database migrations..."
python medcor_backend/manage.py migrate

# Step 13: Create Gunicorn configuration
print_status "Creating Gunicorn configuration..."
cat > /var/www/medcor/gunicorn_config.py << 'EOF'
import multiprocessing

bind = "127.0.0.1:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 120
keepalive = 5
accesslog = "/var/log/medcor/gunicorn_access.log"
errorlog = "/var/log/medcor/gunicorn_error.log"
loglevel = "info"
capture_output = True
enable_stdio_inheritance = True
EOF

# Step 14: Create systemd service
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/medcor.service > /dev/null << 'EOF'
[Unit]
Description=Medcor Hospital Gunicorn Application
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/var/www/medcor
Environment="PATH=/var/www/medcor/venv/bin"
ExecStart=/var/www/medcor/venv/bin/gunicorn \
    --config /var/www/medcor/gunicorn_config.py \
    medcor_backend.wsgi:application

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Step 15: Setup Nginx
print_status "Configuring Nginx..."
# Get the public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

sudo tee /etc/nginx/sites-available/medcor > /dev/null << EOF
# Rate limiting
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;

# Upstream for Django backend
upstream medcor_backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name $PUBLIC_IP;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Frontend static files
    root /var/www/medcor/dist;
    index index.html;
    
    # Frontend routes
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # API endpoints (Django backend)
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://medcor_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
    
    # Django admin
    location /admin/ {
        proxy_pass http://medcor_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Django static files
    location /static/ {
        alias /var/www/medcor/staticfiles/;
    }
    
    # Django media files
    location /media/ {
        alias /var/www/medcor/media/;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    client_max_body_size 50M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/json application/xml+rss;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/medcor /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Step 16: Start services
print_status "Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable medcor
sudo systemctl start medcor
sudo systemctl restart nginx

# Step 17: Setup firewall
print_status "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable

# Step 18: Check service status
print_status "Checking service status..."
if systemctl is-active --quiet medcor; then
    print_status "Gunicorn service is running"
else
    print_error "Gunicorn service failed to start"
    sudo journalctl -u medcor -n 20
fi

if systemctl is-active --quiet nginx; then
    print_status "Nginx service is running"
else
    print_error "Nginx service failed to start"
    sudo journalctl -u nginx -n 20
fi

# Step 19: Display access information
echo ""
print_status "Deployment completed successfully!"
echo ""
echo "🌐 Access your application at: http://$PUBLIC_IP"
echo "🔧 Django Admin: http://$PUBLIC_IP/admin"
echo "📚 API Documentation: http://$PUBLIC_IP/api/schema/swagger-ui/"
echo ""
echo "📝 Important next steps:"
echo "1. Create Django superuser: cd /var/www/medcor && source venv/bin/activate && python medcor_backend/manage.py createsuperuser"
echo "2. Configure your domain name in Nginx"
echo "3. Setup SSL certificate with Let's Encrypt"
echo "4. Configure backup strategy"
echo ""
echo "📊 Monitor logs:"
echo "   Gunicorn: sudo tail -f /var/log/medcor/gunicorn_error.log"
echo "   Nginx: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "🔄 To restart services:"
echo "   sudo systemctl restart medcor"
echo "   sudo systemctl restart nginx"