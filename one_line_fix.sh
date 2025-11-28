#!/bin/bash

# One-line fix for AWS migration issues
# Run: bash one_line_fix.sh

echo "🚀 One-Line AWS Migration Fix"
echo "============================="

# Check directory
if [ ! -f "manage.py" ]; then
    echo "❌ Please run from Django project root"
    exit 1
fi

# Activate venv if exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# The one-line fix
echo "🔧 Running one-line fix..."
python3 -c "
import os, sys, subprocess
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
import django
django.setup()
from django.db import connection, transaction
with connection.cursor() as cursor:
    with transaction.atomic():
        cursor.execute('DELETE FROM django_migrations WHERE app = \"core\"')
        cursor.execute('INSERT INTO django_migrations (app, name, applied) VALUES (\"core\", \"0001_initial\", NOW())')
print('Database fixed!')
" && python manage.py migrate core --fake && echo "✅ SUCCESS! Migration fix completed!"