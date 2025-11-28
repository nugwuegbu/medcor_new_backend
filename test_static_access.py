#!/usr/bin/env python3
"""
Simple test to verify static files are accessible
"""

import requests
import time

def test_static_file_access():
    """Test if static files are accessible via HTTP"""
    
    print("🧪 Testing Static File Access via HTTP")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    test_urls = [
        "/static/dentscape/smile_curve_annotated.jpg",
        "/static/dentscape/e_line_annotated.jpg",
        "/static/dentscape/before_orthodontics.jpg",
        "/static/dentscape/after_orthodontics.jpg",
    ]
    
    print("🔍 Testing static file URLs...")
    print("Note: Make sure Django server is running with: python manage.py runserver")
    print()
    
    for url in test_urls:
        full_url = f"{base_url}{url}"
        print(f"Testing: {full_url}")
        
        try:
            response = requests.get(full_url, timeout=10)
            print(f"  Status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"  ✅ SUCCESS - File accessible")
                print(f"  Content-Type: {response.headers.get('Content-Type', 'Unknown')}")
                print(f"  Content-Length: {len(response.content)} bytes")
            elif response.status_code == 404:
                print(f"  ❌ 404 Not Found - File not accessible")
            else:
                print(f"  ⚠️  Unexpected status: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"  ❌ Connection Error - Django server not running")
            print(f"     Start server with: python manage.py runserver")
        except requests.exceptions.Timeout:
            print(f"  ⏰ Timeout - Server not responding")
        except Exception as e:
            print(f"  ❌ Error: {e}")
        
        print()
    
    print("=" * 50)
    print("📋 Summary:")
    print("- If you see ✅ SUCCESS, static files are working correctly")
    print("- If you see ❌ 404 Not Found, check static files configuration")
    print("- If you see ❌ Connection Error, start Django server first")

if __name__ == "__main__":
    test_static_file_access()




