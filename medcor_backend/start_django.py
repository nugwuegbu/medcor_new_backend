#!/usr/bin/env python
"""
Django startup script for MedCor backend
Intelligently handles database connection and fallback
"""

import os
import sys
import psycopg2
from urllib.parse import urlparse

def check_neon_database():
    """Check if Neon database is accessible"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        return False
    
    try:
        parsed = urlparse(database_url)
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path[1:],
            user=parsed.username,
            password=parsed.password,
            connect_timeout=3
        )
        conn.close()
        print("✅ Neon database is accessible")
        return True
    except psycopg2.OperationalError as e:
        if "endpoint has been disabled" in str(e):
            print("⚠️  Neon database endpoint is disabled")
            print("📝 To enable: visit https://console.neon.tech/")
        else:
            print(f"❌ Database connection error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def main():
    """Main startup function"""
    # Always try to use full Django first, regardless of database check
    # This allows Django to handle database connections internally
    try:
        # Use local settings for development without multi-tenancy
        os.environ['DJANGO_SETTINGS_MODULE'] = 'medcor_backend.settings_local'
        print("🎯 Using local Django settings (without multi-tenancy)")
        
        # Import Django after setting the correct settings module
        import django
        from django.core.management import execute_from_command_line
        
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
        
        # Start the Django development server
        print("🚀 Starting Django development server on port 8000...")
        execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000', '--noreload'])
    except Exception as e:
        # Only fall back if Django completely fails to start
        print(f"❌ Django startup failed: {e}")
        print("📦 Using simple fallback API server")
        # Import and run the simple server
        from simple_django_server import main as simple_server_main
        simple_server_main()

if __name__ == '__main__':
    main()