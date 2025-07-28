#!/usr/bin/env python3
"""
Test script for tenant-specific subdomain access
Demonstrates API documentation and admin panel access for each tenant
"""

import requests
import json
from urllib.parse import urljoin

# Base configuration
BASE_DOMAIN = "14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000"
TENANTS = [
    {
        "name": "Public Tenant",
        "schema": "public", 
        "domain": f"https://{BASE_DOMAIN}",
        "subdomain": BASE_DOMAIN
    },
    {
        "name": "Medcor Hospital",
        "schema": "medcorhospital",
        "domain": f"https://medcorhospital.{BASE_DOMAIN}",
        "subdomain": f"medcorhospital.{BASE_DOMAIN}"
    },
    {
        "name": "Medcor Clinic", 
        "schema": "medcorclinic",
        "domain": f"https://medcorclinic.{BASE_DOMAIN}",
        "subdomain": f"medcorclinic.{BASE_DOMAIN}"
    }
]

def test_tenant_access():
    """Test access to each tenant's API docs and admin panel"""
    
    print("=" * 80)
    print("TENANT SUBDOMAIN ACCESS TEST")
    print("=" * 80)
    print()
    
    for tenant in TENANTS:
        print(f"🏥 Testing {tenant['name']} ({tenant['schema']})")
        print(f"📍 Domain: {tenant['domain']}")
        print()
        
        # Test API documentation access
        api_docs_url = urljoin(tenant['domain'], '/api/docs/')
        admin_url = urljoin(tenant['domain'], '/admin/')
        api_root_url = urljoin(tenant['domain'], '/api/')
        
        print(f"🔗 API Documentation: {api_docs_url}")
        print(f"🔗 Admin Panel: {admin_url}")
        print(f"🔗 API Root: {api_root_url}")
        print()
        
        # Test connectivity (without SSL verification for development)
        try:
            # Test API root
            response = requests.get(api_root_url, timeout=10, verify=False)
            if response.status_code == 200:
                print("✅ API Root - Accessible")
            else:
                print(f"⚠️  API Root - Status {response.status_code}")
                
        except Exception as e:
            print(f"❌ API Root - Connection failed: {str(e)}")
            
        try:
            # Test API docs
            response = requests.get(api_docs_url, timeout=10, verify=False)
            if response.status_code == 200:
                print("✅ API Documentation - Accessible")
            elif response.status_code == 404:
                print("⚠️  API Documentation - Not found (may need URL configuration)")
            else:
                print(f"⚠️  API Documentation - Status {response.status_code}")
                
        except Exception as e:
            print(f"❌ API Documentation - Connection failed: {str(e)}")
            
        try:
            # Test admin
            response = requests.get(admin_url, timeout=10, verify=False)
            if response.status_code == 200:
                print("✅ Admin Panel - Accessible")
            elif response.status_code == 302:
                print("✅ Admin Panel - Accessible (redirected to login)")
            else:
                print(f"⚠️  Admin Panel - Status {response.status_code}")
                
        except Exception as e:
            print(f"❌ Admin Panel - Connection failed: {str(e)}")
            
        print("-" * 60)
        print()

def generate_access_urls():
    """Generate and display all tenant access URLs"""
    
    print("=" * 80)
    print("TENANT ACCESS URLS")
    print("=" * 80)
    print()
    
    for tenant in TENANTS:
        print(f"🏥 {tenant['name']} ({tenant['schema']})")
        print(f"   📊 API Documentation: {urljoin(tenant['domain'], '/api/docs/')}")
        print(f"   🛠️  Admin Panel: {urljoin(tenant['domain'], '/admin/')}")
        print(f"   🔌 API Root: {urljoin(tenant['domain'], '/api/')}")
        print(f"   🌐 Base Domain: {tenant['domain']}")
        print()

def generate_curl_examples():
    """Generate cURL command examples for testing"""
    
    print("=" * 80)
    print("CURL TESTING EXAMPLES")
    print("=" * 80)
    print()
    
    for tenant in TENANTS:
        print(f"# {tenant['name']} ({tenant['schema']})")
        print(f"curl -k -I \"{urljoin(tenant['domain'], '/api/')}\"")
        print(f"curl -k -I \"{urljoin(tenant['domain'], '/admin/')}\"")
        print(f"curl -k -I \"{urljoin(tenant['domain'], '/api/docs/')}\"")
        print()

if __name__ == "__main__":
    print("🚀 Starting Tenant Subdomain Access Test...")
    print()
    
    # Generate access URLs
    generate_access_urls()
    
    # Generate cURL examples
    generate_curl_examples()
    
    # Test actual access
    test_tenant_access()
    
    print("✨ Test completed! Check results above.")
    print()
    print("💡 Usage Notes:")
    print("- Admin panels require authentication (use Django admin credentials)")
    print("- API documentation is publicly accessible")
    print("- All URLs use HTTPS with the Replit domain")
    print("- Subdomain routing is handled by django-tenants automatically")