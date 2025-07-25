#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
django.setup()

from tenants.models import User
from django_tenants.utils import schema_context
from django.contrib.auth.hashers import make_password, check_password

def simple_admin_reset():
    with schema_context('public'):
        print('=== Simple Admin Password Reset ===')
        
        # Try to get existing admin user
        try:
            admin_user = User.objects.get(email='admin@localhost')
            print(f'Found existing admin user: {admin_user.email}')
            
            # Update password with proper hashing
            admin_user.set_password('password')
            admin_user.is_active = True
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
            print('Updated admin user password and permissions')
            
        except User.DoesNotExist:
            # Create new admin user
            admin_user = User.objects.create_user(
                email='admin@localhost',
                password='password',
                first_name='Admin',
                last_name='User'
            )
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
            print('Created new admin user')
        
        # Verify the password hash
        print(f'Password hash starts with: {admin_user.password[:20]}...')
        
        # Test password verification
        password_valid = check_password('password', admin_user.password)
        print(f'Password verification: {"✅ Valid" if password_valid else "❌ Invalid"}')
        
        # Test Django authentication
        from django.contrib.auth import authenticate
        auth_result = authenticate(username='admin@localhost', password='password')
        print(f'Django authentication: {"✅ Success" if auth_result else "❌ Failed"}')
        
        if auth_result:
            print(f'User permissions check: {"✅ All good" if auth_result.is_staff and auth_result.is_superuser else "❌ Missing permissions"}')
        
        print('\n✅ Admin user ready:')
        print('   Email: admin@localhost')
        print('   Password: password')
        print('   URL: https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/admin/')

if __name__ == '__main__':
    simple_admin_reset()