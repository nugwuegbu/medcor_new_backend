#!/usr/bin/env python3
"""
Test script for Hair Extension Analysis API
"""

import base64
import requests
import json

# Test configuration
BASE_URL = "http://localhost:8000"
API_ENDPOINT = f"{BASE_URL}/api/youcam/hair-extension-analysis/"

# Sample base64 encoded image (1x1 pixel JPEG for testing)
SAMPLE_IMAGE_BASE64 = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A"

def test_hair_extension_analysis():
    """Test the hair extension analysis API endpoint"""
    
    print("🧪 Testing Hair Extension Analysis API")
    print("=" * 50)
    
    # Prepare request data
    data = {
        "imagebase64": SAMPLE_IMAGE_BASE64
    }
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    try:
        print(f"📤 Sending request to: {API_ENDPOINT}")
        print(f"📋 Request data: {json.dumps(data, indent=2)}")
        
        # Make the request
        response = requests.post(API_ENDPOINT, json=data, headers=headers, timeout=30)
        
        print(f"\n📥 Response Status: {response.status_code}")
        print(f"📥 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 201:
            print("✅ Hair Extension Analysis API test PASSED!")
            
            # Parse and display response
            try:
                response_data = response.json()
                print(f"\n📊 Response Data:")
                print(json.dumps(response_data, indent=2))
                
                # Validate response structure
                if "success" in response_data and response_data["success"]:
                    print("✅ Response structure is valid")
                    
                    if "result" in response_data:
                        result = response_data["result"]
                        
                        # Check for required fields
                        required_fields = [
                            "analysis_info",
                            "hairstyle_categories", 
                            "color_recommendations",
                            "styling_tips",
                            "installation_methods"
                        ]
                        
                        missing_fields = [field for field in required_fields if field not in result]
                        
                        if not missing_fields:
                            print("✅ All required fields present in response")
                            
                            # Display key information
                            if "analysis_info" in result:
                                analysis_info = result["analysis_info"]
                                print(f"\n🎨 Analysis Info:")
                                print(f"   Base Hair Color: {analysis_info.get('base_hair_color', 'N/A')}")
                                print(f"   Color Category: {analysis_info.get('color_category', 'N/A')}")
                                print(f"   Face Shape: {analysis_info.get('face_shape', 'N/A')}")
                                print(f"   Confidence: {analysis_info.get('confidence', 'N/A')}")
                            
                            if "hairstyle_categories" in result:
                                categories = result["hairstyle_categories"]
                                print(f"\n💇 Hairstyle Categories Found: {len(categories)}")
                                for category_id, category_data in categories.items():
                                    print(f"   - {category_data.get('category_name', category_id)}: {len(category_data.get('styles', []))} styles")
                            
                            if "color_recommendations" in result:
                                colors = result["color_recommendations"]
                                print(f"\n🎨 Color Recommendations:")
                                print(f"   Natural Colors: {len(colors.get('natural_colors', []))}")
                                print(f"   Trendy Colors: {len(colors.get('trendy_colors', []))}")
                                print(f"   Bold Colors: {len(colors.get('bold_colors', []))}")
                            
                            if "installation_methods" in result:
                                methods = result["installation_methods"]
                                print(f"\n🔧 Installation Methods: {len(methods)}")
                                for method_id, method_data in methods.items():
                                    print(f"   - {method_id}: {method_data.get('description', 'N/A')}")
                            
                        else:
                            print(f"❌ Missing required fields: {missing_fields}")
                            
                    else:
                        print("❌ 'result' field missing from response")
                        
                else:
                    print("❌ Response indicates failure")
                    
            except json.JSONDecodeError as e:
                print(f"❌ Failed to parse JSON response: {e}")
                print(f"Raw response: {response.text}")
                
        else:
            print(f"❌ Hair Extension Analysis API test FAILED!")
            print(f"Error response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def test_api_endpoints():
    """Test if the API endpoints are accessible"""
    
    print("\n🔍 Testing API Endpoints Accessibility")
    print("=" * 50)
    
    endpoints_to_test = [
        f"{BASE_URL}/api/youcam/hair-extension-analysis/",
        f"{BASE_URL}/api/schema/",
        f"{BASE_URL}/admin/",
    ]
    
    for endpoint in endpoints_to_test:
        try:
            response = requests.get(endpoint, timeout=10)
            status = "✅" if response.status_code in [200, 201, 302] else "❌"
            print(f"{status} {endpoint} - Status: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"❌ {endpoint} - Error: {e}")

if __name__ == "__main__":
    print("🚀 Starting Hair Extension Analysis API Tests")
    print("=" * 60)
    
    # Test API endpoints accessibility
    test_api_endpoints()
    
    # Test hair extension analysis
    test_hair_extension_analysis()
    
    print("\n🏁 Testing completed!")




















