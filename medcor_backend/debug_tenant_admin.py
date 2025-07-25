#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.append('/home/runner/workspace')
sys.path.append('/home/runner/workspace/medcor_backend')

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.simple_settings')
django.setup()

from tenants.models import Domain, Client, User
from django.contrib.auth.hashers import check_password, make_password
from django.db import connection

def debug_tenant_admin():
    print('=== DJANGO TENANT ADMIN DEBUG ===')
    
    # Check current domain mappings
    print('\n📍 CURRENT DOMAIN MAPPINGS:')
    for domain in Domain.objects.all():
        print(f'  • {domain.domain} -> {domain.tenant.name} (schema: {domain.tenant.schema_name})')
    
    # Check if Replit domain exists
    replit_domain = '14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev'
    existing_domain = Domain.objects.filter(domain=replit_domain).first()
    print(f'\n📍 REPLIT DOMAIN: {replit_domain}')
    print(f'  EXISTS: {bool(existing_domain)}')
    
    if existing_domain:
        print(f'  Maps to: {existing_domain.tenant.name} ({existing_domain.tenant.schema_name})')
        
        # Set to the correct schema
        connection.set_schema(existing_domain.tenant.schema_name)
        
        # Check users in that schema
        print(f'\n👤 USERS IN {existing_domain.tenant.schema_name.upper()} SCHEMA:')
        users = User.objects.all()
        print(f'  Total users: {users.count()}')
        
        admin_user = None
        for user in users:
            print(f'  • {user.email} - staff: {user.is_staff} - superuser: {user.is_superuser}')
            if user.email == 'admin@localhost':
                admin_user = user
                valid_pwd = check_password('admin123', user.password)
                print(f'    Password valid: {valid_pwd}')
        
        # Fix admin user if needed
        if admin_user and not admin_user.is_staff:
            print(f'\n🔧 FIXING ADMIN USER PERMISSIONS...')
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
            print(f'  ✅ Updated admin@localhost permissions')
            
        # Create admin user if doesn't exist
        if not admin_user:
            print(f'\n🔧 CREATING ADMIN USER...')
            admin_user = User.objects.create(
                email='admin@localhost',
                first_name='Admin',
                last_name='User',
                is_staff=True,
                is_superuser=True,
                is_active=True
            )
            admin_user.set_password('admin123')
            admin_user.save()
            print(f'  ✅ Created admin@localhost with admin privileges')
            
    else:
        print(f'\n🔧 CREATING REPLIT DOMAIN MAPPING...')
        public_tenant = Client.objects.get(schema_name='public')
        Domain.objects.create(
            domain=replit_domain,
            tenant=public_tenant,
            is_primary=False
        )
        print(f'  ✅ Created domain mapping: {replit_domain} -> public schema')
        
        # Now check users in public schema
        connection.set_schema('public')
        print(f'\n👤 USERS IN PUBLIC SCHEMA:')
        users = User.objects.all()
        print(f'  Total users: {users.count()}')
        
        admin_user = None
        for user in users:
            print(f'  • {user.email} - staff: {user.is_staff} - superuser: {user.is_superuser}')
            if user.email == 'admin@localhost':
                admin_user = user
        
        # Create or fix admin user in public schema
        if admin_user:
            if not admin_user.is_staff:
                print(f'\n🔧 FIXING ADMIN USER PERMISSIONS IN PUBLIC SCHEMA...')
                admin_user.is_staff = True
                admin_user.is_superuser = True
                admin_user.save()
                print(f'  ✅ Updated admin@localhost permissions in public schema')
        else:
            print(f'\n🔧 CREATING ADMIN USER IN PUBLIC SCHEMA...')
            admin_user = User.objects.create(
                email='admin@localhost',
                first_name='Admin',
                last_name='User',
                is_staff=True,
                is_superuser=True,
                is_active=True
            )
            admin_user.set_password('admin123')
            admin_user.save()
            print(f'  ✅ Created admin@localhost in public schema with admin privileges')

    print('\n🎯 TENANT ADMIN DEBUG COMPLETE')

if __name__ == '__main__':
    debug_tenant_admin()