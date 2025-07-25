from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import check_password
from django.db import connection
from tenants.models import Domain, Client, User

class Command(BaseCommand):
    help = 'Fix Django admin access for Replit domain'

    def handle(self, *args, **options):
        self.stdout.write('=== FIXING REPLIT DOMAIN ADMIN ACCESS ===')
        
        # Check current domain mappings
        self.stdout.write('\n📍 CURRENT DOMAIN MAPPINGS:')
        for domain in Domain.objects.all():
            self.stdout.write(f'  • {domain.domain} -> {domain.tenant.name} (schema: {domain.tenant.schema_name})')
        
        # Replit domain
        replit_domain = '14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev'
        existing_domain = Domain.objects.filter(domain=replit_domain).first()
        
        self.stdout.write(f'\n📍 REPLIT DOMAIN: {replit_domain}')
        self.stdout.write(f'  EXISTS: {bool(existing_domain)}')
        
        if not existing_domain:
            # Create domain mapping to public tenant
            self.stdout.write('\n🔧 CREATING REPLIT DOMAIN MAPPING...')
            public_tenant = Client.objects.get(schema_name='public')
            Domain.objects.create(
                domain=replit_domain,
                tenant=public_tenant,
                is_primary=False
            )
            self.stdout.write(f'  ✅ Created domain mapping: {replit_domain} -> public schema')
        else:
            self.stdout.write(f'  Maps to: {existing_domain.tenant.name} ({existing_domain.tenant.schema_name})')
        
        # Get the correct tenant (should be public)
        domain_obj = Domain.objects.filter(domain=replit_domain).first()
        if domain_obj:
            tenant = domain_obj.tenant
            
            # Switch to the correct schema
            connection.set_schema(tenant.schema_name)
            
            self.stdout.write(f'\n👤 CHECKING USERS IN {tenant.schema_name.upper()} SCHEMA:')
            users = User.objects.all()
            self.stdout.write(f'  Total users: {users.count()}')
            
            # Check for admin user
            admin_user = User.objects.filter(email='admin@localhost').first()
            
            if admin_user:
                self.stdout.write(f'  • Found admin@localhost')
                self.stdout.write(f'    is_staff: {admin_user.is_staff}')
                self.stdout.write(f'    is_superuser: {admin_user.is_superuser}')
                self.stdout.write(f'    is_active: {admin_user.is_active}')
                
                # Check password
                valid_pwd = check_password('admin123', admin_user.password)
                self.stdout.write(f'    password_valid: {valid_pwd}')
                
                # Fix permissions if needed
                if not admin_user.is_staff or not admin_user.is_superuser or not admin_user.is_active:
                    self.stdout.write('\n🔧 FIXING ADMIN USER PERMISSIONS...')
                    admin_user.is_staff = True
                    admin_user.is_superuser = True
                    admin_user.is_active = True
                    admin_user.save()
                    self.stdout.write('  ✅ Updated admin@localhost permissions')
                
                # Fix password if needed
                if not valid_pwd:
                    self.stdout.write('\n🔧 FIXING ADMIN PASSWORD...')
                    admin_user.set_password('admin123')
                    admin_user.save()
                    self.stdout.write('  ✅ Reset admin@localhost password')
                    
            else:
                # Create admin user
                self.stdout.write('\n🔧 CREATING ADMIN USER...')
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
                self.stdout.write('  ✅ Created admin@localhost with admin privileges')
        
        # Verify final state
        self.stdout.write('\n✅ VERIFICATION:')
        domain_obj = Domain.objects.filter(domain=replit_domain).first()
        if domain_obj:
            connection.set_schema(domain_obj.tenant.schema_name)
            admin_user = User.objects.filter(email='admin@localhost').first()
            if admin_user:
                valid_pwd = check_password('admin123', admin_user.password)
                self.stdout.write(f'  • admin@localhost exists: ✅')
                self.stdout.write(f'  • is_staff: {admin_user.is_staff} ✅' if admin_user.is_staff else f'  • is_staff: {admin_user.is_staff} ❌')
                self.stdout.write(f'  • is_superuser: {admin_user.is_superuser} ✅' if admin_user.is_superuser else f'  • is_superuser: {admin_user.is_superuser} ❌')
                self.stdout.write(f'  • password_valid: {valid_pwd} ✅' if valid_pwd else f'  • password_valid: {valid_pwd} ❌')
        
        self.stdout.write('\n🎯 REPLIT ADMIN FIX COMPLETE')
        self.stdout.write(f'Now try logging in at: https://{replit_domain}:8000/admin/')
        self.stdout.write('Username: admin@localhost')
        self.stdout.write('Password: admin123')