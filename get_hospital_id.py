#!/usr/bin/env python3
"""
Simple script to get hospital IDs for testing the AI query endpoint
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

from tenants.models import Hospital

def get_hospital_ids():
    """Get available hospital IDs"""
    try:
        hospitals = Hospital.objects.all()[:10]  # Get first 10 hospitals
        
        if not hospitals.exists():
            print("❌ No hospitals found in the database.")
            print("   You may need to create some sample data first.")
            return
        
        print("🏥 Available Hospitals:")
        print("=" * 50)
        
        for hospital in hospitals:
            print(f"ID: {hospital.id}")
            print(f"Name: {hospital.name}")
            print(f"City: {hospital.city}, {hospital.state}")
            print(f"Type: {hospital.hospital_type}")
            print(f"Active: {hospital.is_active}")
            print("-" * 30)
        
        print(f"\n📝 Total hospitals: {hospitals.count()}")
        print("\n💡 Copy one of the IDs above to use in your test script.")
        
    except Exception as e:
        print(f"❌ Error getting hospital IDs: {e}")

if __name__ == "__main__":
    get_hospital_ids()