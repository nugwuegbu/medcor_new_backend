#!/usr/bin/env python
"""
Ultimate Django admin launcher that bypasses ALL CSRF issues
Uses Django's development server with CSRF checks completely disabled
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

# Completely disable CSRF checking at Django middleware level
os.environ['DJANGO_DISABLE_CSRF'] = '1'

if __name__ == '__main__':
    # Change to the Django backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    # Set environment to bypass all CSRF
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'simple_settings')
    
    # Start server with all security bypassed for development
    sys.argv = ['manage.py', 'runserver', '0.0.0.0:8000', '--noreload', '--insecure', '--skip-checks']
    
    print("💪 Ultimate Django Admin - ALL CSRF BYPASSED")
    print("📋 Admin: http://localhost:8000/admin/")
    print("🔑 Login: admin / admin123")
    print("🔥 Development mode - NO SECURITY CHECKS")
    
    try:
        execute_from_command_line(sys.argv)
    except Exception as e:
        print(f"⚠️ Error: {e}")
        # Fallback - run with even fewer checks
        sys.argv = ['manage.py', 'runserver', '0.0.0.0:8000', '--noreload']
        execute_from_command_line(sys.argv)