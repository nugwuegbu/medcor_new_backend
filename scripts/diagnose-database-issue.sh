#!/bin/bash

# Quick Database Issue Diagnosis
# Run this on the production server to diagnose the PostgreSQL connection issue

echo "🔍 Quick Database Issue Diagnosis"
echo "================================="

# Check if we're on the production server
if [ ! -d "/var/www/html/medcor_backend2" ]; then
    echo "❌ This script should be run on the production server"
    echo "   Expected directory: /var/www/html/medcor_backend2"
    exit 1
fi

cd /var/www/html/medcor_backend2

echo "📋 Environment Check:"
echo "   Working Directory: $(pwd)"
echo "   User: $(whoami)"
echo "   Date: $(date)"
echo

# 1. Check PostgreSQL service
echo "1️⃣ PostgreSQL Service:"
if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is NOT running"
    echo "   Run: sudo systemctl start postgresql"
fi
echo

# 2. Check PostgreSQL port
echo "2️⃣ PostgreSQL Port (5432):"
if ss -tlnp | grep :5432 >/dev/null 2>&1; then
    echo "✅ PostgreSQL is listening on port 5432"
    ss -tlnp | grep :5432
else
    echo "❌ PostgreSQL is NOT listening on port 5432"
fi
echo

# 3. Check .env file
echo "3️⃣ Environment Configuration:"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "   Database settings:"
    grep -E "DATABASE_|DB_" .env | head -5
else
    echo "❌ .env file missing"
    if [ -f "env.prod" ]; then
        echo "   env.prod exists - copying to .env"
        cp env.prod .env
    else
        echo "   No env.prod file found"
    fi
fi
echo

# 4. Check Django settings
echo "4️⃣ Django Database Settings:"
source venv/bin/activate
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()
from django.conf import settings
print(f'   Database Engine: {settings.DATABASES[\"default\"][\"ENGINE\"]}')
print(f'   Database Name: {settings.DATABASES[\"default\"][\"NAME\"]}')
print(f'   Database Host: {settings.DATABASES[\"default\"][\"HOST\"]}')
print(f'   Database Port: {settings.DATABASES[\"default\"][\"PORT\"]}')
print(f'   Database User: {settings.DATABASES[\"default\"][\"USER\"]}')
"
echo

# 5. Test database connection
echo "5️⃣ Database Connection Test:"
python manage.py check --database default 2>&1 | head -10
echo

# 6. Check recent logs
echo "6️⃣ Recent Error Logs:"
echo "   Gunicorn logs:"
sudo journalctl -u gunicorn --no-pager -l | tail -3
echo
echo "   System logs:"
sudo journalctl --no-pager -l | grep -i postgres | tail -3
echo

echo "🎯 Quick Diagnosis Complete!"
echo "============================"
echo "If PostgreSQL is not running, run:"
echo "  sudo systemctl start postgresql"
echo
echo "If .env file is missing, run:"
echo "  cp env.prod .env"
echo
echo "For complete fix, run:"
echo "  ./scripts/fix-postgres-connection.sh"