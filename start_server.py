#!/usr/bin/env python
"""
Start the MedCor Backend 2 Django server on port 8002.
This avoids conflicts with medcor_backend running on port 8000.
"""

import os
import sys
import subprocess

def main():
    """Start the Django development server on port 8002."""
    
    print("=" * 60)
    print("🏥 MedCor Backend 2 - Django Server")
    print("=" * 60)
    print("📝 Port Configuration:")
    print("   - medcor_backend:  port 8000")
    print("   - medcor_backend2: port 8002 (THIS SERVER)")
    print("=" * 60)
    
    # Change to the medcor_backend2 directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Run migrations first
    print("\n🔄 Running database migrations...")
    subprocess.run([sys.executable, "manage.py", "makemigrations"], check=False)
    subprocess.run([sys.executable, "manage.py", "migrate"], check=False)
    
    # Start the server on port 8002
    print("\n🚀 Starting Django server on port 8002...")
    print("📊 API Documentation: http://localhost:8002/api/docs/")
    print("🔐 Admin Panel: http://localhost:8002/admin/")
    print("=" * 60)
    
    # Run the server
    subprocess.run([sys.executable, "manage.py", "runserver", "0.0.0.0:8002"])

if __name__ == "__main__":
    main()