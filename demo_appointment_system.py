#!/usr/bin/env python3
"""
MedCor Appointment System Demo Script

This script demonstrates the complete appointment system workflow:
1. Create schedule templates
2. Generate slots
3. Book appointments
4. Manage exceptions

Run this script to see the system in action!
"""

import requests
import json
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/appointments"

# You'll need to replace these with actual tokens and UUIDs
DOCTOR_TOKEN = "your_doctor_token_here"
PATIENT_TOKEN = "your_patient_token_here"
DOCTOR_UUID = "your_doctor_uuid_here"
PATIENT_UUID = "your_patient_uuid_here"
HOSPITAL_UUID = "your_hospital_uuid_here"

def make_request(method, url, data=None, token=None):
    """Make HTTP request with proper headers"""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    if method.upper() == "GET":
        response = requests.get(url, headers=headers)
    elif method.upper() == "POST":
        response = requests.post(url, headers=headers, json=data)
    elif method.upper() == "PUT":
        response = requests.put(url, headers=headers, json=data)
    elif method.upper() == "DELETE":
        response = requests.delete(url, headers=headers)
    
    return response

def demo_appointment_system():
    """Demonstrate the complete appointment system workflow"""
    
    print("🏥 MedCor Appointment System Demo")
    print("=" * 50)
    
    # Step 1: Create Schedule Templates
    print("\n📋 Step 1: Creating Schedule Templates")
    print("-" * 40)
    
    templates_data = {
        "doctor": DOCTOR_UUID,
        "templates": [
            {
                "day_of_week": 0,  # Monday
                "start_time": "09:00:00",
                "end_time": "17:00:00",
                "slot_duration_minutes": 30,
                "max_appointments_per_slot": 1,
                "allowed_appointment_types": ["CONSULTATION", "FOLLOW_UP"]
            },
            {
                "day_of_week": 1,  # Tuesday
                "start_time": "09:00:00",
                "end_time": "17:00:00",
                "slot_duration_minutes": 30,
                "max_appointments_per_slot": 1,
                "allowed_appointment_types": ["CONSULTATION", "FOLLOW_UP"]
            },
            {
                "day_of_week": 2,  # Wednesday
                "start_time": "09:00:00",
                "end_time": "17:00:00",
                "slot_duration_minutes": 30,
                "max_appointments_per_slot": 1,
                "allowed_appointment_types": ["CONSULTATION", "FOLLOW_UP"]
            },
            {
                "day_of_week": 3,  # Thursday
                "start_time": "09:00:00",
                "end_time": "17:00:00",
                "slot_duration_minutes": 30,
                "max_appointments_per_slot": 1,
                "allowed_appointment_types": ["CONSULTATION", "FOLLOW_UP"]
            },
            {
                "day_of_week": 4,  # Friday
                "start_time": "09:00:00",
                "end_time": "17:00:00",
                "slot_duration_minutes": 30,
                "max_appointments_per_slot": 1,
                "allowed_appointment_types": ["CONSULTATION", "FOLLOW_UP"]
            }
        ]
    }
    
    response = make_request("POST", f"{API_BASE}/templates/bulk_create/", templates_data, DOCTOR_TOKEN)
    if response.status_code == 201:
        print("✅ Schedule templates created successfully!")
        templates = response.json()
        print(f"   Created {len(templates)} templates")
    else:
        print(f"❌ Failed to create templates: {response.status_code}")
        print(f"   Error: {response.text}")
        return
    
    # Step 2: Generate Slots
    print("\n⏰ Step 2: Generating Available Slots")
    print("-" * 40)
    
    # Generate slots for next 30 days
    start_date = datetime.now().strftime("%Y-%m-%d")
    end_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    
    slots_data = {
        "doctor": DOCTOR_UUID,
        "start_date": start_date,
        "end_date": end_date,
        "overwrite_existing": False
    }
    
    response = make_request("POST", f"{API_BASE}/templates/generate_slots/", slots_data, DOCTOR_TOKEN)
    if response.status_code == 200:
        print("✅ Slots generated successfully!")
        slots = response.json()
        print(f"   Generated {len(slots)} slots")
        
        # Show first few slots
        print("   Sample slots:")
        for i, slot in enumerate(slots[:3]):
            print(f"   - {slot['date']} {slot['start_time']}-{slot['end_time']} ({slot['status']})")
    else:
        print(f"❌ Failed to generate slots: {response.status_code}")
        print(f"   Error: {response.text}")
        return
    
    # Step 3: Check Availability
    print("\n🔍 Step 3: Checking Doctor Availability")
    print("-" * 40)
    
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    availability_data = {
        "doctor": DOCTOR_UUID,
        "date": tomorrow,
        "appointment_type": "CONSULTATION"
    }
    
    response = make_request("POST", f"{API_BASE}/slots/check_availability/", availability_data, PATIENT_TOKEN)
    if response.status_code == 200:
        print("✅ Availability checked successfully!")
        availability = response.json()
        available_slots = availability.get('available_slots', [])
        print(f"   Found {len(available_slots)} available slots for {tomorrow}")
        
        if available_slots:
            print("   Available slots:")
            for slot in available_slots[:3]:
                print(f"   - {slot['start_time']}-{slot['end_time']} (Slot ID: {slot['id'][:8]}...)")
    else:
        print(f"❌ Failed to check availability: {response.status_code}")
        print(f"   Error: {response.text}")
        return
    
    # Step 4: Book Appointment
    print("\n🏥 Step 4: Booking Appointment")
    print("-" * 40)
    
    if available_slots:
        slot_id = available_slots[0]['id']
        booking_data = {
            "appointment_type": "CONSULTATION",
            "reason": "Regular checkup",
            "notes": "Patient feeling tired lately",
            "symptoms": "Fatigue, mild headache"
        }
        
        response = make_request("POST", f"{API_BASE}/slots/{slot_id}/book/", booking_data, PATIENT_TOKEN)
        if response.status_code == 201:
            print("✅ Appointment booked successfully!")
            appointment = response.json()
            print(f"   Appointment ID: {appointment['id']}")
            print(f"   Scheduled for: {appointment['scheduled_date']} at {appointment['scheduled_time']}")
            print(f"   Status: {appointment['status']}")
        else:
            print(f"❌ Failed to book appointment: {response.status_code}")
            print(f"   Error: {response.text}")
    else:
        print("⚠️  No available slots to book")
    
    # Step 5: Create Holiday Exception
    print("\n📅 Step 5: Creating Holiday Exception")
    print("-" * 40)
    
    # Create exception for next week
    exception_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    exception_data = {
        "doctor": DOCTOR_UUID,
        "exception_type": "HOLIDAY",
        "start_date": exception_date,
        "end_date": exception_date,
        "title": "Demo Holiday",
        "description": "Demo holiday exception for testing"
    }
    
    response = make_request("POST", f"{API_BASE}/exceptions/", exception_data, DOCTOR_TOKEN)
    if response.status_code == 201:
        print("✅ Holiday exception created successfully!")
        exception = response.json()
        print(f"   Exception ID: {exception['id']}")
        print(f"   Date: {exception['start_date']}")
        print(f"   Type: {exception['exception_type']}")
    else:
        print(f"❌ Failed to create exception: {response.status_code}")
        print(f"   Error: {response.text}")
    
    # Step 6: View Today's Appointments
    print("\n📋 Step 6: Viewing Today's Appointments")
    print("-" * 40)
    
    response = make_request("GET", f"{API_BASE}/appointments/today/", token=DOCTOR_TOKEN)
    if response.status_code == 200:
        print("✅ Today's appointments retrieved!")
        appointments = response.json()
        print(f"   Found {len(appointments)} appointments for today")
        
        for appointment in appointments[:3]:
            print(f"   - {appointment['scheduled_time']}: {appointment['appointment_type']} ({appointment['status']})")
    else:
        print(f"❌ Failed to get today's appointments: {response.status_code}")
        print(f"   Error: {response.text}")
    
    print("\n🎉 Demo completed successfully!")
    print("=" * 50)
    print("📚 For more information, check:")
    print(f"   - Swagger UI: {BASE_URL}/api/docs/")
    print(f"   - Complete Guide: APPOINTMENT_SYSTEM_GUIDE.md")
    print(f"   - Quick Reference: APPOINTMENT_QUICK_REFERENCE.md")
    print(f"   - Visual Flow: APPOINTMENT_VISUAL_FLOW.md")

if __name__ == "__main__":
    print("⚠️  IMPORTANT: Before running this demo, you need to:")
    print("   1. Replace the token and UUID variables at the top of this script")
    print("   2. Make sure Django server is running on localhost:8000")
    print("   3. Ensure you have valid authentication tokens")
    print()
    
    # Uncomment the line below to run the demo
    # demo_appointment_system()
    
    print("To run the demo, uncomment the last line and update the configuration variables.")