import json
import os
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.db import transaction
from tenants.models import User, Client, Domain


class Command(BaseCommand):
    help = 'Populate database with tenants and users from tenants.json'

    def handle(self, *args, **options):
        # Get the path to tenants.json
        tenants_json_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'data',
            'tenants.json'
        )
        
        if not os.path.exists(tenants_json_path):
            self.stdout.write(
                self.style.ERROR(f'tenants.json not found at {tenants_json_path}')
            )
            return

        # Load tenant data
        with open(tenants_json_path, 'r') as f:
            tenants_data = json.load(f)

        with transaction.atomic():
            for tenant_data in tenants_data:
                self.stdout.write(f"Processing tenant: {tenant_data['name']}")
                
                # Create or get tenant (Client)
                client, created = Client.objects.get_or_create(
                    schema_name=tenant_data['schema_name'],
                    defaults={
                        'name': tenant_data['name'],
                        'description': f"Multi-tenant organization for {tenant_data['name']}",
                        'created_on_domain': tenant_data.get('subdomain', ''),
                    }
                )
                
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Created tenant: {client.name}')
                    )
                else:
                    self.stdout.write(f'✅ Tenant already exists: {client.name}')

                # Create domain if subdomain exists
                if tenant_data.get('subdomain'):
                    domain_name = f"{tenant_data['subdomain']}.localhost"
                    domain, domain_created = Domain.objects.get_or_create(
                        domain=domain_name,
                        defaults={
                            'tenant': client,
                            'is_primary': True,
                        }
                    )
                    
                    if domain_created:
                        self.stdout.write(
                            self.style.SUCCESS(f'✅ Created domain: {domain_name}')
                        )

                # Create owner user
                owner_data = tenant_data['owner']
                
                # Prepare user data with defaults for missing fields
                user_data = {
                    'email': owner_data['email'],
                    'first_name': owner_data.get('first_name', 'Admin'),
                    'last_name': owner_data.get('last_name', 'User'),
                    'is_staff': owner_data.get('is_staff', True),
                    'is_superuser': owner_data.get('is_superuser', tenant_data['schema_name'] == 'public'),
                    'is_active': owner_data.get('is_active', True),
                }
                
                # Create or get user
                user, user_created = User.objects.get_or_create(
                    email=owner_data['email'],
                    defaults=user_data
                )
                
                # Set password properly (handles encryption automatically)
                if user_created or not user.has_usable_password():
                    user.set_password(owner_data['password'])
                    user.save()
                    self.stdout.write(f'✅ Password set for user: {user.email}')
                
                if user_created:
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Created user: {user.email}')
                    )
                    
                    # Add user to tenant
                    user.tenants.add(client)
                    self.stdout.write(f'✅ Added user to tenant: {client.name}')
                else:
                    self.stdout.write(f'✅ User already exists: {user.email}')
                    # Ensure user is associated with tenant
                    if not user.tenants.filter(pk=client.pk).exists():
                        user.tenants.add(client)
                        self.stdout.write(f'✅ Associated existing user with tenant: {client.name}')

        self.stdout.write(
            self.style.SUCCESS('🎉 Database population completed successfully!')
        )
        
        # Print summary
        total_tenants = Client.objects.count()
        total_users = User.objects.count()
        total_domains = Domain.objects.count()
        
        self.stdout.write('\n📊 Summary:')
        self.stdout.write(f'  - Tenants: {total_tenants}')
        self.stdout.write(f'  - Users: {total_users}')
        self.stdout.write(f'  - Domains: {total_domains}')