#!/usr/bin/env python
"""
Quick fix script for Django admin access issues on local development.
Run this from the medcor_backend directory:
    python fix_local_django_admin.py
"""

import os
import sys
import django

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')

# Setup Django
try:
    django.setup()
    print("✅ Django setup successful")
except Exception as e:
    print(f"❌ Django setup failed: {e}")
    print("\nTrying with simple settings...")
    os.environ['DJANGO_SETTINGS_MODULE'] = 'medcor_backend.simple_settings'
    try:
        django.setup()
        print("✅ Django setup successful with simple settings")
    except Exception as e2:
        print(f"❌ Failed with simple settings too: {e2}")
        sys.exit(1)

# Import Django models after setup
from django.contrib.auth import get_user_model
from django.db import connection

def check_database():
    """Check if database is accessible"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def fix_admin_user():
    """Create or fix the admin superuser"""
    User = get_user_model()
    
    # Check if admin user exists
    try:
        admin = User.objects.filter(username='admin').first()
        
        if admin:
            # Update existing admin user
            admin.is_superuser = True
            admin.is_staff = True
            admin.is_active = True
            admin.set_password('Admin123!')
            admin.save()
            print("✅ Admin user updated successfully")
            print("   Username: admin")
            print("   Password: Admin123!")
        else:
            # Create new admin user
            admin = User.objects.create_superuser(
                username='admin',
                email='admin@medcor.ai',
                password='Admin123!'
            )
            print("✅ Admin user created successfully")
            print("   Username: admin")
            print("   Password: Admin123!")
            
    except Exception as e:
        print(f"❌ Error creating/updating admin user: {e}")
        return False
    
    return True

def check_tenant_setup():
    """Check and setup tenant configuration if needed"""
    try:
        from tenants.models import Tenant, Domain
        
        # Check if public tenant exists
        public_tenant = Tenant.objects.filter(schema_name='public').first()
        
        if not public_tenant:
            print("Creating public tenant...")
            public_tenant = Tenant(
                schema_name='public',
                name='Public',
                paid_until='2099-12-31',
                on_trial=False
            )
            public_tenant.save()
            print("✅ Public tenant created")
        else:
            print("✅ Public tenant already exists")
        
        # Check if localhost domain exists
        localhost_domain = Domain.objects.filter(domain='localhost').first()
        
        if not localhost_domain:
            print("Creating localhost domain...")
            localhost_domain = Domain(
                domain='localhost',
                tenant=public_tenant,
                is_primary=True
            )
            localhost_domain.save()
            print("✅ Localhost domain created")
        else:
            print("✅ Localhost domain already exists")
            
        # Also add 127.0.0.1 domain
        local_ip_domain = Domain.objects.filter(domain='127.0.0.1').first()
        if not local_ip_domain:
            local_ip_domain = Domain(
                domain='127.0.0.1',
                tenant=public_tenant,
                is_primary=False
            )
            local_ip_domain.save()
            print("✅ 127.0.0.1 domain created")
            
    except ImportError:
        print("ℹ️  Tenant models not found - using simple settings without multi-tenancy")
        return True
    except Exception as e:
        print(f"⚠️  Tenant setup issue (non-critical): {e}")
        return True
    
    return True

def main():
    print("=" * 60)
    print("Django Admin Local Setup Fix")
    print("=" * 60)
    
    # Check database connection
    if not check_database():
        print("\n⚠️  Database connection failed. Make sure:")
        print("   1. PostgreSQL is running (if using PostgreSQL)")
        print("   2. Database credentials are correct in settings")
        print("   3. Or use SQLite for quick testing")
        print("\nYou can use SQLite by running:")
        print("   python manage.py migrate --settings=medcor_backend.simple_settings")
        return
    
    # Fix admin user
    if not fix_admin_user():
        print("\n❌ Failed to fix admin user")
        return
    
    # Setup tenant if needed
    check_tenant_setup()
    
    print("\n" + "=" * 60)
    print("✅ Setup Complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Run the server:")
    print("   python manage.py runserver 8000")
    print("\n2. Access Django admin at:")
    print("   http://localhost:8000/admin/")
    print("\n3. Login with:")
    print("   Username: admin")
    print("   Password: Admin123!")
    print("\n" + "=" * 60)
    
    # Additional tips
    print("\n💡 Tips:")
    print("- If you still can't access admin, try running migrations:")
    print("  python manage.py migrate")
    print("- For simpler setup without tenants, use:")
    print("  python manage.py runserver --settings=medcor_backend.simple_settings 8000")

if __name__ == '__main__':
    main()