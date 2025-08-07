"""
Create test appointment data for Django backend
"""
import os
import sys
import django
from datetime import datetime, timedelta
from random import choice, randint

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from appointment.models import Appointment, Slot
from treatment.models import Treatment

User = get_user_model()

def create_test_appointments():
    """Create test appointments with proper relationships"""
    
    # Get or create test users
    try:
        admin_user = User.objects.get(email='admin@medcor.ai')
    except User.DoesNotExist:
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@medcor.ai',
            password='Admin123!'
        )
        print(f"Created admin user: {admin_user.email}")
    
    # Create doctor users
    doctors = []
    for i in range(1, 4):
        email = f'doctor{i}@medcor.ai'
        try:
            doctor = User.objects.get(email=email)
        except User.DoesNotExist:
            doctor = User.objects.create_user(
                username=f'doctor{i}',
                email=email,
                password='Doctor123!',
                first_name=f'Dr. John',
                last_name=f'Smith{i}'
            )
            print(f"Created doctor: {doctor.email}")
        doctors.append(doctor)
    
    # Create patient users
    patients = []
    for i in range(1, 6):
        email = f'patient{i}@medcor.ai'
        try:
            patient = User.objects.get(email=email)
        except User.DoesNotExist:
            patient = User.objects.create_user(
                username=f'patient{i}',
                email=email,
                password='Patient123!',
                first_name=f'Patient',
                last_name=f'User{i}'
            )
            print(f"Created patient: {patient.email}")
        patients.append(patient)
    
    # Create treatments
    treatment_names = ['General Checkup', 'Dental Cleaning', 'Eye Examination', 'Blood Test', 'X-Ray']
    treatments = []
    for name in treatment_names:
        treatment, created = Treatment.objects.get_or_create(
            name=name,
            defaults={
                'description': f'{name} procedure',
                'duration': timedelta(minutes=30),
                'price': randint(50, 200)
            }
        )
        treatments.append(treatment)
        if created:
            print(f"Created treatment: {treatment.name}")
    
    # Create time slots for doctors
    days_of_week = list(range(1, 8))  # Monday to Sunday
    for doctor in doctors:
        for day in days_of_week:
            for hour in [9, 10, 11, 14, 15, 16]:  # Morning and afternoon slots
                slot, created = Slot.objects.get_or_create(
                    doctor=doctor,
                    day_of_week=day,
                    start_time=datetime.strptime(f"{hour:02d}:00", "%H:%M").time(),
                    defaults={
                        'end_time': datetime.strptime(f"{hour+1:02d}:00", "%H:%M").time()
                    }
                )
                if created:
                    print(f"Created slot for {doctor.email} on day {day} at {hour}:00")
    
    # Create appointments
    statuses = ['Pending', 'Approved', 'Completed', 'Cancelled']
    today = datetime.now().date()
    
    appointment_count = 0
    for i in range(20):  # Create 20 test appointments
        doctor = choice(doctors)
        patient = choice(patients)
        treatment = choice(treatments)
        status = choice(statuses)
        
        # Get a random slot for the doctor
        doctor_slots = Slot.objects.filter(doctor=doctor)
        if doctor_slots.exists():
            slot = choice(doctor_slots)
            
            # Create appointment date (past or future)
            days_offset = randint(-30, 30)
            appointment_date = today + timedelta(days=days_offset)
            
            # Create appointment
            appointment, created = Appointment.objects.get_or_create(
                doctor=doctor,
                patient=patient,
                slot=slot,
                appointment_slot_date=appointment_date,
                defaults={
                    'treatment': treatment,
                    'appointment_status': status,
                    'appointment_slot_start_time': slot.start_time,
                    'appointment_slot_end_time': slot.end_time
                }
            )
            
            if created:
                appointment_count += 1
                print(f"Created appointment #{appointment.id}: {patient.email} with {doctor.email} on {appointment_date}")
    
    print(f"\n✅ Successfully created {appointment_count} test appointments!")
    
    # Print summary
    total_appointments = Appointment.objects.count()
    print(f"Total appointments in database: {total_appointments}")
    
    # Print appointment status breakdown
    for status in statuses:
        count = Appointment.objects.filter(appointment_status=status).count()
        print(f"  - {status}: {count}")

if __name__ == '__main__':
    create_test_appointments()