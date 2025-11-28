#!/usr/bin/env python3
"""
Debug script to check Dentscape URL building on AWS
"""

import os
import sys
import django

# Add the project directory to Python path
sys.path.append('/path/to/your/project')  # Update this path

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

from dentscape.dentscape_client import DentscapeClient
from django.conf import settings

def debug_url_building():
    """Debug URL building configuration"""
    
    print("🔍 Debugging Dentscape URL Building")
    print("=" * 50)
    
    # Check environment variables
    print("1. Environment Variables:")
    print(f"   DENTSCAPE_BASE_URL: {os.getenv('DENTSCAPE_BASE_URL', 'NOT SET')}")
    print(f"   ALLOWED_HOSTS: {os.getenv('ALLOWED_HOSTS', 'NOT SET')}")
    print(f"   DEBUG: {os.getenv('DEBUG', 'NOT SET')}")
    
    # Check Django settings
    print(f"\n2. Django Settings:")
    print(f"   ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    print(f"   DEBUG: {settings.DEBUG}")
    print(f"   DENTSCAPE_BASE_URL: {getattr(settings, 'DENTSCAPE_BASE_URL', 'NOT SET')}")
    
    # Test URL building
    print(f"\n3. URL Building Test:")
    client = DentscapeClient()
    test_path = "/static/dentscape/smile_curve_annotated.jpg"
    
    url = client._build_static_url(test_path)
    print(f"   Generated URL: {url}")
    
    # Expected results
    print(f"\n4. Expected Results:")
    print(f"   Should be: https://api.medcor.ai/static/dentscape/smile_curve_annotated.jpg")
    print(f"   Current:   {url}")
    
    if "api.medcor.ai" in url:
        print(f"   ✅ SUCCESS: URL contains correct domain")
    else:
        print(f"   ❌ ISSUE: URL does not contain correct domain")

if __name__ == "__main__":
    debug_url_building()




