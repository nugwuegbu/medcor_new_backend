#!/bin/bash

# Fix Django Admin Static Files

echo "=== Fixing Django Admin Static Files ==="

# Navigate to the Django project
cd /var/www/html/medcor_backend

# Activate virtual environment
source venv/bin/activate

# Create static directory if it doesn't exist
echo "Creating static directory..."
mkdir -p /var/www/html/medcor_backend/static
mkdir -p /var/www/html/medcor_backend/media

# Set proper permissions
echo "Setting permissions..."
chown -R ubuntu:www-data /var/www/html/medcor_backend/static
chown -R ubuntu:www-data /var/www/html/medcor_backend/media
chmod -R 755 /var/www/html/medcor_backend/static
chmod -R 755 /var/www/html/medcor_backend/media

# Check Django settings
echo "Checking Django settings..."
python -c "
from medcor_backend.settings import STATIC_ROOT, STATIC_URL
print(f'STATIC_ROOT: {STATIC_ROOT}')
print(f'STATIC_URL: {STATIC_URL}')
"

# Run collectstatic
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

# Verify admin static files were created
echo "Verifying admin static files..."
if [ -d "/var/www/html/medcor_backend/static/admin" ]; then
    echo "✓ Admin static files created successfully"
    ls -la /var/www/html/medcor_backend/static/admin/
else
    echo "✗ Admin static files not found"
    echo "Checking installed apps..."
    python -c "
from medcor_backend.settings import INSTALLED_APPS
for app in INSTALLED_APPS:
    if 'admin' in app.lower():
        print(f'  - {app}')
"
fi

# Restart services
echo "Restarting services..."
systemctl restart gunicorn
systemctl reload nginx

echo "=== Fix Complete ==="
echo "Test the admin at: https://medcor.ai/admin/"