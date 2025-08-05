import os
import sys
import django
from django.utils import timezone
from datetime import datetime, timedelta

# Add Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from appointment.models import Appointment, Slot
from treatment.models import Treatment
from tenants.models import User, Client

# Get or create users
doctor = User.objects.filter(email='doctor@medcor.ai').first()
patient = User.objects.filter(email='patient@medcor.ai').first()

if doctor and patient:
    # Get first tenant
    tenant = Client.objects.filter(schema_name='public').first()
    
    # Create some treatments if they don't exist
    treatments = [
        {"name": "General Checkup", "cost": 50.00, "description": "Routine health examination"},
        {"name": "Blood Test", "cost": 30.00, "description": "Complete blood count and analysis"},
        {"name": "X-Ray", "cost": 100.00, "description": "Radiographic imaging"},
        {"name": "Dental Cleaning", "cost": 75.00, "description": "Professional teeth cleaning"},
    ]
    
    for t_data in treatments:
        Treatment.objects.get_or_create(
            name=t_data["name"],
            tenant=tenant,
            defaults={"cost": t_data["cost"], "description": t_data["description"]}
        )
    
    # Create doctor's weekly slots if they don't exist
    days = [
        (1, "9:00", "17:00"),  # Monday
        (2, "9:00", "17:00"),  # Tuesday
        (3, "9:00", "17:00"),  # Wednesday
        (4, "9:00", "17:00"),  # Thursday
        (5, "9:00", "13:00"),  # Friday (half day)
    ]
    
    for day, start, end in days:
        # Create morning slots
        Slot.objects.get_or_create(
            doctor=doctor,
            day_of_week=day,
            start_time="09:00:00",
            end_time="10:00:00"
        )
        Slot.objects.get_or_create(
            doctor=doctor,
            day_of_week=day,
            start_time="10:00:00",
            end_time="11:00:00"
        )
        Slot.objects.get_or_create(
            doctor=doctor,
            day_of_week=day,
            start_time="11:00:00",
            end_time="12:00:00"
        )
        
        # Afternoon slots (except Friday)
        if day != 5:
            Slot.objects.get_or_create(
                doctor=doctor,
                day_of_week=day,
                start_time="14:00:00",
                end_time="15:00:00"
            )
            Slot.objects.get_or_create(
                doctor=doctor,
                day_of_week=day,
                start_time="15:00:00",
                end_time="16:00:00"
            )
            Slot.objects.get_or_create(
                doctor=doctor,
                day_of_week=day,
                start_time="16:00:00",
                end_time="17:00:00"
            )
    
    # Create some sample appointments
    treatment = Treatment.objects.first()
    slot = Slot.objects.filter(doctor=doctor).first()
    
    if treatment and slot:
        # Past appointment (completed)
        past_date = timezone.now().date() - timedelta(days=7)
        Appointment.objects.get_or_create(
            patient=patient,
            doctor=doctor,
            slot=slot,
            treatment=treatment,
            appointment_slot_date=past_date,
            appointment_slot_start_time=slot.start_time,
            appointment_slot_end_time=slot.end_time,
            appointment_status='Completed'
        )
        
        # Upcoming appointment
        future_date = timezone.now().date() + timedelta(days=3)
        Appointment.objects.get_or_create(
            patient=patient,
            doctor=doctor,
            slot=slot,
            treatment=treatment,
            appointment_slot_date=future_date,
            appointment_slot_start_time=slot.start_time,
            appointment_slot_end_time=slot.end_time,
            appointment_status='Approved'
        )
    
    print("Sample data created successfully!")
else:
    print("Please create doctor and patient users first!")