#!/usr/bin/env python3
"""
Test script to verify Dentscape API endpoints are working
"""

import requests
import json
import os
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/dentscape"

def test_api_endpoint(endpoint, data, files=None):
    """Test an API endpoint"""
    url = f"{API_BASE}/{endpoint}"
    
    try:
        response = requests.post(url, data=data, files=files)
        print(f"✓ {endpoint}: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print(f"  Success: {result.get('message', 'No message')}")
            return True
        else:
            print(f"  Error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"✗ {endpoint}: Connection failed (server not running)")
        return False
    except Exception as e:
        print(f"✗ {endpoint}: {str(e)}")
        return False

def main():
    print("Dentscape API Endpoint Test")
    print("=" * 50)
    
    # Test data
    test_user_id = "test_user_12345"
    
    # Create a simple test image file
    test_image_path = "/tmp/test_image.jpg"
    if not os.path.exists(test_image_path):
        # Create a minimal JPEG file for testing
        with open(test_image_path, 'wb') as f:
            # Minimal JPEG header
            f.write(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9')
    
    # Test simulation endpoints
    print("\nTesting Simulation Endpoints:")
    print("-" * 30)
    
    simulation_data = {"user_id": test_user_id}
    simulation_files = {"image": open(test_image_path, 'rb')}
    
    test_api_endpoint("simulations/orthodontics/", simulation_data, simulation_files)
    simulation_files["image"].close()
    
    simulation_files = {"image": open(test_image_path, 'rb')}
    test_api_endpoint("simulations/veneer-with-whitening/", simulation_data, simulation_files)
    simulation_files["image"].close()
    
    simulation_files = {"image": open(test_image_path, 'rb')}
    test_api_endpoint("simulations/tooth-whitening/", simulation_data, simulation_files)
    simulation_files["image"].close()
    
    # Test analysis endpoints
    print("\nTesting Analysis Endpoints:")
    print("-" * 30)
    
    analysis_data = {"user_id": test_user_id}
    analysis_files = {"image": open(test_image_path, 'rb')}
    
    test_api_endpoint("analyses/smile-curve-upper/", analysis_data, analysis_files)
    analysis_files["image"].close()
    
    analysis_files = {"image": open(test_image_path, 'rb')}
    test_api_endpoint("analyses/e-line/", analysis_data, analysis_files)
    analysis_files["image"].close()
    
    analysis_files = {"image": open(test_image_path, 'rb')}
    test_api_endpoint("analyses/tooth-segmentation/", analysis_data, analysis_files)
    analysis_files["image"].close()
    
    analysis_files = {"image": open(test_image_path, 'rb')}
    test_api_endpoint("analyses/width-height-ratio-incisors/", analysis_data, analysis_files)
    analysis_files["image"].close()
    
    analysis_files = {"image": open(test_image_path, 'rb')}
    test_api_endpoint("analyses/incisal-plane/", analysis_data, analysis_files)
    analysis_files["image"].close()
    
    analysis_files = {"image": open(test_image_path, 'rb')}
    test_api_endpoint("analyses/interdental-width-proportion/", analysis_data, analysis_files)
    analysis_files["image"].close()
    
    # Test history endpoint
    print("\nTesting History Endpoint:")
    print("-" * 30)
    
    try:
        response = requests.get(f"{API_BASE}/history/")
        print(f"✓ history: {response.status_code}")
        if response.status_code == 200:
            print("  Success: History endpoint accessible")
        else:
            print(f"  Error: {response.text}")
    except requests.exceptions.ConnectionError:
        print("✗ history: Connection failed (server not running)")
    except Exception as e:
        print(f"✗ history: {str(e)}")
    
    # Clean up
    if os.path.exists(test_image_path):
        os.remove(test_image_path)
    
    print("\n" + "=" * 50)
    print("Test completed!")
    print("\nTo run the server:")
    print("python3 manage.py runserver")

if __name__ == "__main__":
    main()
