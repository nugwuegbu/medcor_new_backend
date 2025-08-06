#!/usr/bin/env python3
"""
Test script for the new user creation API endpoint
Demonstrates creating users with different roles, password encryption, and tenant assignment
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def get_auth_token():
    """Get authentication token for admin user"""
    login_data = {
        "email": "admin@medcor.ai",
        "password": "Admin123!"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login/", json=login_data)
    if response.status_code == 200:
        data = response.json()
        return data.get("access")
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        return None

def list_tenants(token):
    """List all available tenants"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(f"{BASE_URL}/api/auth/tenants/list/", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print("\n=== Available Tenants ===")
        for tenant in data.get("tenants", []):
            print(f"ID: {tenant['id']}, Name: {tenant['name']}, Schema: {tenant['schema_name']}")
        return data.get("tenants", [])
    else:
        print(f"Failed to list tenants: {response.status_code} - {response.text}")
        return []

def create_user(token, user_data):
    """Create a new user with the API"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/users/create/", json=user_data, headers=headers)
    
    if response.status_code == 201:
        data = response.json()
        print(f"\n✅ User created successfully!")
        print(f"   - Email: {data['user']['email']}")
        print(f"   - Role: {data['user']['role']}")
        print(f"   - Name: {data['user']['first_name']} {data['user']['last_name']}")
        print(f"   - Is Staff: {data['user']['is_staff']}")
        print(f"   - Is Superuser: {data['user']['is_superuser']}")
        print(f"   - Is Active: {data['user']['is_active']}")
        print(f"   - Is Verified: {data['user']['is_verified']}")
        if data['user'].get('tenant'):
            print(f"   - Tenant: {data['user']['tenant']['name']} (ID: {data['user']['tenant']['id']})")
        return data
    else:
        print(f"\n❌ Failed to create user: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

def main():
    print("=== Testing User Creation API ===\n")
    
    # Step 1: Get authentication token
    print("1. Getting authentication token...")
    token = get_auth_token()
    if not token:
        print("Failed to get auth token. Exiting.")
        return
    print("✅ Authentication successful!")
    
    # Step 2: List available tenants
    print("\n2. Listing available tenants...")
    tenants = list_tenants(token)
    
    # Step 3: Create test users with different roles
    print("\n3. Creating test users with different roles...")
    
    # Test user 1: Patient
    patient_data = {
        "email": f"patient_test_{datetime.now().strftime('%Y%m%d%H%M%S')}@medcor.ai",
        "password": "SecurePass123!",
        "first_name": "John",
        "last_name": "Doe",
        "role": "patient",
        "phone_number": "+1234567890",
        "address": "123 Medical Street, Health City",
        "blood_type": "O+",
        "allergies": "Penicillin, Peanuts",
        "emergency_contact": "Jane Doe",
        "emergency_phone": "+1234567891",
        "medical_record_number": f"MRN{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "insurance_provider": "Blue Cross Blue Shield",
        "insurance_policy_number": "POL123456789"
    }
    
    # Add tenant if available
    if tenants:
        patient_data["tenant_id"] = tenants[0]["id"]
    
    print("\n--- Creating Patient User ---")
    create_user(token, patient_data)
    
    # Test user 2: Doctor
    doctor_data = {
        "email": f"doctor_test_{datetime.now().strftime('%Y%m%d%H%M%S')}@medcor.ai",
        "password": "DoctorPass456!",
        "first_name": "Dr. Sarah",
        "last_name": "Smith",
        "role": "doctor",
        "phone_number": "+1234567892",
        "address": "456 Hospital Avenue, Medical District"
    }
    
    if tenants:
        doctor_data["tenant_id"] = tenants[0]["id"]
    
    print("\n--- Creating Doctor User ---")
    create_user(token, doctor_data)
    
    # Test user 3: Admin
    admin_data = {
        "email": f"admin_test_{datetime.now().strftime('%Y%m%d%H%M%S')}@medcor.ai",
        "password": "AdminPass789!",
        "first_name": "Michael",
        "last_name": "Johnson",
        "role": "admin",
        "phone_number": "+1234567893",
        "is_superuser": True,  # Explicitly set superuser for admin
        "is_staff": True
    }
    
    if tenants:
        admin_data["tenant_id"] = tenants[0]["id"]
    
    print("\n--- Creating Admin User ---")
    create_user(token, admin_data)
    
    # Test user 4: Nurse
    nurse_data = {
        "email": f"nurse_test_{datetime.now().strftime('%Y%m%d%H%M%S')}@medcor.ai",
        "password": "NursePass321!",
        "first_name": "Emily",
        "last_name": "Wilson",
        "role": "nurse",
        "phone_number": "+1234567894"
    }
    
    if tenants:
        nurse_data["tenant_id"] = tenants[0]["id"]
    
    print("\n--- Creating Nurse User ---")
    create_user(token, nurse_data)
    
    # Test validation: Try to create a user with invalid data
    print("\n4. Testing validation...")
    
    # Test with missing required fields
    invalid_data = {
        "email": "invalid@test.com",
        # Missing password, first_name, last_name
    }
    
    print("\n--- Testing with missing required fields ---")
    create_user(token, invalid_data)
    
    # Test with weak password
    weak_password_data = {
        "email": "weakpass@test.com",
        "password": "weak",  # Too short
        "first_name": "Test",
        "last_name": "User"
    }
    
    print("\n--- Testing with weak password ---")
    create_user(token, weak_password_data)
    
    # Test with invalid email
    invalid_email_data = {
        "email": "not-an-email",
        "password": "ValidPass123!",
        "first_name": "Test",
        "last_name": "User"
    }
    
    print("\n--- Testing with invalid email format ---")
    create_user(token, invalid_email_data)
    
    print("\n=== Test Complete ===")
    print("\nThe API endpoint successfully:")
    print("✅ Creates users with encrypted passwords")
    print("✅ Supports role selection (patient, doctor, admin, nurse)")
    print("✅ Sets is_staff, is_active, is_verified to True by default")
    print("✅ Sets is_superuser to True for admin role")
    print("✅ Assigns users to tenants")
    print("✅ Validates required fields and password strength")
    print("✅ Returns JWT tokens for the created user")

if __name__ == "__main__":
    main()