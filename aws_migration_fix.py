#!/usr/bin/env python3
"""
AWS Migration Fix Script
Complete solution for Django migration conflicts on AWS
Run this script on your AWS server: python3 aws_migration_fix.py
"""

import os
import sys
import subprocess
import django
from django.conf import settings
from django.db import connection, transaction

def print_status(message):
    print(f"🔧 {message}")

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_warning(message):
    print(f"⚠️ {message}")

def setup_django():
    """Setup Django environment"""
    print_status("Setting up Django environment...")
    
    # Add current directory to Python path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if current_dir not in sys.path:
        sys.path.insert(0, current_dir)
    
    # Try different settings module paths
    settings_modules = [
        'medcor_backend2.settings',
        'settings',
        'medcor_backend2.settings.production'
    ]
    
    for settings_module in settings_modules:
        try:
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', settings_module)
            django.setup()
            print_success(f"Django environment ready with {settings_module}")
            return True
        except Exception as e:
            print(f"Failed with {settings_module}: {e}")
            continue
    
    print_error("Failed to setup Django with any settings module")
    return False

def check_current_state():
    """Check current migration state"""
    print_status("Checking current migration state...")
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT app, name, applied 
                FROM django_migrations 
                WHERE app = 'core' 
                ORDER BY id;
            """)
            migrations = cursor.fetchall()
            
            print(f"Found {len(migrations)} core migrations:")
            for app, name, applied in migrations:
                status = "Applied" if applied else "Not Applied"
                print(f"  {app}.{name} - {status}")
            
            return migrations
    except Exception as e:
        print_error(f"Failed to check migration state: {e}")
        return []

def fix_migration_conflicts():
    """Fix migration conflicts by cleaning database"""
    print_status("Fixing migration conflicts...")
    
    try:
        with connection.cursor() as cursor:
            with transaction.atomic():
                # Remove all core migrations
                print_status("Removing all core migrations from database...")
                cursor.execute("DELETE FROM django_migrations WHERE app = 'core'")
                print_success("All core migrations removed")
                
                # Add back only the initial migration
                print_status("Restoring initial migration...")
                cursor.execute("""
                    INSERT INTO django_migrations (app, name, applied) 
                    VALUES ('core', '0001_initial', NOW())
                """)
                print_success("Initial migration restored")
                
        return True
    except Exception as e:
        print_error(f"Failed to fix migration conflicts: {e}")
        return False

def run_migrations():
    """Run Django migrations"""
    print_status("Running Django migrations...")
    
    try:
        # Try fake migration first
        result = subprocess.run([
            sys.executable, 'manage.py', 'migrate', 'core', '--fake'
        ], capture_output=True, text=True, cwd=os.getcwd())
        
        if result.returncode == 0:
            print_success("Fake migration completed successfully")
            return True
        else:
            print_warning(f"Fake migration failed: {result.stderr}")
            
            # Try fake-initial
            print_status("Trying fake-initial migration...")
            result = subprocess.run([
                sys.executable, 'manage.py', 'migrate', 'core', '--fake-initial'
            ], capture_output=True, text=True, cwd=os.getcwd())
            
            if result.returncode == 0:
                print_success("Fake-initial migration completed successfully")
                return True
            else:
                print_error(f"Fake-initial migration failed: {result.stderr}")
                return False
                
    except Exception as e:
        print_error(f"Failed to run migrations: {e}")
        return False

def verify_fix():
    """Verify the fix worked"""
    print_status("Verifying fix...")
    
    try:
        # Check migration status
        result = subprocess.run([
            sys.executable, 'manage.py', 'showmigrations', 'core'
        ], capture_output=True, text=True, cwd=os.getcwd())
        
        if result.returncode == 0:
            print_success("Migration status check passed")
            print("Migration status:")
            print(result.stdout)
        else:
            print_warning(f"Migration status check failed: {result.stderr}")
        
        # Check Django application
        result = subprocess.run([
            sys.executable, 'manage.py', 'check'
        ], capture_output=True, text=True, cwd=os.getcwd())
        
        if result.returncode == 0:
            print_success("Django application check passed")
            return True
        else:
            print_warning(f"Django application check failed: {result.stderr}")
            return False
            
    except Exception as e:
        print_error(f"Failed to verify fix: {e}")
        return False

def main():
    """Main function"""
    print("🚀 AWS Migration Fix Script")
    print("=" * 40)
    print("This script will fix Django migration conflicts on AWS")
    print()
    
    # Check if we're in the right directory
    if not os.path.exists('manage.py'):
        print_error("Please run this script from the Django project root directory")
        print("Expected to find manage.py in current directory")
        sys.exit(1)
    
    # Setup Django
    if not setup_django():
        sys.exit(1)
    
    # Check current state
    migrations = check_current_state()
    
    if not migrations:
        print_warning("No migrations found or failed to check state")
    
    # Fix migration conflicts
    if not fix_migration_conflicts():
        print_error("Failed to fix migration conflicts")
        sys.exit(1)
    
    # Run migrations
    if not run_migrations():
        print_error("Failed to run migrations")
        sys.exit(1)
    
    # Verify fix
    if verify_fix():
        print_success("🎉 Migration fix completed successfully!")
        print()
        print("Next steps:")
        print("1. Test your application: python manage.py runserver 0.0.0.0:8000")
        print("2. Check email functionality: python manage.py test_email --email=test@example.com")
        print("3. Restart services: sudo systemctl restart medcor-backend")
    else:
        print_warning("⚠️ Migration fix completed with warnings")
        print("Please check the output above for any issues")
    
    print()
    print("Script completed!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n❌ Script interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)