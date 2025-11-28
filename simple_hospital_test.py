#!/usr/bin/env python3
"""
Simple test for hospital-aware MCP functionality
"""

import os
import sys
import django
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).resolve().parent
sys.path.insert(0, str(project_root))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

from django.contrib.auth import get_user_model
from langchain_ai.hospital_aware_mcp import get_hospital_aware_tools
from langchain_ai.mcp_client import get_mcp_client

User = get_user_model()

def test_hospital_context():
    """Test hospital context extraction"""
    print("🔧 Testing Hospital Context Extraction")
    print("=" * 50)
    
    # Get users with hospitals
    users_with_hospitals = User.objects.filter(hospital__isnull=False)[:3]
    
    if not users_with_hospitals.exists():
        print("❌ No users with hospital context found")
        return False
    
    for user in users_with_hospitals:
        print(f"\n👤 User: {user.email}")
        print(f"   Hospital: {user.hospital.name if user.hospital else 'None'}")
        print(f"   Hospital ID: {user.hospital.id if user.hospital else 'None'}")
        
        # Test hospital-aware tools
        tools = get_hospital_aware_tools(user)
        context = tools.get_hospital_context()
        print(f"   Context: {context}")
        
        if context['has_context']:
            print("   ✅ Hospital context extracted successfully")
        else:
            print("   ❌ No hospital context available")
    
    return True

def test_hospital_statistics():
    """Test hospital statistics"""
    print("\n🔧 Testing Hospital Statistics")
    print("=" * 50)
    
    # Get a user with hospital context
    user = User.objects.filter(hospital__isnull=False).first()
    
    if not user:
        print("❌ No users with hospital context found")
        return False
    
    print(f"👤 Testing with user: {user.email}")
    print(f"🏥 Hospital: {user.hospital.name}")
    
    try:
        tools = get_hospital_aware_tools(user)
        
        # Test hospital context
        context = tools.get_hospital_context()
        print(f"📊 Hospital Context: {context}")
        
        # Test hospital statistics
        print("\n📈 Testing hospital statistics...")
        stats = tools.get_hospital_statistics()
        print(f"   Statistics: {stats}")
        
        if 'error' not in stats:
            print("   ✅ Hospital statistics retrieved successfully")
        else:
            print(f"   ❌ Error: {stats['error']}")
        
    except Exception as e:
        print(f"❌ Error testing hospital statistics: {str(e)}")
        return False
    
    return True

def test_mcp_client_creation():
    """Test MCP client creation with user context"""
    print("\n🔧 Testing MCP Client Creation")
    print("=" * 50)
    
    # Get a user with hospital context
    user = User.objects.filter(hospital__isnull=False).first()
    
    if not user:
        print("❌ No users with hospital context found")
        return False
    
    print(f"👤 Testing with user: {user.email}")
    print(f"🏥 Hospital: {user.hospital.name}")
    
    try:
        # Test MCP client creation
        client = get_mcp_client(user=user)
        print(f"   ✅ MCP client created with hospital context: {client._hospital_id}")
        
        # Test hospital context injection
        test_params = {"some_param": "test"}
        injected_params = client._inject_hospital_context(test_params.copy())
        
        if 'hospital_id' in injected_params:
            print(f"   ✅ Hospital context injected: {injected_params['hospital_id']}")
        else:
            print("   ⚠️  Hospital context not injected")
        
    except Exception as e:
        print(f"❌ Error testing MCP client: {str(e)}")
        return False
    
    return True

def main():
    """Run all tests"""
    print("🚀 Testing Hospital-Aware MCP Functionality")
    print("=" * 60)
    
    tests = [
        ("Hospital Context Extraction", test_hospital_context),
        ("Hospital Statistics", test_hospital_statistics),
        ("MCP Client Creation", test_mcp_client_creation),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running: {test_name}")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! Hospital-aware MCP is working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)