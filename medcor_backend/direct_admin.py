#!/usr/bin/env python3
"""
Direct Django Admin Server - Bypasses django-tenants for direct admin access
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

# Set environment for direct admin access
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.simple_settings')

def main():
    """Run Django admin server directly"""
    print("🏥 Starting Direct Django Admin (Bypassing Tenants)")
    print("=" * 60)
    
    django.setup()
    
    # Test basic functionality
    from django.conf import settings
    print(f"✅ Settings: {settings.SETTINGS_MODULE}")
    print(f"✅ Debug: {settings.DEBUG}")
    print(f"✅ Database: {settings.DATABASES['default']['NAME']}")
    
    print("🌐 Direct Admin Access:")
    print("   URL: https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/admin/")
    print("   Login: admin@localhost / admin123")
    print("=" * 60)
    
    # Start server
    execute_from_command_line([
        'manage.py',
        'runserver',
        '0.0.0.0:8000',
        '--noreload',
        '--settings=medcor_backend.simple_settings'
    ])

if __name__ == '__main__':
    main()