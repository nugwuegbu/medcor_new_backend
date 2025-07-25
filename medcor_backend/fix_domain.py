#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
django.setup()

from tenants.models import Domain, Client
from django_tenants.utils import schema_context

def fix_replit_domain():
    with schema_context('public'):
        # Get or create the public tenant
        try:
            public_tenant = Client.objects.get(schema_name='public')
            print(f'Found public tenant: {public_tenant.name}')
        except Client.DoesNotExist:
            public_tenant = Client.objects.create(
                schema_name='public',
                name='Public',
                paid_until='2025-12-31',
                on_trial=False
            )
            print('Created public tenant')
        
        # Add the Replit domain to point to public schema
        replit_domain = '14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev'
        
        # Check if domain already exists
        existing_domain = Domain.objects.filter(domain=replit_domain).first()
        if existing_domain:
            print(f'Domain {replit_domain} already exists')
            existing_domain.tenant = public_tenant
            existing_domain.is_primary = True
            existing_domain.save()
            print('Updated domain to point to public schema')
        else:
            new_domain = Domain.objects.create(
                domain=replit_domain,
                tenant=public_tenant,
                is_primary=True
            )
            print(f'Created new domain: {replit_domain} -> public schema')
        
        # List all domains
        print('\nAll configured domains:')
        for domain in Domain.objects.all():
            print(f'- {domain.domain} -> {domain.tenant.schema_name} (primary: {domain.is_primary})')
        
        # Verify admin user
        from tenants.models import User
        admin_user = User.objects.filter(email='admin@localhost').first()
        if admin_user:
            print(f'\nAdmin user verified: {admin_user.email}')
            print(f'Staff: {admin_user.is_staff}, Superuser: {admin_user.is_superuser}')
            print('✅ Admin login should now work on Replit domain')
        else:
            print('\n❌ Admin user not found!')

if __name__ == '__main__':
    fix_replit_domain()