# AWS EC2 Deployment Guide for Medcor Hospital Application

## Prerequisites & Required Information

### From You:
1. **AWS EC2 .pem file** - For SSH access
2. **EC2 Username** - Usually `ubuntu` for Ubuntu or `ec2-user` for Amazon Linux
3. **Database Credentials**:
   - PostgreSQL host/endpoint
   - Database name
   - Database username
   - Database password
   - Port (usually 5432)

### EC2 Instance Requirements:
- **Minimum**: t2.medium (2 vCPU, 4GB RAM)
- **Recommended**: t3.large (2 vCPU, 8GB RAM)
- **OS**: Ubuntu 22.04 LTS
- **Storage**: 30GB minimum
- **Security Groups**: Open ports 80, 443, 22, 8000 (temporarily for testing)

## Step 1: Connect to EC2 Instance

```bash
# Set permissions for .pem file
chmod 400 your-key.pem

# Connect to EC2
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

## Step 2: Update System & Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11 and pip
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install build tools
sudo apt install -y build-essential python3.11-dev

# Install PostgreSQL client
sudo apt install -y postgresql-client

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

## Step 3: Create Application Directory Structure

```bash
# Create directories
sudo mkdir -p /var/www/medcor
sudo mkdir -p /var/www/medcor/backend
sudo mkdir -p /var/www/medcor/frontend
sudo mkdir -p /var/log/medcor

# Set permissions
sudo chown -R ubuntu:ubuntu /var/www/medcor
sudo chown -R ubuntu:ubuntu /var/log/medcor
```

## Step 4: Transfer Application Files

From your local machine:
```bash
# Create deployment package
tar -czf medcor-deploy.tar.gz \
  client/ \
  server/ \
  shared/ \
  medcor_backend/ \
  package.json \
  package-lock.json \
  pyproject.toml \
  uv.lock \
  tsconfig.json \
  vite.config.ts \
  tailwind.config.ts \
  drizzle.config.ts \
  postcss.config.js \
  components.json

# Transfer to EC2
scp -i your-key.pem medcor-deploy.tar.gz ubuntu@your-ec2-public-ip:/home/ubuntu/

# Connect to EC2 and extract
ssh -i your-key.pem ubuntu@your-ec2-public-ip
cd /var/www/medcor
tar -xzf /home/ubuntu/medcor-deploy.tar.gz
```

## Step 5: Setup Python Virtual Environment & Backend

```bash
cd /var/www/medcor

# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install gunicorn
pip install django djangorestframework django-cors-headers
pip install psycopg2-binary python-dotenv pyjwt bcrypt
pip install drf-spectacular pillow requests

# Additional Django packages
pip install dj-database-url django-tenants
```

## Step 6: Setup Frontend Build

```bash
cd /var/www/medcor

# Install Node dependencies
npm install

# Build frontend for production
npm run build

# The build output will be in dist/ directory
```

## Step 7: Configure Environment Variables

Create environment file:
```bash
sudo nano /var/www/medcor/.env
```

Add the following (replace with your actual values):
```env
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

# AWS Settings (if using S3)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_S3_REGION_NAME=us-east-1
```

## Step 8: Configure Gunicorn

Create Gunicorn configuration:
```bash
sudo nano /var/www/medcor/gunicorn_config.py
```

Add:
```python
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
```

## Step 9: Create Systemd Service for Gunicorn

```bash
sudo nano /etc/systemd/system/medcor.service
```

Add:
```ini
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
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable medcor
sudo systemctl start medcor
sudo systemctl status medcor
```

## Step 10: Configure Nginx

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/medcor
```

Add:
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Upstream for Django backend
upstream medcor_backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name your-domain.com your-ec2-public-ip;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Frontend static files
    root /var/www/medcor/dist;
    index index.html;
    
    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
    
    # API endpoints (Django backend)
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://medcor_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for long-running requests
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
    
    # Django admin
    location /admin/ {
        proxy_pass http://medcor_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Django static files
    location /static/ {
        alias /var/www/medcor/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Django media files
    location /media/ {
        alias /var/www/medcor/media/;
        expires 7d;
        add_header Cache-Control "public";
    }
    
    # WebSocket support for real-time features
    location /ws/ {
        proxy_pass http://medcor_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Swagger API documentation
    location /api/schema/ {
        proxy_pass http://medcor_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # File upload size limit
    client_max_body_size 50M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/json application/xml+rss;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/medcor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 11: Setup Django Static Files & Database

```bash
cd /var/www/medcor
source venv/bin/activate

# Collect static files
python medcor_backend/manage.py collectstatic --noinput

# Run database migrations
python medcor_backend/manage.py migrate

# Create superuser
python medcor_backend/manage.py createsuperuser
```

## Step 12: Configure Firewall

```bash
# Setup UFW firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Step 13: Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

## Step 14: Setup Monitoring & Logs

Create log rotation:
```bash
sudo nano /etc/logrotate.d/medcor
```

Add:
```
/var/log/medcor/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 640 ubuntu ubuntu
    sharedscripts
    postrotate
        systemctl reload medcor
    endscript
}
```

## Step 15: Performance Optimization

### Enable Nginx caching:
```bash
sudo nano /etc/nginx/nginx.conf
```

Add in http block:
```nginx
# Cache settings
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=medcor_cache:10m 
                 max_size=1g inactive=60m use_temp_path=off;
```

### Configure system limits:
```bash
sudo nano /etc/security/limits.conf
```

Add:
```
ubuntu soft nofile 65536
ubuntu hard nofile 65536
```

## Deployment Checklist

- [ ] EC2 instance launched with proper security groups
- [ ] System updated and dependencies installed
- [ ] Application files transferred
- [ ] Python virtual environment created
- [ ] Frontend built successfully
- [ ] Environment variables configured
- [ ] Database connected and migrated
- [ ] Gunicorn service running
- [ ] Nginx configured and running
- [ ] SSL certificate installed (for production)
- [ ] Firewall configured
- [ ] Monitoring and logs setup
- [ ] Application accessible via browser

## Testing Commands

```bash
# Check Gunicorn status
sudo systemctl status medcor

# Check Nginx status
sudo systemctl status nginx

# View Gunicorn logs
sudo tail -f /var/log/medcor/gunicorn_error.log

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test database connection
python -c "import psycopg2; conn = psycopg2.connect('your-database-url'); print('Connected!')"

# Check application health
curl http://localhost/health
```

## Troubleshooting

### If Gunicorn fails to start:
```bash
# Check logs
sudo journalctl -u medcor -n 50

# Test Gunicorn directly
cd /var/www/medcor
source venv/bin/activate
gunicorn --bind 127.0.0.1:8000 medcor_backend.wsgi:application
```

### If Nginx returns 502 Bad Gateway:
- Check if Gunicorn is running
- Verify upstream configuration
- Check firewall settings

### If static files don't load:
```bash
# Re-collect static files
python medcor_backend/manage.py collectstatic --noinput

# Check permissions
ls -la /var/www/medcor/staticfiles/
```

## Maintenance Commands

```bash
# Restart application
sudo systemctl restart medcor
sudo systemctl restart nginx

# Update application code
cd /var/www/medcor
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
npm install
npm run build
python medcor_backend/manage.py migrate
python medcor_backend/manage.py collectstatic --noinput
sudo systemctl restart medcor

# View logs
sudo tail -f /var/log/medcor/gunicorn_access.log
sudo tail -f /var/log/nginx/access.log

# Monitor resources
htop
df -h
free -m
```

## Security Best Practices

1. **Keep system updated**: `sudo apt update && sudo apt upgrade`
2. **Use strong passwords** for database and Django admin
3. **Enable automatic security updates**: `sudo dpkg-reconfigure unattended-upgrades`
4. **Regular backups** of database and media files
5. **Monitor logs** for suspicious activity
6. **Use AWS Security Groups** to restrict access
7. **Enable AWS CloudWatch** for monitoring

## Support Information

For deployment assistance, ensure you have:
- EC2 instance public IP
- Database connection string
- Error logs from Gunicorn and Nginx
- Browser developer console errors