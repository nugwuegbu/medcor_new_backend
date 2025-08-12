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
    # Check database availability
    if check_neon_database():
        # Use full Django with PostgreSQL
        os.environ['DJANGO_SETTINGS_MODULE'] = 'medcor_backend.settings'
        print("🎯 Using full Django settings with PostgreSQL")
        
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
    else:
        # Use simple fallback server
        print("📦 Using simple fallback API server")
        # Import and run the simple server
        from simple_django_server import main as simple_server_main
        simple_server_main()

if __name__ == '__main__':
    main()