#!/usr/bin/env python
"""
Django startup script for MedCor backend
Handles database migrations and server startup
"""

import os
import sys
import django
from django.core.management import execute_from_command_line

def main():
    """Main startup function"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
    
    # Setup Django
    django.setup()
    
    # Apply migrations
    print("📊 Applying database migrations...")
    try:
        execute_from_command_line(['manage.py', 'migrate', '--noinput'])
        print("✅ Database migrations completed")
    except Exception as e:
        print(f"⚠️  Migration warning: {e}")
        print("Continuing with server startup...")
    
    # Create public schema if it doesn't exist
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("CREATE SCHEMA IF NOT EXISTS public")
        print("✅ Public schema ensured")
    except Exception as e:
        print(f"⚠️  Schema warning: {e}")
    
    # Start the development server
    print("🚀 Starting Django development server on port 8000...")
    execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000', '--noreload'])

if __name__ == '__main__':
    main()