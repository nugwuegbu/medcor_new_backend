"""
FastMCP Server for MedCor Backend
Provides programmatic access to healthcare management functions.
"""

import os
import sys
import django
from fastmcp import FastMCP
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

# Import Django models after setup
from core.models import User
from tenants.models import Hospital
from appointments.models import Appointment, AppointmentSlot
from medical_records.models import MedicalRecord
from treatments.models import Treatment, Prescription
from subscription_plans.models import SubscriptionPlan, Subscription

# Initialize FastMCP server
mcp = FastMCP("MedCor Healthcare MCP Server")

# ========== HOSPITAL (TENANT) TOOLS ==========

@mcp.tool()
def create_hospital(
    name: str,
    subdomain: str,
    registration_number: str,
    email: str,
    phone_number: str,
    address_line1: str,
    city: str,
    state: str,
    country: str,
    postal_code: str,
    hospital_type: str = "General"
) -> Dict[str, Any]:
    """Create a new hospital (tenant) in the system."""
    try:
        hospital = Hospital.objects.create(
            name=name,
            subdomain=subdomain,
            registration_number=registration_number,
            email=email,
            phone_number=phone_number,
            address_line1=address_line1,
            city=city,
            state=state,
            country=country,
            postal_code=postal_code,
            hospital_type=hospital_type
        )
        return {
            "success": True,
            "hospital_id": str(hospital.id),
            "name": hospital.name,
            "subdomain": hospital.subdomain
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def list_hospitals(
    is_active: Optional[bool] = True,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """List all hospitals in the system."""
    hospitals = Hospital.objects.filter(is_active=is_active)[:limit]
    return [{
        "id": str(h.id),
        "name": h.name,
        "subdomain": h.subdomain,
        "status": h.subscription_status,
        "total_doctors": h.total_doctors,
        "total_patients": h.total_patients
    } for h in hospitals]


# ========== USER MANAGEMENT TOOLS ==========

@mcp.tool()
def create_user(
    email: str,
    first_name: str,
    last_name: str,
    role: str,
    hospital_id: str,
    password: str,
    phone_number: Optional[str] = None,
    department: Optional[str] = None,
    specialization: Optional[str] = None
) -> Dict[str, Any]:
    """Create a new user in the system."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            hospital=hospital,
            phone_number=phone_number or "",
            department=department or "",
            specialization=specialization or ""
        )
        return {
            "success": True,
            "user_id": str(user.id),
            "email": user.email,
            "role": user.role
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def list_users(
    hospital_id: str,
    role: Optional[str] = None,
    is_active: bool = True,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """List users in a hospital."""
    queryset = User.objects.filter(
        hospital_id=hospital_id,
        is_active=is_active
    )
    if role:
        queryset = queryset.filter(role=role)
    
    users = queryset[:limit]
    return [{
        "id": str(u.id),
        "email": u.email,
        "full_name": u.get_full_name(),
        "role": u.role,
        "department": u.department,
        "specialization": u.specialization
    } for u in users]


@mcp.tool()
def list_doctors(
    hospital_id: str,
    specialization: Optional[str] = None,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """List all doctors in a hospital."""
    queryset = User.objects.filter(
        hospital_id=hospital_id,
        role='DOCTOR',
        is_active=True
    )
    if specialization:
        queryset = queryset.filter(specialization__icontains=specialization)
    
    doctors = queryset[:limit]
    return [{
        "id": str(d.id),
        "name": d.get_full_name(),
        "email": d.email,
        "specialization": d.specialization,
        "department": d.department,
        "years_of_experience": d.years_of_experience
    } for d in doctors]


# ========== APPOINTMENT TOOLS ==========

@mcp.tool()
def create_appointment(
    hospital_id: str,
    patient_id: str,
    doctor_id: str,
    scheduled_date: str,  # Format: YYYY-MM-DD
    scheduled_time: str,  # Format: HH:MM
    reason: str,
    appointment_type: str = "CONSULTATION",
    duration_minutes: int = 30
) -> Dict[str, Any]:
    """Create a new appointment."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        patient = User.objects.get(id=patient_id, role='PATIENT')
        doctor = User.objects.get(id=doctor_id, role='DOCTOR')
        
        appointment = Appointment.objects.create(
            hospital=hospital,
            patient=patient,
            doctor=doctor,
            scheduled_date=datetime.strptime(scheduled_date, '%Y-%m-%d').date(),
            scheduled_time=datetime.strptime(scheduled_time, '%H:%M').time(),
            reason=reason,
            appointment_type=appointment_type,
            duration_minutes=duration_minutes
        )
        
        return {
            "success": True,
            "appointment_id": str(appointment.id),
            "patient": patient.get_full_name(),
            "doctor": doctor.get_full_name(),
            "scheduled": f"{scheduled_date} at {scheduled_time}"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def list_appointments(
    hospital_id: str,
    doctor_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """List appointments with filters."""
    queryset = Appointment.objects.filter(hospital_id=hospital_id)
    
    if doctor_id:
        queryset = queryset.filter(doctor_id=doctor_id)
    if patient_id:
        queryset = queryset.filter(patient_id=patient_id)
    if status:
        queryset = queryset.filter(status=status)
    if date_from:
        queryset = queryset.filter(scheduled_date__gte=date_from)
    if date_to:
        queryset = queryset.filter(scheduled_date__lte=date_to)
    
    appointments = queryset.select_related('patient', 'doctor')[:limit]
    
    return [{
        "id": str(a.id),
        "patient": a.patient.get_full_name(),
        "doctor": a.doctor.get_full_name(),
        "date": str(a.scheduled_date),
        "time": str(a.scheduled_time),
        "status": a.status,
        "type": a.appointment_type,
        "reason": a.reason
    } for a in appointments]


@mcp.tool()
def update_appointment_status(
    appointment_id: str,
    status: str,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """Update appointment status."""
    try:
        appointment = Appointment.objects.get(id=appointment_id)
        appointment.status = status
        if notes:
            appointment.notes = notes
        
        if status == 'IN_PROGRESS':
            appointment.start_time = datetime.now()
        elif status == 'COMPLETED':
            appointment.end_time_actual = datetime.now()
        
        appointment.save()
        
        return {
            "success": True,
            "appointment_id": str(appointment.id),
            "status": appointment.status
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def list_appointment_slots(
    hospital_id: str,
    doctor_id: str,
    date: str,  # Format: YYYY-MM-DD
    status: str = "AVAILABLE"
) -> List[Dict[str, Any]]:
    """List available appointment slots for a doctor."""
    slots = AppointmentSlot.objects.filter(
        hospital_id=hospital_id,
        doctor_id=doctor_id,
        date=date,
        status=status
    )
    
    return [{
        "id": str(s.id),
        "date": str(s.date),
        "start_time": str(s.start_time),
        "end_time": str(s.end_time),
        "status": s.status,
        "is_telemedicine": s.is_telemedicine
    } for s in slots]


# ========== MEDICAL RECORDS TOOLS ==========

@mcp.tool()
def create_medical_record(
    hospital_id: str,
    patient_id: str,
    created_by_id: str,
    title: str,
    description: str,
    record_type: str = "GENERAL",
    diagnosis: Optional[str] = None,
    symptoms: Optional[str] = None,
    appointment_id: Optional[str] = None
) -> Dict[str, Any]:
    """Create a new medical record."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        patient = User.objects.get(id=patient_id, role='PATIENT')
        created_by = User.objects.get(id=created_by_id)
        
        record = MedicalRecord.objects.create(
            hospital=hospital,
            patient=patient,
            created_by=created_by,
            title=title,
            description=description,
            record_type=record_type,
            diagnosis=diagnosis or "",
            symptoms=symptoms or "",
            appointment_id=appointment_id
        )
        
        return {
            "success": True,
            "record_id": str(record.id),
            "title": record.title,
            "patient": patient.get_full_name()
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def list_medical_records(
    hospital_id: str,
    patient_id: str,
    record_type: Optional[str] = None,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """List medical records for a patient."""
    queryset = MedicalRecord.objects.filter(
        hospital_id=hospital_id,
        patient_id=patient_id
    )
    
    if record_type:
        queryset = queryset.filter(record_type=record_type)
    
    records = queryset.select_related('created_by')[:limit]
    
    return [{
        "id": str(r.id),
        "title": r.title,
        "type": r.record_type,
        "description": r.description,
        "diagnosis": r.diagnosis,
        "created_by": r.created_by.get_full_name() if r.created_by else "System",
        "created_at": r.created_at.isoformat()
    } for r in records]


# ========== TREATMENT TOOLS ==========

@mcp.tool()
def create_treatment(
    hospital_id: str,
    patient_id: str,
    prescribed_by_id: str,
    name: str,
    description: str,
    instructions: str,
    start_date: str,  # Format: YYYY-MM-DD
    treatment_type: str = "MEDICATION",
    end_date: Optional[str] = None,
    appointment_id: Optional[str] = None
) -> Dict[str, Any]:
    """Create a new treatment plan."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        patient = User.objects.get(id=patient_id, role='PATIENT')
        prescribed_by = User.objects.get(id=prescribed_by_id, role='DOCTOR')
        
        treatment = Treatment.objects.create(
            hospital=hospital,
            patient=patient,
            prescribed_by=prescribed_by,
            name=name,
            description=description,
            instructions=instructions,
            treatment_type=treatment_type,
            start_date=datetime.strptime(start_date, '%Y-%m-%d').date(),
            end_date=datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else None,
            appointment_id=appointment_id
        )
        
        return {
            "success": True,
            "treatment_id": str(treatment.id),
            "name": treatment.name,
            "patient": patient.get_full_name()
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def list_treatments(
    hospital_id: str,
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """List treatments with filters."""
    queryset = Treatment.objects.filter(hospital_id=hospital_id)
    
    if patient_id:
        queryset = queryset.filter(patient_id=patient_id)
    if doctor_id:
        queryset = queryset.filter(prescribed_by_id=doctor_id)
    if status:
        queryset = queryset.filter(status=status)
    
    treatments = queryset.select_related('patient', 'prescribed_by')[:limit]
    
    return [{
        "id": str(t.id),
        "name": t.name,
        "type": t.treatment_type,
        "patient": t.patient.get_full_name(),
        "doctor": t.prescribed_by.get_full_name() if t.prescribed_by else "N/A",
        "status": t.status,
        "start_date": str(t.start_date),
        "end_date": str(t.end_date) if t.end_date else None
    } for t in treatments]


# ========== SUBSCRIPTION TOOLS ==========

@mcp.tool()
def list_subscription_plans(
    is_active: bool = True
) -> List[Dict[str, Any]]:
    """List available subscription plans."""
    plans = SubscriptionPlan.objects.filter(is_active=is_active)
    
    return [{
        "id": str(p.id),
        "name": p.name,
        "type": p.plan_type,
        "price": float(p.price),
        "billing_cycle": p.billing_cycle,
        "max_users": p.max_users,
        "max_doctors": p.max_doctors,
        "max_patients": p.max_patients,
        "features": p.features
    } for p in plans]


@mcp.tool()
def create_subscription(
    hospital_id: str,
    plan_id: str,
    start_date: str,  # Format: YYYY-MM-DD
    end_date: str  # Format: YYYY-MM-DD
) -> Dict[str, Any]:
    """Create a subscription for a hospital."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        plan = SubscriptionPlan.objects.get(id=plan_id)
        
        subscription = Subscription.objects.create(
            hospital=hospital,
            plan=plan,
            start_date=datetime.strptime(start_date, '%Y-%m-%d'),
            end_date=datetime.strptime(end_date, '%Y-%m-%d'),
            current_period_start=datetime.strptime(start_date, '%Y-%m-%d'),
            current_period_end=datetime.strptime(end_date, '%Y-%m-%d')
        )
        
        # Update hospital subscription status
        hospital.subscription_plan = plan
        hospital.subscription_status = 'ACTIVE'
        hospital.save()
        
        return {
            "success": True,
            "subscription_id": str(subscription.id),
            "hospital": hospital.name,
            "plan": plan.name
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ========== RESOURCES ==========

@mcp.resource("hospitals://list")
def get_hospitals_resource() -> str:
    """Get list of all hospitals as a resource."""
    hospitals = list_hospitals(limit=100)
    return json.dumps(hospitals, indent=2)


@mcp.resource("doctors://list/{hospital_id}")
def get_doctors_resource(hospital_id: str) -> str:
    """Get list of doctors in a hospital as a resource."""
    doctors = list_doctors(hospital_id=hospital_id, limit=100)
    return json.dumps(doctors, indent=2)


@mcp.resource("appointments://today/{hospital_id}")
def get_todays_appointments(hospital_id: str) -> str:
    """Get today's appointments for a hospital."""
    today = date.today().isoformat()
    appointments = list_appointments(
        hospital_id=hospital_id,
        date_from=today,
        date_to=today,
        limit=100
    )
    return json.dumps(appointments, indent=2)


# ========== PROMPTS ==========

@mcp.prompt()
def appointment_booking_prompt(
    patient_name: str,
    doctor_specialization: str,
    preferred_date: str
) -> str:
    """Generate a prompt for booking an appointment."""
    return f"""
    Help book an appointment for patient {patient_name}.
    They need to see a {doctor_specialization} specialist.
    Their preferred date is {preferred_date}.
    
    Steps:
    1. Find available doctors with the required specialization
    2. Check available slots for the preferred date
    3. Create the appointment
    4. Confirm the booking details
    """


@mcp.prompt()
def patient_onboarding_prompt(
    hospital_name: str,
    patient_email: str
) -> str:
    """Generate a prompt for onboarding a new patient."""
    return f"""
    Onboard a new patient to {hospital_name}.
    Patient email: {patient_email}
    
    Steps:
    1. Create patient account
    2. Set up initial medical record
    3. Schedule welcome appointment
    4. Send confirmation email
    """


@mcp.prompt()
def daily_operations_prompt(hospital_id: str) -> str:
    """Generate a prompt for daily hospital operations."""
    return f"""
    Review daily operations for hospital {hospital_id}.
    
    Tasks:
    1. Check today's appointments
    2. Review pending treatments
    3. Update patient records
    4. Generate daily report
    """


if __name__ == "__main__":
    # Run the MCP server
    mcp.run()