#!/usr/bin/env python3
"""
MedCor.ai MCP Server Implementation
FastMCP server with tools for healthcare entity management
"""

import os
import sys
import django
from typing import Dict, List, Any, Optional
import json
from datetime import datetime, date
from decimal import Decimal

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
django.setup()

from django.db import connection
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth.hashers import make_password
try:
    from fastmcp import FastMCP
    # Initialize FastMCP server
    mcp = FastMCP("MedCor Healthcare Management")
    FASTMCP_AVAILABLE = True
except ImportError:
    # Fallback for when fastmcp is not available
    print("FastMCP not available, using fallback implementation")
    FASTMCP_AVAILABLE = False
    
    class MockMCP:
        """Mock MCP server for development"""
        def __init__(self, name: str):
            self.name = name
            self.tools = {}
            self.resources = {}
            self.prompts = {}
        
        def tool(self):
            def decorator(func):
                self.tools[func.__name__] = func
                return func
            return decorator
        
        def resource(self, uri: str):
            def decorator(func):
                self.resources[uri] = func
                return func
            return decorator
        
        def prompt(self, name: str):
            def decorator(func):
                self.prompts[name] = func
                return func
            return decorator
        
        def run(self):
            print(f"Mock MCP Server '{self.name}' running...")
            print(f"Tools: {list(self.tools.keys())}")
            print(f"Resources: {list(self.resources.keys())}")
            print(f"Prompts: {list(self.prompts.keys())}")
    
    mcp = MockMCP("MedCor Healthcare Management")

# Import Django models
from tenants.models import User, Client
from treatments.models import Treatment
from appointment.models import Appointment, Slot

class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder for datetime objects"""
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        elif isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

def serialize_user(user: User) -> Dict[str, Any]:
    """Serialize User model to dictionary"""
    return {
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'phone_number': user.phone_number,
        'role': user.role,
        'is_active': user.is_active,
        'date_joined': user.date_joined.isoformat() if user.date_joined else None,
        'last_login': user.last_login.isoformat() if user.last_login else None,
        # Role-specific fields
        'medical_record_number': getattr(user, 'medical_record_number', None),
        'blood_type': getattr(user, 'blood_type', None),
        'insurance_provider': getattr(user, 'insurance_provider', None),
        'allergies': getattr(user, 'allergies', None),
        'specialization': getattr(user, 'specialization', None),
        'license_number': getattr(user, 'license_number', None),
        'department': getattr(user, 'department', None),
        'certification_level': getattr(user, 'certification_level', None),
    }

def serialize_treatment(treatment: Treatment) -> Dict[str, Any]:
    """Serialize Treatment model to dictionary"""
    return {
        'id': treatment.id,
        'name': treatment.name,
        'description': treatment.description,
        'cost': float(treatment.cost),
        'image': treatment.image.url if treatment.image else None,
        'tenant_id': treatment.tenant.id if treatment.tenant else None,
        'tenant_name': treatment.tenant.name if treatment.tenant else None,
        'created_at': treatment.created_at.isoformat() if hasattr(treatment, 'created_at') else None,
        'updated_at': treatment.updated_at.isoformat() if hasattr(treatment, 'updated_at') else None,
    }

def serialize_appointment(appointment: Appointment) -> Dict[str, Any]:
    """Serialize Appointment model to dictionary"""
    return {
        'id': appointment.id,
        'patient_id': appointment.patient.id if appointment.patient else None,
        'patient_name': f"{appointment.patient.first_name} {appointment.patient.last_name}" if appointment.patient else None,
        'doctor_id': appointment.doctor.id if appointment.doctor else None,
        'doctor_name': f"{appointment.doctor.first_name} {appointment.doctor.last_name}" if appointment.doctor else None,
        'treatment_id': appointment.treatment.id if appointment.treatment else None,
        'treatment_name': appointment.treatment.name if appointment.treatment else None,
        'date': appointment.date.isoformat() if appointment.date else None,
        'time': appointment.time.isoformat() if appointment.time else None,
        'status': appointment.status,
        'notes': appointment.notes,
        'tenant_id': appointment.tenant.id if appointment.tenant else None,
        'created_at': appointment.created_at.isoformat() if hasattr(appointment, 'created_at') else None,
        'updated_at': appointment.updated_at.isoformat() if hasattr(appointment, 'updated_at') else None,
    }

# Doctor Management Tools
@mcp.tool()
def list_doctors(limit: int = 10, active_only: bool = True) -> List[Dict[str, Any]]:
    """
    List doctors in the system.
    
    Args:
        limit: Maximum number of doctors to return (default: 10)
        active_only: Only return active doctors (default: True)
    
    Returns:
        List of doctor dictionaries with their information
    """
    try:
        queryset = User.objects.filter(role='doctor')
        if active_only:
            queryset = queryset.filter(is_active=True)
        
        doctors = queryset.order_by('first_name', 'last_name')[:limit]
        return [serialize_user(doctor) for doctor in doctors]
    except Exception as e:
        return [{"error": f"Failed to list doctors: {str(e)}"}]

@mcp.tool()
def create_doctor(
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    phone_number: Optional[str] = None,
    specialization: Optional[str] = None,
    license_number: Optional[str] = None,
    years_of_experience: Optional[int] = None
) -> Dict[str, Any]:
    """
    Create a new doctor in the system.
    
    Args:
        email: Doctor's email address (required)
        password: Doctor's password (required)
        first_name: Doctor's first name (required)
        last_name: Doctor's last name (required)
        phone_number: Doctor's phone number (optional)
        specialization: Doctor's medical specialization (optional)
        license_number: Doctor's medical license number (optional)
        years_of_experience: Years of medical experience (optional)
    
    Returns:
        Dictionary with created doctor information or error message
    """
    try:
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return {"error": f"User with email {email} already exists"}
        
        # Create the doctor user
        doctor = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number or '',
            role='doctor',
            is_active=True
        )
        
        # Set doctor-specific fields if provided
        if specialization:
            doctor.specialization = specialization
        if license_number:
            doctor.license_number = license_number
        if years_of_experience:
            doctor.years_of_experience = years_of_experience
        
        doctor.save()
        
        return {
            "success": True,
            "message": f"Doctor {first_name} {last_name} created successfully",
            "doctor": serialize_user(doctor)
        }
    except Exception as e:
        return {"error": f"Failed to create doctor: {str(e)}"}

# Nurse Management Tools
@mcp.tool()
def list_nurses(limit: int = 10, active_only: bool = True) -> List[Dict[str, Any]]:
    """
    List nurses in the system.
    
    Args:
        limit: Maximum number of nurses to return (default: 10)
        active_only: Only return active nurses (default: True)
    
    Returns:
        List of nurse dictionaries with their information
    """
    try:
        queryset = User.objects.filter(role='nurse')
        if active_only:
            queryset = queryset.filter(is_active=True)
        
        nurses = queryset.order_by('first_name', 'last_name')[:limit]
        return [serialize_user(nurse) for nurse in nurses]
    except Exception as e:
        return [{"error": f"Failed to list nurses: {str(e)}"}]

@mcp.tool()
def create_nurse(
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    phone_number: Optional[str] = None,
    department: Optional[str] = None,
    shift_schedule: Optional[str] = None,
    certification_level: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a new nurse in the system.
    
    Args:
        email: Nurse's email address (required)
        password: Nurse's password (required)
        first_name: Nurse's first name (required)
        last_name: Nurse's last name (required)
        phone_number: Nurse's phone number (optional)
        department: Nursing department (optional)
        shift_schedule: Work shift schedule (optional)
        certification_level: Nursing certification level (optional)
    
    Returns:
        Dictionary with created nurse information or error message
    """
    try:
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return {"error": f"User with email {email} already exists"}
        
        # Create the nurse user
        nurse = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number or '',
            role='nurse',
            is_active=True
        )
        
        # Set nurse-specific fields if provided
        if department:
            nurse.department = department
        if shift_schedule:
            nurse.shift_schedule = shift_schedule
        if certification_level:
            nurse.certification_level = certification_level
        
        nurse.save()
        
        return {
            "success": True,
            "message": f"Nurse {first_name} {last_name} created successfully",
            "nurse": serialize_user(nurse)
        }
    except Exception as e:
        return {"error": f"Failed to create nurse: {str(e)}"}

# Patient Management Tools
@mcp.tool()
def list_patients(limit: int = 10, active_only: bool = True) -> List[Dict[str, Any]]:
    """
    List patients in the system.
    
    Args:
        limit: Maximum number of patients to return (default: 10)
        active_only: Only return active patients (default: True)
    
    Returns:
        List of patient dictionaries with their information
    """
    try:
        queryset = User.objects.filter(role='patient')
        if active_only:
            queryset = queryset.filter(is_active=True)
        
        patients = queryset.order_by('first_name', 'last_name')[:limit]
        return [serialize_user(patient) for patient in patients]
    except Exception as e:
        return [{"error": f"Failed to list patients: {str(e)}"}]

@mcp.tool()
def create_patient(
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    phone_number: Optional[str] = None,
    date_of_birth: Optional[str] = None,
    medical_record_number: Optional[str] = None,
    blood_type: Optional[str] = None,
    insurance_provider: Optional[str] = None,
    allergies: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a new patient in the system.
    
    Args:
        email: Patient's email address (required)
        password: Patient's password (required)
        first_name: Patient's first name (required)
        last_name: Patient's last name (required)
        phone_number: Patient's phone number (optional)
        date_of_birth: Patient's date of birth in YYYY-MM-DD format (optional)
        medical_record_number: Patient's medical record number (optional)
        blood_type: Patient's blood type (optional)
        insurance_provider: Patient's insurance provider (optional)
        allergies: Patient's known allergies (optional)
    
    Returns:
        Dictionary with created patient information or error message
    """
    try:
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return {"error": f"User with email {email} already exists"}
        
        # Create the patient user
        patient_data = {
            'email': email,
            'password': password,
            'first_name': first_name,
            'last_name': last_name,
            'phone_number': phone_number or '',
            'role': 'patient',
            'is_active': True
        }
        
        # Add optional fields
        if date_of_birth:
            try:
                patient_data['date_of_birth'] = datetime.strptime(date_of_birth, '%Y-%m-%d').date()
            except ValueError:
                return {"error": "Invalid date_of_birth format. Use YYYY-MM-DD"}
        
        patient = User.objects.create_user(**patient_data)
        
        # Set patient-specific fields if provided
        if medical_record_number:
            patient.medical_record_number = medical_record_number
        if blood_type:
            patient.blood_type = blood_type
        if insurance_provider:
            patient.insurance_provider = insurance_provider
        if allergies:
            patient.allergies = allergies
        
        patient.save()
        
        return {
            "success": True,
            "message": f"Patient {first_name} {last_name} created successfully",
            "patient": serialize_user(patient)
        }
    except Exception as e:
        return {"error": f"Failed to create patient: {str(e)}"}

# Treatment Management Tools
@mcp.tool()
def list_treatments(limit: int = 10, tenant_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    List treatments available in the system.
    
    Args:
        limit: Maximum number of treatments to return (default: 10)
        tenant_id: Filter treatments by specific tenant (optional)
    
    Returns:
        List of treatment dictionaries with their information
    """
    try:
        queryset = Treatment.objects.all()
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)
        
        treatments = queryset.order_by('name')[:limit]
        return [serialize_treatment(treatment) for treatment in treatments]
    except Exception as e:
        return [{"error": f"Failed to list treatments: {str(e)}"}]

@mcp.tool()
def create_treatment(
    name: str,
    cost: float,
    description: Optional[str] = None,
    tenant_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Create a new treatment in the system.
    
    Args:
        name: Treatment name (required)
        cost: Treatment cost (required)
        description: Treatment description (optional)
        tenant_id: Tenant ID to associate treatment with (optional)
    
    Returns:
        Dictionary with created treatment information or error message
    """
    try:
        # Get tenant if provided
        tenant = None
        if tenant_id:
            try:
                tenant = Client.objects.get(id=tenant_id)
            except Client.DoesNotExist:
                return {"error": f"Tenant with ID {tenant_id} does not exist"}
        
        # Create the treatment
        treatment = Treatment.objects.create(
            name=name,
            description=description or '',
            cost=cost,
            tenant=tenant
        )
        
        return {
            "success": True,
            "message": f"Treatment '{name}' created successfully",
            "treatment": serialize_treatment(treatment)
        }
    except Exception as e:
        return {"error": f"Failed to create treatment: {str(e)}"}

# Appointment Management Tools
@mcp.tool()
def list_appointments(limit: int = 10, status: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    List appointments in the system.
    
    Args:
        limit: Maximum number of appointments to return (default: 10)
        status: Filter by appointment status (pending, confirmed, cancelled, completed) (optional)
    
    Returns:
        List of appointment dictionaries with their information
    """
    try:
        queryset = Appointment.objects.all()
        if status:
            queryset = queryset.filter(status=status)
        
        appointments = queryset.select_related(
            'patient', 'doctor', 'treatment', 'tenant'
        ).order_by('-created_at')[:limit]
        
        return [serialize_appointment(appointment) for appointment in appointments]
    except Exception as e:
        return [{"error": f"Failed to list appointments: {str(e)}"}]

@mcp.tool()
def create_appointment(
    patient_id: int,
    doctor_id: int,
    treatment_id: int,
    date: str,
    time: str,
    notes: Optional[str] = None,
    tenant_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Create a new appointment in the system.
    
    Args:
        patient_id: Patient ID (required)
        doctor_id: Doctor ID (required)
        treatment_id: Treatment ID (required)
        date: Appointment date in YYYY-MM-DD format (required)
        time: Appointment time in HH:MM format (required)
        notes: Additional notes (optional)
        tenant_id: Tenant ID (optional)
    
    Returns:
        Dictionary with created appointment information or error message
    """
    try:
        # Validate patient
        try:
            patient = User.objects.get(id=patient_id, role='patient')
        except User.DoesNotExist:
            return {"error": f"Patient with ID {patient_id} does not exist"}
        
        # Validate doctor
        try:
            doctor = User.objects.get(id=doctor_id, role='doctor')
        except User.DoesNotExist:
            return {"error": f"Doctor with ID {doctor_id} does not exist"}
        
        # Validate treatment
        try:
            treatment = Treatment.objects.get(id=treatment_id)
        except Treatment.DoesNotExist:
            return {"error": f"Treatment with ID {treatment_id} does not exist"}
        
        # Validate and parse date
        try:
            appointment_date = datetime.strptime(date, '%Y-%m-%d').date()
        except ValueError:
            return {"error": "Invalid date format. Use YYYY-MM-DD"}
        
        # Validate and parse time
        try:
            appointment_time = datetime.strptime(time, '%H:%M').time()
        except ValueError:
            return {"error": "Invalid time format. Use HH:MM"}
        
        # Get tenant if provided
        tenant = None
        if tenant_id:
            try:
                tenant = Client.objects.get(id=tenant_id)
            except Client.DoesNotExist:
                return {"error": f"Tenant with ID {tenant_id} does not exist"}
        
        # Create the appointment
        appointment = Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            treatment=treatment,
            date=appointment_date,
            time=appointment_time,
            notes=notes or '',
            status='pending',
            tenant=tenant
        )
        
        return {
            "success": True,
            "message": f"Appointment created successfully for {patient.first_name} {patient.last_name}",
            "appointment": serialize_appointment(appointment)
        }
    except Exception as e:
        return {"error": f"Failed to create appointment: {str(e)}"}

# MCP Resources
@mcp.resource("healthcare://doctors")
def get_doctors_resource() -> str:
    """Get all doctors as a resource"""
    doctors = list_doctors(limit=50, active_only=True)
    return json.dumps(doctors, cls=DateTimeEncoder, indent=2)

@mcp.resource("healthcare://nurses")
def get_nurses_resource() -> str:
    """Get all nurses as a resource"""
    nurses = list_nurses(limit=50, active_only=True)
    return json.dumps(nurses, cls=DateTimeEncoder, indent=2)

@mcp.resource("healthcare://patients")
def get_patients_resource() -> str:
    """Get all patients as a resource"""
    patients = list_patients(limit=50, active_only=True)
    return json.dumps(patients, cls=DateTimeEncoder, indent=2)

@mcp.resource("healthcare://treatments")
def get_treatments_resource() -> str:
    """Get all treatments as a resource"""
    treatments = list_treatments(limit=100)
    return json.dumps(treatments, cls=DateTimeEncoder, indent=2)

@mcp.resource("healthcare://appointments")
def get_appointments_resource() -> str:
    """Get all appointments as a resource"""
    appointments = list_appointments(limit=100)
    return json.dumps(appointments, cls=DateTimeEncoder, indent=2)

# MCP Prompts
@mcp.prompt("create_medical_staff")
def create_medical_staff_prompt() -> str:
    """Prompt template for creating medical staff (doctors and nurses)"""
    return """
You are an AI assistant helping to create medical staff profiles for MedCor.ai healthcare platform.

When creating a doctor, you need:
- Email address (unique)
- Password (minimum 8 characters)
- First name and last name
- Phone number (optional)
- Medical specialization (e.g., Cardiology, Neurology)
- Medical license number
- Years of experience

When creating a nurse, you need:
- Email address (unique)
- Password (minimum 8 characters)
- First name and last name
- Phone number (optional)
- Department (e.g., ICU, Emergency, Pediatrics)
- Shift schedule (e.g., Day, Night, Rotating)
- Certification level (e.g., RN, LPN, BSN)

Use the appropriate MCP tools: create_doctor() or create_nurse()
"""

@mcp.prompt("create_patient_profile")
def create_patient_profile_prompt() -> str:
    """Prompt template for creating patient profiles"""
    return """
You are an AI assistant helping to create patient profiles for MedCor.ai healthcare platform.

When creating a patient, you need:
- Email address (unique, required)
- Password (minimum 8 characters, required)
- First name and last name (required)
- Phone number (for appointment reminders)
- Date of birth (YYYY-MM-DD format)
- Medical record number (if available)
- Blood type (A+, A-, B+, B-, AB+, AB-, O+, O-)
- Insurance provider
- Known allergies

Use the create_patient() MCP tool with the collected information.
"""

@mcp.prompt("schedule_appointment")
def schedule_appointment_prompt() -> str:
    """Prompt template for scheduling appointments"""
    return """
You are an AI assistant helping to schedule appointments for MedCor.ai healthcare platform.

To schedule an appointment, you need:
- Patient ID (use list_patients() to find)
- Doctor ID (use list_doctors() to find)
- Treatment ID (use list_treatments() to find)
- Appointment date (YYYY-MM-DD format)
- Appointment time (HH:MM format)
- Additional notes (optional)
- Tenant ID (if multi-tenant setup)

Steps:
1. First, use list_patients() to find the patient
2. Use list_doctors() to find an appropriate doctor
3. Use list_treatments() to find the treatment
4. Create the appointment with create_appointment()

The system will validate all IDs and ensure the appointment doesn't conflict with existing schedules.
"""

if __name__ == "__main__":
    # Run the MCP server
    mcp.run()