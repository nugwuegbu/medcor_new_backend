#!/usr/bin/env python3
"""
Test URL building with different ALLOWED_HOSTS configurations
"""

import os
import sys
import django

# Add the project directory to Python path
sys.path.append('/home/nnamdi/pyth/medcor_backend2')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

from dentscape.dentscape_client import DentscapeClient
from django.conf import settings

def test_url_building():
    """Test URL building with different configurations"""
    
    print("🧪 Testing URL Building Method")
    print("=" * 50)
    
    # Test with current settings
    print(f"Current ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    print(f"Current DEBUG: {settings.DEBUG}")
    
    client = DentscapeClient()
    test_path = "/static/dentscape/smile_curve_annotated.jpg"
    
    # Test current configuration
    url = client._build_static_url(test_path)
    print(f"\nCurrent URL: {url}")
    
    # Test with production-like settings
    print(f"\n🔧 Testing with production settings:")
    
    # Simulate production environment
    original_debug = settings.DEBUG
    original_hosts = settings.ALLOWED_HOSTS
    
    # Set production-like settings
    settings.DEBUG = False
    settings.ALLOWED_HOSTS = ['api.medcor.ai', 'localhost', '127.0.0.1']
    
    # Test URL building
    url_prod = client._build_static_url(test_path)
    print(f"Production URL: {url_prod}")
    
    # Restore original settings
    settings.DEBUG = original_debug
    settings.ALLOWED_HOSTS = original_hosts
    
    print(f"\n✅ Expected result:")
    print(f"   Development: http://localhost:8000/static/dentscape/smile_curve_annotated.jpg")
    print(f"   Production:  https://api.medcor.ai/static/dentscape/smile_curve_annotated.jpg")

if __name__ == "__main__":
    test_url_building()




