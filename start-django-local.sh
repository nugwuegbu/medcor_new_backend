#!/bin/bash
# Temporary script to start Django with local SQLite database

cd medcor_backend

# Export settings module to use local configuration
export DJANGO_SETTINGS_MODULE=medcor_backend.settings_local

echo "============================================"
echo "🚀 Starting Django with Local SQLite Database"
echo "============================================"

# First, run migrations to create database tables
echo "Running database migrations..."
python manage.py migrate --run-syncdb --noinput 2>&1 | grep -E "(Applied|No migrations|Operations|Running)" || true

# Create superuser if not exists
echo "Creating admin user..."
python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings_local')
import django
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@medcor.ai', 'admin123')
    print('✅ Admin user created: admin / admin123')
else:
    print('ℹ️ Admin user already exists')
" 2>&1 || echo "Note: User creation skipped"

# Start Django server
echo "Starting Django server on port 8000..."
python manage.py runserver 0.0.0.0:8000 --noreload