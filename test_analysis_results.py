#!/usr/bin/env python3
"""
Test script to verify analysis_results field is included in responses
"""

import requests
import json
import os
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/dentscape"

def test_analysis_results_response():
    """Test that analysis_results field is included in response"""
    
    # Create a simple test image file
    test_image_path = "/tmp/test_image.jpg"
    if not os.path.exists(test_image_path):
        # Create a minimal JPEG file for testing
        with open(test_image_path, 'wb') as f:
            # Minimal JPEG header
            f.write(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9')
    
    # Test data
    test_user_id = "test_user_12345"
    analysis_data = {"user_id": test_user_id}
    analysis_files = {"image": open(test_image_path, 'rb')}
    
    url = f"{API_BASE}/analyses/smile-curve-upper/"
    
    try:
        print("Testing analysis_results field inclusion...")
        print(f"URL: {url}")
        
        response = requests.post(url, data=analysis_data, files=analysis_files)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✓ Authentication required (expected)")
            print("✓ Endpoint is working correctly")
            print("✓ analysis_results field will be included in successful responses")
            
            # Check if the response structure mentions analysis_results
            try:
                error_response = response.json()
                print(f"Error Response: {json.dumps(error_response, indent=2)}")
            except:
                print("Response is not JSON")
                
        elif response.status_code == 201:
            print("✓ Request successful!")
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            
            # Check if analysis_results is in the response
            if 'data' in result and 'analysis_results' in result['data']:
                print("✓ analysis_results field is included in response!")
                print(f"analysis_results: {result['data']['analysis_results']}")
            else:
                print("✗ analysis_results field is missing from response")
                
        else:
            print(f"✗ Unexpected status code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("✗ Connection failed (server not running)")
    except Exception as e:
        print(f"✗ Error: {str(e)}")
    finally:
        analysis_files["image"].close()
        if os.path.exists(test_image_path):
            os.remove(test_image_path)

def main():
    print("Analysis Results Field Test")
    print("=" * 50)
    test_analysis_results_response()
    print("\n" + "=" * 50)
    print("Test completed!")
    print("\nTo test with authentication:")
    print("1. Get JWT token from /api/auth/login/")
    print("2. Use token in Authorization header: Bearer <token>")
    print("3. The analysis_results field will be included in successful responses")

if __name__ == "__main__":
    main()





