#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
django.setup()

from tenants.models import User
from django_tenants.utils import schema_context
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate

def final_admin_fix():
    with schema_context('public'):
        print('=== Final Admin Fix - Complete Reset ===')
        
        # Delete ALL existing admin users to start fresh
        User.objects.filter(email__in=['admin@localhost', 'superadmin@medcor.ai']).delete()
        print('Deleted all existing admin users')
        
        # Create completely fresh admin user with manual password hash
        admin_password = make_password('admin123')  # Change to admin123 for clarity
        
        admin_user = User(
            email='admin@localhost',
            first_name='Super',
            last_name='Admin',
            is_active=True,
            is_staff=True,
            is_superuser=True,
            password=admin_password
        )
        admin_user.save()
        print(f'Created fresh admin user: {admin_user.email}')
        print(f'New password: admin123')
        
        # Also create a backup with different email format
        backup_user = User(
            email='superadmin@medcor.ai',
            first_name='Backup',
            last_name='Admin',
            is_active=True,
            is_staff=True,
            is_superuser=True,
            password=make_password('password123')
        )
        backup_user.save()
        print(f'Created backup admin: {backup_user.email}')
        
        # Test both users
        print('\n=== Testing Authentication ===')
        
        # Test primary admin
        auth1 = authenticate(username='admin@localhost', password='admin123')
        print(f'Primary admin (admin@localhost / admin123): {"✅ Success" if auth1 else "❌ Failed"}')
        
        # Test backup admin
        auth2 = authenticate(username='superadmin@medcor.ai', password='password123')
        print(f'Backup admin (superadmin@medcor.ai / password123): {"✅ Success" if auth2 else "❌ Failed"}')
        
        if auth1 or auth2:
            print('\n✅ Admin authentication working!')
            print('\n🌐 Try these credentials:')
            print('   URL: https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/admin/')
            print()
            print('   Option 1:')
            print('   Email: admin@localhost')
            print('   Password: admin123')
            print()
            print('   Option 2:')
            print('   Email: superadmin@medcor.ai')
            print('   Password: password123')
        else:
            print('\n❌ Authentication still failing')
            
        return auth1 or auth2

if __name__ == '__main__':
    final_admin_fix()