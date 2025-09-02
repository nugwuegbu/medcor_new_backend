#!/usr/bin/env python3
"""
Create sample specialty data for MedCor Backend
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

from specialty.models import Specialty, DoctorSpecialty
from core.models import User

def create_specialties():
    """Create sample medical specialties"""
    specialties_data = [
        {
            'code': 'general_medicine',
            'name': 'General Medicine',
            'description': 'General medical practice covering common health issues',
            'certification_required': True,
            'years_of_training': 3
        },
        {
            'code': 'cardiology',
            'name': 'Cardiology',
            'description': 'Specialized in heart and cardiovascular system',
            'certification_required': True,
            'years_of_training': 5
        },
        {
            'code': 'pediatrics',
            'name': 'Pediatrics',
            'description': 'Medical care for infants, children, and adolescents',
            'certification_required': True,
            'years_of_training': 4
        },
        {
            'code': 'dermatology',
            'name': 'Dermatology',
            'description': 'Diagnosis and treatment of skin conditions',
            'certification_required': True,
            'years_of_training': 4
        },
        {
            'code': 'orthopedics',
            'name': 'Orthopedics',
            'description': 'Treatment of musculoskeletal system and injuries',
            'certification_required': True,
            'years_of_training': 5
        },
        {
            'code': 'psychiatry',
            'name': 'Psychiatry',
            'description': 'Mental health and behavioral disorders',
            'certification_required': True,
            'years_of_training': 4
        },
        {
            'code': 'neurology',
            'name': 'Neurology',
            'description': 'Nervous system disorders and brain conditions',
            'certification_required': True,
            'years_of_training': 5
        },
        {
            'code': 'ophthalmology',
            'name': 'Ophthalmology',
            'description': 'Eye care and vision disorders',
            'certification_required': True,
            'years_of_training': 4
        },
        {
            'code': 'surgery',
            'name': 'General Surgery',
            'description': 'Surgical procedures and operations',
            'certification_required': True,
            'years_of_training': 6
        },
        {
            'code': 'emergency_medicine',
            'name': 'Emergency Medicine',
            'description': 'Acute care and emergency situations',
            'certification_required': True,
            'years_of_training': 4
        }
    ]
    
    created_count = 0
    for specialty_data in specialties_data:
        specialty, created = Specialty.objects.get_or_create(
            code=specialty_data['code'],
            defaults=specialty_data
        )
        if created:
            created_count += 1
            print(f"✅ Created specialty: {specialty.name}")
        else:
            print(f"✅ Specialty already exists: {specialty.name}")
    
    print(f"\n📊 Total specialties: {Specialty.objects.count()}")
    return created_count

def assign_doctor_specialties():
    """Assign specialties to existing doctors"""
    try:
        # Get existing doctors
        doctors = User.objects.filter(role='DOCTOR', is_active=True)
        
        if not doctors.exists():
            print("⚠️  No doctors found to assign specialties")
            return
        
        # Get some specialties
        specialties = Specialty.objects.filter(is_active=True)[:5]
        
        for doctor in doctors:
            # Assign primary specialty
            primary_specialty = specialties.first()
            if primary_specialty:
                doctor_specialty, created = DoctorSpecialty.objects.get_or_create(
                    doctor=doctor,
                    specialty=primary_specialty,
                    defaults={
                        'is_primary': True,
                        'years_of_experience': 5,
                        'certification_date': '2020-01-01'
                    }
                )
                if created:
                    print(f"✅ Assigned {doctor.get_full_name()} to {primary_specialty.name} (Primary)")
                else:
                    print(f"✅ {doctor.get_full_name()} already has {primary_specialty.name}")
        
        print(f"\n👨‍⚕️  Doctor specialties assigned")
        
    except Exception as e:
        print(f"❌ Error assigning doctor specialties: {e}")

def main():
    """Main function to create all specialty data"""
    print("🏥 Creating specialty data for MedCor Backend...")
    print("=" * 50)
    
    # Create specialties
    specialties_created = create_specialties()
    
    # Assign doctor specialties
    assign_doctor_specialties()
    
    print("=" * 50)
    print("✅ Specialty data creation completed!")
    print(f"📊 You can now see {Specialty.objects.count()} specialties in the admin interface")

if __name__ == '__main__':
    main() 