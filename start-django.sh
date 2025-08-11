#!/bin/bash
cd medcor_backend

# Check if Neon database is disabled by testing connection
echo "Checking database connection..."
python -c "
import os
import psycopg2
try:
    conn = psycopg2.connect(os.environ.get('DATABASE_URL', ''))
    conn.close()
    print('✅ Database connection successful')
    exit(0)
except Exception as e:
    if 'disabled' in str(e):
        print('⚠️ Neon database is disabled, using local SQLite')
        exit(1)
    else:
        print(f'❌ Database error: {e}')
        exit(1)
" 2>/dev/null

if [ $? -eq 0 ]; then
    # Use regular settings with Neon database
    python manage.py runserver 0.0.0.0:8000 --noreload
else
    # Use local settings with SQLite
    echo "Starting Django with local SQLite database..."
    export DJANGO_SETTINGS_MODULE=medcor_backend.settings_local
    python manage.py migrate --run-syncdb 2>/dev/null
    python manage.py runserver 0.0.0.0:8000 --noreload --settings=medcor_backend.settings_local
fi