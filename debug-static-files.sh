#!/bin/bash

echo "=== Debugging Django Static Files Issue ==="

# Step 1: Check where static files actually are
echo -e "\n1. Checking static file locations:"
echo "Looking for staticfiles directory:"
find /var/www/html/medcor_backend -type d -name "staticfiles" 2>/dev/null
echo "Looking for static directory:"
find /var/www/html/medcor_backend -type d -name "static" 2>/dev/null
echo "Looking for admin static files:"
find /var/www/html/medcor_backend -type d -name "admin" -path "*/static/*" 2>/dev/null

# Step 2: Check Django settings
echo -e "\n2. Checking Django settings:"
cd /var/www/html/medcor_backend
source venv/bin/activate
python -c "
import sys
sys.path.insert(0, '/var/www/html/medcor_backend')
from medcor_backend.settings import *
print('STATIC_URL:', STATIC_URL)
print('STATIC_ROOT:', STATIC_ROOT if 'STATIC_ROOT' in dir() else 'NOT SET')
print('BASE_DIR:', BASE_DIR)
print('DEBUG:', DEBUG)
"

# Step 3: Find where Django admin static files are installed
echo -e "\n3. Finding Django admin static files location:"
python -c "
import django
import os
print('Django version:', django.__version__)
django_path = os.path.dirname(django.__file__)
admin_static = os.path.join(django_path, 'contrib/admin/static/admin')
print('Django admin static path:', admin_static)
print('Admin static exists:', os.path.exists(admin_static))
if os.path.exists(admin_static):
    print('Admin CSS files:', os.listdir(os.path.join(admin_static, 'css'))[:5])
"

# Step 4: Check current Nginx configuration
echo -e "\n4. Current Nginx static configuration:"
grep -A 5 "location /static" /etc/nginx/sites-enabled/test.medcor.conf

# Step 5: Test if Gunicorn is handling static requests (it shouldn't)
echo -e "\n5. Testing static file request handling:"
curl -I http://localhost:8000/static/admin/css/base.css 2>/dev/null | head -5

echo -e "\n=== Diagnosis Complete ==="