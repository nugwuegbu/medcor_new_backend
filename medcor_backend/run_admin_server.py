#!/usr/bin/env python
"""
Django admin server launcher for MedCor backend
Runs the complete Django admin interface on port 8000
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    # Change to the Django backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    # Set the Django settings module to our simplified admin settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'simple_settings')
    
    # Override command line args to run the server
    sys.argv = ['manage.py', 'runserver', '0.0.0.0:8000', '--noreload']
    
    print("🏥 Starting MedCor Django Admin Backend on port 8000...")
    print("📋 Admin Interface: http://localhost:8000/admin/")
    print("🔑 Login: admin / admin123")
    print("✅ Full Django functionality deployed")
    
    execute_from_command_line(sys.argv)