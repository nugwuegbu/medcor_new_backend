#!/usr/bin/env python3
"""
Test script for Services MCP Integration
"""

import os
import sys
import django

# Add the project directory to Python path
sys.path.append('/home/nnamdi/pyth/medcor_backend2')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

from services.models import Service
from tenants.models import Hospital


def test_list_services():
    """Test the list_services functionality"""
    print("🧪 Testing list_services...")
    
    try:
        # Import the function directly (before it's wrapped by @mcp.tool())
        import mcp_server
        import inspect
        
        # Get the actual function
        list_services_func = None
        for name, obj in inspect.getmembers(mcp_server):
            if name == 'list_services' and callable(obj) and not isinstance(obj, type):
                list_services_func = obj
                break
        
        if list_services_func is None:
            # Import from the module directly
            import importlib
            spec = importlib.util.spec_from_file_location("mcp_server", "mcp_server.py")
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            list_services_func = module.list_services
        
        # Get a hospital ID (using first hospital)
        hospital = Hospital.objects.first()
        if not hospital:
            print("❌ No hospitals found in database")
            return False
        
        print(f"📋 Testing with hospital: {hospital.name} (ID: {hospital.id})")
        
        # Call the function
        result = list_services_func(str(hospital.id))
        
        print(f"✅ Tool executed successfully")
        print(f"   Success: {result['success']}")
        print(f"   Hospital: {result.get('hospital_name', 'N/A')}")
        print(f"   Services found: {result.get('count', 0)}")
        
        if result['success'] and result.get('services'):
            print("\n📝 Sample services:")
            for service in result['services'][:5]:  # Show first 5
                print(f"   - {service['service_name']}: ${service['price']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_get_services_summary():
    """Test the get_services_summary functionality"""
    print("\n🧪 Testing get_services_summary...")
    
    try:
        from mcp_server import get_services_summary
        
        # Get a hospital ID
        hospital = Hospital.objects.first()
        if not hospital:
            print("❌ No hospitals found in database")
            return False
        
        # Call the tool
        result = get_services_summary(str(hospital.id))
        
        print(f"✅ Tool executed successfully")
        print(f"   Total services: {result.get('total_services', 0)}")
        
        if result.get('price_statistics'):
            stats = result['price_statistics']
            print(f"   Price Range: ${stats.get('minimum_price', '0')} - ${stats.get('maximum_price', '0')}")
            print(f"   Average Price: ${stats.get('average_price', '0')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_search_services():
    """Test the search_services functionality"""
    print("\n🧪 Testing search_services...")
    
    try:
        from mcp_server import search_services
        
        # Get a hospital ID
        hospital = Hospital.objects.first()
        if not hospital:
            print("❌ No hospitals found in database")
            return False
        
        # Search with query
        result = search_services(str(hospital.id), "consult", limit=5)
        
        print(f"✅ Tool executed successfully")
        print(f"   Search results: {result.get('count', 0)}")
        print(f"   Query: {result.get('search_query', 'N/A')}")
        
        if result.get('services'):
            print("\n📝 Search results:")
            for service in result['services']:
                print(f"   - {service['service_name']}: ${service['price']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    print("=" * 60)
    print("🧪 Testing Services MCP Integration")
    print("=" * 60)
    
    # Run tests
    test1 = test_list_services()
    test2 = test_get_services_summary()
    test3 = test_search_services()
    
    print("\n" + "=" * 60)
    if all([test1, test2, test3]):
        print("🎉 ALL TESTS PASSED!")
        print("✅ Services are now available in MCP server")
        print("\n📋 Available MCP Tools for Services:")
        print("   - list_services: List all services for a hospital")
        print("   - get_service_details: Get details of a specific service")
        print("   - search_services: Search services by name and price")
        print("   - get_services_summary: Get summary with pricing statistics")
    else:
        print("❌ Some tests failed")
    print("=" * 60)


if __name__ == "__main__":
    main()
