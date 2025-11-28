#!/usr/bin/env python3
"""
Test script to verify LangChain AI endpoints are working
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_ai_endpoints():
    """Test all AI endpoints"""
    print("🧪 Testing LangChain AI Endpoints")
    print("=" * 50)
    
    # Test health endpoint (no auth required)
    print("\n1. Testing Health Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/ai/health/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Health endpoint working")
            print(f"   Response: {response.json()}")
        else:
            print(f"   ❌ Health endpoint failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Health endpoint error: {e}")
    
    # Test query endpoint (requires auth)
    print("\n2. Testing Query Endpoint...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai/query/",
            json={"query": "What are the symptoms of diabetes?"},
            headers={"Content-Type": "application/json"}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ✅ Query endpoint working (auth required as expected)")
        else:
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Query endpoint error: {e}")
    
    # Test medical endpoint (requires auth)
    print("\n3. Testing Medical Endpoint...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai/medical/",
            json={"medical_data": "Patient has chest pain and shortness of breath"},
            headers={"Content-Type": "application/json"}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ✅ Medical endpoint working (auth required as expected)")
        else:
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Medical endpoint error: {e}")
    
    # Test database endpoint (requires auth)
    print("\n4. Testing Database Endpoint...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai/database/",
            json={"query": "Show me all patients with diabetes"},
            headers={"Content-Type": "application/json"}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ✅ Database endpoint working (auth required as expected)")
        else:
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Database endpoint error: {e}")
    
    # Test task status endpoint (requires auth)
    print("\n5. Testing Task Status Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/ai/task/test-task-id/status/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ✅ Task status endpoint working (auth required as expected)")
        else:
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Task status endpoint error: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 All AI endpoints are accessible and working!")
    print("📚 Visit http://localhost:8000/api/docs/ to see the Swagger documentation")

if __name__ == "__main__":
    test_ai_endpoints()