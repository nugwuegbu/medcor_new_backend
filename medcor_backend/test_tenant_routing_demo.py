#!/usr/bin/env python3
"""
Comprehensive tenant routing demonstration with working examples
"""

import requests
import json

def test_tenant_routing():
    """Test tenant routing with various configurations"""
    
    print("=" * 80)
    print("TENANT SUBDOMAIN ROUTING DEMONSTRATION")
    print("=" * 80)
    print()
    
    # Test configurations
    base_port = "8000"
    local_base = f"localhost:{base_port}"
    replit_base = "14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000"
    
    test_cases = [
        {
            "name": "Public Schema (Local)",
            "url": f"http://{local_base}/api/",
            "host_header": None,
            "expected_schema": "public"
        },
        {
            "name": "Hospital Schema (Local with Host Header)",
            "url": f"http://{local_base}/api/",
            "host_header": f"medcorhospital.{replit_base}",
            "expected_schema": "medcorhospital"
        },
        {
            "name": "Clinic Schema (Local with Host Header)",
            "url": f"http://{local_base}/api/",
            "host_header": f"medcorclinic.{replit_base}",
            "expected_schema": "medcorclinic"
        },
        {
            "name": "Hospital Admin (Local with Host Header)",
            "url": f"http://{local_base}/admin/",
            "host_header": f"medcorhospital.{replit_base}",
            "expected_schema": "medcorhospital"
        },
    ]
    
    for test in test_cases:
        print(f"🧪 Testing: {test['name']}")
        print(f"   URL: {test['url']}")
        if test['host_header']:
            print(f"   Host: {test['host_header']}")
        
        headers = {}
        if test['host_header']:
            headers['Host'] = test['host_header']
        
        try:
            response = requests.get(test['url'], headers=headers, timeout=10)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                if response.headers.get('content-type', '').startswith('application/json'):
                    try:
                        data = response.json()
                        if 'schema' in data:
                            schema = data['schema']
                            tenant = data.get('tenant', 'Unknown')
                            expected = test['expected_schema']
                            status = "✅ CORRECT" if schema == expected else f"❌ WRONG (got {schema})"
                            print(f"   Schema: {schema} ({status})")
                            print(f"   Tenant: {tenant}")
                        else:
                            print(f"   Response: {json.dumps(data, indent=2)[:200]}...")
                    except json.JSONDecodeError:
                        print(f"   Response: {response.text[:100]}...")
                else:
                    print(f"   Response: HTML content ({len(response.text)} chars)")
            elif response.status_code == 302:
                print(f"   Redirect: {response.headers.get('Location', 'Unknown')}")
            else:
                print(f"   Error: {response.text[:100]}...")
                
        except Exception as e:
            print(f"   ❌ Connection Error: {str(e)}")
        
        print()
    
    print("=" * 80)
    print("EXTERNAL TENANT SUBDOMAIN ACCESS")
    print("=" * 80)
    print()
    
    # Test external access (Replit URLs)
    external_tests = [
        f"https://{replit_base}/api/",
        f"https://medcorhospital.{replit_base}/api/",
        f"https://medcorclinic.{replit_base}/api/"
    ]
    
    for url in external_tests:
        print(f"🌐 Testing External: {url}")
        try:
            response = requests.get(url, timeout=5, verify=False)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200 and 'application/json' in response.headers.get('content-type', ''):
                data = response.json()
                if 'schema' in data:
                    print(f"   Schema: {data['schema']}")
                    print(f"   Tenant: {data.get('tenant', 'Unknown')}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        print()

if __name__ == "__main__":
    test_tenant_routing()