#!/usr/bin/env python3
"""
Complex Django Migration Fix Script
This script fixes complex migration dependency conflicts by cleaning the database
and rebuilding the migration state properly.
"""

import os
import sys
import django
from django.conf import settings
from django.db import connection, transaction

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

def fix_complex_migration_conflict():
    """Fix complex migration conflicts by cleaning and rebuilding migration state."""
    
    print("🔧 Fixing Complex Django Migration Conflict")
    print("=" * 50)
    
    with connection.cursor() as cursor:
        # Check current migration state
        print("📋 Current migration state:")
        cursor.execute("""
            SELECT app, name, applied 
            FROM django_migrations 
            WHERE app = 'core' 
            ORDER BY id;
        """)
        migrations = cursor.fetchall()
        
        for app, name, applied in migrations:
            print(f"  {app}.{name} - {'Applied' if applied else 'Not Applied'}")
        
        print("\n🔍 Identifying problematic migrations...")
        
        # Get all core migrations
        cursor.execute("""
            SELECT name FROM django_migrations 
            WHERE app = 'core' 
            ORDER BY id;
        """)
        all_migrations = [row[0] for row in cursor.fetchall()]
        
        # Identify the problematic range
        problematic_migrations = [
            '0005_make_specialization_nullable',
            '0006_fix_specialization_data', 
            '0007_merge_20250909_1526',
            '0008_fix_specialization_nullable',
            '0009_fix_specialization_final',
            '0010_replace_specialization_field',
            '0011_merge_20250911_1823'
        ]
        
        print(f"Found {len(problematic_migrations)} potentially problematic migrations")
        
        # Strategy: Remove all problematic migrations and rebuild
        print("\n🗑️ Removing all problematic migrations from database...")
        
        with transaction.atomic():
            for migration in problematic_migrations:
                cursor.execute("""
                    DELETE FROM django_migrations 
                    WHERE app = 'core' AND name = %s
                """, [migration])
                print(f"  Removed {migration}")
        
        # Check what's left
        print("\n📊 Remaining migrations:")
        cursor.execute("""
            SELECT app, name FROM django_migrations 
            WHERE app = 'core' 
            ORDER BY id;
        """)
        remaining = cursor.fetchall()
        
        for app, name in remaining:
            print(f"  {app}.{name}")
        
        print(f"\n✅ Removed {len(problematic_migrations)} problematic migrations")
        print("🎯 You can now run: python manage.py migrate core --fake-initial")

def alternative_fix():
    """Alternative approach: Reset all core migrations."""
    
    print("\n🔄 Alternative Fix: Reset all core migrations")
    print("=" * 45)
    
    with connection.cursor() as cursor:
        with transaction.atomic():
            # Remove ALL core migrations
            cursor.execute("DELETE FROM django_migrations WHERE app = 'core'")
            print("🗑️ Removed all core migrations from database")
            
            # Add back only the initial migration
            cursor.execute("""
                INSERT INTO django_migrations (app, name, applied) 
                VALUES ('core', '0001_initial', NOW())
            """)
            print("✅ Added initial migration back")
        
        print("🎯 You can now run: python manage.py migrate core --fake")

if __name__ == "__main__":
    try:
        print("Choose fix method:")
        print("1. Remove problematic migrations only")
        print("2. Reset all core migrations (more aggressive)")
        
        choice = input("Enter choice (1 or 2): ").strip()
        
        if choice == "1":
            fix_complex_migration_conflict()
        elif choice == "2":
            alternative_fix()
        else:
            print("Invalid choice. Running method 1...")
            fix_complex_migration_conflict()
            
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)