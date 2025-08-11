#!/bin/bash

# Medcor Hospital Custom Deployment Script for AWS EC2
# Customized for specific ports and configuration

set -e  # Exit on error

echo "🏥 Starting Medcor Hospital Application Deployment..."
echo "📍 Frontend Port: 8081"
echo "📍 Backend Port: 8001"

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
sudo apt install -y build-essential postgresql-client git nginx supervisor

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

# Step 6: Extract application files
if [ -f "/home/ubuntu/medcor-deploy.tar.gz" ]; then
    print_status "Extracting application files..."
    cd /var/www/medcor
    tar -xzf /home/ubuntu/medcor-deploy.tar.gz
else
    print_warning "Application files not found. Assuming files are already in place."
fi

# Step 7: Setup Python virtual environment
print_status "Setting up Python virtual environment..."
cd /var/www/medcor
python3.11 -m venv venv
source venv/bin/activate

# Step 8: Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip
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
pip install openai==1.6.1
pip install aiohttp==3.9.1
pip install cryptography==41.0.7

# Step 9: Create environment file
print_status "Creating environment configuration..."
cat > /var/www/medcor/.env << 'EOF'
# Django Settings
DJANGO_SECRET_KEY=django-insecure-$(openssl rand -base64 32)
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=ec2-51-16-221-91.il-central-1.compute.amazonaws.com,medcor.ai,*.medcor.ai,localhost,127.0.0.1

# Database Configuration
DATABASE_URL=postgresql://postgres:3765R7vmFQwF6ddlNyWa@medcore.czouassyu7f2.il-central-1.rds.amazonaws.com:5432/medcor_db
DB_HOST=medcore.czouassyu7f2.il-central-1.rds.amazonaws.com
DB_NAME=medcor_db
DB_USER=postgres
DB_PASSWORD=3765R7vmFQwF6ddlNyWa
DB_PORT=5432

# Application Settings
FRONTEND_URL=https://medcor.ai:8081
BACKEND_URL=https://medcor.ai:8001/api
BASE_DOMAIN=medcor.ai

# Port Configuration
BACKEND_PORT=8001
FRONTEND_PORT=8081

# CORS Settings
CORS_ALLOWED_ORIGINS=https://medcor.ai:8081,http://medcor.ai:8081,https://ec2-51-16-221-91.il-central-1.compute.amazonaws.com:8081

# Session Settings
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SESSION_COOKIE_SAMESITE=None
CSRF_COOKIE_SAMESITE=None

# Static Files
STATIC_URL=/static/
STATIC_ROOT=/var/www/medcor/staticfiles/
EOF

# Step 10: Install Node dependencies and build frontend
print_status "Installing Node.js dependencies..."
cd /var/www/medcor
npm install

print_status "Building frontend with custom port configuration..."
# Update Vite config for port 8081
cat > /var/www/medcor/vite.config.ts.temp << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8081,
    host: '0.0.0.0'
  },
  preview: {
    port: 8081,
    host: '0.0.0.0'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@assets': path.resolve(__dirname, './attached_assets'),
      '@components': path.resolve(__dirname, './client/src/components'),
      '@lib': path.resolve(__dirname, './client/src/lib'),
      '@shared': path.resolve(__dirname, './shared')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
EOF

# Backup original and use custom config
if [ -f "/var/www/medcor/vite.config.ts" ]; then
    mv /var/www/medcor/vite.config.ts /var/www/medcor/vite.config.ts.backup
fi
mv /var/www/medcor/vite.config.ts.temp /var/www/medcor/vite.config.ts

npm run build

# Step 11: Setup Django
print_status "Setting up Django..."
cd /var/www/medcor
source venv/bin/activate

# Update Django settings for custom ports
cat > /var/www/medcor/medcor_backend/settings_production.py << 'EOF'
from medcor_backend.settings import *
import os
from dotenv import load_dotenv

load_dotenv()

# Security Settings
DEBUG = False
ALLOWED_HOSTS = os.getenv('DJANGO_ALLOWED_HOSTS', '').split(',')

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# CORS Settings
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
CORS_ALLOW_CREDENTIALS = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = '/var/www/medcor/staticfiles/'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = '/var/www/medcor/media/'

# Security
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True
EOF

print_status "Collecting static files..."
DJANGO_SETTINGS_MODULE=medcor_backend.settings_production python medcor_backend/manage.py collectstatic --noinput

print_status "Running database migrations..."
DJANGO_SETTINGS_MODULE=medcor_backend.settings_production python medcor_backend/manage.py migrate

# Step 12: Create Gunicorn configuration for port 8001
print_status "Creating Gunicorn configuration for port 8001..."
cat > /var/www/medcor/gunicorn_config.py << 'EOF'
import multiprocessing

bind = "127.0.0.1:8001"
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

# Step 13: Create systemd service
print_status "Creating systemd service for backend..."
sudo tee /etc/systemd/system/medcor-backend.service > /dev/null << 'EOF'
[Unit]
Description=Medcor Hospital Backend (Port 8001)
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/var/www/medcor
Environment="PATH=/var/www/medcor/venv/bin"
Environment="DJANGO_SETTINGS_MODULE=medcor_backend.settings_production"
ExecStart=/var/www/medcor/venv/bin/gunicorn \
    --config /var/www/medcor/gunicorn_config.py \
    medcor_backend.wsgi:application

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Step 14: Create frontend service for port 8081
print_status "Creating frontend service..."
cat > /var/www/medcor/serve-frontend.py << 'EOF'
#!/usr/bin/env python3
import http.server
import socketserver
import os

os.chdir('/var/www/medcor/dist')

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        if self.path == '/' or not os.path.exists(self.translate_path(self.path)):
            self.path = '/index.html'
        return super().do_GET()

PORT = 8081
Handler = MyHTTPRequestHandler

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"Frontend serving at port {PORT}")
    httpd.serve_forever()
EOF

chmod +x /var/www/medcor/serve-frontend.py

sudo tee /etc/systemd/system/medcor-frontend.service > /dev/null << 'EOF'
[Unit]
Description=Medcor Hospital Frontend (Port 8081)
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/var/www/medcor
ExecStart=/usr/bin/python3 /var/www/medcor/serve-frontend.py

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Step 15: Configure Nginx as reverse proxy
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/medcor > /dev/null << 'EOF'
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Backend upstream (port 8001)
upstream medcor_backend {
    server 127.0.0.1:8001;
}

# Frontend upstream (port 8081)
upstream medcor_frontend {
    server 127.0.0.1:8081;
}

# Frontend server - Port 8081
server {
    listen 8081;
    server_name medcor.ai ec2-51-16-221-91.il-central-1.compute.amazonaws.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    location / {
        proxy_pass http://medcor_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    client_max_body_size 50M;
}

# Backend API server - Port 8001  
server {
    listen 8001;
    server_name medcor.ai ec2-51-16-221-91.il-central-1.compute.amazonaws.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Access-Control-Allow-Origin "https://medcor.ai:8081" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    add_header Access-Control-Allow-Credentials "true" always;
    
    # API endpoints
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://medcor_backend;
        proxy_set_header Host $host:$server_port;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Port $server_port;
        
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
    
    # Django admin
    location /admin/ {
        proxy_pass http://medcor_backend;
        proxy_set_header Host $host:$server_port;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Django static files
    location /static/ {
        alias /var/www/medcor/staticfiles/;
        expires 30d;
    }
    
    # Django media files
    location /media/ {
        alias /var/www/medcor/media/;
        expires 7d;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    client_max_body_size 50M;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/medcor /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Step 16: Start all services
print_status "Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable medcor-backend
sudo systemctl enable medcor-frontend
sudo systemctl start medcor-backend
sudo systemctl start medcor-frontend
sudo systemctl restart nginx

# Step 17: Configure firewall
print_status "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 8001/tcp
sudo ufw allow 8081/tcp
echo "y" | sudo ufw enable

# Step 18: Create test script
print_status "Creating test script..."
cat > /home/ubuntu/test-medcor.sh << 'EOF'
#!/bin/bash

echo "Testing Medcor deployment..."

# Test backend health
echo -n "Backend (8001): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health

echo ""

# Test frontend
echo -n "Frontend (8081): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/

echo ""

# Test from external
echo -n "External Backend: "
curl -s -o /dev/null -w "%{http_code}" http://ec2-51-16-221-91.il-central-1.compute.amazonaws.com:8001/health

echo ""

echo -n "External Frontend: "
curl -s -o /dev/null -w "%{http_code}" http://ec2-51-16-221-91.il-central-1.compute.amazonaws.com:8081/

echo ""

# Service status
echo "Service Status:"
sudo systemctl is-active medcor-backend
sudo systemctl is-active medcor-frontend
sudo systemctl is-active nginx
EOF

chmod +x /home/ubuntu/test-medcor.sh

# Step 19: Run tests
print_status "Running deployment tests..."
sleep 5
/home/ubuntu/test-medcor.sh

# Display final information
echo ""
print_status "Deployment completed!"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://ec2-51-16-221-91.il-central-1.compute.amazonaws.com:8081"
echo "   Backend API: http://ec2-51-16-221-91.il-central-1.compute.amazonaws.com:8001/api/"
echo "   Django Admin: http://ec2-51-16-221-91.il-central-1.compute.amazonaws.com:8001/admin/"
echo ""
echo "📝 Next steps:"
echo "1. Create Django superuser:"
echo "   cd /var/www/medcor && source venv/bin/activate"
echo "   DJANGO_SETTINGS_MODULE=medcor_backend.settings_production python medcor_backend/manage.py createsuperuser"
echo ""
echo "2. Configure DNS for medcor.ai to point to: 51.16.221.91"
echo ""
echo "📊 Monitor logs:"
echo "   Backend: sudo journalctl -u medcor-backend -f"
echo "   Frontend: sudo journalctl -u medcor-frontend -f"
echo "   Nginx: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "🔄 Restart services:"
echo "   sudo systemctl restart medcor-backend"
echo "   sudo systemctl restart medcor-frontend"
echo "   sudo systemctl restart nginx"