#!/usr/bin/env python
"""
Create sample data JSON file for MedCor Backend
Generates test data without database dependency
"""

import json
from datetime import datetime, timedelta, date
from decimal import Decimal
import uuid
import random

class SampleDataGenerator:
    def __init__(self):
        self.data = {
            'subscription_plans': [],
            'hospitals': [],
            'subscriptions': [],
            'specialties': [],
            'super_admin': None,
            'admins': [],
            'doctors': [],
            'patients': [],
            'medical_records': [],
            'doctor_specialties': []
        }
    
    def generate_uuid(self):
        """Generate a UUID for primary keys"""
        return str(uuid.uuid4())
    
    def create_subscription_plans(self):
        """Create 3 subscription plans"""
        plans = [
            {
                'id': self.generate_uuid(),
                'name': 'Basic Plan',
                'plan_type': 'BASIC',
                'price': '99.99',
                'billing_cycle': 'MONTHLY',
                'max_users': 50,
                'max_doctors': 5,
                'max_patients': 100,
                'features': {
                    'appointments': True,
                    'medical_records': True,
                    'treatments': True,
                    'analytics': False,
                    'telemedicine': False,
                    'support': 'email'
                },
                'description': 'Perfect for small clinics',
                'is_active': True,
                'created_at': datetime.now().isoformat()
            },
            {
                'id': self.generate_uuid(),
                'name': 'Professional Plan',
                'plan_type': 'PROFESSIONAL',
                'price': '299.99',
                'billing_cycle': 'MONTHLY',
                'max_users': 200,
                'max_doctors': 20,
                'max_patients': 500,
                'features': {
                    'appointments': True,
                    'medical_records': True,
                    'treatments': True,
                    'analytics': True,
                    'telemedicine': True,
                    'support': 'priority',
                    'custom_branding': True
                },
                'description': 'Ideal for medium-sized hospitals',
                'is_active': True,
                'created_at': datetime.now().isoformat()
            },
            {
                'id': self.generate_uuid(),
                'name': 'Enterprise Plan',
                'plan_type': 'ENTERPRISE',
                'price': '999.99',
                'billing_cycle': 'MONTHLY',
                'max_users': 1000,
                'max_doctors': 100,
                'max_patients': 5000,
                'features': {
                    'appointments': True,
                    'medical_records': True,
                    'treatments': True,
                    'analytics': True,
                    'telemedicine': True,
                    'support': '24/7',
                    'custom_branding': True,
                    'api_access': True,
                    'white_label': True
                },
                'description': 'Complete solution for large healthcare networks',
                'is_active': True,
                'created_at': datetime.now().isoformat()
            }
        ]
        
        self.data['subscription_plans'] = plans
        return plans
    
    def create_hospitals(self, plans):
        """Create 3 hospitals"""
        hospitals = [
            {
                'id': self.generate_uuid(),
                'name': 'City General Hospital',
                'subdomain': 'citygeneral',
                'registration_number': 'CGH2025001',
                'email': 'admin@citygeneral.com',
                'phone_number': '+1-555-0101',
                'address_line1': '123 Medical Center Drive',
                'address_line2': 'Building A',
                'city': 'New York',
                'state': 'NY',
                'country': 'USA',
                'postal_code': '10001',
                'hospital_type': 'General',
                'subscription_plan_id': plans[2]['id'],
                'subscription_plan_name': plans[2]['name'],
                'subscription_status': 'ACTIVE',
                'is_active': True,
                'created_at': datetime.now().isoformat()
            },
            {
                'id': self.generate_uuid(),
                'name': 'Sunshine Pediatric Clinic',
                'subdomain': 'sunshine',
                'registration_number': 'SPC2025002',
                'email': 'info@sunshinepediatric.com',
                'phone_number': '+1-555-0202',
                'address_line1': '456 Kids Health Avenue',
                'address_line2': '',
                'city': 'Los Angeles',
                'state': 'CA',
                'country': 'USA',
                'postal_code': '90001',
                'hospital_type': 'Pediatric',
                'subscription_plan_id': plans[1]['id'],
                'subscription_plan_name': plans[1]['name'],
                'subscription_status': 'ACTIVE',
                'is_active': True,
                'created_at': datetime.now().isoformat()
            },
            {
                'id': self.generate_uuid(),
                'name': 'Mountain View Medical Center',
                'subdomain': 'mountainview',
                'registration_number': 'MVMC2025003',
                'email': 'contact@mvmedical.com',
                'phone_number': '+1-555-0303',
                'address_line1': '789 Healthcare Blvd',
                'address_line2': '',
                'city': 'Denver',
                'state': 'CO',
                'country': 'USA',
                'postal_code': '80201',
                'hospital_type': 'Specialty',
                'subscription_plan_id': plans[0]['id'],
                'subscription_plan_name': plans[0]['name'],
                'subscription_status': 'ACTIVE',
                'is_active': True,
                'created_at': datetime.now().isoformat()
            }
        ]
        
        self.data['hospitals'] = hospitals
        return hospitals
    
    def create_subscriptions(self, hospitals, plans):
        """Create subscriptions for hospitals"""
        subscriptions = []
        
        for i, hospital in enumerate(hospitals):
            plan = plans[2-i]  # Assign different plans
            start_date = datetime.now()
            end_date = start_date + timedelta(days=365)
            
            subscription = {
                'id': self.generate_uuid(),
                'hospital_id': hospital['id'],
                'hospital_name': hospital['name'],
                'plan_id': plan['id'],
                'plan_name': plan['name'],
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'current_period_start': start_date.isoformat(),
                'current_period_end': (start_date + timedelta(days=30)).isoformat(),
                'status': 'ACTIVE',
                'created_at': datetime.now().isoformat()
            }
            subscriptions.append(subscription)
        
        self.data['subscriptions'] = subscriptions
        return subscriptions
    
    def create_specialties(self):
        """Create 10 medical specialties"""
        specialties_data = [
            ('CARD', 'Cardiology', 'Heart and cardiovascular system'),
            ('DERM', 'Dermatology', 'Skin, hair, and nail conditions'),
            ('ENDO', 'Endocrinology', 'Hormones and metabolic disorders'),
            ('GAST', 'Gastroenterology', 'Digestive system disorders'),
            ('NEUR', 'Neurology', 'Brain and nervous system'),
            ('OBGY', 'Obstetrics & Gynecology', 'Women\'s health and pregnancy'),
            ('ORTH', 'Orthopedics', 'Bones, joints, and musculoskeletal system'),
            ('PEDI', 'Pediatrics', 'Children and adolescent health'),
            ('PSYC', 'Psychiatry', 'Mental health and behavioral disorders'),
            ('PULM', 'Pulmonology', 'Lungs and respiratory system')
        ]
        
        specialties = []
        for code, name, description in specialties_data:
            specialty = {
                'id': self.generate_uuid(),
                'code': code,
                'name': name,
                'description': description,
                'is_active': True,
                'created_at': datetime.now().isoformat()
            }
            specialties.append(specialty)
        
        self.data['specialties'] = specialties
        return specialties
    
    def create_super_admin(self):
        """Create 1 super admin"""
        super_admin = {
            'id': self.generate_uuid(),
            'email': 'superadmin@medcor.ai',
            'password': 'SuperAdmin@123',
            'first_name': 'Super',
            'last_name': 'Admin',
            'role': 'SUPERADMIN',
            'is_superuser': True,
            'is_staff': True,
            'is_active': True,
            'phone_number': '+1-555-9999',
            'created_at': datetime.now().isoformat()
        }
        
        self.data['super_admin'] = super_admin
        return super_admin
    
    def create_admins(self, hospitals):
        """Create 3 admin users (one for each hospital)"""
        admins = []
        
        for i, hospital in enumerate(hospitals):
            admin = {
                'id': self.generate_uuid(),
                'email': f'admin@{hospital["subdomain"]}.com',
                'password': 'Admin@123',
                'first_name': 'Admin',
                'last_name': hospital['name'].split()[0],
                'role': 'ADMIN',
                'hospital_id': hospital['id'],
                'hospital_name': hospital['name'],
                'is_staff': True,
                'is_active': True,
                'phone_number': f'+1-555-100{i+1}',
                'created_at': datetime.now().isoformat()
            }
            admins.append(admin)
        
        self.data['admins'] = admins
        return admins
    
    def create_doctors(self, hospitals, specialties):
        """Create 3 doctors with specialties"""
        doctors = [
            {
                'id': self.generate_uuid(),
                'email': 'dr.johnson@citygeneral.com',
                'password': 'Doctor@123',
                'first_name': 'Robert',
                'last_name': 'Johnson',
                'role': 'DOCTOR',
                'hospital_id': hospitals[0]['id'],
                'hospital_name': hospitals[0]['name'],
                'primary_specialty_id': specialties[0]['id'],
                'primary_specialty_name': specialties[0]['name'],
                'years_of_experience': 15,
                'license_number': 'MD12345NY',
                'department': 'Cardiology',
                'phone_number': '+1-555-2001',
                'is_active': True,
                'created_at': datetime.now().isoformat()
            },
            {
                'id': self.generate_uuid(),
                'email': 'dr.martinez@sunshine.com',
                'password': 'Doctor@123',
                'first_name': 'Maria',
                'last_name': 'Martinez',
                'role': 'DOCTOR',
                'hospital_id': hospitals[1]['id'],
                'hospital_name': hospitals[1]['name'],
                'primary_specialty_id': specialties[7]['id'],
                'primary_specialty_name': specialties[7]['name'],
                'years_of_experience': 10,
                'license_number': 'MD67890CA',
                'department': 'Pediatrics',
                'phone_number': '+1-555-2002',
                'is_active': True,
                'created_at': datetime.now().isoformat()
            },
            {
                'id': self.generate_uuid(),
                'email': 'dr.smith@mountainview.com',
                'password': 'Doctor@123',
                'first_name': 'Sarah',
                'last_name': 'Smith',
                'role': 'DOCTOR',
                'hospital_id': hospitals[2]['id'],
                'hospital_name': hospitals[2]['name'],
                'primary_specialty_id': specialties[6]['id'],
                'primary_specialty_name': specialties[6]['name'],
                'years_of_experience': 8,
                'license_number': 'MD11111CO',
                'department': 'Orthopedics',
                'phone_number': '+1-555-2003',
                'is_active': True,
                'created_at': datetime.now().isoformat()
            }
        ]
        
        # Create doctor-specialty associations
        doctor_specialties = [
            # Dr. Johnson - Cardiology and Neurology
            {
                'id': self.generate_uuid(),
                'doctor_id': doctors[0]['id'],
                'doctor_name': f"{doctors[0]['first_name']} {doctors[0]['last_name']}",
                'specialty_id': specialties[0]['id'],
                'specialty_name': specialties[0]['name'],
                'is_primary': True,
                'years_of_experience': 15,
                'certification_date': (date.today() - timedelta(days=365*15)).isoformat()
            },
            {
                'id': self.generate_uuid(),
                'doctor_id': doctors[0]['id'],
                'doctor_name': f"{doctors[0]['first_name']} {doctors[0]['last_name']}",
                'specialty_id': specialties[4]['id'],
                'specialty_name': specialties[4]['name'],
                'is_primary': False,
                'years_of_experience': 10,
                'certification_date': (date.today() - timedelta(days=365*10)).isoformat()
            },
            # Dr. Martinez - Pediatrics
            {
                'id': self.generate_uuid(),
                'doctor_id': doctors[1]['id'],
                'doctor_name': f"{doctors[1]['first_name']} {doctors[1]['last_name']}",
                'specialty_id': specialties[7]['id'],
                'specialty_name': specialties[7]['name'],
                'is_primary': True,
                'years_of_experience': 10,
                'certification_date': (date.today() - timedelta(days=365*10)).isoformat()
            },
            # Dr. Smith - Orthopedics and Dermatology
            {
                'id': self.generate_uuid(),
                'doctor_id': doctors[2]['id'],
                'doctor_name': f"{doctors[2]['first_name']} {doctors[2]['last_name']}",
                'specialty_id': specialties[6]['id'],
                'specialty_name': specialties[6]['name'],
                'is_primary': True,
                'years_of_experience': 8,
                'certification_date': (date.today() - timedelta(days=365*8)).isoformat()
            },
            {
                'id': self.generate_uuid(),
                'doctor_id': doctors[2]['id'],
                'doctor_name': f"{doctors[2]['first_name']} {doctors[2]['last_name']}",
                'specialty_id': specialties[1]['id'],
                'specialty_name': specialties[1]['name'],
                'is_primary': False,
                'years_of_experience': 5,
                'certification_date': (date.today() - timedelta(days=365*5)).isoformat()
            }
        ]
        
        self.data['doctors'] = doctors
        self.data['doctor_specialties'] = doctor_specialties
        return doctors
    
    def create_patients(self, hospitals):
        """Create 6 patients (2 per hospital)"""
        patients = [
            # City General Hospital patients
            {
                'id': self.generate_uuid(),
                'email': 'john.doe@example.com',
                'password': 'Patient@123',
                'first_name': 'John',
                'last_name': 'Doe',
                'role': 'PATIENT',
                'hospital_id': hospitals[0]['id'],
                'hospital_name': hospitals[0]['name'],
                'date_of_birth': '1980-05-15',
                'gender': 'MALE',
                'blood_group': 'O+',
                'phone_number': '+1-555-3001',
                'address': '100 Patient Street, New York, NY 10001',
                'is_active': True,
                'created_at': datetime.now().isoformat()
            },
            {
                'id': self.generate_uuid(),
                'email': 'jane.wilson@example.com',
                'password': 'Patient@123',
                'first_name': 'Jane',
                'last_name': 'Wilson',
                'role': 'PATIENT',
                'hospital_id': hospitals[0]['id'],
                'hospital_name': hospitals[0]['name'],
                'date_of_birth': '1992-08-22',
                'gender': 'FEMALE',
                'blood_group': 'A+',
                'phone_number': '+1-555-3002',
                'address': '200 Patient Avenue, New York, NY 10002',
                'is_active': True,
                'created_at': datetime.now().isoformat()
            },
            # Sunshine Pediatric Clinic patients
            {
                'id': self.generate_uuid(),
                'email': 'emma.brown@example.com',
                'password': 'Patient@123',
                'first_name': 'Emma',
                'last_name': 'Brown',
                'role': 'PATIENT',
                'hospital_id': hospitals[1]['id'],
                'hospital_name': hospitals[1]['name'],
                'date_of_birth': '2015-03-10',
                'gender': 'FEMALE',
                'blood_group': 'B+',
                'phone_number': '+1-555-3003',
                'address': '300 Kids Lane, Los Angeles, CA 90001',
                'is_active': True,
                'created_at': datetime.now().isoformat()
            },
            {
                'id': self.generate_uuid(),
                'email': 'oliver.davis@example.com',
                'password': 'Patient@123',
                'first_name': 'Oliver',
                'last_name': 'Davis',
                'role': 'PATIENT',
                'hospital_id': hospitals[1]['id'],
                'hospital_name': hospitals[1]['name'],
                'date_of_birth': '2018-11-05',
                'gender': 'MALE',
                'blood_group': 'AB+',
                'phone_number': '+1-555-3004',
                'address': '400 Children Road, Los Angeles, CA 90002',
                'is_active': True,
                'created_at': datetime.now().isoformat()
            },
            # Mountain View Medical Center patients
            {
                'id': self.generate_uuid(),
                'email': 'michael.taylor@example.com',
                'password': 'Patient@123',
                'first_name': 'Michael',
                'last_name': 'Taylor',
                'role': 'PATIENT',
                'hospital_id': hospitals[2]['id'],
                'hospital_name': hospitals[2]['name'],
                'date_of_birth': '1975-07-30',
                'gender': 'MALE',
                'blood_group': 'O-',
                'phone_number': '+1-555-3005',
                'address': '500 Mountain Street, Denver, CO 80201',
                'is_active': True,
                'created_at': datetime.now().isoformat()
            },
            {
                'id': self.generate_uuid(),
                'email': 'sophia.anderson@example.com',
                'password': 'Patient@123',
                'first_name': 'Sophia',
                'last_name': 'Anderson',
                'role': 'PATIENT',
                'hospital_id': hospitals[2]['id'],
                'hospital_name': hospitals[2]['name'],
                'date_of_birth': '1988-12-18',
                'gender': 'FEMALE',
                'blood_group': 'A-',
                'phone_number': '+1-555-3006',
                'address': '600 View Boulevard, Denver, CO 80202',
                'is_active': True,
                'created_at': datetime.now().isoformat()
            }
        ]
        
        self.data['patients'] = patients
        return patients
    
    def create_medical_records(self, patients, doctors):
        """Create 5 medical records for 5 patients"""
        medical_records = [
            {
                'id': self.generate_uuid(),
                'patient_id': patients[0]['id'],
                'patient_name': f"{patients[0]['first_name']} {patients[0]['last_name']}",
                'hospital_id': patients[0]['hospital_id'],
                'hospital_name': patients[0]['hospital_name'],
                'title': 'Annual Health Checkup',
                'description': 'Routine annual health examination',
                'record_type': 'CHECKUP',
                'diagnosis': 'Patient in good health. Mild hypertension noted.',
                'symptoms': 'None - routine checkup',
                'created_by_id': doctors[0]['id'],
                'created_by_name': f"Dr. {doctors[0]['first_name']} {doctors[0]['last_name']}",
                'created_at': datetime.now().isoformat()
            },
            {
                'id': self.generate_uuid(),
                'patient_id': patients[1]['id'],
                'patient_name': f"{patients[1]['first_name']} {patients[1]['last_name']}",
                'hospital_id': patients[1]['hospital_id'],
                'hospital_name': patients[1]['hospital_name'],
                'title': 'Cardiology Consultation',
                'description': 'Referred for chest pain evaluation',
                'record_type': 'CONSULTATION',
                'diagnosis': 'Suspected angina. ECG shows minor irregularities.',
                'symptoms': 'Chest pain during exercise, shortness of breath',
                'created_by_id': doctors[0]['id'],
                'created_by_name': f"Dr. {doctors[0]['first_name']} {doctors[0]['last_name']}",
                'created_at': datetime.now().isoformat()
            },
            {
                'id': self.generate_uuid(),
                'patient_id': patients[2]['id'],
                'patient_name': f"{patients[2]['first_name']} {patients[2]['last_name']}",
                'hospital_id': patients[2]['hospital_id'],
                'hospital_name': patients[2]['hospital_name'],
                'title': 'Pediatric Wellness Visit',
                'description': 'Regular pediatric checkup and vaccinations',
                'record_type': 'VACCINATION',
                'diagnosis': 'Healthy child development. Vaccines administered.',
                'symptoms': 'None - wellness visit',
                'created_by_id': doctors[1]['id'],
                'created_by_name': f"Dr. {doctors[1]['first_name']} {doctors[1]['last_name']}",
                'created_at': datetime.now().isoformat()
            },
            {
                'id': self.generate_uuid(),
                'patient_id': patients[3]['id'],
                'patient_name': f"{patients[3]['first_name']} {patients[3]['last_name']}",
                'hospital_id': patients[3]['hospital_id'],
                'hospital_name': patients[3]['hospital_name'],
                'title': 'Flu Treatment',
                'description': 'Treatment for seasonal influenza',
                'record_type': 'TREATMENT',
                'diagnosis': 'Influenza A confirmed',
                'symptoms': 'Fever, cough, body aches, fatigue',
                'created_by_id': doctors[1]['id'],
                'created_by_name': f"Dr. {doctors[1]['first_name']} {doctors[1]['last_name']}",
                'created_at': datetime.now().isoformat()
            },
            {
                'id': self.generate_uuid(),
                'patient_id': patients[4]['id'],
                'patient_name': f"{patients[4]['first_name']} {patients[4]['last_name']}",
                'hospital_id': patients[4]['hospital_id'],
                'hospital_name': patients[4]['hospital_name'],
                'title': 'Orthopedic Evaluation',
                'description': 'Knee pain assessment',
                'record_type': 'CONSULTATION',
                'diagnosis': 'Mild osteoarthritis of the right knee',
                'symptoms': 'Knee pain, stiffness, especially in morning',
                'created_by_id': doctors[2]['id'],
                'created_by_name': f"Dr. {doctors[2]['first_name']} {doctors[2]['last_name']}",
                'created_at': datetime.now().isoformat()
            }
        ]
        
        self.data['medical_records'] = medical_records
        return medical_records
    
    def generate_all(self):
        """Generate all test data"""
        print("🚀 Generating sample data...")
        
        # Generate in order of dependencies
        plans = self.create_subscription_plans()
        print(f"  ✓ Created {len(plans)} subscription plans")
        
        hospitals = self.create_hospitals(plans)
        print(f"  ✓ Created {len(hospitals)} hospitals")
        
        subscriptions = self.create_subscriptions(hospitals, plans)
        print(f"  ✓ Created {len(subscriptions)} subscriptions")
        
        specialties = self.create_specialties()
        print(f"  ✓ Created {len(specialties)} specialties")
        
        super_admin = self.create_super_admin()
        print(f"  ✓ Created 1 super admin")
        
        admins = self.create_admins(hospitals)
        print(f"  ✓ Created {len(admins)} admins")
        
        doctors = self.create_doctors(hospitals, specialties)
        print(f"  ✓ Created {len(doctors)} doctors")
        print(f"  ✓ Created {len(self.data['doctor_specialties'])} doctor-specialty associations")
        
        patients = self.create_patients(hospitals)
        print(f"  ✓ Created {len(patients)} patients")
        
        records = self.create_medical_records(patients, doctors)
        print(f"  ✓ Created {len(records)} medical records")
        
        return self.data
    
    def save_to_file(self, filename='sample_data.json'):
        """Save data to JSON file"""
        with open(filename, 'w') as f:
            json.dump(self.data, f, indent=2, default=str)
        print(f"\n✅ Sample data saved to {filename}")
        return filename
    
    def print_summary(self):
        """Print summary of generated data"""
        print("\n" + "="*60)
        print("SAMPLE DATA GENERATION SUMMARY")
        print("="*60)
        
        print("\n📊 Generated Entities:")
        print(f"  • Subscription Plans: {len(self.data['subscription_plans'])}")
        print(f"  • Hospitals: {len(self.data['hospitals'])}")
        print(f"  • Subscriptions: {len(self.data['subscriptions'])}")
        print(f"  • Specialties: {len(self.data['specialties'])}")
        print(f"  • Super Admin: 1")
        print(f"  • Admins: {len(self.data['admins'])}")
        print(f"  • Doctors: {len(self.data['doctors'])}")
        print(f"  • Doctor Specialties: {len(self.data['doctor_specialties'])}")
        print(f"  • Patients: {len(self.data['patients'])}")
        print(f"  • Medical Records: {len(self.data['medical_records'])}")
        
        print("\n🔐 Login Credentials (all passwords are the same):")
        print("\n  Super Admin:")
        print(f"    • Email: {self.data['super_admin']['email']}")
        print(f"    • Password: {self.data['super_admin']['password']}")
        
        print("\n  Admins:")
        for admin in self.data['admins']:
            print(f"    • {admin['email']} / {admin['password']} ({admin['hospital_name']})")
        
        print("\n  Doctors:")
        for doctor in self.data['doctors']:
            print(f"    • {doctor['email']} / {doctor['password']} ({doctor['primary_specialty_name']})")
        
        print("\n  Sample Patients:")
        for patient in self.data['patients'][:2]:
            print(f"    • {patient['email']} / {patient['password']}")
        
        print("\n🏥 Hospitals & Plans:")
        for hospital in self.data['hospitals']:
            print(f"  • {hospital['name']}: {hospital['subscription_plan_name']}")
            print(f"    Subdomain: {hospital['subdomain']}")
            print(f"    Location: {hospital['city']}, {hospital['state']}")


def main():
    """Main execution"""
    generator = SampleDataGenerator()
    
    # Generate all data
    data = generator.generate_all()
    
    # Save to file
    generator.save_to_file('medcor_backend2/sample_data.json')
    
    # Print summary
    generator.print_summary()
    
    print("\n✨ Sample data generation complete!")
    print("📁 Data has been saved to medcor_backend2/sample_data.json")
    print("\n💡 This JSON file can be used to:")
    print("  • Import test data into the database")
    print("  • Reference for API testing")
    print("  • Documentation of data structure")


if __name__ == "__main__":
    main()