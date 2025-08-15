#!/bin/bash

echo "=== FINAL Django Static Files Fix ==="

# Step 1: Find and copy Django admin static files directly
echo "Step 1: Finding Django admin static files..."
cd /var/www/html/medcor_backend
source venv/bin/activate

# Find Django installation
DJANGO_PATH=$(python -c "import django; import os; print(os.path.dirname(django.__file__))")
echo "Django installed at: $DJANGO_PATH"

# Create static directory
echo "Step 2: Creating static directory..."
mkdir -p /var/www/html/medcor_backend/static_root

# Copy admin static files directly from Django
echo "Step 3: Copying admin static files..."
if [ -d "$DJANGO_PATH/contrib/admin/static/admin" ]; then
    cp -r "$DJANGO_PATH/contrib/admin/static/admin" /var/www/html/medcor_backend/static_root/
    echo "✓ Admin static files copied"
else
    echo "✗ Admin static files not found in Django installation"
fi

# Step 4: Update settings.py
echo "Step 4: Updating Django settings..."
python << 'PYTHON'
import os

# Read current settings
with open('medcor_backend/settings.py', 'r') as f:
    content = f.read()

# Remove old STATIC_ROOT lines
lines = content.split('\n')
new_lines = []
for line in lines:
    if 'STATIC_ROOT' not in line:
        new_lines.append(line)

content = '\n'.join(new_lines)

# Add new static configuration at the end
static_config = """
# Static files configuration (FIXED)
STATIC_URL = '/static/'
STATIC_ROOT = '/var/www/html/medcor_backend/static_root/'
"""

with open('medcor_backend/settings.py', 'w') as f:
    f.write(content + '\n' + static_config)

print("Settings updated")
PYTHON

# Step 5: Run collectstatic to gather all static files
echo "Step 5: Collecting all static files..."
python manage.py collectstatic --noinput --clear

# Step 6: Set permissions
echo "Step 6: Setting permissions..."
chown -R www-data:www-data /var/www/html/medcor_backend/static_root
chmod -R 755 /var/www/html/medcor_backend/static_root

# Step 7: Fix Nginx configuration
echo "Step 7: Creating correct Nginx configuration..."
cat > /tmp/nginx-static-fix.conf << 'NGINX'
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

    # Static files - MUST come first and use exact path
    location /static/ {
        alias /var/www/html/medcor_backend/static_root/;
        autoindex off;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /var/www/html/medcor_backend/media/;
        autoindex off;
        expires 7d;
    }

    # Django admin
    location /admin/ {
        proxy_pass http://unix:/var/www/html/medcor_backend/gunicorn.sock;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_redirect off;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://unix:/var/www/html/medcor_backend/gunicorn.sock;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_redirect off;
    }

    # Root
    location / {
        proxy_pass http://unix:/var/www/html/medcor_backend/gunicorn.sock;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_redirect off;
    }
}
NGINX

# Step 8: Apply Nginx configuration
echo "Step 8: Applying Nginx configuration..."
cp /tmp/nginx-static-fix.conf /etc/nginx/sites-enabled/test.medcor.conf
nginx -t
if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo "✓ Nginx reloaded"
else
    echo "✗ Nginx config test failed"
fi

# Step 9: Restart Gunicorn
echo "Step 9: Restarting Gunicorn..."
systemctl restart gunicorn

# Step 10: Verify
echo "Step 10: Verifying static files..."
if [ -f "/var/www/html/medcor_backend/static_root/admin/css/base.css" ]; then
    echo "✓ Admin CSS files exist"
    ls -la /var/www/html/medcor_backend/static_root/admin/css/ | head -3
else
    echo "✗ Admin CSS files not found"
fi

if [ -f "/var/www/html/medcor_backend/static_root/admin/js/theme.js" ]; then
    echo "✓ Admin JS files exist"
    ls -la /var/www/html/medcor_backend/static_root/admin/js/ | head -3
else
    echo "✗ Admin JS files not found"
fi

# Step 11: Test URLs
echo -e "\nStep 11: Testing static file URLs..."
echo "Testing CSS file:"
curl -I -s https://medcor.ai/static/admin/css/base.css | head -3
echo "Testing JS file:"
curl -I -s https://medcor.ai/static/admin/js/theme.js | head -3

echo -e "\n=== Fix Complete ==="
echo "Clear your browser cache and try: https://medcor.ai/admin/"
echo "Login with: admin@medcor.ai / Admin123!"