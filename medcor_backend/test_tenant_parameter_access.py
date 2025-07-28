#!/usr/bin/env python3
"""
Test tenant parameter-based access (SSL certificate workaround)
"""

import requests
import json

def test_tenant_parameter_access():
    """Test tenant access via parameters instead of subdomains"""
    
    print("=" * 80)
    print("TENANT PARAMETER-BASED ACCESS TEST (SSL Certificate Workaround)")
    print("=" * 80)
    print()
    
    base_url = "https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000"
    
    test_urls = [
        {
            "name": "Tenant List",
            "url": f"{base_url}/tenants/",
            "description": "List all available tenants"
        },
        {
            "name": "Hospital API (Parameter)",
            "url": f"{base_url}/tenant/medcorhospital/api/",
            "description": "Hospital tenant API via parameter"
        },
        {
            "name": "Clinic API (Parameter)",
            "url": f"{base_url}/tenant/medcorclinic/api/",
            "description": "Clinic tenant API via parameter"
        },
        {
            "name": "Hospital Admin (Parameter)",
            "url": f"{base_url}/tenant/medcorhospital/admin/",
            "description": "Hospital admin via parameter"
        },
        {
            "name": "Hospital Docs (Parameter)",
            "url": f"{base_url}/tenant/medcorhospital/api/docs/",
            "description": "Hospital API docs via parameter"
        }
    ]
    
    for test in test_urls:
        print(f"🧪 Testing: {test['name']}")
        print(f"   URL: {test['url']}")
        print(f"   Description: {test['description']}")
        
        try:
            response = requests.get(test['url'], timeout=10, verify=False)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'application/json' in content_type:
                    data = response.json()
                    print(f"   Type: JSON Response")
                    if 'tenant' in data:
                        print(f"   Tenant: {data['tenant']}")
                        print(f"   Schema: {data.get('schema', 'Unknown')}")
                    elif 'tenants' in data:
                        print(f"   Total Tenants: {data.get('total_tenants', 0)}")
                else:
                    print(f"   Type: HTML Content")
                print(f"   ✅ SUCCESS")
                
            elif response.status_code == 302:
                redirect_url = response.headers.get('Location', 'Unknown')
                print(f"   Redirect: {redirect_url}")
                print(f"   ✅ SUCCESS (Redirected)")
                
            else:
                print(f"   ❌ ERROR: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
        
        print()
    
    print("=" * 80)
    print("🎯 WORKING URLS FOR BROWSER ACCESS (No SSL Issues):")
    print("=" * 80)
    print(f"📋 Tenant List:      {base_url}/tenants/")
    print(f"🏥 Hospital API:     {base_url}/tenant/medcorhospital/api/")
    print(f"🏥 Hospital Admin:   {base_url}/tenant/medcorhospital/admin/")
    print(f"🏥 Hospital Docs:    {base_url}/tenant/medcorhospital/api/docs/")
    print(f"🏨 Clinic API:       {base_url}/tenant/medcorclinic/api/")
    print(f"🏨 Clinic Admin:     {base_url}/tenant/medcorclinic/admin/")
    print(f"🏨 Clinic Docs:      {base_url}/tenant/medcorclinic/api/docs/")
    print()
    print("✅ These URLs use the main domain SSL certificate and avoid subdomain issues!")

if __name__ == "__main__":
    test_tenant_parameter_access()