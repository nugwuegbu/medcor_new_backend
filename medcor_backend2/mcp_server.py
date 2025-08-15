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
from appointments.models import Appointment, DoctorAvailabilitySlot
from medical_records.models import MedicalRecord
from treatments.models import Treatment, Prescription
from subscription_plans.models import SubscriptionPlan, Subscription
from specialty.models import Specialty, DoctorSpecialty

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
    hospital_type: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """List all hospitals in the system with filters."""
    queryset = Hospital.objects.all()
    
    if is_active is not None:
        queryset = queryset.filter(is_active=is_active)
    
    if hospital_type:
        queryset = queryset.filter(hospital_type__icontains=hospital_type)
    
    if city:
        queryset = queryset.filter(city__icontains=city)
    
    hospitals = queryset[:limit]
    
    return [{
        "id": str(h.id),
        "name": h.name,
        "subdomain": h.subdomain,
        "hospital_type": h.hospital_type,
        "city": h.city,
        "state": h.state,
        "country": h.country,
        "status": h.subscription_status,
        "total_doctors": User.objects.filter(hospital=h, role='DOCTOR', is_active=True).count(),
        "total_patients": User.objects.filter(hospital=h, role='PATIENT', is_active=True).count(),
        "is_active": h.is_active
    } for h in hospitals]


@mcp.tool()
def get_hospital_details(
    hospital_id: str
) -> Dict[str, Any]:
    """Get detailed information about a specific hospital."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        
        # Count users by role
        doctor_count = User.objects.filter(hospital=hospital, role='doctor', is_active=True).count()
        patient_count = User.objects.filter(hospital=hospital, role='patient', is_active=True).count()
        nurse_count = User.objects.filter(hospital=hospital, role='nurse', is_active=True).count()
        
        return {
            "success": True,
            "hospital": {
                "id": str(hospital.id),
                "name": hospital.name,
                "subdomain": hospital.subdomain,
                "registration_number": hospital.registration_number,
                "email": hospital.email,
                "phone_number": hospital.phone_number,
                "address_line1": hospital.address_line1,
                "address_line2": hospital.address_line2,
                "city": hospital.city,
                "state": hospital.state,
                "country": hospital.country,
                "postal_code": hospital.postal_code,
                "hospital_type": hospital.hospital_type,
                "is_active": hospital.is_active,
                "subscription_status": hospital.subscription_status,
                "subscription_plan": hospital.subscription_plan.name if hospital.subscription_plan else None,
                "created_at": hospital.created_at.isoformat(),
                "statistics": {
                    "total_doctors": doctor_count,
                    "total_patients": patient_count,
                    "total_nurses": nurse_count,
                    "total_users": doctor_count + patient_count + nurse_count
                }
            }
        }
    except Hospital.DoesNotExist:
        return {"success": False, "error": "Hospital not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def update_hospital(
    hospital_id: str,
    name: Optional[str] = None,
    email: Optional[str] = None,
    phone_number: Optional[str] = None,
    address_line1: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    is_active: Optional[bool] = None
) -> Dict[str, Any]:
    """Update hospital information."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        
        if name:
            hospital.name = name
        if email:
            hospital.email = email
        if phone_number:
            hospital.phone_number = phone_number
        if address_line1:
            hospital.address_line1 = address_line1
        if city:
            hospital.city = city
        if state:
            hospital.state = state
        if is_active is not None:
            hospital.is_active = is_active
        
        hospital.save()
        
        return {
            "success": True,
            "hospital_id": str(hospital.id),
            "name": hospital.name,
            "updated": True
        }
    except Hospital.DoesNotExist:
        return {"success": False, "error": "Hospital not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


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
    department: Optional[str] = None,
    is_active: bool = True,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """List all doctors in a hospital with enhanced filters."""
    queryset = User.objects.filter(
        hospital_id=hospital_id,
        role='DOCTOR',
        is_active=is_active
    ).prefetch_related('doctor_specialties__specialty')
    
    if specialization:
        queryset = queryset.filter(specialization__icontains=specialization)
    
    if department:
        queryset = queryset.filter(department__icontains=department)
    
    doctors = queryset[:limit]
    
    result = []
    for d in doctors:
        # Get primary specialty if available
        primary_specialty = None
        all_specialties = []
        
        try:
            doctor_specialties = d.doctor_specialties.all()
            for ds in doctor_specialties:
                spec_info = {
                    "name": ds.specialty.name,
                    "code": ds.specialty.code,
                    "is_primary": ds.is_primary
                }
                all_specialties.append(spec_info)
                if ds.is_primary:
                    primary_specialty = ds.specialty.name
        except:
            pass
        
        result.append({
            "id": str(d.id),
            "name": d.get_full_name(),
            "email": d.email,
            "phone_number": d.phone_number,
            "specialization": d.specialization or primary_specialty or "General Medicine",
            "primary_specialty": primary_specialty,
            "all_specialties": all_specialties,
            "department": d.department,
            "years_of_experience": d.years_of_experience,
            "is_active": d.is_active
        })
    
    return result


@mcp.tool()
def get_doctor_details(
    doctor_id: str
) -> Dict[str, Any]:
    """Get detailed information about a specific doctor."""
    try:
        doctor = User.objects.prefetch_related(
            'doctor_specialties__specialty',
            'appointments_as_doctor'
        ).get(id=doctor_id, role='DOCTOR')
        
        # Get specialties
        specialties = []
        primary_specialty = None
        for ds in doctor.doctor_specialties.all():
            spec_info = {
                "id": str(ds.specialty.id),
                "name": ds.specialty.name,
                "code": ds.specialty.code,
                "is_primary": ds.is_primary,
                "years_of_experience": ds.years_of_experience,
                "certification_date": str(ds.certification_date) if ds.certification_date else None
            }
            specialties.append(spec_info)
            if ds.is_primary:
                primary_specialty = ds.specialty.name
        
        # Count appointments
        total_appointments = doctor.appointments_as_doctor.count()
        completed_appointments = doctor.appointments_as_doctor.filter(status='COMPLETED').count()
        upcoming_appointments = doctor.appointments_as_doctor.filter(status='SCHEDULED').count()
        
        return {
            "success": True,
            "doctor": {
                "id": str(doctor.id),
                "email": doctor.email,
                "first_name": doctor.first_name,
                "last_name": doctor.last_name,
                "full_name": doctor.get_full_name(),
                "phone_number": doctor.phone_number,
                "department": doctor.department,
                "specialization": doctor.specialization or primary_specialty or "General Medicine",
                "primary_specialty": primary_specialty,
                "specialties": specialties,
                "years_of_experience": doctor.years_of_experience,
                "license_number": doctor.license_number,
                "hospital_id": str(doctor.hospital.id),
                "hospital_name": doctor.hospital.name,
                "is_active": doctor.is_active,
                "created_at": doctor.created_at.isoformat(),
                "statistics": {
                    "total_appointments": total_appointments,
                    "completed_appointments": completed_appointments,
                    "upcoming_appointments": upcoming_appointments
                }
            }
        }
    except User.DoesNotExist:
        return {"success": False, "error": "Doctor not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ========== SPECIALTY TOOLS ==========

@mcp.tool()
def list_specialties(
    search: Optional[str] = None,
    is_active: bool = True,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """List all medical specialties available in the system."""
    queryset = Specialty.objects.filter(is_active=is_active)
    
    if search:
        queryset = queryset.filter(name__icontains=search)
    
    specialties = queryset.order_by('name')[:limit]
    
    return [{
        "id": str(s.id),
        "code": s.code,
        "name": s.name,
        "description": s.description,
        "is_active": s.is_active
    } for s in specialties]


@mcp.tool()
def create_specialty(
    code: str,
    name: str,
    description: str
) -> Dict[str, Any]:
    """Create a new medical specialty."""
    try:
        specialty = Specialty.objects.create(
            code=code.upper(),
            name=name,
            description=description
        )
        return {
            "success": True,
            "specialty_id": str(specialty.id),
            "code": specialty.code,
            "name": specialty.name
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def assign_doctor_specialty(
    doctor_id: str,
    specialty_id: str,
    is_primary: bool = False,
    years_of_experience: int = 0,
    certification_date: Optional[str] = None  # Format: YYYY-MM-DD
) -> Dict[str, Any]:
    """Assign a specialty to a doctor."""
    try:
        doctor = User.objects.get(id=doctor_id, role='DOCTOR')
        specialty = Specialty.objects.get(id=specialty_id)
        
        # If setting as primary, unset other primary specialties
        if is_primary:
            DoctorSpecialty.objects.filter(
                doctor=doctor,
                is_primary=True
            ).update(is_primary=False)
        
        doctor_specialty = DoctorSpecialty.objects.create(
            doctor=doctor,
            specialty=specialty,
            is_primary=is_primary,
            years_of_experience=years_of_experience,
            certification_date=datetime.strptime(certification_date, '%Y-%m-%d').date() if certification_date else None
        )
        
        return {
            "success": True,
            "doctor": doctor.get_full_name(),
            "specialty": specialty.name,
            "is_primary": is_primary
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def list_doctor_specialties(
    doctor_id: str
) -> List[Dict[str, Any]]:
    """List all specialties for a specific doctor."""
    doctor_specialties = DoctorSpecialty.objects.filter(
        doctor_id=doctor_id
    ).select_related('specialty').order_by('-is_primary', 'specialty__name')
    
    return [{
        "id": str(ds.id),
        "specialty_id": str(ds.specialty.id),
        "specialty_code": ds.specialty.code,
        "specialty_name": ds.specialty.name,
        "is_primary": ds.is_primary,
        "years_of_experience": ds.years_of_experience,
        "certification_date": str(ds.certification_date) if ds.certification_date else None
    } for ds in doctor_specialties]


@mcp.tool()
def get_doctors_by_specialty(
    hospital_id: str,
    specialty_id: str,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """Get all doctors in a hospital with a specific specialty."""
    doctor_specialties = DoctorSpecialty.objects.filter(
        specialty_id=specialty_id,
        doctor__hospital_id=hospital_id,
        doctor__is_active=True
    ).select_related('doctor', 'specialty')[:limit]
    
    return [{
        "doctor_id": str(ds.doctor.id),
        "doctor_name": ds.doctor.get_full_name(),
        "doctor_email": ds.doctor.email,
        "specialty": ds.specialty.name,
        "is_primary": ds.is_primary,
        "years_of_experience": ds.years_of_experience
    } for ds in doctor_specialties]


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
    date_from: Optional[str] = None,  # Format: YYYY-MM-DD
    date_to: Optional[str] = None,
    is_available: bool = True
) -> List[Dict[str, Any]]:
    """List available appointment slots for a doctor."""
    queryset = DoctorAvailabilitySlot.objects.filter(
        doctor_id=doctor_id,
        is_available=is_available
    )
    
    if date_from:
        from_datetime = datetime.strptime(date_from, '%Y-%m-%d')
        queryset = queryset.filter(start_time__gte=from_datetime)
    
    if date_to:
        to_datetime = datetime.strptime(date_to, '%Y-%m-%d')
        queryset = queryset.filter(end_time__lte=to_datetime)
    
    slots = queryset[:50]
    
    return [{
        "id": str(s.id),
        "start_time": s.start_time.isoformat(),
        "end_time": s.end_time.isoformat(),
        "is_available": s.is_available,
        "duration_minutes": (s.end_time - s.start_time).total_seconds() / 60
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
    patient_id: Optional[str] = None,
    record_type: Optional[str] = None,
    created_by_id: Optional[str] = None,
    date_from: Optional[str] = None,  # Format: YYYY-MM-DD
    date_to: Optional[str] = None,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """List medical records with various filters."""
    queryset = MedicalRecord.objects.filter(hospital_id=hospital_id)
    
    if patient_id:
        queryset = queryset.filter(patient_id=patient_id)
    
    if created_by_id:
        queryset = queryset.filter(created_by_id=created_by_id)
    
    if record_type:
        queryset = queryset.filter(record_type=record_type)
    
    if date_from:
        from_date = datetime.strptime(date_from, '%Y-%m-%d')
        queryset = queryset.filter(created_at__gte=from_date)
    
    if date_to:
        to_date = datetime.strptime(date_to, '%Y-%m-%d')
        queryset = queryset.filter(created_at__lte=to_date)
    
    records = queryset.select_related('patient', 'created_by').order_by('-created_at')[:limit]
    
    return [{
        "id": str(r.id),
        "patient_id": str(r.patient.id),
        "patient_name": r.patient.get_full_name(),
        "title": r.title,
        "type": r.record_type,
        "description": r.description,
        "diagnosis": r.diagnosis,
        "symptoms": r.symptoms,
        "created_by": r.created_by.get_full_name() if r.created_by else "System",
        "created_at": r.created_at.isoformat(),
        "appointment_id": str(r.appointment_id) if r.appointment_id else None
    } for r in records]


@mcp.tool()
def get_medical_record_details(
    record_id: str
) -> Dict[str, Any]:
    """Get detailed information about a specific medical record."""
    try:
        record = MedicalRecord.objects.select_related('patient', 'created_by', 'hospital').get(id=record_id)
        
        return {
            "success": True,
            "record": {
                "id": str(record.id),
                "hospital_id": str(record.hospital.id),
                "hospital_name": record.hospital.name,
                "patient_id": str(record.patient.id),
                "patient_name": record.patient.get_full_name(),
                "patient_email": record.patient.email,
                "title": record.title,
                "type": record.record_type,
                "description": record.description,
                "diagnosis": record.diagnosis,
                "symptoms": record.symptoms,
                "appointment_id": str(record.appointment_id) if record.appointment_id else None,
                "created_by_id": str(record.created_by.id) if record.created_by else None,
                "created_by_name": record.created_by.get_full_name() if record.created_by else "System",
                "created_at": record.created_at.isoformat(),
                "updated_at": record.updated_at.isoformat()
            }
        }
    except MedicalRecord.DoesNotExist:
        return {"success": False, "error": "Medical record not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def update_medical_record(
    record_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    diagnosis: Optional[str] = None,
    symptoms: Optional[str] = None
) -> Dict[str, Any]:
    """Update an existing medical record."""
    try:
        record = MedicalRecord.objects.get(id=record_id)
        
        if title:
            record.title = title
        if description:
            record.description = description
        if diagnosis:
            record.diagnosis = diagnosis
        if symptoms:
            record.symptoms = symptoms
        
        record.save()
        
        return {
            "success": True,
            "record_id": str(record.id),
            "title": record.title,
            "updated": True
        }
    except MedicalRecord.DoesNotExist:
        return {"success": False, "error": "Medical record not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


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


@mcp.resource("hospitals://details/{hospital_id}")
def get_hospital_details_resource(hospital_id: str) -> str:
    """Get detailed information about a specific hospital."""
    details = get_hospital_details(hospital_id)
    return json.dumps(details, indent=2)


@mcp.resource("doctors://list/{hospital_id}")
def get_doctors_resource(hospital_id: str) -> str:
    """Get list of doctors in a hospital as a resource."""
    doctors = list_doctors(hospital_id=hospital_id, limit=100)
    return json.dumps(doctors, indent=2)


@mcp.resource("doctors://details/{doctor_id}")
def get_doctor_details_resource(doctor_id: str) -> str:
    """Get detailed information about a specific doctor."""
    details = get_doctor_details(doctor_id)
    return json.dumps(details, indent=2)


@mcp.resource("specialties://list")
def get_specialties_resource() -> str:
    """Get list of all medical specialties."""
    specialties = list_specialties(limit=100)
    return json.dumps(specialties, indent=2)


@mcp.resource("specialties://doctors/{specialty_id}/{hospital_id}")
def get_doctors_by_specialty_resource(specialty_id: str, hospital_id: str) -> str:
    """Get all doctors in a hospital with a specific specialty."""
    doctors = get_doctors_by_specialty(hospital_id, specialty_id, limit=100)
    return json.dumps(doctors, indent=2)


@mcp.resource("medical_records://list/{hospital_id}")
def get_medical_records_resource(hospital_id: str) -> str:
    """Get list of medical records for a hospital."""
    records = list_medical_records(hospital_id=hospital_id, limit=100)
    return json.dumps(records, indent=2)


@mcp.resource("medical_records://patient/{patient_id}")
def get_patient_medical_records_resource(patient_id: str) -> str:
    """Get medical records for a specific patient."""
    # Get patient's hospital first
    try:
        patient = User.objects.get(id=patient_id)
        records = list_medical_records(
            hospital_id=str(patient.hospital.id),
            patient_id=patient_id,
            limit=100
        )
        return json.dumps(records, indent=2)
    except:
        return json.dumps({"error": "Patient not found"}, indent=2)


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


@mcp.resource("appointments://upcoming/{hospital_id}")
def get_upcoming_appointments_resource(hospital_id: str) -> str:
    """Get upcoming appointments for a hospital."""
    today = date.today().isoformat()
    appointments = list_appointments(
        hospital_id=hospital_id,
        date_from=today,
        status="SCHEDULED",
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