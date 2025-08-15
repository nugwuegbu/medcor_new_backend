#!/bin/bash

echo "=== Fixing Django Static Files Issue ==="

# Navigate to Django project
cd /var/www/html/medcor_backend

# Activate virtual environment
source venv/bin/activate

# Step 1: Check and update settings.py
echo "Step 1: Updating Django settings..."
cat > temp_settings.py << 'EOF'
import os
from pathlib import Path

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = '/var/www/html/medcor_backend/staticfiles/'

# Add staticfiles directories
STATICFILES_DIRS = []

# Ensure staticfiles app is enabled
STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
]
EOF

# Step 2: Create static directories
echo "Step 2: Creating static directories..."
mkdir -p /var/www/html/medcor_backend/staticfiles
mkdir -p /var/www/html/medcor_backend/media

# Step 3: Update settings to use correct STATIC_ROOT
echo "Step 3: Checking current settings..."
python << 'PYTHON'
import sys
sys.path.insert(0, '/var/www/html/medcor_backend')

# Try to import and update settings
try:
    with open('medcor_backend/settings.py', 'r') as f:
        content = f.read()
    
    # Check if STATIC_ROOT is set correctly
    if 'STATIC_ROOT' not in content:
        # Add STATIC_ROOT
        content += "\n\n# Static files configuration\nSTATIC_ROOT = '/var/www/html/medcor_backend/staticfiles/'\n"
        with open('medcor_backend/settings.py', 'w') as f:
            f.write(content)
        print("Added STATIC_ROOT to settings.py")
    else:
        # Update STATIC_ROOT
        import re
        content = re.sub(r"STATIC_ROOT\s*=\s*['\"].*?['\"]", "STATIC_ROOT = '/var/www/html/medcor_backend/staticfiles/'", content)
        with open('medcor_backend/settings.py', 'w') as f:
            f.write(content)
        print("Updated STATIC_ROOT in settings.py")
        
except Exception as e:
    print(f"Error updating settings: {e}")
PYTHON

# Step 4: Collect static files
echo "Step 4: Collecting static files..."
python manage.py collectstatic --noinput --clear --verbosity 2

# Step 5: Set permissions
echo "Step 5: Setting permissions..."
chown -R www-data:www-data /var/www/html/medcor_backend/staticfiles
chmod -R 755 /var/www/html/medcor_backend/staticfiles

# Step 6: Update Nginx configuration
echo "Step 6: Updating Nginx configuration..."
cat > /etc/nginx/sites-available/medcor-static-fix.conf << 'NGINX'
server {
    listen 80;
    server_name medcor.ai www.medcor.ai;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name medcor.ai www.medcor.ai;
    client_max_body_size 100M;

    ssl_certificate /etc/letsencrypt/live/medcor.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/medcor.ai/privkey.pem;

    # CRITICAL: Static files must be served directly by Nginx
    location /static/ {
        alias /var/www/html/medcor_backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # Ensure correct MIME types
        location ~ \.css$ {
            add_header Content-Type text/css;
        }
        location ~ \.js$ {
            add_header Content-Type application/javascript;
        }
    }

    location /media/ {
        alias /var/www/html/medcor_backend/media/;
        expires 7d;
    }

    # Django admin
    location /admin/ {
        proxy_pass http://unix:/var/www/html/medcor_backend/gunicorn.sock;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://unix:/var/www/html/medcor_backend/gunicorn.sock;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    # Root
    location / {
        proxy_pass http://unix:/var/www/html/medcor_backend/gunicorn.sock;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
NGINX

# Step 7: Test and apply Nginx config
echo "Step 7: Testing Nginx configuration..."
nginx -t
if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid"
    # Backup current config
    cp /etc/nginx/sites-enabled/test.medcor.conf /etc/nginx/sites-enabled/test.medcor.conf.bak
    # Apply new config
    cp /etc/nginx/sites-available/medcor-static-fix.conf /etc/nginx/sites-enabled/test.medcor.conf
    systemctl reload nginx
    echo "Nginx reloaded with new configuration"
else
    echo "Nginx configuration test failed"
fi

# Step 8: Restart services
echo "Step 8: Restarting services..."
systemctl restart gunicorn
systemctl reload nginx

# Step 9: Verify static files
echo "Step 9: Verifying static files..."
if [ -d "/var/www/html/medcor_backend/staticfiles/admin" ]; then
    echo "✓ Admin static files found at: /var/www/html/medcor_backend/staticfiles/admin"
    ls -la /var/www/html/medcor_backend/staticfiles/admin/ | head -5
else
    echo "✗ Admin static files not found"
fi

# Step 10: Test URLs
echo "Step 10: Testing static file URLs..."
curl -I https://medcor.ai/static/admin/css/base.css
curl -I https://medcor.ai/static/admin/js/theme.js

echo "=== Fix Complete ==="
echo "Please clear your browser cache and try accessing https://medcor.ai/admin/ again"