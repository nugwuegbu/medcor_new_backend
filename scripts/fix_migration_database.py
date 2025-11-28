#!/usr/bin/env python3
"""
Django Migration Fix Script
This script directly manipulates the database to fix migration conflicts.
Run this on your AWS server.
"""

import os
import sys
import django
from django.conf import settings
from django.db import connection

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

def fix_migration_conflict():
    """Fix the migration conflict by updating the database directly."""
    
    print("🔧 Fixing Django Migration Conflict")
    print("=" * 40)
    
    with connection.cursor() as cursor:
        # Check current migration state
        print("📋 Current migration state:")
        cursor.execute("SELECT app, name FROM django_migrations WHERE app = 'core' ORDER BY id;")
        migrations = cursor.fetchall()
        
        for app, name in migrations:
            print(f"  {app}.{name}")
        
        print("\n🔍 Checking for conflicting migrations...")
        
        # Check if the problematic migrations exist
        cursor.execute("""
            SELECT name FROM django_migrations 
            WHERE app = 'core' AND name IN (
                '0005_make_specialization_nullable',
                '0006_fix_specialization_data',
                '0005_convert_specialization_to_foreignkey'
            )
            ORDER BY id;
        """)
        
        existing_migrations = [row[0] for row in cursor.fetchall()]
        print(f"Found migrations: {existing_migrations}")
        
        # Fix the conflict by removing the problematic migration
        if '0006_fix_specialization_data' in existing_migrations:
            print("\n🗑️ Removing conflicting migration: 0006_fix_specialization_data")
            cursor.execute("""
                DELETE FROM django_migrations 
                WHERE app = 'core' AND name = '0006_fix_specialization_data'
            """)
            print("✅ Removed 0006_fix_specialization_data")
        
        # Also remove the dependency if it exists
        if '0005_make_specialization_nullable' in existing_migrations:
            print("🗑️ Removing dependency migration: 0005_make_specialization_nullable")
            cursor.execute("""
                DELETE FROM django_migrations 
                WHERE app = 'core' AND name = '0005_make_specialization_nullable'
            """)
            print("✅ Removed 0005_make_specialization_nullable")
        
        # Check final state
        print("\n📊 Final migration state:")
        cursor.execute("SELECT app, name FROM django_migrations WHERE app = 'core' ORDER BY id;")
        migrations = cursor.fetchall()
        
        for app, name in migrations:
            print(f"  {app}.{name}")
        
        print("\n✅ Migration conflict resolved!")
        print("You can now run: python manage.py migrate core")

if __name__ == "__main__":
    try:
        fix_migration_conflict()
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)