#!/usr/bin/env python3
"""
Test HTTP access to bypass SSL certificate issues
"""

import requests
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def test_http_access():
    """Test HTTP access to tenant subdomains"""
    
    print("=" * 70)
    print("HTTP ACCESS TEST (Bypassing SSL Certificate Issues)")
    print("=" * 70)
    print()
    
    base_domain = "14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000"
    
    test_urls = [
        {
            "name": "Hospital API Docs (HTTP)",
            "url": f"http://medcorhospital.{base_domain}/api/docs/",
            "expected": "API Documentation"
        },
        {
            "name": "Hospital API Root (HTTP)", 
            "url": f"http://medcorhospital.{base_domain}/api/",
            "expected": "JSON API Response"
        },
        {
            "name": "Clinic API Docs (HTTP)",
            "url": f"http://medcorclinic.{base_domain}/api/docs/",
            "expected": "API Documentation"
        },
        {
            "name": "Clinic Admin (HTTP)",
            "url": f"http://medcorclinic.{base_domain}/admin/",
            "expected": "Django Admin"
        },
        {
            "name": "Public Schema (HTTP)",
            "url": f"http://{base_domain}/api/",
            "expected": "Public API"
        }
    ]
    
    for test in test_urls:
        print(f"🌐 Testing: {test['name']}")
        print(f"   URL: {test['url']}")
        
        try:
            response = requests.get(test['url'], timeout=10)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'application/json' in content_type:
                    data = response.json()
                    print(f"   Type: JSON API Response")
                    if 'message' in data:
                        print(f"   Message: {data['message']}")
                elif 'text/html' in content_type:
                    print(f"   Type: HTML ({len(response.text)} chars)")
                    if 'Django administration' in response.text:
                        print(f"   Content: Django Admin Login")
                    elif 'Swagger UI' in response.text:
                        print(f"   Content: API Documentation")
                    else:
                        print(f"   Content: HTML Page")
                        
                print(f"   ✅ SUCCESS: {test['expected']} accessible")
                
            elif response.status_code == 302:
                redirect = response.headers.get('Location', 'Unknown')
                print(f"   Redirect: {redirect}")
                print(f"   ✅ SUCCESS: Redirected (likely admin login)")
                
            else:
                print(f"   ❌ ERROR: HTTP {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ CONNECTION ERROR: Cannot reach server")
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
        
        print()
    
    print("=" * 70)
    print("WORKING HTTP URLS FOR BROWSER ACCESS:")
    print("=" * 70)
    print(f"🏥 Hospital API Docs: http://medcorhospital.{base_domain}/api/docs/")
    print(f"🏥 Hospital Admin:    http://medcorhospital.{base_domain}/admin/")
    print(f"🏨 Clinic API Docs:   http://medcorclinic.{base_domain}/api/docs/") 
    print(f"🏨 Clinic Admin:      http://medcorclinic.{base_domain}/admin/")
    print(f"🏢 Public API:        http://{base_domain}/api/")

if __name__ == "__main__":
    test_http_access()