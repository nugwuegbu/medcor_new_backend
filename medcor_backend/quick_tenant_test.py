#!/usr/bin/env python3
"""
Quick test script to verify tenant subdomain functionality
"""

import requests
import urllib3

# Disable SSL warnings for development
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def test_tenant_urls():
    """Test key tenant URLs quickly"""
    
    urls_to_test = [
        ("Public Schema API", "https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/api/"),
        ("Hospital Schema API", "https://medcorhospital.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/api/"),
        ("Clinic Schema API", "https://medcorclinic.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/api/"),
        ("Hospital Admin", "https://medcorhospital.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/admin/"),
        ("Hospital API Docs", "https://medcorhospital.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/api/docs/"),
    ]
    
    print("Quick Tenant Subdomain Test Results:")
    print("=" * 60)
    
    for name, url in urls_to_test:
        try:
            response = requests.get(url, timeout=5, verify=False)
            status = "✅ WORKING" if response.status_code in [200, 302] else f"⚠️ {response.status_code}"
            print(f"{name:<25}: {status}")
            
            # For API endpoints, show first 100 chars of response
            if response.status_code == 200 and '/api/' in url and response.headers.get('content-type', '').startswith('application/json'):
                try:
                    json_response = response.json()
                    if 'tenant' in json_response:
                        print(f"                           Tenant: {json_response['tenant']}")
                    elif 'schema' in json_response:
                        print(f"                           Schema: {json_response['schema']}")
                except:
                    pass
                    
        except Exception as e:
            print(f"{name:<25}: ❌ ERROR - {str(e)[:50]}")
    
    print("\nKey URLs for Testing:")
    print("📊 Hospital API Docs:  https://medcorhospital.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/api/docs/")
    print("🛠️ Hospital Admin:     https://medcorhospital.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/admin/")
    print("📊 Clinic API Docs:    https://medcorclinic.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/api/docs/")
    print("🛠️ Clinic Admin:       https://medcorclinic.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/admin/")

if __name__ == "__main__":
    test_tenant_urls()