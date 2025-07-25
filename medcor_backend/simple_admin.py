#!/usr/bin/env python3
"""
Simple Django Admin Server - Direct execution without complex middleware
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')

def run_admin():
    """Run Django admin with simplified configuration"""
    
    # Setup Django
    django.setup()
    
    print("🏥 MedCor Django Admin Server Starting...")
    print("=" * 60)
    
    # Test basic functionality
    from django.conf import settings
    from django.contrib import admin
    
    print(f"✅ Django Version: {django.get_version()}")
    print(f"✅ Debug Mode: {settings.DEBUG}")
    print(f"✅ Allowed Hosts: {settings.ALLOWED_HOSTS}")
    print(f"✅ Admin Site: {admin.site}")
    
    # Test admin route
    from django.urls import reverse
    try:
        admin_url = reverse('admin:index')
        print(f"✅ Admin URL: {admin_url}")
    except Exception as e:
        print(f"❌ Admin URL error: {e}")
    
    print("=" * 60)
    print("🌐 Access URL: https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/admin/")
    print("🔑 Login: admin@localhost / admin123")
    print("=" * 60)
    
    # Start Django server
    try:
        # Run server with minimal options
        execute_from_command_line([
            'manage.py',
            'runserver', 
            '0.0.0.0:8000',
            '--noreload'
        ])
    except KeyboardInterrupt:
        print("\n🛑 Django server stopped")
    except Exception as e:
        print(f"❌ Django server error: {e}")

if __name__ == '__main__':
    run_admin()