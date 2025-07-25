#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
django.setup()

from tenants.models import User
from django_tenants.utils import schema_context
from django.contrib.auth.hashers import make_password

def reset_admin_password():
    with schema_context('public'):
        print('=== Resetting Admin Password ===')
        
        # Delete existing admin user and create fresh one
        User.objects.filter(email='admin@localhost').delete()
        print('Deleted existing admin user')
        
        # Create new admin user with proper password hashing
        admin_user = User.objects.create(
            email='admin@localhost',
            first_name='Admin',
            last_name='User',
            is_active=True,
            is_staff=True,
            is_superuser=True,
            password=make_password('password')  # Properly hash the password
        )
        print(f'Created new admin user: {admin_user.email}')
        
        # Also create a backup admin with different credentials
        backup_admin = User.objects.create(
            email='superadmin@medcor.ai',
            first_name='Super',
            last_name='Admin',
            is_active=True,
            is_staff=True,
            is_superuser=True,
            password=make_password('admin123')
        )
        print(f'Created backup admin user: {backup_admin.email}')
        
        # Test authentication
        from django.contrib.auth import authenticate
        
        # Test primary admin
        auth_result1 = authenticate(username='admin@localhost', password='password')
        print(f'Primary admin auth test: {"✅ Success" if auth_result1 else "❌ Failed"}')
        
        # Test backup admin
        auth_result2 = authenticate(username='superadmin@medcor.ai', password='admin123')
        print(f'Backup admin auth test: {"✅ Success" if auth_result2 else "❌ Failed"}')
        
        if auth_result1 and auth_result2:
            print('\n✅ Password encryption fixed successfully!')
            print('\n🌐 Django Admin Access Options:')
            print('   URL: https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/admin/')
            print()
            print('   Option 1:')
            print('   Email: admin@localhost')
            print('   Password: password')
            print()
            print('   Option 2:')
            print('   Email: superadmin@medcor.ai')
            print('   Password: admin123')
        else:
            print('\n❌ Authentication still failing - need further investigation')
        
        return auth_result1 or auth_result2

if __name__ == '__main__':
    reset_admin_password()