#!/usr/bin/env python3
"""
Test script for Patient, Doctor, and Nurse role-based CRUD APIs
"""

import requests
import json

# Base URL for the Django API
BASE_URL = "http://localhost:8000"

def test_api_endpoints():
    """Test all the role-based API endpoints"""
    
    print("🏥 MedCor.ai Role-Based API Test")
    print("=" * 50)
    
    # Test endpoints without authentication (should return 401)
    endpoints = [
        "/api/tenants/patients/",
        "/api/tenants/doctors/", 
        "/api/tenants/nurses/",
        "/api/tenants/patients/statistics/",
        "/api/tenants/doctors/statistics/",
        "/api/tenants/nurses/statistics/"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            status = "✅ Working" if response.status_code in [401, 403] else f"❌ Unexpected: {response.status_code}"
            print(f"{endpoint:<35} - {status}")
        except requests.exceptions.RequestException as e:
            print(f"{endpoint:<35} - ❌ Connection Error: {str(e)}")
    
    print("\n📋 Available API Endpoints:")
    print("-" * 50)
    
    # Patient endpoints
    patient_endpoints = [
        "GET    /api/tenants/patients/                    # List all patients",
        "POST   /api/tenants/patients/                    # Create new patient", 
        "GET    /api/tenants/patients/{id}/               # Get patient details",
        "PUT    /api/tenants/patients/{id}/               # Update patient",
        "PATCH  /api/tenants/patients/{id}/               # Partially update patient",
        "DELETE /api/tenants/patients/{id}/               # Delete patient",
        "GET    /api/tenants/patients/statistics/         # Patient statistics",
        "GET    /api/tenants/patients/search/?q=term      # Search patients"
    ]
    
    print("\n👤 Patient Management:")
    for endpoint in patient_endpoints:
        print(f"  {endpoint}")
    
    # Doctor endpoints
    doctor_endpoints = [
        "GET    /api/tenants/doctors/                     # List all doctors",
        "POST   /api/tenants/doctors/                     # Create new doctor",
        "GET    /api/tenants/doctors/{id}/                # Get doctor details", 
        "PUT    /api/tenants/doctors/{id}/                # Update doctor",
        "PATCH  /api/tenants/doctors/{id}/                # Partially update doctor",
        "DELETE /api/tenants/doctors/{id}/                # Delete doctor",
        "GET    /api/tenants/doctors/statistics/          # Doctor statistics",
        "GET    /api/tenants/doctors/search/?q=term       # Search doctors"
    ]
    
    print("\n👨‍⚕️ Doctor Management:")
    for endpoint in doctor_endpoints:
        print(f"  {endpoint}")
    
    # Nurse endpoints
    nurse_endpoints = [
        "GET    /api/tenants/nurses/                      # List all nurses",
        "POST   /api/tenants/nurses/                      # Create new nurse",
        "GET    /api/tenants/nurses/{id}/                 # Get nurse details",
        "PUT    /api/tenants/nurses/{id}/                 # Update nurse", 
        "PATCH  /api/tenants/nurses/{id}/                 # Partially update nurse",
        "DELETE /api/tenants/nurses/{id}/                 # Delete nurse",
        "GET    /api/tenants/nurses/statistics/           # Nurse statistics",
        "GET    /api/tenants/nurses/search/?q=term        # Search nurses"
    ]
    
    print("\n👩‍⚕️ Nurse Management:")
    for endpoint in nurse_endpoints:
        print(f"  {endpoint}")
    
    print("\n🔒 Authentication Required:")
    print("  All endpoints require JWT authentication token")
    print("  Include in request headers: Authorization: Bearer <token>")
    
    print("\n🔍 Filtering & Search Features:")
    print("  - Advanced search across name, email, phone fields")
    print("  - Filtering by status, blood type, department")
    print("  - Ordering by name, date joined, experience")
    print("  - Pagination support for large datasets")
    print("  - Statistics and analytics endpoints")
    
    print("\n📊 Swagger Documentation:")
    print("  Interactive API docs: http://localhost:8000/api/swagger/")
    print("  ReDoc documentation: http://localhost:8000/api/redoc/")

if __name__ == "__main__":
    test_api_endpoints()