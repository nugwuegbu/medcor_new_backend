#!/usr/bin/env python3
import os
import sys
import django
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
    
    try:
        print("=== Starting Django Admin Server ===")
        print("Setting up Django...")
        django.setup()
        print("✅ Django setup complete")
        
        from django.conf import settings
        print(f"DEBUG: {settings.DEBUG}")
        print(f"ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
        
        print("Starting Django development server on 0.0.0.0:8000...")
        sys.argv = ['manage.py', 'runserver', '0.0.0.0:8000', '--noreload']
        execute_from_command_line(sys.argv)
        
    except Exception as e:
        print(f"❌ Error starting Django: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)