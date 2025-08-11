#!/usr/bin/env python
"""
Script to enable Neon database endpoint or provide fallback
"""

import os
import sys
import psycopg2
from urllib.parse import urlparse
import time

def check_neon_connection():
    """Check if Neon database is accessible"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        return False
    
    try:
        # Parse the DATABASE_URL
        parsed = urlparse(database_url)
        
        # Try to connect
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path[1:],  # Remove leading /
            user=parsed.username,
            password=parsed.password,
            connect_timeout=5
        )
        conn.close()
        print("✅ Neon database is accessible")
        return True
    except psycopg2.OperationalError as e:
        if "endpoint has been disabled" in str(e):
            print("⚠️  Neon database endpoint is disabled")
            print("📝 To enable it:")
            print("   1. Go to https://console.neon.tech/")
            print("   2. Find your project and click on it")
            print("   3. Click 'Resume' or 'Enable' button")
            print("   4. Wait a few seconds for the database to start")
            return False
        else:
            print(f"❌ Database connection error: {e}")
            return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def create_fallback_config():
    """Create a fallback database configuration"""
    print("\n🔄 Creating fallback database configuration...")
    
    # Create a new settings file with SQLite fallback
    fallback_settings = """
# Fallback database configuration
import os
from pathlib import Path

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# SQLite fallback database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

print("⚠️  Using SQLite fallback database - Neon endpoint is disabled")
print("📝 To restore PostgreSQL, enable your Neon database at https://console.neon.tech/")
"""
    
    with open('medcor_backend/fallback_db.py', 'w') as f:
        f.write(fallback_settings)
    
    print("✅ Fallback configuration created")
    return True

def main():
    """Main function to check and handle Neon database"""
    
    print("🔍 Checking Neon database status...")
    
    # Check if Neon is accessible
    if check_neon_connection():
        # Database is working, no action needed
        sys.exit(0)
    else:
        # Create fallback configuration
        create_fallback_config()
        
        print("\n📌 Next steps:")
        print("1. Enable your Neon database at https://console.neon.tech/")
        print("2. Once enabled, restart the application")
        print("3. The system will automatically switch back to PostgreSQL")
        
        # Exit with error code to trigger fallback
        sys.exit(1)

if __name__ == "__main__":
    main()