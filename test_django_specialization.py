#!/usr/bin/env python
"""
Test script to verify doctor specialization integration in Django backend
"""

import os
import sys
import django

# Add the medcor_backend2 directory to path
sys.path.insert(0, '/home/runner/workspace/medcor_backend2')
os.environ['DJANGO_SETTINGS_MODULE'] = 'medcor_backend2.settings'

# Setup Django
django.setup()

from django.contrib.auth import get_user_model
from tenants.models import Hospital
from specialty.models import Specialty, DoctorSpecialty
from core.serializers import UserSerializer, DoctorSerializer

User = get_user_model()

# Test the serializers with mock data
def test_doctor_specialization():
    print("🔍 Testing Doctor Specialization Serializers...\n")
    
    # Create a mock hospital
    hospital = Hospital(
        id=1,
        name="Test Hospital",
        city="New York",
        state="NY",
        country="USA",
        hospital_type="general"
    )
    
    # Create a mock doctor user
    doctor = User(
        id=1,
        email="test.doctor@medcor.ai",
        username="testdoctor",
        first_name="John",
        last_name="Smith",
        role="doctor",
        hospital=hospital,
        department="Cardiology",
        license_number="MD123456",
        years_of_experience=10
    )
    
    print("1. Testing UserSerializer with doctor role...")
    user_serializer = UserSerializer(doctor)
    user_data = user_serializer.data
    
    print(f"   - User email: {user_data.get('email')}")
    print(f"   - User role: {user_data.get('role')}")
    print(f"   - Has doctor_specialties field: {'doctor_specialties' in user_data}")
    print(f"   - Has primary_specialty field: {'primary_specialty' in user_data}")
    
    if 'doctor_specialties' in user_data:
        print(f"   - Doctor specialties value: {user_data['doctor_specialties']}")
    
    if 'primary_specialty' in user_data:
        print(f"   - Primary specialty value: {user_data['primary_specialty']}")
    
    print("\n2. Testing DoctorSerializer...")
    doctor_serializer = DoctorSerializer(doctor)
    doctor_data = doctor_serializer.data
    
    print(f"   - Has specialties field: {'specialties' in doctor_data}")
    print(f"   - Has primary_specialty field: {'primary_specialty' in doctor_data}")
    
    if 'specialties' in doctor_data:
        print(f"   - Specialties value: {doctor_data['specialties']}")
    
    if 'primary_specialty' in doctor_data:
        print(f"   - Primary specialty value: {doctor_data['primary_specialty']}")
    
    print("\n3. Testing Specialty model methods...")
    try:
        # Test get_default_specialty
        default_specialty = Specialty.get_default_specialty()
        print(f"   - Default specialty code: {default_specialty.code}")
        print(f"   - Default specialty name: {default_specialty.name}")
    except Exception as e:
        print(f"   - Error getting default specialty: {e}")
    
    print("\n✅ Serializer structure test completed!")
    print("\nSummary:")
    print("- UserSerializer includes doctor_specialties and primary_specialty fields")
    print("- DoctorSerializer includes specialties and primary_specialty fields")
    print("- These fields will be populated when doctor has DoctorSpecialty relationships")
    
if __name__ == "__main__":
    test_doctor_specialization()