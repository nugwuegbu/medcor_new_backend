#!/usr/bin/env python
"""
Simple script to populate database with sample data
Using direct Django ORM without complex migrations
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
sys.path.append('/home/runner/workspace/medcor_backend')

django.setup()

def main():
    print("Starting simple database population...")
    
    try:
        # Import models after Django setup
        from core.models import Doctor, Appointment
        from simple_tenant.models import Tenant, Domain
        from treatment.models import Treatment
        from django.contrib.auth import get_user_model
        from django.contrib.auth.hashers import make_password
        
        User = get_user_model()
        
        print("Creating sample tenants...")
        # Create sample tenants first
        tenant_data = [
            {
                'name': 'MedCor Main Clinic',
                'schema_name': 'medcor_main',
                'contact_email': 'info@medcor.ai',
                'contact_phone': '+971-4-123-4567',
                'address': 'Dubai Healthcare City, Dubai, UAE'
            },
            {
                'name': 'Heart Care Cardiology',
                'schema_name': 'heart_care',
                'contact_email': 'info@heartcare.ae',
                'contact_phone': '+971-4-234-5678',
                'address': 'Jumeirah Medical Center, Dubai, UAE'
            }
        ]
        
        tenants = []
        for tenant_info in tenant_data:
            tenant, created = Tenant.objects.get_or_create(
                name=tenant_info['name'],
                defaults=tenant_info
            )
            tenants.append(tenant)
            if created:
                print(f"Created tenant: {tenant.name}")
                # Create domain for each tenant
                domain, _ = Domain.objects.get_or_create(
                    domain=f"{tenant_info['schema_name']}.medcor.ai",
                    tenant=tenant,
                    defaults={'is_primary': True}
                )
        
        print("Creating sample doctors...")
        # Create sample doctors
        doctors_data = [
            {
                'name': 'Dr. Ahmed Al-Hassan',
                'specialty': 'Cardiology',
                'experience': 15,
                'education': 'MD - American University of Beirut',
                'bio': 'Experienced cardiologist specializing in interventional cardiology.',
                'photo': '/attached_assets/image_1753347597347.png'
            },
            {
                'name': 'Dr. Sarah Johnson', 
                'specialty': 'Dermatology',
                'experience': 12,
                'education': 'MD - Harvard Medical School',
                'bio': 'Expert in medical and cosmetic dermatology procedures.',
                'photo': '/attached_assets/image_1753347611799.png'
            },
            {
                'name': 'Dr. Mohammad Al-Rashid',
                'specialty': 'General Practice',
                'experience': 8,
                'education': 'MD - Dubai Medical College',
                'bio': 'Family medicine specialist focused on preventive care.',
                'photo': '/attached_assets/image_1753347597347.png'
            }
        ]
        
        created_doctors = []
        for doctor_info in doctors_data:
            doctor, created = Doctor.objects.get_or_create(
                name=doctor_info['name'],
                defaults=doctor_info
            )
            created_doctors.append(doctor)
            if created:
                print(f"Created doctor: {doctor.name}")
        
        print("Creating sample treatments...")
        # Create sample treatments (need tenant relationship)
        if tenants:
            main_tenant = tenants[0]  # Use first tenant
            treatments_data = [
                {
                    'name': 'General Consultation',
                    'description': '<p>Comprehensive medical consultation and examination</p>',
                    'cost': 150.00,
                    'tenant': main_tenant
                },
                {
                    'name': 'Cardiac Screening',
                    'description': '<p>Complete cardiac health assessment including ECG and stress test</p>',
                    'cost': 450.00,
                    'tenant': main_tenant
                },
                {
                    'name': 'Skin Analysis',
                    'description': '<p>Advanced AI-powered skin health analysis and recommendations</p>',
                    'cost': 200.00,
                    'tenant': main_tenant
                },
                {
                    'name': 'Dental Cleaning',
                    'description': '<p>Professional dental cleaning and oral health check</p>',
                    'cost': 180.00,
                    'tenant': main_tenant
                }
            ]
            
            for treatment_info in treatments_data:
                treatment, created = Treatment.objects.get_or_create(
                    name=treatment_info['name'],
                    tenant=treatment_info['tenant'],
                    defaults=treatment_info
                )
                if created:
                    print(f"Created treatment: {treatment.name}")
        
        print("Creating sample appointments...")
        # Create sample appointments
        doctors = Doctor.objects.all()
        
        if doctors.exists():
            for i in range(5):
                doctor = doctors[i % doctors.count()]
                
                appointment_date = datetime.now() + timedelta(days=i+1)
                
                appointment, created = Appointment.objects.get_or_create(
                    patient_email=f'patient{i+1}@example.com',
                    patient_name=f'Patient {i+1}',
                    doctor=doctor,
                    appointment_date=appointment_date,
                    defaults={
                        'patient_phone': f'+971-50-123-456{i}',
                        'appointment_time': f'{9+i}:00',
                        'reason': 'General consultation',
                        'status': 'confirmed'
                    }
                )
                if created:
                    print(f"Created appointment: {appointment.patient_name} with {appointment.doctor.name}")
        
        print("Database population completed successfully!")
        
        # Print summary
        print(f"\nSummary:")
        print(f"Tenants: {Tenant.objects.count()}")
        print(f"Domains: {Domain.objects.count()}")
        print(f"Doctors: {Doctor.objects.count()}")
        print(f"Treatments: {Treatment.objects.count()}")
        print(f"Appointments: {Appointment.objects.count()}")
        
    except Exception as e:
        print(f"Error during population: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()