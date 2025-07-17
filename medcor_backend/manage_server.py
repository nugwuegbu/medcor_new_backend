#!/usr/bin/env python
"""
Django development server management script.
This script handles starting the Django development server.
"""
import os
import sys
import django
from django.core.management import execute_from_command_line
from django.conf import settings

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
    
    try:
        django.setup()
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    
    # Start the development server
    print("🚀 Starting Django development server...")
    print("📋 Available endpoints:")
    print("  - Authentication: /api/auth/")
    print("  - API: /api/")
    print("  - Admin: /admin/")
    print("  - Django backend running on: http://localhost:8000")
    print("  - Express frontend running on: http://localhost:5000")
    
    execute_from_command_line(['manage.py', 'runserver', '8000'])

if __name__ == '__main__':
    main()