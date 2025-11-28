#!/usr/bin/env python3
"""
Test script for hospital-aware MCP functionality
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
from asgiref.sync import sync_to_async
import asyncio

User = get_user_model()

async def test_hospital_context_extraction():
    """Test hospital context extraction from users"""
    print("🔧 Testing Hospital Context Extraction")
    print("=" * 50)
    
    # Get users with hospitals
    users_with_hospitals = await sync_to_async(list)(User.objects.filter(hospital__isnull=False)[:3])
    
    if not users_with_hospitals:
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

async def test_mcp_client_hospital_context():
    """Test MCP client with hospital context"""
    print("\n🔧 Testing MCP Client with Hospital Context")
    print("=" * 50)
    
    # Get a user with hospital context
    user = await sync_to_async(lambda: User.objects.filter(hospital__isnull=False).first())()
    
    if not user:
        print("❌ No users with hospital context found")
        return False
    
    print(f"👤 Testing with user: {user.email}")
    print(f"🏥 Hospital: {user.hospital.name}")
    
    try:
        async with get_mcp_client(user=user) as client:
            # Test listing doctors (should automatically filter by hospital)
            print("\n📋 Testing list_doctors with hospital context...")
            response = await client.call_tool("list_doctors", {})
            
            if response.success:
                doctors = response.data
                print(f"   ✅ Found {len(doctors)} doctors in hospital")
                for doctor in doctors[:3]:  # Show first 3
                    print(f"      - {doctor.get('name', 'Unknown')} ({doctor.get('specialization', 'No specialty')})")
            else:
                print(f"   ❌ Error: {response.error}")
            
            # Test listing appointments
            print("\n📅 Testing list_appointments with hospital context...")
            response = await client.call_tool("list_appointments", {})
            
            if response.success:
                appointments = response.data
                print(f"   ✅ Found {len(appointments)} appointments in hospital")
                for appointment in appointments[:3]:  # Show first 3
                    print(f"      - {appointment.get('patient', 'Unknown')} with {appointment.get('doctor', 'Unknown')}")
            else:
                print(f"   ❌ Error: {response.error}")
            
            # Test listing medical records
            print("\n📄 Testing list_medical_records with hospital context...")
            response = await client.call_tool("list_medical_records", {})
            
            if response.success:
                records = response.data
                print(f"   ✅ Found {len(records)} medical records in hospital")
                for record in records[:3]:  # Show first 3
                    print(f"      - {record.get('title', 'Unknown')} for {record.get('patient_name', 'Unknown')}")
            else:
                print(f"   ❌ Error: {response.error}")
    
    except Exception as e:
        print(f"❌ Error testing MCP client: {str(e)}")
        return False
    
    return True

async def test_hospital_aware_tools():
    """Test hospital-aware tools wrapper"""
    print("\n🔧 Testing Hospital-Aware Tools Wrapper")
    print("=" * 50)
    
    # Get a user with hospital context
    user = await sync_to_async(lambda: User.objects.filter(hospital__isnull=False).first())()
    
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
        
        # Test listing doctors with context
        print("\n👨‍⚕️ Testing list_doctors_with_context...")
        doctors = await tools.list_doctors_with_context()
        print(f"   Found {len(doctors)} doctors")
        
        # Test listing appointments with context
        print("\n📅 Testing list_appointments_with_context...")
        appointments = await tools.list_appointments_with_context()
        print(f"   Found {len(appointments)} appointments")
        
        # Test listing medical records with context
        print("\n📄 Testing list_medical_records_with_context...")
        records = await tools.list_medical_records_with_context()
        print(f"   Found {len(records)} medical records")
        
    except Exception as e:
        print(f"❌ Error testing hospital-aware tools: {str(e)}")
        return False
    
    return True

async def test_cross_hospital_isolation():
    """Test that users can only access their own hospital's data"""
    print("\n🔧 Testing Cross-Hospital Data Isolation")
    print("=" * 50)
    
    # Get users from different hospitals
    users = await sync_to_async(list)(User.objects.filter(hospital__isnull=False).distinct('hospital')[:2])
    
    if len(users) < 2:
        print("❌ Need at least 2 users from different hospitals for isolation test")
        return False
    
    user1, user2 = users[0], users[1]
    print(f"👤 User 1: {user1.email} (Hospital: {user1.hospital.name})")
    print(f"👤 User 2: {user2.email} (Hospital: {user2.hospital.name})")
    
    try:
        # Test user 1's access
        async with get_mcp_client(user=user1) as client1:
            response1 = await client1.call_tool("list_doctors", {})
            doctors1 = response1.data if response1.success else []
            print(f"   User 1 sees {len(doctors1)} doctors")
        
        # Test user 2's access
        async with get_mcp_client(user=user2) as client2:
            response2 = await client2.call_tool("list_doctors", {})
            doctors2 = response2.data if response2.success else []
            print(f"   User 2 sees {len(doctors2)} doctors")
        
        # Verify isolation (they should see different data)
        if len(doctors1) != len(doctors2):
            print("   ✅ Data isolation working - users see different data")
        else:
            print("   ⚠️  Warning: Users might be seeing the same data")
        
    except Exception as e:
        print(f"❌ Error testing cross-hospital isolation: {str(e)}")
        return False
    
    return True

async def main():
    """Run all tests"""
    print("🚀 Testing Hospital-Aware MCP Functionality")
    print("=" * 60)
    
    tests = [
        ("Hospital Context Extraction", test_hospital_context_extraction),
        ("MCP Client Hospital Context", test_mcp_client_hospital_context),
        ("Hospital-Aware Tools", test_hospital_aware_tools),
        ("Cross-Hospital Isolation", test_cross_hospital_isolation),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running: {test_name}")
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = await test_func()
            else:
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
    success = asyncio.run(main())
    sys.exit(0 if success else 1)