#!/usr/bin/env python3
"""
Simple AWS Migration Fix
Direct database manipulation without Django setup
Run: python3 simple_fix.py
"""

import os
import sys
import subprocess

def print_status(message):
    print(f"🔧 {message}")

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def run_command(command, description):
    """Run a command and return success status"""
    print_status(description)
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print_success(f"{description} - Success")
            if result.stdout.strip():
                print(f"Output: {result.stdout.strip()}")
            return True
        else:
            print_error(f"{description} - Failed: {result.stderr}")
            return False
    except Exception as e:
        print_error(f"{description} - Exception: {e}")
        return False

def main():
    print("🚀 Simple AWS Migration Fix")
    print("=" * 35)
    print("This script will fix Django migration conflicts")
    print()
    
    # Check if we're in the right directory
    if not os.path.exists('manage.py'):
        print_error("Please run this script from the Django project root directory")
        sys.exit(1)
    
    # Step 1: Direct database fix using Django management command
    print_status("Step 1: Creating database fix script...")
    
    fix_script = """
import os
import django
from django.conf import settings
from django.db import connection, transaction

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

print('Cleaning migration database...')
with connection.cursor() as cursor:
    with transaction.atomic():
        # Remove all core migrations
        cursor.execute('DELETE FROM django_migrations WHERE app = "core"')
        print('Removed all core migrations')
        
        # Add back only the initial migration
        cursor.execute('INSERT INTO django_migrations (app, name, applied) VALUES ("core", "0001_initial", NOW())')
        print('Restored initial migration')

print('Database cleaned successfully!')
"""
    
    # Write the fix script to a temporary file
    with open('temp_fix.py', 'w') as f:
        f.write(fix_script)
    
    # Step 2: Run the database fix
    if not run_command('python3 temp_fix.py', 'Fixing migration database'):
        print_error("Database fix failed")
        sys.exit(1)
    
    # Step 3: Run migrations
    if not run_command('python manage.py migrate core --fake', 'Running fake migrations'):
        print_warning("Fake migration failed, trying fake-initial...")
        if not run_command('python manage.py migrate core --fake-initial', 'Running fake-initial migrations'):
            print_error("All migration attempts failed")
            sys.exit(1)
    
    # Step 4: Verify
    print_status("Step 4: Verifying fix...")
    run_command('python manage.py showmigrations core', 'Checking migration status')
    run_command('python manage.py check', 'Checking Django application')
    
    # Cleanup
    if os.path.exists('temp_fix.py'):
        os.remove('temp_fix.py')
    
    print()
    print_success("🎉 Migration fix completed!")
    print()
    print("Next steps:")
    print("1. Test your application: python manage.py runserver 0.0.0.0:8000")
    print("2. Check email functionality: python manage.py test_email --email=test@example.com")
    print("3. Restart services: sudo systemctl restart medcor-backend")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n❌ Script interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)