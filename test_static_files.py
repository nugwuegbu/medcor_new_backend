#!/usr/bin/env python3
"""
Test static file serving
"""

import requests
import os
import sys
import django

# Add the project directory to Python path
sys.path.append('/home/nnamdi/pyth/medcor_backend2')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

from django.conf import settings
from django.test import Client

def test_static_files():
    """Test if static files are being served correctly"""
    
    print("🧪 Testing Static File Serving")
    print("=" * 40)
    
    # Test with Django test client
    client = Client()
    
    # Test URLs
    test_urls = [
        "/static/dentscape/smile_curve_annotated.jpg",
        "/static/dentscape/e_line_annotated.jpg",
        "/static/dentscape/before_orthodontics.jpg",
        "/static/dentscape/after_orthodontics.jpg",
    ]
    
    for url in test_urls:
        print(f"\n🔍 Testing: {url}")
        
        try:
            response = client.get(url)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ SUCCESS - File accessible")
                print(f"Content-Type: {response.get('Content-Type', 'Unknown')}")
                print(f"Content-Length: {len(response.content)} bytes")
            else:
                print(f"❌ FAILED - Status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ ERROR: {e}")
    
    # Test with requests (simulating external access)
    print(f"\n🌐 Testing External Access:")
    base_url = "http://localhost:8000"
    
    for url in test_urls[:2]:  # Test first 2 URLs
        full_url = f"{base_url}{url}"
        print(f"\n🔍 Testing: {full_url}")
        
        try:
            response = requests.get(full_url, timeout=5)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ SUCCESS - File accessible via HTTP")
            else:
                print(f"❌ FAILED - Status: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print("⚠️  Django server not running - start with: python manage.py runserver")
        except Exception as e:
            print(f"❌ ERROR: {e}")
    
    print(f"\n📁 Static Files Location:")
    print(f"STATIC_ROOT: {settings.STATIC_ROOT}")
    print(f"STATIC_URL: {settings.STATIC_URL}")
    print(f"DEBUG: {settings.DEBUG}")
    
    # Check if files exist in staticfiles
    static_files_dir = os.path.join(settings.STATIC_ROOT, "dentscape")
    if os.path.exists(static_files_dir):
        files = os.listdir(static_files_dir)
        print(f"\n📂 Files in staticfiles/dentscape/: {len(files)} files")
        for file in files[:5]:  # Show first 5 files
            print(f"  - {file}")
        if len(files) > 5:
            print(f"  ... and {len(files) - 5} more files")
    else:
        print(f"\n❌ Directory not found: {static_files_dir}")

if __name__ == "__main__":
    test_static_files()




