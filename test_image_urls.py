#!/usr/bin/env python3
"""
Test script to verify image URLs are working correctly
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

def test_image_urls():
    """Test that image URLs are generated correctly"""
    
    print("🧪 Testing Dentscape Image URL Generation")
    print("=" * 50)
    
    # Initialize client
    client = DentscapeClient()
    
    # Test URL building
    test_path = "/static/dentscape/smile_curve_annotated.jpg"
    absolute_url = client._build_static_url(test_path)
    
    print(f"📁 Static Path: {test_path}")
    print(f"🔗 Absolute URL: {absolute_url}")
    
    # Test if static files exist
    static_file_path = f"/home/nnamdi/pyth/medcor_backend2{test_path}"
    if os.path.exists(static_file_path):
        print(f"✅ Static file exists: {static_file_path}")
    else:
        print(f"❌ Static file missing: {static_file_path}")
    
    # Test mock response
    print("\n🔬 Testing Mock Response:")
    try:
        # Use the proper test image that meets requirements
        test_image_path = "/home/nnamdi/pyth/medcor_backend2/static/dentscape/test_image.jpg"
        
        # Test smile curve analysis
        result = client.analyze_smile_curve_upper(test_image_path, "test_user")
        
        print(f"📊 Analysis Result Keys: {list(result.keys())}")
        print(f"🖼️  Annotations URL: {result.get('annotations_image_url')}")
        
        if not result.get('success', True):
            print(f"❌ Analysis failed: {result.get('error')}")
            print(f"🔍 Validation details: {result.get('validation')}")
        else:
            print("✅ Analysis successful!")
        
    except Exception as e:
        print(f"❌ Mock response test failed: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Summary:")
    print("- Image URLs should now be absolute URLs")
    print("- Static files should be accessible via HTTP")
    print("- Mock responses should include working image URLs")

if __name__ == "__main__":
    test_image_urls()
