"""
FastMCP Server for MedCor Backend
Provides programmatic access to healthcare management functions.
"""

import json
import os
import sys
from datetime import date, datetime, time
from typing import Any, Dict, List, Optional

import django
from fastmcp import FastMCP

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medcor_backend2.settings")
django.setup()

from appointments.models import Appointment, DoctorScheduleSlot

# Import Django models after setup
from core.models import User, Certification
from knowledgebase.models import Ai_Identity, Behavior, Response, Source, SourceFile
from medical_records.models import MedicalRecord
from specialty.models import DoctorSpecialty, Specialty
from subscription_plans.models import Subscription, SubscriptionPlan
from tenants.models import Hospital
from treatments.models import Prescription, Treatment
from services.models import Service
from core.models import Certification

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
    hospital_type: str = "General",
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
            hospital_type=hospital_type,
        )
        return {
            "success": True,
            "hospital_id": str(hospital.id),
            "name": hospital.name,
            "subdomain": hospital.subdomain,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def list_hospitals(
    is_active: Optional[bool] = True,
    hospital_type: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = 20,
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

    return [
        {
            "id": str(h.id),
            "name": h.name,
            "subdomain": h.subdomain,
            "hospital_type": h.hospital_type,
            "city": h.city,
            "state": h.state,
            "country": h.country,
            "status": h.subscription_status,
            "total_doctors": User.objects.filter(
                hospital=h, role="DOCTOR", is_active=True
            ).count(),
            "total_patients": User.objects.filter(
                hospital=h, role="PATIENT", is_active=True
            ).count(),
            "is_active": h.is_active,
        }
        for h in hospitals
    ]


@mcp.tool()
def get_hospital_details(hospital_id: str) -> Dict[str, Any]:
    """Get detailed information about a specific hospital."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)

        # Count users by role
        doctor_count = User.objects.filter(
            hospital=hospital, role="doctor", is_active=True
        ).count()
        patient_count = User.objects.filter(
            hospital=hospital, role="patient", is_active=True
        ).count()
        nurse_count = User.objects.filter(
            hospital=hospital, role="nurse", is_active=True
        ).count()

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
                "subscription_plan": (
                    hospital.subscription_plan.name
                    if hospital.subscription_plan
                    else None
                ),
                "created_at": hospital.created_at.isoformat(),
                "statistics": {
                    "total_doctors": doctor_count,
                    "total_patients": patient_count,
                    "total_nurses": nurse_count,
                    "total_users": doctor_count + patient_count + nurse_count,
                },
            },
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
    is_active: Optional[bool] = None,
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
            "updated": True,
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
    specialization: Optional[str] = None,
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
            specialization=specialization or "",
        )
        return {
            "success": True,
            "user_id": str(user.id),
            "email": user.email,
            "role": user.role,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def list_users(
    hospital_id: str,
    role: Optional[str] = None,
    is_active: bool = True,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """List users in a hospital."""
    queryset = User.objects.filter(hospital_id=hospital_id, is_active=is_active)
    if role:
        queryset = queryset.filter(role=role)

    users = queryset[:limit]
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.get_full_name(),
            "role": u.role,
            "department": u.department,
            "specialization": u.specialization,
        }
        for u in users
    ]


@mcp.tool()
def list_doctors(
    hospital_id: str,
    specialization: Optional[str] = None,
    department: Optional[str] = None,
    is_active: bool = True,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """List all doctors in a hospital with enhanced filters."""
    # Validate hospital exists
    try:
        Hospital.objects.get(id=hospital_id)
    except Hospital.DoesNotExist:
        return [{"error": f"Hospital with ID {hospital_id} not found"}]
    
    queryset = User.objects.filter(
        hospital_id=hospital_id, role="DOCTOR", is_active=is_active
    ).prefetch_related("doctor_specialties__specialty")

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
                    "is_primary": ds.is_primary,
                }
                all_specialties.append(spec_info)
                if ds.is_primary:
                    primary_specialty = ds.specialty.name
        except:
            pass

        result.append(
            {
                "id": str(d.id),
                "name": d.get_full_name(),
                "email": d.email,
                "phone_number": d.phone_number,
                "specialization": d.specialization
                or primary_specialty
                or "General Medicine",
                "primary_specialty": primary_specialty,
                "all_specialties": all_specialties,
                "department": d.department,
                "years_of_experience": d.years_of_experience,
                "is_active": d.is_active,
            }
        )

    return result


@mcp.tool()
def get_doctor_details(doctor_id: str) -> Dict[str, Any]:
    """Get detailed information about a specific doctor."""
    try:
        doctor = User.objects.prefetch_related(
            "doctor_specialties__specialty", "appointments_as_doctor"
        ).get(id=doctor_id, role="DOCTOR")

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
                "certification_date": (
                    str(ds.certification_date) if ds.certification_date else None
                ),
            }
            specialties.append(spec_info)
            if ds.is_primary:
                primary_specialty = ds.specialty.name

        # Count appointments
        total_appointments = doctor.appointments_as_doctor.count()
        completed_appointments = doctor.appointments_as_doctor.filter(
            status="COMPLETED"
        ).count()
        upcoming_appointments = doctor.appointments_as_doctor.filter(
            status="SCHEDULED"
        ).count()

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
                "specialization": doctor.specialization
                or primary_specialty
                or "General Medicine",
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
                    "upcoming_appointments": upcoming_appointments,
                },
            },
        }
    except User.DoesNotExist:
        return {"success": False, "error": "Doctor not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def get_doctor_experience_details(doctor_id: str) -> Dict[str, Any]:
    """Get detailed experience information for a specific doctor."""
    try:
        doctor = User.objects.prefetch_related(
            "doctor_specialties__specialty"
        ).get(id=doctor_id, role="DOCTOR")

        # Get detailed experience from specialties
        experience_details = []
        total_experience = 0
        
        for ds in doctor.doctor_specialties.all():
            exp_info = {
                "specialty_name": ds.specialty.name,
                "specialty_code": ds.specialty.code,
                "years_in_specialty": ds.years_of_experience,
                "is_primary": ds.is_primary,
                "certification_date": (
                    str(ds.certification_date) if ds.certification_date else None
                ),
                "certification_age_years": (
                    (datetime.now().date() - ds.certification_date).days / 365.25
                    if ds.certification_date
                    else None
                ),
            }
            experience_details.append(exp_info)
            if ds.is_primary:
                total_experience = ds.years_of_experience

        # Calculate overall experience
        overall_experience = doctor.years_of_experience or total_experience

        return {
            "success": True,
            "doctor": {
                "id": str(doctor.id),
                "name": doctor.get_full_name(),
                "overall_years_experience": overall_experience,
                "primary_specialty_experience": total_experience,
                "experience_details": experience_details,
                "license_number": doctor.license_number,
                "department": doctor.department,
                "hospital_name": doctor.hospital.name,
            },
        }
    except User.DoesNotExist:
        return {"success": False, "error": "Doctor not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def get_doctor_qualifications(doctor_id: str) -> Dict[str, Any]:
    """Get detailed qualifications and certifications for a specific doctor."""
    try:
        doctor = User.objects.prefetch_related(
            "doctor_specialties__specialty"
        ).get(id=doctor_id, role="DOCTOR")

        # Get qualifications from specialties
        qualifications = []
        certifications = []
        
        for ds in doctor.doctor_specialties.all():
            qual_info = {
                "specialty": ds.specialty.name,
                "specialty_code": ds.specialty.code,
                "is_primary": ds.is_primary,
                "years_of_experience": ds.years_of_experience,
                "certification_date": (
                    str(ds.certification_date) if ds.certification_date else None
                ),
                "certification_status": "Certified" if ds.certification_date else "Not Certified",
            }
            qualifications.append(qual_info)
            
            if ds.certification_date:
                cert_info = {
                    "specialty": ds.specialty.name,
                    "certification_date": str(ds.certification_date),
                    "years_since_certification": (
                        (datetime.now().date() - ds.certification_date).days / 365.25
                    ),
                    "is_primary": ds.is_primary,
                }
                certifications.append(cert_info)

        return {
            "success": True,
            "doctor": {
                "id": str(doctor.id),
                "name": doctor.get_full_name(),
                "license_number": doctor.license_number,
                "department": doctor.department,
                "hospital_name": doctor.hospital.name,
                "qualifications": qualifications,
                "certifications": certifications,
                "total_specialties": len(qualifications),
                "certified_specialties": len(certifications),
            },
        }
    except User.DoesNotExist:
        return {"success": False, "error": "Doctor not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def count_doctors_by_hospital(hospital_id: str) -> Dict[str, Any]:
    """Count total number of doctors and specialists in a hospital."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        
        # Count all doctors
        total_doctors = User.objects.filter(
            hospital_id=hospital_id,
            role="DOCTOR",
            is_active=True
        ).count()
        
        # Count by primary specialty
        doctors_by_specialty = {}
        doctor_specialties = DoctorSpecialty.objects.filter(
            doctor__hospital_id=hospital_id,
            doctor__is_active=True,
            is_primary=True
        ).select_related('specialty', 'doctor')
        
        for ds in doctor_specialties:
            specialty_name = ds.specialty.name
            if specialty_name not in doctors_by_specialty:
                doctors_by_specialty[specialty_name] = 0
            doctors_by_specialty[specialty_name] += 1
        
        return {
            "success": True,
            "hospital": {
                "id": str(hospital.id),
                "name": hospital.name,
            },
            "total_doctors": total_doctors,
            "doctors_by_specialty": doctors_by_specialty,
            "specialty_count": len(doctors_by_specialty),
        }
    except Hospital.DoesNotExist:
        return {"success": False, "error": "Hospital not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def list_doctors_by_specialty(hospital_id: str, specialty_name: str) -> List[Dict[str, Any]]:
    """List all doctors with a specific specialty in a hospital."""
    try:
        # Validate hospital exists
        Hospital.objects.get(id=hospital_id)
        
        # Find specialty by name
        specialty = Specialty.objects.filter(
            name__icontains=specialty_name
        ).first()
        
        if not specialty:
            return [{"error": f"Specialty '{specialty_name}' not found"}]
        
        # Get doctors with this specialty
        doctor_specialties = DoctorSpecialty.objects.filter(
            specialty=specialty,
            doctor__hospital_id=hospital_id,
            doctor__is_active=True
        ).select_related('doctor', 'specialty')
        
        result = []
        for ds in doctor_specialties:
            doctor = ds.doctor
            result.append({
                "id": str(doctor.id),
                "name": doctor.get_full_name(),
                "email": doctor.email,
                "phone_number": doctor.phone_number,
                "department": doctor.department,
                "specialty": specialty.name,
                "is_primary": ds.is_primary,
                "years_of_experience": ds.years_of_experience or doctor.years_of_experience,
                "certification_date": (
                    str(ds.certification_date) if ds.certification_date else None
                ),
            })
        
        return result
    except Hospital.DoesNotExist:
        return [{"error": f"Hospital with ID {hospital_id} not found"}]
    except Exception as e:
        return [{"error": str(e)}]


@mcp.tool()
def count_hospital_doctors(hospital_id: str, specialty_name: Optional[str] = None) -> Dict[str, Any]:
    """Count total doctors in a hospital, optionally filtered by specialty."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        
        if specialty_name:
            # Count doctors with specific specialty
            specialty = Specialty.objects.filter(name__icontains=specialty_name).first()
            if not specialty:
                return {
                    "hospital_id": str(hospital.id),
                    "hospital_name": hospital.name,
                    "specialty": specialty_name,
                    "count": 0,
                    "message": f"Specialty '{specialty_name}' not found"
                }
            
            count = DoctorSpecialty.objects.filter(
                specialty=specialty,
                doctor__hospital_id=hospital_id,
                doctor__is_active=True
            ).count()
            
            return {
                "hospital_id": str(hospital.id),
                "hospital_name": hospital.name,
                "specialty": specialty.name,
                "count": count,
                "message": f"{hospital.name} has {count} {specialty.name} specialist(s)"
            }
        else:
            # Count all doctors
            total_doctors = User.objects.filter(
                hospital_id=hospital_id,
                role="DOCTOR",
                is_active=True
            ).count()
            
            return {
                "hospital_id": str(hospital.id),
                "hospital_name": hospital.name,
                "total_doctors": total_doctors,
                "message": f"{hospital.name} has {total_doctors} doctor(s)"
            }
    except Hospital.DoesNotExist:
        return {"success": False, "error": f"Hospital with ID {hospital_id} not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def get_hospital_doctors_summary(hospital_id: str) -> Dict[str, Any]:
    """Get summary of all doctors in a hospital including specialties breakdown."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        
        # Get all doctors
        doctors = User.objects.filter(
            hospital_id=hospital_id,
            role="DOCTOR",
            is_active=True
        ).prefetch_related('doctor_specialties__specialty')
        
        total_doctors = doctors.count()
        
        # Count by specialty
        specialty_counts = {}
        for doctor in doctors:
            for ds in doctor.doctor_specialties.all():
                spec_name = ds.specialty.name
                specialty_counts[spec_name] = specialty_counts.get(spec_name, 0) + 1
        
        # Get departments
        departments = set([d.department for d in doctors if d.department])
        
        return {
            "hospital_id": str(hospital.id),
            "hospital_name": hospital.name,
            "total_doctors": total_doctors,
            "specialties_breakdown": specialty_counts,
            "departments": list(departments),
            "summary": f"{hospital.name} has {total_doctors} active doctors across {len(specialty_counts)} specialties and {len(departments)} departments."
        }
    except Hospital.DoesNotExist:
        return {"success": False, "error": f"Hospital with ID {hospital_id} not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def get_doctor_cv_resume(doctor_id: str) -> Dict[str, Any]:
    """Get CV/Resume document for a specific doctor."""
    try:
        doctor = User.objects.get(id=doctor_id, role="DOCTOR")
        
        # Get CV/Resume from certifications
        cv_certifications = Certification.objects.filter(
            user=doctor,
            certification_type="CV_RESUME",
            is_active=True
        ).order_by('-created_at')
        
        if not cv_certifications.exists():
            return {
                "success": False,
                "doctor_id": str(doctor.id),
                "doctor_name": doctor.get_full_name(),
                "message": "No CV/Resume uploaded for this doctor",
                "cv_document": None
            }
        
        latest_cv = cv_certifications.first()
        
        return {
            "success": True,
            "doctor_id": str(doctor.id),
            "doctor_name": doctor.get_full_name(),
            "cv": {
                "id": str(latest_cv.id),
                "certification_name": latest_cv.certification_name,
                "file_document": str(latest_cv.file_document) if latest_cv.file_document else None,
                "file_url": latest_cv.file_document.url if latest_cv.file_document else None,
                "description": latest_cv.description,
                "upload_date": latest_cv.created_at.isoformat(),
                "verified": latest_cv.is_verified,
            }
        }
    except User.DoesNotExist:
        return {"success": False, "error": "Doctor not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def get_doctor_certifications(doctor_id: str) -> List[Dict[str, Any]]:
    """Get all certifications, CV, and resume documents for a doctor."""
    try:
        doctor = User.objects.get(id=doctor_id, role="DOCTOR")
        
        # Get all certifications for this doctor
        certifications = Certification.objects.filter(user=doctor).order_by('-created_at')
        
        result = []
        for cert in certifications:
            cert_info = {
                "id": str(cert.id),
                "certification_name": cert.certification_name,
                "certification_type": cert.certification_type,
                "certification_license_id": cert.certification_license_id,
                "issuing_authority": cert.issuing_authority,
                "issue_date": str(cert.issue_date) if cert.issue_date else None,
                "expiry_date": str(cert.expiry_date) if cert.expiry_date else None,
                "description": cert.description,
                "is_verified": cert.is_verified,
                "is_active": cert.is_active,
                "file_document": str(cert.file_document) if cert.file_document else None,
                "created_at": cert.created_at.isoformat(),
            }
            result.append(cert_info)
        
        return result
    except User.DoesNotExist:
        return [{"error": "Doctor not found"}]
    except Exception as e:
        return [{"error": str(e)}]


@mcp.tool()
def get_doctor_cv_resume(doctor_id: str) -> Dict[str, Any]:
    """Get doctor's CV/Resume file from certifications."""
    try:
        doctor = User.objects.get(id=doctor_id, role="DOCTOR")
        
        # Find CV/Resume certification
        cv_certification = Certification.objects.filter(
            user=doctor,
            certification_type="CV_RESUME",
            is_active=True
        ).order_by('-created_at').first()
        
        if not cv_certification:
            return {
                "success": False,
                "error": "No CV/Resume found for this doctor",
                "doctor": doctor.get_full_name()
            }
        
        return {
            "success": True,
            "doctor": {
                "id": str(doctor.id),
                "name": doctor.get_full_name(),
                "email": doctor.email,
            },
            "cv_resume": {
                "id": str(cv_certification.id),
                "certification_name": cv_certification.certification_name,
                "file_document": str(cv_certification.file_document) if cv_certification.file_document else None,
                "description": cv_certification.description,
                "upload_date": cv_certification.created_at.isoformat(),
                "verified": cv_certification.is_verified,
            }
        }
    except User.DoesNotExist:
        return {"success": False, "error": "Doctor not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def get_doctor_profile(doctor_id: str) -> Dict[str, Any]:
    """Get comprehensive doctor profile including bio, certifications, and credentials."""
    try:
        doctor = User.objects.prefetch_related(
            "doctor_specialties__specialty",
            "certifications"
        ).get(id=doctor_id, role="DOCTOR")
        
        # Get all specialties
        specialties = []
        primary_specialty = None
        for ds in doctor.doctor_specialties.all():
            spec_info = {
                "name": ds.specialty.name,
                "code": ds.specialty.code,
                "is_primary": ds.is_primary,
                "years_of_experience": ds.years_of_experience,
                "certification_date": (
                    str(ds.certification_date) if ds.certification_date else None
                ),
            }
            specialties.append(spec_info)
            if ds.is_primary:
                primary_specialty = ds.specialty.name
        
        # Get certifications
        certifications_list = []
        for cert in doctor.certifications.all():
            cert_info = {
                "id": str(cert.id),
                "certification_name": cert.certification_name,
                "type": cert.certification_type,
                "license_id": cert.certification_license_id,
                "issuing_authority": cert.issuing_authority,
                "issue_date": str(cert.issue_date) if cert.issue_date else None,
                "expiry_date": str(cert.expiry_date) if cert.expiry_date else None,
                "verified": cert.is_verified,
                "has_file": bool(cert.file_document),
            }
            certifications_list.append(cert_info)
        
        # Find CV/Resume
        cv_certification = doctor.certifications.filter(
            certification_type="CV_RESUME",
            is_active=True
        ).order_by('-created_at').first()
        
        return {
            "success": True,
            "doctor": {
                "id": str(doctor.id),
                "name": doctor.get_full_name(),
                "email": doctor.email,
                "phone_number": doctor.phone_number,
                "bio": doctor.bio,
                "department": doctor.department,
                "license_number": doctor.license_number,
                "years_of_experience": doctor.years_of_experience,
                "primary_specialty": primary_specialty,
                "specialties": specialties,
                "certifications": certifications_list,
                "total_certifications": len(certifications_list),
                "has_cv": bool(cv_certification),
                "cv_document": str(cv_certification.file_document) if cv_certification and cv_certification.file_document else None,
                "hospital": {
                    "id": str(doctor.hospital.id),
                    "name": doctor.hospital.name,
                },
                "social_media": {
                    "linkedin": doctor.linkedin_url,
                    "facebook": doctor.facebook_url,
                    "twitter": doctor.twitter_url,
                },
            }
        }
    except User.DoesNotExist:
        return {"success": False, "error": "Doctor not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def get_hospital_bed_availability(hospital_id: str) -> Dict[str, Any]:
    """Get current bed availability and capacity information for a hospital."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        
        # Note: This is a placeholder implementation since bed management
        # would typically be in a separate model. For now, we'll return
        # basic hospital capacity information.
        
        # In a real implementation, you would have a Bed model with:
        # - bed_type (ICU, General, Emergency, etc.)
        # - status (Available, Occupied, Maintenance)
        # - ward/floor information
        
        # For demonstration, we'll use some default values
        # You should replace this with actual bed management logic
        
        bed_capacity = {
            "total_beds": 100,  # This should come from hospital.bed_capacity or similar
            "available_beds": 75,  # This should be calculated from actual bed status
            "occupied_beds": 25,
            "maintenance_beds": 0,
            "icu_beds": 10,
            "general_beds": 80,
            "emergency_beds": 10,
        }
        
        # Calculate occupancy rate
        occupancy_rate = (bed_capacity["occupied_beds"] / bed_capacity["total_beds"]) * 100
        
        return {
            "success": True,
            "hospital": {
                "id": str(hospital.id),
                "name": hospital.name,
                "bed_capacity": bed_capacity,
                "occupancy_rate": round(occupancy_rate, 2),
                "availability_status": (
                    "High Availability" if occupancy_rate < 50
                    else "Moderate Availability" if occupancy_rate < 80
                    else "Low Availability"
                ),
                "last_updated": datetime.now().isoformat(),
            },
        }
    except Hospital.DoesNotExist:
        return {"success": False, "error": "Hospital not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def search_doctors_by_experience(
    hospital_id: str,
    min_years_experience: int = 0,
    max_years_experience: Optional[int] = None,
    specialty: Optional[str] = None,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """Search doctors by years of experience and specialty."""
    try:
        Hospital.objects.get(id=hospital_id)
    except Hospital.DoesNotExist:
        return [{"error": f"Hospital with ID {hospital_id} not found"}]
    
    # Get doctors with their specialty experience
    doctor_specialties = DoctorSpecialty.objects.filter(
        doctor__hospital_id=hospital_id,
        doctor__is_active=True,
        years_of_experience__gte=min_years_experience,
    ).select_related("doctor", "specialty")
    
    if max_years_experience:
        doctor_specialties = doctor_specialties.filter(
            years_of_experience__lte=max_years_experience
        )
    
    if specialty:
        doctor_specialties = doctor_specialties.filter(
            specialty__name__icontains=specialty
        )
    
    doctors = doctor_specialties[:limit]
    
    result = []
    for ds in doctors:
        result.append({
            "doctor_id": str(ds.doctor.id),
            "doctor_name": ds.doctor.get_full_name(),
            "specialty": ds.specialty.name,
            "years_experience": ds.years_of_experience,
            "is_primary_specialty": ds.is_primary,
            "certification_date": (
                str(ds.certification_date) if ds.certification_date else None
            ),
            "department": ds.doctor.department,
            "license_number": ds.doctor.license_number,
        })
    
    return result


@mcp.tool()
def get_doctor_statistics(hospital_id: str) -> Dict[str, Any]:
    """Get comprehensive statistics about doctors in a hospital."""
    try:
        Hospital.objects.get(id=hospital_id)
    except Hospital.DoesNotExist:
        return {"success": False, "error": "Hospital not found"}
    
    # Get all doctors in the hospital
    doctors = User.objects.filter(
        hospital_id=hospital_id, role="DOCTOR", is_active=True
    ).prefetch_related("doctor_specialties__specialty")
    
    # Calculate statistics
    total_doctors = doctors.count()
    
    # Experience statistics
    experience_stats = []
    for doctor in doctors:
        for ds in doctor.doctor_specialties.all():
            if ds.is_primary:
                experience_stats.append(ds.years_of_experience)
                break
        else:
            # If no primary specialty, use overall experience
            experience_stats.append(doctor.years_of_experience or 0)
    
    avg_experience = sum(experience_stats) / len(experience_stats) if experience_stats else 0
    max_experience = max(experience_stats) if experience_stats else 0
    min_experience = min(experience_stats) if experience_stats else 0
    
    # Specialty distribution
    specialty_counts = {}
    for doctor in doctors:
        for ds in doctor.doctor_specialties.all():
            if ds.is_primary:
                specialty = ds.specialty.name
                specialty_counts[specialty] = specialty_counts.get(specialty, 0) + 1
                break
    
    # Department distribution
    department_counts = {}
    for doctor in doctors:
        dept = doctor.department or "General"
        department_counts[dept] = department_counts.get(dept, 0) + 1
    
    return {
        "success": True,
        "hospital_id": hospital_id,
        "statistics": {
            "total_doctors": total_doctors,
            "experience": {
                "average_years": round(avg_experience, 1),
                "maximum_years": max_experience,
                "minimum_years": min_experience,
            },
            "specialty_distribution": specialty_counts,
            "department_distribution": department_counts,
            "doctors_with_primary_specialty": len([
                d for d in doctors 
                if d.doctor_specialties.filter(is_primary=True).exists()
            ]),
        },
    }


# ========== SPECIALTY TOOLS ==========


@mcp.tool()
def list_specialties(
    search: Optional[str] = None, is_active: bool = True, limit: int = 50
) -> List[Dict[str, Any]]:
    """List all medical specialties available in the system."""
    queryset = Specialty.objects.filter(is_active=is_active)

    if search:
        queryset = queryset.filter(name__icontains=search)

    specialties = queryset.order_by("name")[:limit]

    return [
        {
            "id": str(s.id),
            "code": s.code,
            "name": s.name,
            "description": s.description,
            "is_active": s.is_active,
        }
        for s in specialties
    ]


@mcp.tool()
def create_specialty(code: str, name: str, description: str) -> Dict[str, Any]:
    """Create a new medical specialty."""
    try:
        specialty = Specialty.objects.create(
            code=code.upper(), name=name, description=description
        )
        return {
            "success": True,
            "specialty_id": str(specialty.id),
            "code": specialty.code,
            "name": specialty.name,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def assign_doctor_specialty(
    doctor_id: str,
    specialty_id: str,
    is_primary: bool = False,
    years_of_experience: int = 0,
    certification_date: Optional[str] = None,  # Format: YYYY-MM-DD
) -> Dict[str, Any]:
    """Assign a specialty to a doctor."""
    try:
        doctor = User.objects.get(id=doctor_id, role="DOCTOR")
        specialty = Specialty.objects.get(id=specialty_id)

        # If setting as primary, unset other primary specialties
        if is_primary:
            DoctorSpecialty.objects.filter(doctor=doctor, is_primary=True).update(
                is_primary=False
            )

        doctor_specialty = DoctorSpecialty.objects.create(
            doctor=doctor,
            specialty=specialty,
            is_primary=is_primary,
            years_of_experience=years_of_experience,
            certification_date=(
                datetime.strptime(certification_date, "%Y-%m-%d").date()
                if certification_date
                else None
            ),
        )

        return {
            "success": True,
            "doctor": doctor.get_full_name(),
            "specialty": specialty.name,
            "is_primary": is_primary,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def list_doctor_specialties(doctor_id: str) -> List[Dict[str, Any]]:
    """List all specialties for a specific doctor."""
    doctor_specialties = (
        DoctorSpecialty.objects.filter(doctor_id=doctor_id)
        .select_related("specialty")
        .order_by("-is_primary", "specialty__name")
    )

    return [
        {
            "id": str(ds.id),
            "specialty_id": str(ds.specialty.id),
            "specialty_code": ds.specialty.code,
            "specialty_name": ds.specialty.name,
            "is_primary": ds.is_primary,
            "years_of_experience": ds.years_of_experience,
            "certification_date": (
                str(ds.certification_date) if ds.certification_date else None
            ),
        }
        for ds in doctor_specialties
    ]


@mcp.tool()
def get_doctors_by_specialty(
    hospital_id: str, specialty_id: str, limit: int = 20
) -> List[Dict[str, Any]]:
    """Get all doctors in a hospital with a specific specialty."""
    doctor_specialties = DoctorSpecialty.objects.filter(
        specialty_id=specialty_id,
        doctor__hospital_id=hospital_id,
        doctor__is_active=True,
    ).select_related("doctor", "specialty")[:limit]

    return [
        {
            "doctor_id": str(ds.doctor.id),
            "doctor_name": ds.doctor.get_full_name(),
            "doctor_email": ds.doctor.email,
            "specialty": ds.specialty.name,
            "is_primary": ds.is_primary,
            "years_of_experience": ds.years_of_experience,
        }
        for ds in doctor_specialties
    ]


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
    duration_minutes: int = 30,
) -> Dict[str, Any]:
    """Create a new appointment."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        patient = User.objects.get(id=patient_id, role="PATIENT")
        doctor = User.objects.get(id=doctor_id, role="DOCTOR")

        appointment = Appointment.objects.create(
            hospital=hospital,
            patient=patient,
            doctor=doctor,
            scheduled_date=datetime.strptime(scheduled_date, "%Y-%m-%d").date(),
            scheduled_time=datetime.strptime(scheduled_time, "%H:%M").time(),
            reason=reason,
            appointment_type=appointment_type,
            duration_minutes=duration_minutes,
        )

        return {
            "success": True,
            "appointment_id": str(appointment.id),
            "patient": patient.get_full_name(),
            "doctor": doctor.get_full_name(),
            "scheduled": f"{scheduled_date} at {scheduled_time}",
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
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """List appointments with filters."""
    # Validate hospital exists
    try:
        Hospital.objects.get(id=hospital_id)
    except Hospital.DoesNotExist:
        return [{"error": f"Hospital with ID {hospital_id} not found"}]
    
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

    appointments = queryset.select_related("patient", "doctor")[:limit]

    return [
        {
            "id": str(a.id),
            "patient": a.patient.get_full_name(),
            "doctor": a.doctor.get_full_name(),
            "date": str(a.scheduled_date),
            "time": str(a.scheduled_time),
            "status": a.status,
            "type": a.appointment_type,
            "reason": a.reason,
        }
        for a in appointments
    ]


@mcp.tool()
def update_appointment_status(
    appointment_id: str, status: str, notes: Optional[str] = None
) -> Dict[str, Any]:
    """Update appointment status."""
    try:
        appointment = Appointment.objects.get(id=appointment_id)
        appointment.status = status
        if notes:
            appointment.notes = notes

        if status == "IN_PROGRESS":
            appointment.start_time = datetime.now()
        elif status == "COMPLETED":
            appointment.end_time_actual = datetime.now()

        appointment.save()

        return {
            "success": True,
            "appointment_id": str(appointment.id),
            "status": appointment.status,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def list_appointment_slots(
    hospital_id: str,
    doctor_id: str,
    date_from: Optional[str] = None,  # Format: YYYY-MM-DD
    date_to: Optional[str] = None,
    is_available: bool = True,
) -> List[Dict[str, Any]]:
    """List available appointment slots for a doctor."""
    queryset = DoctorScheduleSlot.objects.filter(
        doctor_id=doctor_id, is_available=is_available
    )

    if date_from:
        from_datetime = datetime.strptime(date_from, "%Y-%m-%d")
        queryset = queryset.filter(start_time__gte=from_datetime)

    if date_to:
        to_datetime = datetime.strptime(date_to, "%Y-%m-%d")
        queryset = queryset.filter(end_time__lte=to_datetime)

    slots = queryset[:50]

    return [
        {
            "id": str(s.id),
            "start_time": s.start_time.isoformat(),
            "end_time": s.end_time.isoformat(),
            "is_available": s.is_available,
            "duration_minutes": (s.end_time - s.start_time).total_seconds() / 60,
        }
        for s in slots
    ]


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
    appointment_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a new medical record."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        patient = User.objects.get(id=patient_id, role="PATIENT")
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
            appointment_id=appointment_id,
        )

        return {
            "success": True,
            "record_id": str(record.id),
            "title": record.title,
            "patient": patient.get_full_name(),
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
    limit: int = 20,
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
        from_date = datetime.strptime(date_from, "%Y-%m-%d")
        queryset = queryset.filter(created_at__gte=from_date)

    if date_to:
        to_date = datetime.strptime(date_to, "%Y-%m-%d")
        queryset = queryset.filter(created_at__lte=to_date)

    records = queryset.select_related("patient", "created_by").order_by("-created_at")[
        :limit
    ]

    return [
        {
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
            "appointment_id": str(r.appointment_id) if r.appointment_id else None,
        }
        for r in records
    ]


@mcp.tool()
def get_medical_record_details(record_id: str) -> Dict[str, Any]:
    """Get detailed information about a specific medical record."""
    try:
        record = MedicalRecord.objects.select_related(
            "patient", "created_by", "hospital"
        ).get(id=record_id)

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
                "appointment_id": (
                    str(record.appointment_id) if record.appointment_id else None
                ),
                "created_by_id": (
                    str(record.created_by.id) if record.created_by else None
                ),
                "created_by_name": (
                    record.created_by.get_full_name() if record.created_by else "System"
                ),
                "created_at": record.created_at.isoformat(),
                "updated_at": record.updated_at.isoformat(),
            },
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
    symptoms: Optional[str] = None,
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
            "updated": True,
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
    appointment_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a new treatment plan."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        patient = User.objects.get(id=patient_id, role="PATIENT")
        prescribed_by = User.objects.get(id=prescribed_by_id, role="DOCTOR")

        treatment = Treatment.objects.create(
            hospital=hospital,
            patient=patient,
            prescribed_by=prescribed_by,
            name=name,
            description=description,
            instructions=instructions,
            treatment_type=treatment_type,
            start_date=datetime.strptime(start_date, "%Y-%m-%d").date(),
            end_date=(
                datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else None
            ),
            appointment_id=appointment_id,
        )

        return {
            "success": True,
            "treatment_id": str(treatment.id),
            "name": treatment.name,
            "patient": patient.get_full_name(),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def list_treatments(
    hospital_id: str,
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """List treatments with filters."""
    queryset = Treatment.objects.filter(hospital_id=hospital_id)

    if patient_id:
        queryset = queryset.filter(patient_id=patient_id)
    if doctor_id:
        queryset = queryset.filter(prescribed_by_id=doctor_id)
    if status:
        queryset = queryset.filter(status=status)

    treatments = queryset.select_related("patient", "prescribed_by")[:limit]

    return [
        {
            "id": str(t.id),
            "name": t.name,
            "type": t.treatment_type,
            "patient": t.patient.get_full_name(),
            "doctor": t.prescribed_by.get_full_name() if t.prescribed_by else "N/A",
            "status": t.status,
            "start_date": str(t.start_date),
            "end_date": str(t.end_date) if t.end_date else None,
        }
        for t in treatments
    ]


# ========== SUBSCRIPTION TOOLS ==========


@mcp.tool()
def list_subscription_plans(is_active: bool = True) -> List[Dict[str, Any]]:
    """List available subscription plans."""
    plans = SubscriptionPlan.objects.filter(is_active=is_active)

    return [
        {
            "id": str(p.id),
            "name": p.name,
            "type": p.plan_type,
            "price": float(p.price),
            "billing_cycle": p.billing_cycle,
            "max_users": p.max_users,
            "max_doctors": p.max_doctors,
            "max_patients": p.max_patients,
            "features": p.features,
        }
        for p in plans
    ]


@mcp.tool()
def create_subscription(
    hospital_id: str,
    plan_id: str,
    start_date: str,  # Format: YYYY-MM-DD
    end_date: str,  # Format: YYYY-MM-DD
) -> Dict[str, Any]:
    """Create a subscription for a hospital."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        plan = SubscriptionPlan.objects.get(id=plan_id)

        subscription = Subscription.objects.create(
            hospital=hospital,
            plan=plan,
            start_date=datetime.strptime(start_date, "%Y-%m-%d"),
            end_date=datetime.strptime(end_date, "%Y-%m-%d"),
            current_period_start=datetime.strptime(start_date, "%Y-%m-%d"),
            current_period_end=datetime.strptime(end_date, "%Y-%m-%d"),
        )

        # Update hospital subscription status
        hospital.subscription_plan = plan
        hospital.subscription_status = "ACTIVE"
        hospital.save()

        return {
            "success": True,
            "subscription_id": str(subscription.id),
            "hospital": hospital.name,
            "plan": plan.name,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ========== SERVICES TOOLS ==========


@mcp.tool()
def list_services(hospital_id: str, search: Optional[str] = None) -> List[Dict[str, Any]]:
    """List all services offered by a hospital."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        services = Service.objects.filter(hospital=hospital)
        
        if search:
            services = services.filter(service_name__icontains=search)
        
        return [
            {
                "id": str(s.id),
                "service_name": s.service_name,
                "price": float(s.price),
                "created_at": s.created_at.isoformat(),
                "updated_at": s.updated_at.isoformat(),
            }
            for s in services
        ]
    except Hospital.DoesNotExist:
        return []
    except Exception as e:
        return []


@mcp.tool()
def create_service(
    hospital_id: str,
    service_name: str,
    price: float,
) -> Dict[str, Any]:
    """Create a new service for a hospital."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        
        service = Service.objects.create(
            hospital=hospital,
            service_name=service_name,
            price=price,
        )
        
        return {
            "success": True,
            "service_id": str(service.id),
            "service_name": service.service_name,
            "price": float(service.price),
            "hospital_name": hospital.name,
        }
    except Hospital.DoesNotExist:
        return {"success": False, "error": "Hospital not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def get_service_details(service_id: str) -> Dict[str, Any]:
    """Get detailed information about a specific service."""
    try:
        service = Service.objects.select_related('hospital').get(id=service_id)
        
        return {
            "id": str(service.id),
            "service_name": service.service_name,
            "price": float(service.price),
            "hospital": {
                "id": str(service.hospital.id),
                "name": service.hospital.name,
            },
            "created_at": service.created_at.isoformat(),
            "updated_at": service.updated_at.isoformat(),
        }
    except Service.DoesNotExist:
        return {"success": False, "error": "Service not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def update_service(
    service_id: str,
    service_name: Optional[str] = None,
    price: Optional[float] = None,
) -> Dict[str, Any]:
    """Update a service."""
    try:
        service = Service.objects.get(id=service_id)
        
        if service_name:
            service.service_name = service_name
        if price is not None:
            service.price = price
        
        service.save()
        
        return {
            "success": True,
            "service_id": str(service.id),
            "service_name": service.service_name,
            "price": float(service.price),
        }
    except Service.DoesNotExist:
        return {"success": False, "error": "Service not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def delete_service(service_id: str) -> Dict[str, Any]:
    """Delete a service."""
    try:
        service = Service.objects.get(id=service_id)
        service_name = service.service_name
        service.delete()
        
        return {
            "success": True,
            "message": f"Service '{service_name}' deleted successfully",
        }
    except Service.DoesNotExist:
        return {"success": False, "error": "Service not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def get_hospital_services_summary(hospital_id: str) -> Dict[str, Any]:
    """Get a summary of all services offered by a hospital including pricing."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        services = Service.objects.filter(hospital=hospital)
        
        total_services = services.count()
        total_value = sum(float(s.price) for s in services)
        average_price = total_value / total_services if total_services > 0 else 0
        
        return {
            "hospital_id": str(hospital.id),
            "hospital_name": hospital.name,
            "total_services": total_services,
            "total_value": round(total_value, 2),
            "average_price": round(average_price, 2),
            "services": [
                {
                    "id": str(s.id),
                    "service_name": s.service_name,
                    "price": float(s.price),
                }
                for s in services
            ],
        }
    except Hospital.DoesNotExist:
        return {"success": False, "error": "Hospital not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ========== CERTIFICATION TOOLS ==========


@mcp.tool()
def get_doctor_certifications(doctor_id: str) -> List[Dict[str, Any]]:
    """Get all certifications for a specific doctor."""
    try:
        doctor = User.objects.get(id=doctor_id, role="DOCTOR")
        certifications = Certification.objects.filter(user=doctor, is_active=True)
        
        result = []
        for cert in certifications:
            cert_data = {
                "id": str(cert.id),
                "certification_name": cert.certification_name,
                "certification_type": cert.certification_type,
                "certification_license_id": cert.certification_license_id,
                "issuing_authority": cert.issuing_authority,
                "issue_date": str(cert.issue_date) if cert.issue_date else None,
                "expiry_date": str(cert.expiry_date) if cert.expiry_date else None,
                "description": cert.description,
                "is_verified": cert.is_verified,
                "has_document": bool(cert.file_document),
                "document_url": cert.file_document.url if cert.file_document else None,
            }
            result.append(cert_data)
        
        return result
    except User.DoesNotExist:
        return [{"error": "Doctor not found"}]
    except Exception as e:
        return [{"error": str(e)}]


@mcp.tool()
def get_doctor_resume_cv(doctor_id: str) -> Dict[str, Any]:
    """Get CV/Resume document for a specific doctor."""
    try:
        doctor = User.objects.get(id=doctor_id, role="DOCTOR")
        
        # Get CV/Resume certification
        resume_cert = Certification.objects.filter(
            user=doctor,
            certification_type="CV_RESUME",
            is_active=True
        ).first()
        
        if not resume_cert:
            return {
                "success": False,
                "error": "No CV/Resume found for this doctor",
                "doctor_name": doctor.get_full_name()
            }
        
        return {
            "success": True,
            "doctor_id": str(doctor.id),
            "doctor_name": doctor.get_full_name(),
            "certification_name": resume_cert.certification_name,
            "certification_type": resume_cert.certification_type,
            "issue_date": str(resume_cert.issue_date) if resume_cert.issue_date else None,
            "description": resume_cert.description,
            "document_url": resume_cert.file_document.url if resume_cert.file_document else None,
            "has_document": bool(resume_cert.file_document),
        }
    except User.DoesNotExist:
        return {"success": False, "error": "Doctor not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def get_all_doctor_documents(doctor_id: str) -> Dict[str, Any]:
    """Get all uploaded documents (certifications, CV, licenses) for a doctor."""
    try:
        doctor = User.objects.get(id=doctor_id, role="DOCTOR")
        
        certifications = Certification.objects.filter(user=doctor, is_active=True)
        
        documents = []
        for cert in certifications:
            if cert.file_document:
                doc_info = {
                    "certification_id": str(cert.id),
                    "certification_name": cert.certification_name,
                    "certification_type": cert.certification_type,
                    "certification_license_id": cert.certification_license_id,
                    "issuing_authority": cert.issuing_authority,
                    "issue_date": str(cert.issue_date) if cert.issue_date else None,
                    "expiry_date": str(cert.expiry_date) if cert.expiry_date else None,
                    "is_verified": cert.is_verified,
                    "document_url": cert.file_document.url,
                    "description": cert.description,
                }
                documents.append(doc_info)
        
        return {
            "success": True,
            "doctor_id": str(doctor.id),
            "doctor_name": doctor.get_full_name(),
            "total_documents": len(documents),
            "documents": documents
        }
    except User.DoesNotExist:
        return {"success": False, "error": "Doctor not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def get_doctors_count_by_specialty(hospital_id: str, specialty_name: str) -> Dict[str, Any]:
    """Get count of doctors in a specific specialty at a hospital."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        
        # Get specialty
        specialty = Specialty.objects.filter(name__icontains=specialty_name).first()
        if not specialty:
            return {
                "success": False,
                "error": f"Specialty '{specialty_name}' not found",
                "hospital_id": hospital_id,
                "specialty_name": specialty_name,
                "count": 0
            }
        
        # Get doctors with this specialty in this hospital
        doctor_count = DoctorSpecialty.objects.filter(
            specialty=specialty,
            doctor__hospital_id=hospital_id,
            doctor__is_active=True
        ).count()
        
        return {
            "success": True,
            "hospital_id": hospital_id,
            "hospital_name": hospital.name,
            "specialty_id": str(specialty.id),
            "specialty_name": specialty.name,
            "specialty_code": specialty.code,
            "count": doctor_count
        }
    except Hospital.DoesNotExist:
        return {"success": False, "error": "Hospital not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ========== RESOURCES ==========


@mcp.resource(uri="http://localhost:8001/hospitals/list", name="hospitals_list")
def get_hospitals_resource() -> str:
    """Get list of all hospitals as a resource."""
    hospitals = list_hospitals(limit=100)
    return json.dumps(hospitals, indent=2)


@mcp.resource(uri="http://localhost:8001/hospitals/details/{hospital_id}", name="hospital_details")
def get_hospital_details_resource(hospital_id: str) -> str:
    """Get detailed information about a specific hospital."""
    details = get_hospital_details(hospital_id)
    return json.dumps(details, indent=2)


@mcp.resource(uri="http://localhost:8001/doctors/list/{hospital_id}", name="doctors_list")
def get_doctors_resource(hospital_id: str) -> str:
    """Get list of doctors in a hospital as a resource."""
    doctors = list_doctors(hospital_id=hospital_id, limit=100)
    return json.dumps(doctors, indent=2)


@mcp.resource(uri="http://localhost:8001/doctors/details/{doctor_id}", name="doctor_details")
def get_doctor_details_resource(doctor_id: str) -> str:
    """Get detailed information about a specific doctor."""
    details = get_doctor_details(doctor_id)
    return json.dumps(details, indent=2)


@mcp.resource(uri="http://localhost:8001/specialties/list", name="specialties_list")
def get_specialties_resource() -> str:
    """Get list of all medical specialties."""
    specialties = list_specialties(limit=100)
    return json.dumps(specialties, indent=2)


@mcp.resource(uri="http://localhost:8001/specialties/doctors/{specialty_id}/{hospital_id}", name="doctors_by_specialty")
def get_doctors_by_specialty_resource(specialty_id: str, hospital_id: str) -> str:
    """Get all doctors in a hospital with a specific specialty."""
    doctors = get_doctors_by_specialty(hospital_id, specialty_id, limit=100)
    return json.dumps(doctors, indent=2)


@mcp.resource(uri="http://localhost:8001/doctors/summary/{hospital_id}", name="doctors_summary")
def get_doctors_summary_resource(hospital_id: str) -> str:
    """Get summary of all doctors in a hospital."""
    summary = get_hospital_doctors_summary(hospital_id)
    return json.dumps(summary, indent=2)


@mcp.resource(uri="http://localhost:8001/doctors/certifications/{doctor_id}", name="doctor_certifications_list")
def get_doctor_certifications_resource(doctor_id: str) -> str:
    """Get all certifications for a specific doctor."""
    certifications = get_doctor_certifications(doctor_id)
    return json.dumps(certifications, indent=2)


@mcp.resource(uri="http://localhost:8001/doctors/cv/{doctor_id}", name="doctor_cv")
def get_doctor_cv_resource(doctor_id: str) -> str:
    """Get CV/Resume for a specific doctor."""
    cv_info = get_doctor_cv_resume(doctor_id)
    return json.dumps(cv_info, indent=2)


@mcp.resource(uri="http://localhost:8001/medical_records/list/{hospital_id}", name="medical_records_list")
def get_medical_records_resource(hospital_id: str) -> str:
    """Get list of medical records for a hospital."""
    records = list_medical_records(hospital_id=hospital_id, limit=100)
    return json.dumps(records, indent=2)


@mcp.resource(uri="http://localhost:8001/medical_records/patient/{patient_id}", name="patient_medical_records")
def get_patient_medical_records_resource(patient_id: str) -> str:
    """Get medical records for a specific patient."""
    # Get patient's hospital first
    try:
        patient = User.objects.get(id=patient_id)
        records = list_medical_records(
            hospital_id=str(patient.hospital.id), patient_id=patient_id, limit=100
        )
        return json.dumps(records, indent=2)
    except:
        return json.dumps({"error": "Patient not found"}, indent=2)


@mcp.resource(uri="http://localhost:8001/appointments/today/{hospital_id}", name="todays_appointments")
def get_todays_appointments(hospital_id: str) -> str:
    """Get today's appointments for a hospital."""
    today = date.today().isoformat()
    appointments = list_appointments(
        hospital_id=hospital_id, date_from=today, date_to=today, limit=100
    )
    return json.dumps(appointments, indent=2)


@mcp.resource(uri="http://localhost:8001/appointments/upcoming/{hospital_id}", name="upcoming_appointments")
def get_upcoming_appointments_resource(hospital_id: str) -> str:
    """Get upcoming appointments for a hospital."""
    today = date.today().isoformat()
    appointments = list_appointments(
        hospital_id=hospital_id, date_from=today, status="SCHEDULED", limit=100
    )
    return json.dumps(appointments, indent=2)


@mcp.resource(uri="http://localhost:8001/services/hospital/{hospital_id}", name="hospital_services")
def get_hospital_services_resource(hospital_id: str) -> str:
    """Get all services offered by a hospital."""
    services = list_services(hospital_id=hospital_id)
    return json.dumps(services, indent=2)


@mcp.resource(uri="http://localhost:8001/services/summary/{hospital_id}", name="services_summary")
def get_services_summary_resource(hospital_id: str) -> str:
    """Get a summary of hospital services with pricing."""
    summary = get_hospital_services_summary(hospital_id)
    return json.dumps(summary, indent=2)


# ========== PROMPT TOOLS ==========


@mcp.tool()
def appointment_booking_prompt(
    patient_name: str, doctor_specialization: str, preferred_date: str
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


@mcp.tool()
def patient_onboarding_prompt(hospital_name: str, patient_email: str) -> str:
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


@mcp.tool()
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


# ========== KNOWLEDGEBASE TOOLS ==========


@mcp.tool()
def get_ai_identity(hospital_id: str) -> Dict[str, Any]:
    """Get AI identity configuration for a hospital including system prompt template."""
    try:
        ai_identity = Ai_Identity.objects.get(hospital_id=hospital_id, is_active=True)
        return {
            "success": True,
            "hospital_id": str(ai_identity.hospital.id),
            "hospital_name": ai_identity.hospital.name,
            "agent_name": ai_identity.agent_name,
            "agent_title": ai_identity.agent_title,
            "system_prompt": ai_identity.system_prompt,
            "is_active": ai_identity.is_active,
            "created_at": ai_identity.created_at.isoformat(),
            "updated_at": ai_identity.updated_at.isoformat(),
        }
    except Ai_Identity.DoesNotExist:
        return {
            "success": False,
            "error": f"No AI identity found for hospital {hospital_id}",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def create_or_update_ai_identity(
    hospital_id: str,
    agent_name: str,
    agent_title: str,
    system_prompt: str,
    is_active: bool = True,
) -> Dict[str, Any]:
    """Create or update AI identity configuration for a hospital."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        ai_identity, created = Ai_Identity.objects.update_or_create(
            hospital=hospital,
            defaults={
                "agent_name": agent_name,
                "agent_title": agent_title,
                "system_prompt": system_prompt,
                "is_active": is_active,
            },
        )
        
        action = "created" if created else "updated"
        return {
            "success": True,
            "action": action,
            "hospital_id": str(ai_identity.hospital.id),
            "hospital_name": ai_identity.hospital.name,
            "agent_name": ai_identity.agent_name,
            "agent_title": ai_identity.agent_title,
            "system_prompt": ai_identity.system_prompt,
            "is_active": ai_identity.is_active,
        }
    except Hospital.DoesNotExist:
        return {
            "success": False,
            "error": f"Hospital with ID {hospital_id} not found",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def get_behavior_config(hospital_id: str) -> Dict[str, Any]:
    """Get AI behavior configuration for a hospital."""
    try:
        behavior = Behavior.objects.get(hospital_id=hospital_id, is_active=True)
        return {
            "success": True,
            "hospital_id": str(behavior.hospital.id),
            "hospital_name": behavior.hospital.name,
            "communication_tone": behavior.communication_tone,
            "communication_style": behavior.communication_style,
            "confidence_level": behavior.confidence_level,
            "response_length": behavior.response_length,
            "enable_follow_up_questions": behavior.enable_follow_up_questions,
            "enable_appointment_booking": behavior.enable_appointment_booking,
            "enable_personalization": behavior.enable_personalization,
            "is_active": behavior.is_active,
            "created_at": behavior.created_at.isoformat(),
            "updated_at": behavior.updated_at.isoformat(),
        }
    except Behavior.DoesNotExist:
        return {
            "success": False,
            "error": f"No behavior configuration found for hospital {hospital_id}",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def create_or_update_behavior_config(
    hospital_id: str,
    communication_tone: str = "Professional",
    communication_style: str = "Conversational",
    confidence_level: str = "Balanced",
    response_length: str = "Medium",
    enable_follow_up_questions: bool = True,
    enable_appointment_booking: bool = True,
    enable_personalization: bool = True,
    is_active: bool = True,
) -> Dict[str, Any]:
    """Create or update AI behavior configuration for a hospital."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        behavior, created = Behavior.objects.update_or_create(
            hospital=hospital,
            defaults={
                "communication_tone": communication_tone,
                "communication_style": communication_style,
                "confidence_level": confidence_level,
                "response_length": response_length,
                "enable_follow_up_questions": enable_follow_up_questions,
                "enable_appointment_booking": enable_appointment_booking,
                "enable_personalization": enable_personalization,
                "is_active": is_active,
            },
        )
        
        action = "created" if created else "updated"
        return {
            "success": True,
            "action": action,
            "hospital_id": str(behavior.hospital.id),
            "hospital_name": behavior.hospital.name,
            "communication_tone": behavior.communication_tone,
            "communication_style": behavior.communication_style,
            "confidence_level": behavior.confidence_level,
            "response_length": behavior.response_length,
            "enable_follow_up_questions": behavior.enable_follow_up_questions,
            "enable_appointment_booking": behavior.enable_appointment_booking,
            "enable_personalization": behavior.enable_personalization,
            "is_active": behavior.is_active,
        }
    except Hospital.DoesNotExist:
        return {
            "success": False,
            "error": f"Hospital with ID {hospital_id} not found",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def get_response_templates(hospital_id: str) -> Dict[str, Any]:
    """Get AI response templates for a hospital."""
    try:
        response = Response.objects.get(hospital_id=hospital_id, is_active=True)
        return {
            "success": True,
            "hospital_id": str(response.hospital.id),
            "hospital_name": response.hospital.name,
            "greeting_message": response.greeting_message,
            "appointment_booking": response.appointment_booking,
            "general_inquiries": response.general_inquiries,
            "fallback_response": response.fallback_response,
            "emergency_response": response.emergency_response,
            "business_hours": response.business_hours,
            "medical_specialties": response.medical_specialties,
            "is_active": response.is_active,
            "created_at": response.created_at.isoformat(),
            "updated_at": response.updated_at.isoformat(),
        }
    except Response.DoesNotExist:
        return {
            "success": False,
            "error": f"No response templates found for hospital {hospital_id}",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def create_or_update_response_templates(
    hospital_id: str,
    greeting_message: str,
    appointment_booking: str,
    general_inquiries: str,
    fallback_response: str,
    emergency_response: str,
    business_hours: str,
    medical_specialties: str,
    is_active: bool = True,
) -> Dict[str, Any]:
    """Create or update AI response templates for a hospital."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        response, created = Response.objects.update_or_create(
            hospital=hospital,
            defaults={
                "greeting_message": greeting_message,
                "appointment_booking": appointment_booking,
                "general_inquiries": general_inquiries,
                "fallback_response": fallback_response,
                "emergency_response": emergency_response,
                "business_hours": business_hours,
                "medical_specialties": medical_specialties,
                "is_active": is_active,
            },
        )
        
        action = "created" if created else "updated"
        return {
            "success": True,
            "action": action,
            "hospital_id": str(response.hospital.id),
            "hospital_name": response.hospital.name,
            "greeting_message": response.greeting_message,
            "appointment_booking": response.appointment_booking,
            "general_inquiries": response.general_inquiries,
            "fallback_response": response.fallback_response,
            "emergency_response": response.emergency_response,
            "business_hours": response.business_hours,
            "medical_specialties": response.medical_specialties,
            "is_active": response.is_active,
        }
    except Hospital.DoesNotExist:
        return {
            "success": False,
            "error": f"Hospital with ID {hospital_id} not found",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def get_knowledgebase_sources(hospital_id: str) -> Dict[str, Any]:
    """Get knowledgebase source files for a hospital."""
    try:
        source = Source.objects.get(hospital_id=hospital_id, is_active=True)
        source_files = source.get_files()
        
        files_data = []
        for file_obj in source_files:
            files_data.append({
                "id": str(file_obj.id),
                "file_name": file_obj.file_name,
                "file_size": file_obj.file_size,
                "file_type": file_obj.file_type,
                "file_url": file_obj.file.url if file_obj.file else None,
                "is_active": file_obj.is_active,
                "created_at": file_obj.created_at.isoformat(),
            })
        
        return {
            "success": True,
            "hospital_id": str(source.hospital.id),
            "hospital_name": source.hospital.name,
            "files_count": source.get_files_count(),
            "files": files_data,
            "is_active": source.is_active,
            "created_at": source.created_at.isoformat(),
            "updated_at": source.updated_at.isoformat(),
        }
    except Source.DoesNotExist:
        return {
            "success": False,
            "error": f"No knowledgebase sources found for hospital {hospital_id}",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def create_knowledgebase_source(hospital_id: str) -> Dict[str, Any]:
    """Create a knowledgebase source container for a hospital."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        source, created = Source.objects.get_or_create(
            hospital=hospital,
            defaults={"is_active": True}
        )
        
        action = "created" if created else "already exists"
        return {
            "success": True,
            "action": action,
            "hospital_id": str(source.hospital.id),
            "hospital_name": source.hospital.name,
            "source_id": str(source.id),
            "files_count": source.get_files_count(),
            "is_active": source.is_active,
        }
    except Hospital.DoesNotExist:
        return {
            "success": False,
            "error": f"Hospital with ID {hospital_id} not found",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def get_complete_knowledgebase(hospital_id: str) -> Dict[str, Any]:
    """Get complete knowledgebase configuration for a hospital including AI identity, behavior, responses, and sources."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        
        # Get AI Identity (system prompt template)
        ai_identity_data = None
        try:
            ai_identity = Ai_Identity.objects.get(hospital=hospital, is_active=True)
            ai_identity_data = {
                "agent_name": ai_identity.agent_name,
                "agent_title": ai_identity.agent_title,
                "system_prompt": ai_identity.system_prompt,
                "is_active": ai_identity.is_active,
            }
        except Ai_Identity.DoesNotExist:
            ai_identity_data = {"error": "No AI identity configured"}
        
        # Get Behavior Configuration
        behavior_data = None
        try:
            behavior = Behavior.objects.get(hospital=hospital, is_active=True)
            behavior_data = {
                "communication_tone": behavior.communication_tone,
                "communication_style": behavior.communication_style,
                "confidence_level": behavior.confidence_level,
                "response_length": behavior.response_length,
                "enable_follow_up_questions": behavior.enable_follow_up_questions,
                "enable_appointment_booking": behavior.enable_appointment_booking,
                "enable_personalization": behavior.enable_personalization,
                "is_active": behavior.is_active,
            }
        except Behavior.DoesNotExist:
            behavior_data = {"error": "No behavior configuration found"}
        
        # Get Response Templates
        response_data = None
        try:
            response = Response.objects.get(hospital=hospital, is_active=True)
            response_data = {
                "greeting_message": response.greeting_message,
                "appointment_booking": response.appointment_booking,
                "general_inquiries": response.general_inquiries,
                "fallback_response": response.fallback_response,
                "emergency_response": response.emergency_response,
                "business_hours": response.business_hours,
                "medical_specialties": response.medical_specialties,
                "is_active": response.is_active,
            }
        except Response.DoesNotExist:
            response_data = {"error": "No response templates found"}
        
        # Get Source Files
        source_data = None
        try:
            source = Source.objects.get(hospital=hospital, is_active=True)
            source_files = source.get_files()
            files_data = []
            for file_obj in source_files:
                files_data.append({
                    "id": str(file_obj.id),
                    "file_name": file_obj.file_name,
                    "file_size": file_obj.file_size,
                    "file_type": file_obj.file_type,
                    "file_url": file_obj.file.url if file_obj.file else None,
                    "is_active": file_obj.is_active,
                })
            
            source_data = {
                "files_count": source.get_files_count(),
                "files": files_data,
                "is_active": source.is_active,
            }
        except Source.DoesNotExist:
            source_data = {"error": "No source files found", "files_count": 0, "files": []}
        
        return {
            "success": True,
            "hospital_id": str(hospital.id),
            "hospital_name": hospital.name,
            "ai_identity": ai_identity_data,
            "behavior": behavior_data,
            "response_templates": response_data,
            "source_files": source_data,
        }
    except Hospital.DoesNotExist:
        return {
            "success": False,
            "error": f"Hospital with ID {hospital_id} not found",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def generate_system_prompt_from_template(
    hospital_id: str,
    additional_context: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate a complete system prompt using the hospital's AI identity template and current configuration."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        
        # Get AI Identity (base template)
        try:
            ai_identity = Ai_Identity.objects.get(hospital=hospital, is_active=True)
            base_prompt = ai_identity.system_prompt
            agent_name = ai_identity.agent_name
            agent_title = ai_identity.agent_title
        except Ai_Identity.DoesNotExist:
            return {
                "success": False,
                "error": f"No AI identity template found for hospital {hospital_id}. Please configure AI identity first.",
            }
        
        # Get Behavior Configuration
        behavior_context = ""
        try:
            behavior = Behavior.objects.get(hospital=hospital, is_active=True)
            behavior_context = f"""
BEHAVIOR CONFIGURATION:
- Communication Tone: {behavior.communication_tone}
- Communication Style: {behavior.communication_style}
- Confidence Level: {behavior.confidence_level}
- Response Length: {behavior.response_length}
- Follow-up Questions: {'Enabled' if behavior.enable_follow_up_questions else 'Disabled'}
- Appointment Booking: {'Enabled' if behavior.enable_appointment_booking else 'Disabled'}
- Personalization: {'Enabled' if behavior.enable_personalization else 'Disabled'}
"""
        except Behavior.DoesNotExist:
            behavior_context = "\nBEHAVIOR CONFIGURATION: Not configured\n"
        
        # Get Response Templates Context
        response_context = ""
        try:
            response = Response.objects.get(hospital=hospital, is_active=True)
            response_context = f"""
RESPONSE TEMPLATES:
- Greeting: {response.greeting_message}
- Appointment Booking: {response.appointment_booking}
- General Inquiries: {response.general_inquiries}
- Emergency Response: {response.emergency_response}
- Business Hours: {response.business_hours}
- Medical Specialties: {response.medical_specialties}
"""
        except Response.DoesNotExist:
            response_context = "\nRESPONSE TEMPLATES: Not configured\n"
        
        # Get Hospital Information
        hospital_context = f"""
HOSPITAL INFORMATION:
- Name: {hospital.name}
- Type: {hospital.hospital_type}
- Address: {hospital.address_line1}, {hospital.city}, {hospital.state}
- Phone: {hospital.phone_number}
- Email: {hospital.email}
"""
        
        # Build complete system prompt
        complete_prompt = f"""You are {agent_name}, {agent_title} for {hospital.name}.

{base_prompt}

{hospital_context}

{behavior_context}

{response_context}

{additional_context if additional_context else ''}

Remember to maintain consistency with your configured behavior and use the appropriate response templates when relevant."""

        return {
            "success": True,
            "hospital_id": str(hospital.id),
            "hospital_name": hospital.name,
            "agent_name": agent_name,
            "agent_title": agent_title,
            "generated_system_prompt": complete_prompt,
            "base_template": base_prompt,
            "includes_behavior": bool(behavior_context.strip()),
            "includes_responses": bool(response_context.strip()),
            "includes_additional_context": bool(additional_context),
        }
    except Hospital.DoesNotExist:
        return {
            "success": False,
            "error": f"Hospital with ID {hospital_id} not found",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ========== HOSPITAL SERVICES MANAGEMENT ==========


@mcp.tool()
def list_services(hospital_id: str, search: Optional[str] = None, limit: int = 20) -> Dict[str, Any]:
    """List all services offered by a hospital. Can be filtered by search term."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        services = Service.objects.filter(hospital=hospital)
        
        # Search functionality
        if search:
            services = services.filter(service_name__icontains=search)
        
        services = services.select_related('hospital').order_by('service_name')[:limit]
        
        return {
            "success": True,
            "hospital_id": str(hospital.id),
            "hospital_name": hospital.name,
            "count": len(services),
            "services": [
                {
                    "id": str(s.id),
                    "service_name": s.service_name,
                    "price": str(s.price),
                    "created_at": s.created_at.isoformat(),
                    "updated_at": s.updated_at.isoformat(),
                }
                for s in services
            ],
        }
    except Hospital.DoesNotExist:
        return {"success": False, "error": "Hospital not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def get_service_details(service_id: str) -> Dict[str, Any]:
    """Get detailed information about a specific service."""
    try:
        service = Service.objects.select_related('hospital').get(id=service_id)
        
        return {
            "success": True,
            "service": {
                "id": str(service.id),
                "hospital_id": str(service.hospital.id),
                "hospital_name": service.hospital.name,
                "service_name": service.service_name,
                "price": str(service.price),
                "created_at": service.created_at.isoformat(),
                "updated_at": service.updated_at.isoformat(),
            },
        }
    except Service.DoesNotExist:
        return {"success": False, "error": "Service not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def search_services(
    hospital_id: str, 
    query: str, 
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 20
) -> Dict[str, Any]:
    """Search services by name, filter by price range."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        services = Service.objects.filter(hospital=hospital)
        
        # Search by service name
        if query:
            services = services.filter(service_name__icontains=query)
        
        # Filter by price range
        if min_price is not None:
            services = services.filter(price__gte=min_price)
        if max_price is not None:
            services = services.filter(price__lte=max_price)
        
        services = services.order_by('price', 'service_name')[:limit]
        
        return {
            "success": True,
            "hospital_id": str(hospital.id),
            "hospital_name": hospital.name,
            "search_query": query,
            "min_price": min_price,
            "max_price": max_price,
            "count": len(services),
            "services": [
                {
                    "id": str(s.id),
                    "service_name": s.service_name,
                    "price": str(s.price),
                    "created_at": s.created_at.isoformat(),
                }
                for s in services
            ],
        }
    except Hospital.DoesNotExist:
        return {"success": False, "error": "Hospital not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
def get_services_summary(hospital_id: str) -> Dict[str, Any]:
    """Get a summary of all services offered by a hospital with pricing information."""
    try:
        hospital = Hospital.objects.get(id=hospital_id)
        services = Service.objects.filter(hospital=hospital)
        
        total_services = services.count()
        
        # Get price statistics
        from django.db.models import Min, Max, Avg
        price_stats = services.aggregate(
            min_price=Min('price'),
            max_price=Max('price'),
            avg_price=Avg('price')
        )
        
        # Group services by price ranges
        services_list = list(services.order_by('price'))
        
        return {
            "success": True,
            "hospital_id": str(hospital.id),
            "hospital_name": hospital.name,
            "total_services": total_services,
            "price_statistics": {
                "minimum_price": str(price_stats['min_price'] or 0),
                "maximum_price": str(price_stats['max_price'] or 0),
                "average_price": str(price_stats['avg_price'] or 0),
            },
            "services": [
                {
                    "service_name": s.service_name,
                    "price": str(s.price),
                }
                for s in services_list
            ],
        }
    except Hospital.DoesNotExist:
        return {"success": False, "error": "Hospital not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    # Run the MCP server with STDIO transport
    mcp.run()
