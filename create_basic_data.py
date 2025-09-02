#!/usr/bin/env python3
"""
Create basic data for MedCor Backend
Creates superuser and basic test data
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import User

User = get_user_model()

def create_superuser():
    """Create a superuser account"""
    try:
        # Check if superuser already exists
        if User.objects.filter(is_superuser=True).exists():
            print("✅ Superuser already exists")
            return User.objects.filter(is_superuser=True).first()
        
        # Create superuser
        superuser = User.objects.create_superuser(
            email='admin@medcor.com',
            username='admin',
            password='admin123',
            first_name='Admin',
            last_name='User',
            role='ADMIN'
        )
        print(f"✅ Superuser created: {superuser.email}")
        return superuser
    except Exception as e:
        print(f"❌ Error creating superuser: {e}")
        return None

def create_test_users():
    """Create some basic test users"""
    try:
        # Create a doctor
        doctor, created = User.objects.get_or_create(
            email='doctor@medcor.com',
            defaults={
                'username': 'doctor',
                'first_name': 'John',
                'last_name': 'Smith',
                'role': 'DOCTOR',
                'specialization': 'Cardiology',
                'department': 'Cardiology',
                'is_active': True
            }
        )
        if created:
            doctor.set_password('doctor123')
            doctor.save()
            print(f"✅ Doctor created: {doctor.email}")
        else:
            print(f"✅ Doctor already exists: {doctor.email}")
        
        # Create a patient
        patient, created = User.objects.get_or_create(
            email='patient@medcor.com',
            defaults={
                'username': 'patient',
                'first_name': 'Jane',
                'last_name': 'Doe',
                'role': 'PATIENT',
                'is_active': True
            }
        )
        if created:
            patient.set_password('patient123')
            patient.save()
            print(f"✅ Patient created: {patient.email}")
        else:
            print(f"✅ Patient already exists: {patient.email}")
        
        # Create a nurse
        nurse, created = User.objects.get_or_create(
            email='nurse@medcor.com',
            defaults={
                'username': 'nurse',
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'role': 'NURSE',
                'department': 'Emergency',
                'is_active': True
            }
        )
        if created:
            nurse.set_password('nurse123')
            nurse.save()
            print(f"✅ Nurse created: {nurse.email}")
        else:
            print(f"✅ Nurse already exists: {nurse.email}")
            
    except Exception as e:
        print(f"❌ Error creating test users: {e}")

def main():
    """Main function to create all basic data"""
    print("🏥 Creating basic data for MedCor Backend...")
    print("=" * 50)
    
    # Create superuser
    superuser = create_superuser()
    
    # Create test users
    create_test_users()
    
    print("=" * 50)
    print("✅ Basic data creation completed!")
    print("\n📋 Login Credentials:")
    print("Superuser: admin@medcor.com / admin123")
    print("Doctor: doctor@medcor.com / doctor123")
    print("Patient: patient@medcor.com / patient123")
    print("Nurse: nurse@medcor.com / nurse123")
    print("\n🌐 Access the admin interface at: http://localhost:8000/admin/")

if __name__ == '__main__':
    main() 