#!/usr/bin/env python3
"""
Quick test script to verify the unified KnowledgeBase API is working.
"""

import requests
import json

# Test configuration
BASE_URL = "http://127.0.0.1:8000/api/knowledgebase"
HOSPITAL_ID = "123e4567-e89b-12d3-a456-426614174000"  # Replace with actual hospital ID

def test_unified_endpoints():
    """Test the unified KnowledgeBase endpoints"""
    print("Testing Unified KnowledgeBase API...")
    print("=" * 50)
    
    # Test 1: List all knowledge bases
    print("1. Testing GET /api/knowledgebase/hospital/{hospital_id}/knowledge-base/")
    try:
        response = requests.get(f"{BASE_URL}/hospital/{HOSPITAL_ID}/knowledge-base/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2)}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Exception: {str(e)}")
    
    print()
    
    # Test 2: Test the URL pattern
    print("2. Testing URL pattern recognition...")
    try:
        # This should work even if the hospital doesn't exist (auto-creation)
        response = requests.get(f"{BASE_URL}/hospital/{HOSPITAL_ID}/knowledge-base/")
        print(f"   Status: {response.status_code}")
        if response.status_code in [200, 201]:
            print("   ✓ URL pattern is working correctly")
        else:
            print(f"   ✗ URL pattern issue: {response.text}")
    except Exception as e:
        print(f"   ✗ Exception: {str(e)}")
    
    print()
    
    # Test 3: Check if the new model exists
    print("3. Testing model creation...")
    try:
        # Try to create a knowledge base
        data = {
            "agent_name": "Test AI Assistant",
            "agent_title": "Test Medical Assistant",
            "system_prompt": "Test system prompt",
            "communication_tone": "Professional",
            "communication_style": "Conversational",
            "confidence_level": "Balanced",
            "response_length": "Medium",
            "greeting_message": "Hello! This is a test.",
            "is_active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/hospital/{HOSPITAL_ID}/knowledge-base/",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code in [200, 201]:
            print("   ✓ Model creation is working")
            result = response.json()
            print(f"   Created ID: {result.get('id', 'N/A')}")
        else:
            print(f"   ✗ Model creation failed: {response.text}")
    except Exception as e:
        print(f"   ✗ Exception: {str(e)}")
    
    print()
    print("Test completed!")

if __name__ == "__main__":
    test_unified_endpoints()