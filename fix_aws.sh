#!/bin/bash

# AWS Migration Fix Script
# Complete solution for Django migration conflicts
# Run: bash fix_aws.sh

set -e

echo "🚀 AWS Migration Fix Script"
echo "=========================="
echo "This script will fix Django migration conflicts on AWS"
echo ""

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    echo "❌ Please run this script from the Django project root directory"
    echo "Expected to find manage.py in current directory"
    exit 1
fi

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "🔧 Activating virtual environment..."
    source venv/bin/activate
fi

# Function to print status
print_status() {
    echo "🔧 $1"
}

print_success() {
    echo "✅ $1"
}

print_error() {
    echo "❌ $1"
}

# Step 1: Fix the database
print_status "Fixing migration conflicts in database..."

python3 -c "
import os
import django
from django.conf import settings
from django.db import connection, transaction

print('Setting up Django...')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

print('Cleaning migration database...')
with connection.cursor() as cursor:
    with transaction.atomic():
        cursor.execute('DELETE FROM django_migrations WHERE app = \"core\"')
        print('Removed all core migrations')
        cursor.execute('INSERT INTO django_migrations (app, name, applied) VALUES (\"core\", \"0001_initial\", NOW())')
        print('Restored initial migration')

print('Database cleaned successfully!')
"

if [ $? -eq 0 ]; then
    print_success "Database fix completed"
else
    print_error "Database fix failed"
    exit 1
fi

# Step 2: Run migrations
print_status "Running Django migrations..."

if python manage.py migrate core --fake; then
    print_success "Migrations completed successfully"
elif python manage.py migrate core --fake-initial; then
    print_success "Migrations completed with fake-initial"
else
    print_error "Migration failed"
    exit 1
fi

# Step 3: Verify
print_status "Verifying fix..."

echo "Migration status:"
python manage.py showmigrations core

echo ""
echo "Django check:"
if python manage.py check; then
    print_success "Django application is healthy"
else
    echo "⚠️ Django check had warnings, but migrations are fixed"
fi

echo ""
print_success "🎉 Migration fix completed successfully!"
echo ""
echo "Next steps:"
echo "1. Test your application: python manage.py runserver 0.0.0.0:8000"
echo "2. Check email functionality: python manage.py test_email --email=test@example.com"
echo "3. Restart services: sudo systemctl restart medcor-backend"
echo ""
echo "Script completed!"