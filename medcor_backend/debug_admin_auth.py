#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
django.setup()

from django.conf import settings
from django.contrib.admin.forms import AdminAuthenticationForm
from django.http import HttpRequest
from django.test import RequestFactory
from tenants.models import User
from django_tenants.utils import schema_context

def debug_admin_auth():
    print('=== Django Admin Authentication Debug ===')
    
    # Check configuration
    print(f'AUTH_USER_MODEL: {settings.AUTH_USER_MODEL}')
    print(f'AUTHENTICATION_BACKENDS: {settings.AUTHENTICATION_BACKENDS}')
    
    with schema_context('public'):
        # Create a mock request similar to what Django admin receives
        factory = RequestFactory()
        request = factory.post('/admin/login/', {
            'username': 'admin@localhost',
            'password': 'password'
        })
        request.META['HTTP_HOST'] = '14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000'
        
        # Test the admin authentication form
        form = AdminAuthenticationForm(request, data={
            'username': 'admin@localhost',
            'password': 'password'
        })
        
        print(f'\nAdmin form validation: {"✅ Valid" if form.is_valid() else "❌ Invalid"}')
        
        if not form.is_valid():
            print(f'Form errors: {form.errors}')
            print(f'Non-field errors: {form.non_field_errors()}')
            
            # Check if user exists and has correct permissions
            try:
                user = User.objects.get(email='admin@localhost')
                print(f'\nUser found: {user.email}')
                print(f'  is_active: {user.is_active}')
                print(f'  is_staff: {user.is_staff}')
                print(f'  is_superuser: {user.is_superuser}')
                
                # Check password directly
                from django.contrib.auth.hashers import check_password
                pwd_check = check_password('password', user.password)
                print(f'  password_check: {pwd_check}')
                
                # Check user authentication
                from django.contrib.auth import authenticate
                auth_user = authenticate(username='admin@localhost', password='password')
                print(f'  authentication: {"✅ Success" if auth_user else "❌ Failed"}')
                
                if auth_user:
                    # Check if user has permission to access admin
                    can_access = auth_user.is_active and auth_user.is_staff
                    print(f'  admin_access: {"✅ Allowed" if can_access else "❌ Denied"}')
                    
            except User.DoesNotExist:
                print('\\n❌ User does not exist!')
        else:
            authenticated_user = form.get_user()
            print(f'✅ Form validation successful, user: {authenticated_user.email}')

if __name__ == '__main__':
    debug_admin_auth()