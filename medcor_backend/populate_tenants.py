#!/usr/bin/env python
"""
Django script to populate tenants from JSON data
"""
import os
import sys
import django
import json
from django.contrib.auth.hashers import make_password

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
django.setup()

from tenants.models import User, Client, Domain

def populate_tenants():
    """Populate tenants from JSON data file"""
    
    # Load tenant data from JSON file
    json_file_path = os.path.join(os.path.dirname(__file__), 'tenants', 'data', 'tenants.json')
    
    try:
        with open(json_file_path, 'r') as f:
            tenant_data = json.load(f)
    except FileNotFoundError:
        print(f"❌ JSON file not found: {json_file_path}")
        return
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in file: {e}")
        return
    
    print(f"📋 Loading {len(tenant_data)} tenants from {json_file_path}")
    
    for tenant_info in tenant_data:
        try:
            # Create or get user (tenant owner)
            owner_data = tenant_info['owner']
            user, user_created = User.objects.get_or_create(
                username=owner_data['username'],
                defaults={
                    'email': owner_data['email'],
                    'password': make_password(owner_data['password']),
                    'first_name': 'Tenant',
                    'last_name': 'Owner',
                    'is_active': True,
                }
            )
            
            if user_created:
                print(f"✅ Created user: {user.username}")
            else:
                print(f"♻️  User already exists: {user.username}")
            
            # Create or get tenant (client)
            client, client_created = Client.objects.get_or_create(
                schema_name=tenant_info['schema_name'],
                defaults={
                    'name': tenant_info['name'],
                    'owner': user,
                }
            )
            
            if client_created:
                print(f"✅ Created tenant: {client.name} (schema: {client.schema_name})")
            else:
                print(f"♻️  Tenant already exists: {client.name}")
            
            # Create domain if subdomain is provided
            if tenant_info.get('subdomain'):
                domain_name = f"{tenant_info['subdomain']}.localhost"
                domain, domain_created = Domain.objects.get_or_create(
                    domain=domain_name,
                    defaults={
                        'tenant': client,
                        'is_primary': True,
                    }
                )
                
                if domain_created:
                    print(f"✅ Created domain: {domain.domain}")
                else:
                    print(f"♻️  Domain already exists: {domain.domain}")
            
            print(f"---")
            
        except Exception as e:
            print(f"❌ Error creating tenant {tenant_info.get('name', 'Unknown')}: {e}")
            continue
    
    # Print summary
    print(f"\n📊 Database Summary:")
    print(f"👥 Users: {User.objects.count()}")
    print(f"🏥 Tenants: {Client.objects.count()}")
    print(f"🌐 Domains: {Domain.objects.count()}")

if __name__ == '__main__':
    populate_tenants()