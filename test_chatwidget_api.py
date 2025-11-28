#!/usr/bin/env python3
"""
Test script for ChatWidget Customization API
"""

import requests
import json
import uuid

# Configuration
BASE_URL = "http://localhost:8000/api/chatwidget"
# Replace with your actual JWT token
JWT_TOKEN = "your_jwt_token_here"

# Headers
headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

def test_create_chatwidget_customization():
    """Test creating a chatwidget customization for a hospital."""
    
    # Use a real hospital ID from your database
    hospital_id = "123e4567-e89b-12d3-a456-426614174001"
    
    data = {
        "chatwidget": {
            "theme": {
                "company_logo": "/media/logos/hospital-logo.png",
                "primary_color": "#2E86AB",
                "secondary_color": "#A23B72",
                "accent_color": "#F18F01",
                "background_color": "#FFFFFF",
                "text_color": "#333333",
                "user_message_background": "#F8F9FA",
                "assistant_message_background": "#E3F2FD",
                "message_overlay_color": "#BBDEFB",
                "input_background": "#FFFFFF",
                "glow_border_color": "#2E86AB"
            },
            "features": {
                "avarta_interaction_type": "voice",
                "face_analysis": True,
                "hair_analysis": True,
                "skin_analysis": True,
                "lips_analysis": False,
                "hair_extension_analysis": True
            },
            "avatar": {
                "avarta_language": "en"
            },
            "voice": {
                "voice_id": "hospital_voice_001"
            },
            "integration": {}
        }
    }
    
    url = f"{BASE_URL}/create-for-hospital/{hospital_id}/"
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f"Create Response Status: {response.status_code}")
        print(f"Create Response: {json.dumps(response.json(), indent=2)}")
        return response.json() if response.status_code == 201 else None
    except Exception as e:
        print(f"Error creating chatwidget customization: {e}")
        return None

def test_get_chatwidget_customization():
    """Test retrieving a chatwidget customization by hospital ID."""
    
    hospital_id = "123e4567-e89b-12d3-a456-426614174001"
    url = f"{BASE_URL}/hospital/{hospital_id}/"
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Get Response Status: {response.status_code}")
        print(f"Get Response: {json.dumps(response.json(), indent=2)}")
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"Error getting chatwidget customization: {e}")
        return None

def test_update_chatwidget_customization():
    """Test updating a chatwidget customization."""
    
    hospital_id = "123e4567-e89b-12d3-a456-426614174001"
    
    data = {
        "chatwidget": {
            "theme": {
                "primary_color": "#FF6B6B",
                "secondary_color": "#4ECDC4"
            },
            "features": {
                "face_analysis": False,
                "hair_analysis": True,
                "skin_analysis": False
            },
            "voice": {
                "voice_id": "hospital_voice_002"
            }
        }
    }
    
    url = f"{BASE_URL}/update-for-hospital/{hospital_id}/"
    
    try:
        response = requests.patch(url, headers=headers, json=data)
        print(f"Update Response Status: {response.status_code}")
        print(f"Update Response: {json.dumps(response.json(), indent=2)}")
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"Error updating chatwidget customization: {e}")
        return None

def test_list_chatwidget_customizations():
    """Test listing all chatwidget customizations."""
    
    url = f"{BASE_URL}/"
    
    try:
        response = requests.get(url, headers=headers)
        print(f"List Response Status: {response.status_code}")
        print(f"List Response: {json.dumps(response.json(), indent=2)}")
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"Error listing chatwidget customizations: {e}")
        return None

def test_delete_chatwidget_customization():
    """Test deleting a chatwidget customization."""
    
    hospital_id = "123e4567-e89b-12d3-a456-426614174001"
    url = f"{BASE_URL}/delete-for-hospital/{hospital_id}/"
    
    try:
        response = requests.delete(url, headers=headers)
        print(f"Delete Response Status: {response.status_code}")
        print(f"Delete Response: {json.dumps(response.json(), indent=2)}")
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"Error deleting chatwidget customization: {e}")
        return None

def main():
    """Run all tests."""
    
    print("=" * 60)
    print("ChatWidget Customization API Test Suite")
    print("=" * 60)
    
    print("\n1. Testing Create ChatWidget Customization")
    print("-" * 50)
    create_result = test_create_chatwidget_customization()
    
    print("\n2. Testing Get ChatWidget Customization")
    print("-" * 50)
    get_result = test_get_chatwidget_customization()
    
    print("\n3. Testing Update ChatWidget Customization")
    print("-" * 50)
    update_result = test_update_chatwidget_customization()
    
    print("\n4. Testing List ChatWidget Customizations")
    print("-" * 50)
    list_result = test_list_chatwidget_customizations()
    
    print("\n5. Testing Delete ChatWidget Customization")
    print("-" * 50)
    delete_result = test_delete_chatwidget_customization()
    
    print("\n" + "=" * 60)
    print("Test Suite Completed")
    print("=" * 60)

if __name__ == "__main__":
    main()
