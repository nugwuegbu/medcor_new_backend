#!/usr/bin/env python
"""
Quick admin interface launcher without CSRF issues
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    # Change to the Django backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    # Set the Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'simple_settings')
    
    # Override command line args to run the server
    sys.argv = ['manage.py', 'runserver', '0.0.0.0:8000', '--noreload', '--insecure']
    
    print("🔧 Starting Django Admin with CSRF fixes...")
    print("📋 Admin: http://localhost:8000/admin/")
    print("🔑 Login: admin / admin123")
    
    execute_from_command_line(sys.argv)