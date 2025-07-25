#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
django.setup()

from django.contrib.auth import authenticate
from tenants.models import User
from django_tenants.utils import schema_context

print('=== Testing Updated Admin Credentials ===')

with schema_context('public'):
    # Test the updated admin user
    auth_result = authenticate(username='admin@localhost', password='admin123')
    
    if auth_result:
        print('✅ Authentication successful!')
        print(f'User: {auth_result.email}')
        print(f'Staff: {auth_result.is_staff}')
        print(f'Superuser: {auth_result.is_superuser}')
        print(f'Active: {auth_result.is_active}')
        
        # Test admin permissions
        has_admin_access = auth_result.is_active and auth_result.is_staff
        print(f'Admin access: {"✅ Granted" if has_admin_access else "❌ Denied"}')
        
    else:
        print('❌ Authentication failed')
        
        # Check if user exists
        try:
            user = User.objects.get(email='admin@localhost')
            print(f'User exists but auth failed:')
            print(f'  Active: {user.is_active}')
            print(f'  Staff: {user.is_staff}')
            print(f'  Superuser: {user.is_superuser}')
        except User.DoesNotExist:
            print('User does not exist')

print()
print('🌐 Try logging in with:')
print('   URL: https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/admin/')
print('   Email: admin@localhost')
print('   Password: admin123')