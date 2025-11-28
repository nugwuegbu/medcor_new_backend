#!/usr/bin/env python3
"""
Comprehensive test for all Dentscape endpoints with image URLs
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

def test_all_endpoints():
    """Test all Dentscape endpoints to verify image URLs work"""
    
    print("🧪 Testing All Dentscape Endpoints with Image URLs")
    print("=" * 60)
    
    # Initialize client
    client = DentscapeClient()
    
    # Use the proper test image
    test_image_path = "/home/nnamdi/pyth/medcor_backend2/static/dentscape/test_image.jpg"
    
    # Test all analysis endpoints
    analysis_tests = [
        ("Smile Curve Upper", client.analyze_smile_curve_upper),
        ("E-Line Analysis", client.analyze_e_line),
        ("Tooth Segmentation", client.analyze_tooth_segmentation),
        ("Width-Height Ratio Incisors", client.analyze_width_height_ratio_incisors),
        ("Incisal Plane", client.analyze_incisal_plane),
        ("Interdental Width Proportion", client.analyze_interdental_width_proportion),
    ]
    
    print("\n🔬 ANALYSIS ENDPOINTS:")
    for name, method in analysis_tests:
        print(f"\n📊 Testing: {name}")
        try:
            result = method(test_image_path, "test_user")
            
            if result.get('success', True):
                annotations_url = result.get('annotations_image_url')
                print(f"✅ SUCCESS")
                print(f"🖼️  Annotations URL: {annotations_url}")
                
                # Verify URL format
                if annotations_url and annotations_url.startswith('http'):
                    print(f"✅ Absolute URL format correct")
                else:
                    print(f"❌ URL format incorrect: {annotations_url}")
            else:
                print(f"❌ FAILED: {result.get('error')}")
                
        except Exception as e:
            print(f"❌ ERROR: {e}")
    
    # Test simulation endpoints
    simulation_tests = [
        ("Orthodontics", client.simulate_orthodontics),
        ("Veneer with Whitening", client.simulate_veneer_with_whitening),
        ("Tooth Whitening", client.simulate_tooth_whitening),
    ]
    
    print("\n🎭 SIMULATION ENDPOINTS:")
    for name, method in simulation_tests:
        print(f"\n🎨 Testing: {name}")
        try:
            result = method(test_image_path, "test_user")
            
            if result.get('success', True):
                before_url = result.get('before_image_url')
                after_url = result.get('after_image_url')
                print(f"✅ SUCCESS")
                print(f"📸 Before URL: {before_url}")
                print(f"📸 After URL: {after_url}")
                
                # Verify URL formats
                if before_url and before_url.startswith('http'):
                    print(f"✅ Before URL format correct")
                else:
                    print(f"❌ Before URL format incorrect: {before_url}")
                    
                if after_url and after_url.startswith('http'):
                    print(f"✅ After URL format correct")
                else:
                    print(f"❌ After URL format incorrect: {after_url}")
            else:
                print(f"❌ FAILED: {result.get('error')}")
                
        except Exception as e:
            print(f"❌ ERROR: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 SUMMARY:")
    print("- All endpoints should return absolute URLs")
    print("- URLs should start with 'http://' or 'https://'")
    print("- Static files should be accessible via HTTP")

if __name__ == "__main__":
    test_all_endpoints()




