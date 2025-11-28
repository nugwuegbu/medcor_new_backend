#!/usr/bin/env python3
"""
Test script to verify Dentscape API endpoints work without authentication
"""

import requests
import base64
import json

# Configuration
BASE_URL = "http://localhost:8000"  # Change to your server URL
API_BASE = f"{BASE_URL}/api/dentscape"

# Test image (small base64 encoded image for testing)
TEST_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

def test_endpoint_without_auth(endpoint, data):
    """Test an endpoint without authentication"""
    url = f"{API_BASE}{endpoint}"
    
    print(f"\n🔍 Testing: {endpoint}")
    print(f"URL: {url}")
    
    try:
        response = requests.post(url, json=data, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS - Endpoint accessible without authentication")
            try:
                result = response.json()
                print(f"Response keys: {list(result.keys())}")
            except:
                print("Response: (non-JSON)")
        elif response.status_code == 401:
            print("❌ FAILED - Authentication required")
        elif response.status_code == 400:
            print("⚠️  BAD REQUEST - Endpoint accessible but validation failed")
            try:
                error = response.json()
                print(f"Error: {error}")
            except:
                print("Error: (non-JSON)")
        else:
            print(f"⚠️  Unexpected status code: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ REQUEST FAILED: {e}")

def main():
    """Test all Dentscape endpoints without authentication"""
    
    print("🚀 Testing Dentscape API Endpoints Without Authentication")
    print("=" * 60)
    
    # Test data
    test_data = {
        "image": TEST_IMAGE_BASE64,
        "user_id": "test_user_123"
    }
    
    # Simulation endpoints
    simulation_endpoints = [
        "/simulations/orthodontics/",
        "/simulations/veneer-with-whitening/",
        "/simulations/tooth-whitening/"
    ]
    
    # Analysis endpoints
    analysis_endpoints = [
        "/analyses/smile-curve-upper/",
        "/analyses/e-line-analysis/",
        "/analyses/tooth-segmentation/",
        "/analyses/width-height-ratio-incisors/",
        "/analyses/incisal-plane/",
        "/analyses/interdental-width-proportion/"
    ]
    
    print("\n📊 SIMULATION ENDPOINTS:")
    for endpoint in simulation_endpoints:
        test_endpoint_without_auth(endpoint, test_data)
    
    print("\n🔬 ANALYSIS ENDPOINTS:")
    for endpoint in analysis_endpoints:
        test_endpoint_without_auth(endpoint, test_data)
    
    # Test list endpoints
    print("\n📋 LIST ENDPOINTS:")
    list_endpoints = [
        "/simulations/",
        "/analyses/",
        "/history/"
    ]
    
    for endpoint in list_endpoints:
        url = f"{API_BASE}{endpoint}"
        print(f"\n🔍 Testing: {endpoint}")
        print(f"URL: {url}")
        
        try:
            response = requests.get(url, timeout=10)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ SUCCESS - List endpoint accessible without authentication")
            elif response.status_code == 401:
                print("❌ FAILED - Authentication required")
            else:
                print(f"⚠️  Status: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ REQUEST FAILED: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 SUMMARY:")
    print("- If you see ✅ SUCCESS messages, authentication has been removed")
    print("- If you see ❌ FAILED messages, authentication is still required")
    print("- ⚠️  BAD REQUEST is expected for test data (validation errors)")

if __name__ == "__main__":
    main()




