#!/usr/bin/env python
"""
Create test data for MedCor Backend
Creates subscription plans, hospitals, users, medical records, and specialties
"""

import json
import os
import random
import sys
from datetime import date, datetime, timedelta
from decimal import Decimal

import django

# Use SQLite for test data creation to avoid database issues
os.environ["USE_SQLITE"] = "true"

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medcor_backend2.settings")
django.setup()

from appointments.models import Appointment, DoctorAvailabilitySlot
# Import models after Django setup
from core.models import User
from medical_records.models import MedicalRecord
from specialty.models import DoctorSpecialty, Specialty
from subscription_plans.models import Subscription, SubscriptionPlan
from tenants.models import Hospital
from treatments.models import Treatment


class TestDataGenerator:
    def __init__(self):
        self.created_data = {
            "subscription_plans": [],
            "hospitals": [],
            "subscriptions": [],
            "specialties": [],
            "super_admin": None,
            "admins": [],
            "doctors": [],
            "patients": [],
            "medical_records": [],
            "appointments": [],
            "treatments": [],
        }

    def create_subscription_plans(self):
        """Create 3 subscription plans"""
        print("Creating subscription plans...")

        plans_data = [
            {
                "name": "Basic Plan",
                "plan_type": "BASIC",
                "price": Decimal("99.99"),
                "billing_cycle": "MONTHLY",
                "max_users": 50,
                "max_doctors": 5,
                "max_patients": 100,
                "features": {
                    "appointments": True,
                    "medical_records": True,
                    "treatments": True,
                    "analytics": False,
                    "telemedicine": False,
                    "support": "email",
                },
                "description": "Perfect for small clinics",
            },
            {
                "name": "Professional Plan",
                "plan_type": "PROFESSIONAL",
                "price": Decimal("299.99"),
                "billing_cycle": "MONTHLY",
                "max_users": 200,
                "max_doctors": 20,
                "max_patients": 500,
                "features": {
                    "appointments": True,
                    "medical_records": True,
                    "treatments": True,
                    "analytics": True,
                    "telemedicine": True,
                    "support": "priority",
                    "custom_branding": True,
                },
                "description": "Ideal for medium-sized hospitals",
            },
            {
                "name": "Enterprise Plan",
                "plan_type": "ENTERPRISE",
                "price": Decimal("999.99"),
                "billing_cycle": "MONTHLY",
                "max_users": 1000,
                "max_doctors": 100,
                "max_patients": 5000,
                "features": {
                    "appointments": True,
                    "medical_records": True,
                    "treatments": True,
                    "analytics": True,
                    "telemedicine": True,
                    "support": "24/7",
                    "custom_branding": True,
                    "api_access": True,
                    "white_label": True,
                },
                "description": "Complete solution for large healthcare networks",
            },
        ]

        for plan_data in plans_data:
            plan, created = SubscriptionPlan.objects.get_or_create(
                name=plan_data["name"], defaults=plan_data
            )
            if created:
                print(f"  Created plan: {plan.name}")
                self.created_data["subscription_plans"].append(
                    {
                        "id": str(plan.id),
                        "name": plan.name,
                        "type": plan.plan_type,
                        "price": str(plan.price),
                        "billing_cycle": plan.billing_cycle,
                    }
                )

        return SubscriptionPlan.objects.all()[:3]

    def create_hospitals(self, plans):
        """Create 3 hospitals with different subscription plans"""
        print("Creating hospitals...")

        hospitals_data = [
            {
                "name": "City General Hospital",
                "subdomain": "citygeneral",
                "registration_number": "CGH2025001",
                "email": "admin@citygeneral.com",
                "phone_number": "+1-555-0101",
                "address_line1": "123 Medical Center Drive",
                "address_line2": "Building A",
                "city": "New York",
                "state": "NY",
                "country": "USA",
                "postal_code": "10001",
                "hospital_type": "General",
                "is_active": True,
                "subscription_plan": plans[2],  # Enterprise
            },
            {
                "name": "Sunshine Pediatric Clinic",
                "subdomain": "sunshine",
                "registration_number": "SPC2025002",
                "email": "info@sunshinepediatric.com",
                "phone_number": "+1-555-0202",
                "address_line1": "456 Kids Health Avenue",
                "city": "Los Angeles",
                "state": "CA",
                "country": "USA",
                "postal_code": "90001",
                "hospital_type": "Pediatric",
                "is_active": True,
                "subscription_plan": plans[1],  # Professional
            },
            {
                "name": "Mountain View Medical Center",
                "subdomain": "mountainview",
                "registration_number": "MVMC2025003",
                "email": "contact@mvmedical.com",
                "phone_number": "+1-555-0303",
                "address_line1": "789 Healthcare Blvd",
                "city": "Denver",
                "state": "CO",
                "country": "USA",
                "postal_code": "80201",
                "hospital_type": "Specialty",
                "is_active": True,
                "subscription_plan": plans[0],  # Basic
            },
        ]

        created_hospitals = []
        for hosp_data in hospitals_data:
            hospital, created = Hospital.objects.get_or_create(
                subdomain=hosp_data["subdomain"], defaults=hosp_data
            )
            if created:
                print(f"  Created hospital: {hospital.name}")
                self.created_data["hospitals"].append(
                    {
                        "id": str(hospital.id),
                        "name": hospital.name,
                        "subdomain": hospital.subdomain,
                        "type": hospital.hospital_type,
                        "city": hospital.city,
                    }
                )
            created_hospitals.append(hospital)

        return created_hospitals

    def create_subscriptions(self, hospitals):
        """Create subscriptions for hospitals"""
        print("Creating subscriptions...")

        for hospital in hospitals:
            if hospital.subscription_plan:
                start_date = datetime.now()
                end_date = start_date + timedelta(days=365)

                subscription, created = Subscription.objects.get_or_create(
                    hospital=hospital,
                    plan=hospital.subscription_plan,
                    defaults={
                        "start_date": start_date,
                        "end_date": end_date,
                        "current_period_start": start_date,
                        "current_period_end": start_date + timedelta(days=30),
                        "status": "ACTIVE",
                    },
                )

                if created:
                    hospital.subscription_status = "ACTIVE"
                    hospital.save()
                    print(f"  Created subscription for: {hospital.name}")
                    self.created_data["subscriptions"].append(
                        {
                            "id": str(subscription.id),
                            "hospital": hospital.name,
                            "plan": hospital.subscription_plan.name,
                            "status": subscription.status,
                        }
                    )

    def create_specialties(self):
        """Create 10 medical specialties"""
        print("Creating specialties...")

        specialties_data = [
            ("CARD", "Cardiology", "Heart and cardiovascular system"),
            ("DERM", "Dermatology", "Skin, hair, and nail conditions"),
            ("ENDO", "Endocrinology", "Hormones and metabolic disorders"),
            ("GAST", "Gastroenterology", "Digestive system disorders"),
            ("NEUR", "Neurology", "Brain and nervous system"),
            ("OBGY", "Obstetrics & Gynecology", "Women's health and pregnancy"),
            ("ORTH", "Orthopedics", "Bones, joints, and musculoskeletal system"),
            ("PEDI", "Pediatrics", "Children and adolescent health"),
            ("PSYC", "Psychiatry", "Mental health and behavioral disorders"),
            ("PULM", "Pulmonology", "Lungs and respiratory system"),
        ]

        created_specialties = []
        for code, name, description in specialties_data:
            specialty, created = Specialty.objects.get_or_create(
                code=code,
                defaults={"name": name, "description": description, "is_active": True},
            )
            if created:
                print(f"  Created specialty: {name}")
                self.created_data["specialties"].append(
                    {
                        "id": str(specialty.id),
                        "code": specialty.code,
                        "name": specialty.name,
                    }
                )
            created_specialties.append(specialty)

        return created_specialties

    def create_super_admin(self):
        """Create 1 super admin user"""
        print("Creating super admin...")

        super_admin, created = User.objects.get_or_create(
            email="superadmin@medcor.ai",
            defaults={
                "first_name": "Super",
                "last_name": "Admin",
                "role": "SUPERADMIN",
                "is_superuser": True,
                "is_staff": True,
                "is_active": True,
                "phone_number": "+1-555-9999",
            },
        )

        if created:
            super_admin.set_password("SuperAdmin@123")
            super_admin.save()
            print(f"  Created super admin: {super_admin.email}")
            self.created_data["super_admin"] = {
                "id": str(super_admin.id),
                "email": super_admin.email,
                "name": super_admin.get_full_name(),
                "role": super_admin.role,
            }

        return super_admin

    def create_admins(self, hospitals):
        """Create 3 admin users (one for each hospital)"""
        print("Creating admin users...")

        for i, hospital in enumerate(hospitals):
            admin_email = f"admin@{hospital.subdomain}.com"
            admin, created = User.objects.get_or_create(
                email=admin_email,
                defaults={
                    "first_name": f"Admin",
                    "last_name": f"{hospital.name.split()[0]}",
                    "role": "ADMIN",
                    "hospital": hospital,
                    "is_staff": True,
                    "is_active": True,
                    "phone_number": f"+1-555-100{i+1}",
                },
            )

            if created:
                admin.set_password("Admin@123")
                admin.save()
                print(f"  Created admin: {admin.email} for {hospital.name}")
                self.created_data["admins"].append(
                    {
                        "id": str(admin.id),
                        "email": admin.email,
                        "name": admin.get_full_name(),
                        "hospital": hospital.name,
                    }
                )

    def create_doctors(self, hospitals, specialties):
        """Create 3 doctors with specialties"""
        print("Creating doctors...")

        doctors_data = [
            {
                "email": "dr.johnson@citygeneral.com",
                "first_name": "Robert",
                "last_name": "Johnson",
                "hospital": hospitals[0],
                "specialties": [
                    specialties[0],
                    specialties[4],
                ],  # Cardiology, Neurology
                "primary_specialty": specialties[0],
                "years_of_experience": 15,
                "license_number": "MD12345NY",
            },
            {
                "email": "dr.martinez@sunshine.com",
                "first_name": "Maria",
                "last_name": "Martinez",
                "hospital": hospitals[1],
                "specialties": [specialties[7]],  # Pediatrics
                "primary_specialty": specialties[7],
                "years_of_experience": 10,
                "license_number": "MD67890CA",
            },
            {
                "email": "dr.smith@mountainview.com",
                "first_name": "Sarah",
                "last_name": "Smith",
                "hospital": hospitals[2],
                "specialties": [
                    specialties[6],
                    specialties[1],
                ],  # Orthopedics, Dermatology
                "primary_specialty": specialties[6],
                "years_of_experience": 8,
                "license_number": "MD11111CO",
            },
        ]

        created_doctors = []
        for doc_data in doctors_data:
            doctor, created = User.objects.get_or_create(
                email=doc_data["email"],
                defaults={
                    "first_name": doc_data["first_name"],
                    "last_name": doc_data["last_name"],
                    "role": "DOCTOR",
                    "hospital": doc_data["hospital"],
                    "is_active": True,
                    "years_of_experience": doc_data["years_of_experience"],
                    "license_number": doc_data["license_number"],
                    "department": "Medical",
                    "phone_number": f"+1-555-{random.randint(2000, 2999)}",
                },
            )

            if created:
                doctor.set_password("Doctor@123")
                doctor.save()

                # Assign specialties
                for specialty in doc_data["specialties"]:
                    is_primary = specialty == doc_data["primary_specialty"]
                    DoctorSpecialty.objects.get_or_create(
                        doctor=doctor,
                        specialty=specialty,
                        defaults={
                            "is_primary": is_primary,
                            "years_of_experience": doc_data["years_of_experience"],
                            "certification_date": date.today()
                            - timedelta(days=365 * 5),
                        },
                    )

                print(
                    f"  Created doctor: {doctor.get_full_name()} at {doc_data['hospital'].name}"
                )
                self.created_data["doctors"].append(
                    {
                        "id": str(doctor.id),
                        "email": doctor.email,
                        "name": doctor.get_full_name(),
                        "hospital": doc_data["hospital"].name,
                        "specialties": [s.name for s in doc_data["specialties"]],
                    }
                )

            created_doctors.append(doctor)

        return created_doctors

    def create_patients(self, hospitals):
        """Create 6 patients (2 per hospital)"""
        print("Creating patients...")

        patients_data = [
            # City General Hospital patients
            {
                "email": "john.doe@example.com",
                "first_name": "John",
                "last_name": "Doe",
                "hospital": hospitals[0],
                "date_of_birth": date(1980, 5, 15),
                "gender": "MALE",
                "blood_group": "O+",
            },
            {
                "email": "jane.wilson@example.com",
                "first_name": "Jane",
                "last_name": "Wilson",
                "hospital": hospitals[0],
                "date_of_birth": date(1992, 8, 22),
                "gender": "FEMALE",
                "blood_group": "A+",
            },
            # Sunshine Pediatric Clinic patients
            {
                "email": "emma.brown@example.com",
                "first_name": "Emma",
                "last_name": "Brown",
                "hospital": hospitals[1],
                "date_of_birth": date(2015, 3, 10),
                "gender": "FEMALE",
                "blood_group": "B+",
            },
            {
                "email": "oliver.davis@example.com",
                "first_name": "Oliver",
                "last_name": "Davis",
                "hospital": hospitals[1],
                "date_of_birth": date(2018, 11, 5),
                "gender": "MALE",
                "blood_group": "AB+",
            },
            # Mountain View Medical Center patients
            {
                "email": "michael.taylor@example.com",
                "first_name": "Michael",
                "last_name": "Taylor",
                "hospital": hospitals[2],
                "date_of_birth": date(1975, 7, 30),
                "gender": "MALE",
                "blood_group": "O-",
            },
            {
                "email": "sophia.anderson@example.com",
                "first_name": "Sophia",
                "last_name": "Anderson",
                "hospital": hospitals[2],
                "date_of_birth": date(1988, 12, 18),
                "gender": "FEMALE",
                "blood_group": "A-",
            },
        ]

        created_patients = []
        for patient_data in patients_data:
            patient, created = User.objects.get_or_create(
                email=patient_data["email"],
                defaults={
                    "first_name": patient_data["first_name"],
                    "last_name": patient_data["last_name"],
                    "role": "PATIENT",
                    "hospital": patient_data["hospital"],
                    "is_active": True,
                    "date_of_birth": patient_data["date_of_birth"],
                    "gender": patient_data["gender"],
                    "blood_group": patient_data["blood_group"],
                    "phone_number": f"+1-555-{random.randint(3000, 3999)}",
                    "address": f"{random.randint(100, 999)} Patient Street",
                },
            )

            if created:
                patient.set_password("Patient@123")
                patient.save()
                print(
                    f"  Created patient: {patient.get_full_name()} at {patient_data['hospital'].name}"
                )
                self.created_data["patients"].append(
                    {
                        "id": str(patient.id),
                        "email": patient.email,
                        "name": patient.get_full_name(),
                        "hospital": patient_data["hospital"].name,
                        "date_of_birth": str(patient_data["date_of_birth"]),
                    }
                )

            created_patients.append(patient)

        return created_patients

    def create_medical_records(self, patients, doctors):
        """Create 5 medical records for 5 patients"""
        print("Creating medical records...")

        records_data = [
            {
                "patient": patients[0],
                "title": "Annual Health Checkup",
                "description": "Routine annual health examination",
                "record_type": "CHECKUP",
                "diagnosis": "Patient in good health. Mild hypertension noted.",
                "symptoms": "None - routine checkup",
                "created_by": doctors[0],
            },
            {
                "patient": patients[1],
                "title": "Cardiology Consultation",
                "description": "Referred for chest pain evaluation",
                "record_type": "CONSULTATION",
                "diagnosis": "Suspected angina. ECG shows minor irregularities.",
                "symptoms": "Chest pain during exercise, shortness of breath",
                "created_by": doctors[0],
            },
            {
                "patient": patients[2],
                "title": "Pediatric Wellness Visit",
                "description": "Regular pediatric checkup and vaccinations",
                "record_type": "VACCINATION",
                "diagnosis": "Healthy child development. Vaccines administered.",
                "symptoms": "None - wellness visit",
                "created_by": doctors[1],
            },
            {
                "patient": patients[3],
                "title": "Flu Treatment",
                "description": "Treatment for seasonal influenza",
                "record_type": "TREATMENT",
                "diagnosis": "Influenza A confirmed",
                "symptoms": "Fever, cough, body aches, fatigue",
                "created_by": doctors[1],
            },
            {
                "patient": patients[4],
                "title": "Orthopedic Evaluation",
                "description": "Knee pain assessment",
                "record_type": "CONSULTATION",
                "diagnosis": "Mild osteoarthritis of the right knee",
                "symptoms": "Knee pain, stiffness, especially in morning",
                "created_by": doctors[2],
            },
        ]

        for record_data in records_data:
            record, created = MedicalRecord.objects.get_or_create(
                patient=record_data["patient"],
                title=record_data["title"],
                defaults={
                    "hospital": record_data["patient"].hospital,
                    "description": record_data["description"],
                    "record_type": record_data["record_type"],
                    "diagnosis": record_data["diagnosis"],
                    "symptoms": record_data["symptoms"],
                    "created_by": record_data["created_by"],
                },
            )

            if created:
                print(
                    f"  Created medical record: {record.title} for {record_data['patient'].get_full_name()}"
                )
                self.created_data["medical_records"].append(
                    {
                        "id": str(record.id),
                        "patient": record_data["patient"].get_full_name(),
                        "title": record.title,
                        "type": record.record_type,
                        "created_by": record_data["created_by"].get_full_name(),
                    }
                )

    def save_to_json(self):
        """Save all created data to JSON file"""
        output_file = "sample_data.json"

        # Convert datetime objects to strings
        def serialize(obj):
            if isinstance(obj, (datetime, date)):
                return obj.isoformat()
            elif isinstance(obj, Decimal):
                return str(obj)
            return obj

        with open(output_file, "w") as f:
            json.dump(self.created_data, f, indent=2, default=serialize)

        print(f"\n✅ Test data saved to {output_file}")
        return output_file

    def print_summary(self):
        """Print summary of created data"""
        print("\n" + "=" * 50)
        print("TEST DATA CREATION SUMMARY")
        print("=" * 50)

        print(f"\n📊 Created Entities:")
        print(f"  • Subscription Plans: {len(self.created_data['subscription_plans'])}")
        print(f"  • Hospitals: {len(self.created_data['hospitals'])}")
        print(f"  • Subscriptions: {len(self.created_data['subscriptions'])}")
        print(f"  • Specialties: {len(self.created_data['specialties'])}")
        print(f"  • Super Admin: {'1' if self.created_data['super_admin'] else '0'}")
        print(f"  • Admins: {len(self.created_data['admins'])}")
        print(f"  • Doctors: {len(self.created_data['doctors'])}")
        print(f"  • Patients: {len(self.created_data['patients'])}")
        print(f"  • Medical Records: {len(self.created_data['medical_records'])}")

        print(f"\n🔐 Default Passwords:")
        print(f"  • Super Admin: SuperAdmin@123")
        print(f"  • Admins: Admin@123")
        print(f"  • Doctors: Doctor@123")
        print(f"  • Patients: Patient@123")

        print(f"\n📧 Login Credentials:")
        if self.created_data["super_admin"]:
            print(f"  • Super Admin: superadmin@medcor.ai")
        for admin in self.created_data["admins"][:3]:
            print(f"  • Admin: {admin['email']}")
        for doctor in self.created_data["doctors"][:3]:
            print(f"  • Doctor: {doctor['email']}")
        for patient in self.created_data["patients"][:2]:
            print(f"  • Patient: {patient['email']}")

    def run(self):
        """Main execution method"""
        print("\n🚀 Starting test data creation for MedCor Backend...")
        print("=" * 50)

        try:
            # Create all entities in order
            plans = self.create_subscription_plans()
            hospitals = self.create_hospitals(plans)
            self.create_subscriptions(hospitals)
            specialties = self.create_specialties()
            self.create_super_admin()
            self.create_admins(hospitals)
            doctors = self.create_doctors(hospitals, specialties)
            patients = self.create_patients(hospitals)
            self.create_medical_records(patients, doctors)

            # Save to JSON and print summary
            self.save_to_json()
            self.print_summary()

            print("\n✅ Test data creation completed successfully!")

        except Exception as e:
            print(f"\n❌ Error creating test data: {str(e)}")
            import traceback

            traceback.print_exc()


if __name__ == "__main__":
    generator = TestDataGenerator()
    generator.run()
