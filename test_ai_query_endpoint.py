#!/usr/bin/env python3
"""
Test script for the enhanced AI Query endpoint
Tests various types of queries: health, hospital-specific, and appointment booking
"""

import requests
import json
import sys
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8002"
AI_QUERY_ENDPOINT = f"{BASE_URL}/api/ai/query/"

# Test data
TEST_HOSPITAL_ID = "your-hospital-id-here"  # Replace with actual hospital ID

def test_ai_query(question: str, hospital: str = None) -> Dict[str, Any]:
    """Test the AI query endpoint with a given question"""
    payload = {"question": question}
    if hospital:
        payload["hospital"] = hospital
    
    try:
        response = requests.post(
            AI_QUERY_ENDPOINT,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        return {
            "status_code": response.status_code,
            "response": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
            "success": response.status_code == 200
        }
    except requests.exceptions.RequestException as e:
        return {
            "status_code": 0,
            "response": {"error": str(e)},
            "success": False
        }

def run_tests():
    """Run comprehensive tests for the AI query endpoint"""
    
    print("🧪 Testing Enhanced AI Query Endpoint")
    print("=" * 50)
    
    # Test cases
    test_cases = [
        # Health questions
        {
            "category": "Health Questions",
            "tests": [
                {
                    "question": "What are the symptoms of diabetes?",
                    "hospital": None,
                    "expected_type": "health"
                },
                {
                    "question": "How do I treat high blood pressure?",
                    "hospital": None,
                    "expected_type": "health"
                },
                {
                    "question": "What causes headaches?",
                    "hospital": None,
                    "expected_type": "health"
                }
            ]
        },
        
        # Non-health questions (should be filtered out)
        {
            "category": "Non-Health Questions (Should be filtered)",
            "tests": [
                {
                    "question": "What's the weather like today?",
                    "hospital": None,
                    "expected_type": "non_health"
                },
                {
                    "question": "Tell me about the latest movies",
                    "hospital": None,
                    "expected_type": "non_health"
                },
                {
                    "question": "How do I cook pasta?",
                    "hospital": None,
                    "expected_type": "non_health"
                }
            ]
        },
        
        # Hospital-specific questions
        {
            "category": "Hospital-Specific Questions",
            "tests": [
                {
                    "question": "Is there a Gynecologist in this hospital?",
                    "hospital": TEST_HOSPITAL_ID,
                    "expected_type": "hospital"
                },
                {
                    "question": "What diseases are treated in this hospital?",
                    "hospital": TEST_HOSPITAL_ID,
                    "expected_type": "hospital"
                },
                {
                    "question": "Who are the doctors in this hospital?",
                    "hospital": TEST_HOSPITAL_ID,
                    "expected_type": "hospital"
                },
                {
                    "question": "Does your hospital perform brain surgery?",
                    "hospital": TEST_HOSPITAL_ID,
                    "expected_type": "hospital"
                }
            ]
        },
        
        # Appointment booking
        {
            "category": "Appointment Booking",
            "tests": [
                {
                    "question": "I want to book an appointment",
                    "hospital": TEST_HOSPITAL_ID,
                    "expected_type": "appointment"
                },
                {
                    "question": "Can you help me schedule a consultation?",
                    "hospital": TEST_HOSPITAL_ID,
                    "expected_type": "appointment"
                },
                {
                    "question": "I need to see a doctor",
                    "hospital": TEST_HOSPITAL_ID,
                    "expected_type": "appointment"
                }
            ]
        }
    ]
    
    # Run tests
    total_tests = 0
    passed_tests = 0
    
    for category in test_cases:
        print(f"\n📋 {category['category']}")
        print("-" * 30)
        
        for test in category['tests']:
            total_tests += 1
            print(f"\n❓ Question: {test['question']}")
            if test['hospital']:
                print(f"🏥 Hospital ID: {test['hospital']}")
            
            result = test_ai_query(test['question'], test['hospital'])
            
            if result['success']:
                response_data = result['response']
                print(f"✅ Status: {result['status_code']}")
                print(f"📝 Response: {response_data.get('response', 'No response')[:200]}...")
                print(f"🏷️  Query Type: {response_data.get('query_type', 'Unknown')}")
                
                if response_data.get('query_type') == test['expected_type']:
                    print("✅ Query type detection: CORRECT")
                    passed_tests += 1
                else:
                    print(f"❌ Query type detection: INCORRECT (expected: {test['expected_type']}, got: {response_data.get('query_type')})")
                
                # Show additional info if available
                if 'hospital_info' in response_data:
                    print(f"🏥 Hospital Info: {response_data['hospital_info']}")
                if 'appointment_options' in response_data:
                    print(f"📅 Appointment Options: {len(response_data['appointment_options'])} slots available")
                if 'follow_up_questions' in response_data:
                    print(f"💬 Follow-up Questions: {response_data['follow_up_questions']}")
            else:
                print(f"❌ Status: {result['status_code']}")
                print(f"❌ Error: {result['response']}")
    
    # Summary
    print("\n" + "=" * 50)
    print(f"📊 Test Summary: {passed_tests}/{total_tests} tests passed")
    print(f"📈 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    if passed_tests == total_tests:
        print("🎉 All tests passed!")
        return True
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return False

def test_specific_scenarios():
    """Test specific scenarios mentioned in the requirements"""
    print("\n🎯 Testing Specific Scenarios")
    print("=" * 50)
    
    scenarios = [
        {
            "name": "Gynecologist Check",
            "question": "Is there a Gynecologist in this hospital?",
            "hospital": TEST_HOSPITAL_ID
        },
        {
            "name": "Diseases Treated",
            "question": "What are the diseases treated in this hospital?",
            "hospital": TEST_HOSPITAL_ID
        },
        {
            "name": "Doctors List",
            "question": "Who are the doctors in this hospital?",
            "hospital": TEST_HOSPITAL_ID
        },
        {
            "name": "Appointment Booking",
            "question": "I want to book an appointment for me",
            "hospital": TEST_HOSPITAL_ID
        },
        {
            "name": "Brain Surgery Check",
            "question": "Does your hospital perform brain surgery?",
            "hospital": TEST_HOSPITAL_ID
        }
    ]
    
    for scenario in scenarios:
        print(f"\n🔍 {scenario['name']}")
        print(f"❓ Question: {scenario['question']}")
        
        result = test_ai_query(scenario['question'], scenario['hospital'])
        
        if result['success']:
            response_data = result['response']
            print(f"✅ Response: {response_data.get('response', 'No response')}")
            print(f"🏷️  Type: {response_data.get('query_type', 'Unknown')}")
        else:
            print(f"❌ Error: {result['response']}")

if __name__ == "__main__":
    print("🚀 Starting AI Query Endpoint Tests")
    print(f"🌐 Endpoint: {AI_QUERY_ENDPOINT}")
    print(f"🏥 Test Hospital ID: {TEST_HOSPITAL_ID}")
    
    if TEST_HOSPITAL_ID == "your-hospital-id-here":
        print("\n⚠️  WARNING: Please update TEST_HOSPITAL_ID with a real hospital ID from your database")
        print("   You can get hospital IDs by running: python manage.py shell -c \"from tenants.models import Hospital; print([(h.id, h.name) for h in Hospital.objects.all()[:5]])\"")
    
    try:
        # Test if server is running
        health_response = requests.get(f"{BASE_URL}/api/health/", timeout=5)
        if health_response.status_code == 200:
            print("✅ Server is running")
        else:
            print("❌ Server health check failed")
            sys.exit(1)
    except requests.exceptions.RequestException:
        print("❌ Cannot connect to server. Make sure the Django server is running on localhost:8002")
        sys.exit(1)
    
    # Run tests
    success = run_tests()
    test_specific_scenarios()
    
    if success:
        print("\n🎉 All tests completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the implementation.")
        sys.exit(1)