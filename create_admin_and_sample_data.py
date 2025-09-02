#!/usr/bin/env python3
"""
Create admin user and sample data for MedCor Backend
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import User
from specialty.models import Specialty, DoctorSpecialty
from tenants.models import Hospital
from subscription_plans.models import SubscriptionPlan, Subscription
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()

def create_superuser():
    """Create a superuser account"""
    try:
        user = User.objects.create_superuser(
            username='admin',
            email='admin@medcor.com',
            password='admin123',
            first_name='Admin',
            last_name='User'
        )
        print(f"✅ Superuser created: {user.username} ({user.email})")
        return user
    except Exception as e:
        print(f"⚠️  Superuser already exists or error: {e}")
        return User.objects.get(username='admin')

def create_sample_hospitals():
    """Create sample hospitals"""
    hospitals_data = [
        {
            'name': 'MedCor General Hospital',
            'slug': 'medcor-general',
            'hospital_type': 'GENERAL',
            'description': 'A comprehensive general hospital providing quality healthcare services',
            'phone_number': '+1-555-0123',
            'email': 'info@medcor-general.com',
            'website': 'https://medcor-general.com',
            'address_line1': '123 Healthcare Blvd',
            'city': 'New York',
            'state': 'NY',
            'country': 'United States',
            'postal_code': '10001',
            'bed_count': 250,
            'emergency_services': True,
            'trauma_center_level': 'Level II',
            'services': ['Cardiology', 'Pediatrics', 'Emergency Medicine', 'Surgery'],
            'is_verified': True
        },
        {
            'name': 'MedCor Specialty Clinic',
            'slug': 'medcor-specialty',
            'hospital_type': 'SPECIALTY',
            'description': 'Specialized medical care focusing on specific medical conditions',
            'phone_number': '+1-555-0456',
            'email': 'info@medcor-specialty.com',
            'website': 'https://medcor-specialty.com',
            'address_line1': '456 Medical Center Dr',
            'city': 'Los Angeles',
            'state': 'CA',
            'country': 'United States',
            'postal_code': '90210',
            'bed_count': 50,
            'emergency_services': False,
            'services': ['Dermatology', 'Orthopedics', 'Neurology'],
            'is_verified': True
        }
    ]
    
    created_hospitals = []
    for hospital_data in hospitals_data:
        hospital, created = Hospital.objects.get_or_create(
            slug=hospital_data['slug'],
            defaults=hospital_data
        )
        if created:
            print(f"✅ Created hospital: {hospital.name}")
        else:
            print(f"✅ Hospital already exists: {hospital.name}")
        created_hospitals.append(hospital)
    
    return created_hospitals

def create_sample_subscription_plans():
    """Create sample subscription plans"""
    plans_data = [
        {
            'name': 'Basic Plan',
            'slug': 'basic-plan',
            'plan_type': 'BASIC',
            'description': 'Essential healthcare management for small clinics',
            'price': 99.00,
            'currency': 'USD',
            'billing_cycle': 'MONTHLY',
            'trial_days': 14,
            'max_users': 10,
            'max_doctors': 3,
            'max_patients': 100,
            'max_appointments_per_month': 200,
            'storage_gb': 5,
            'has_telemedicine': False,
            'has_analytics': False,
            'is_featured': False
        },
        {
            'name': 'Professional Plan',
            'slug': 'professional-plan',
            'plan_type': 'PROFESSIONAL',
            'description': 'Advanced features for growing medical practices',
            'price': 299.00,
            'currency': 'USD',
            'billing_cycle': 'MONTHLY',
            'trial_days': 14,
            'max_users': 50,
            'max_doctors': 15,
            'max_patients': 500,
            'max_appointments_per_month': 1000,
            'storage_gb': 25,
            'has_telemedicine': True,
            'has_analytics': True,
            'is_featured': True
        },
        {
            'name': 'Enterprise Plan',
            'slug': 'enterprise-plan',
            'plan_type': 'ENTERPRISE',
            'description': 'Full-featured solution for large hospitals',
            'price': 799.00,
            'currency': 'USD',
            'billing_cycle': 'MONTHLY',
            'trial_days': 30,
            'max_users': 200,
            'max_doctors': 50,
            'max_patients': 2000,
            'max_appointments_per_month': 5000,
            'storage_gb': 100,
            'has_telemedicine': True,
            'has_analytics': True,
            'has_api_access': True,
            'has_custom_branding': True,
            'has_priority_support': True,
            'is_featured': True
        }
    ]
    
    created_plans = []
    for plan_data in plans_data:
        plan, created = SubscriptionPlan.objects.get_or_create(
            slug=plan_data['slug'],
            defaults=plan_data
        )
        if created:
            print(f"✅ Created subscription plan: {plan.name}")
        else:
            print(f"✅ Subscription plan already exists: {plan.name}")
        created_plans.append(plan)
    
    return created_plans

def create_sample_subscriptions(hospitals, plans):
    """Create sample subscriptions for hospitals"""
    for i, hospital in enumerate(hospitals):
        plan = plans[i % len(plans)]  # Distribute plans among hospitals
        subscription, created = Subscription.objects.get_or_create(
            hospital_name=hospital.name,
            defaults={
                'plan': plan,
                'status': 'ACTIVE',
                'start_date': timezone.now(),
                'end_date': timezone.now() + timedelta(days=365),
                'trial_end_date': timezone.now() + timedelta(days=14),
                'current_period_start': timezone.now(),
                'current_period_end': timezone.now() + timedelta(days=30),
                'next_billing_date': timezone.now() + timedelta(days=30),
                'auto_renew': True
            }
        )
        if created:
            print(f"✅ Created subscription for {hospital.name}: {plan.name}")
        else:
            print(f"✅ Subscription already exists for {hospital.name}")

def create_sample_users():
    """Create sample users (doctors, nurses, patients)"""
    users_data = [
        {
            'username': 'dr.smith',
            'email': 'dr.smith@medcor.com',
            'password': 'password123',
            'first_name': 'John',
            'last_name': 'Smith',
            'role': 'DOCTOR',
            'hospital_name': 'MedCor General Hospital',
            'specialization': 'Cardiology',
            'department': 'Cardiology',
            'phone_number': '+1-555-0101',
            'is_verified': True
        },
        {
            'username': 'dr.johnson',
            'email': 'dr.johnson@medcor.com',
            'password': 'password123',
            'first_name': 'Sarah',
            'last_name': 'Johnson',
            'role': 'DOCTOR',
            'hospital_name': 'MedCor General Hospital',
            'specialization': 'Pediatrics',
            'department': 'Pediatrics',
            'phone_number': '+1-555-0102',
            'is_verified': True
        },
        {
            'username': 'nurse.wilson',
            'email': 'nurse.wilson@medcor.com',
            'password': 'password123',
            'first_name': 'Michael',
            'last_name': 'Wilson',
            'role': 'NURSE',
            'hospital_name': 'MedCor General Hospital',
            'department': 'Emergency Medicine',
            'phone_number': '+1-555-0103',
            'is_verified': True
        },
        {
            'username': 'patient.brown',
            'email': 'patient.brown@email.com',
            'password': 'password123',
            'first_name': 'Emily',
            'last_name': 'Brown',
            'role': 'PATIENT',
            'hospital_name': 'MedCor General Hospital',
            'phone_number': '+1-555-0201',
            'is_verified': True
        },
        {
            'username': 'patient.davis',
            'email': 'patient.davis@email.com',
            'password': 'password123',
            'first_name': 'Robert',
            'last_name': 'Davis',
            'role': 'PATIENT',
            'hospital_name': 'MedCor General Hospital',
            'phone_number': '+1-555-0202',
            'is_verified': True
        }
    ]
    
    created_users = []
    for user_data in users_data:
        try:
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password=user_data['password'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                role=user_data['role'],
                hospital_name=user_data['hospital_name'],
                specialization=user_data.get('specialization', ''),
                department=user_data.get('department', ''),
                phone_number=user_data['phone_number'],
                is_verified=user_data['is_verified']
            )
            print(f"✅ Created user: {user.get_full_name()} ({user.role})")
            created_users.append(user)
        except Exception as e:
            print(f"⚠️  User already exists or error: {e}")
            try:
                user = User.objects.get(username=user_data['username'])
                created_users.append(user)
            except User.DoesNotExist:
                pass
    
    return created_users

def assign_doctor_specialties(users, specialties):
    """Assign specialties to doctors"""
    doctors = [u for u in users if u.role == 'DOCTOR']
    for i, doctor in enumerate(doctors):
        specialty = specialties[i % len(specialties)]
        doctor_specialty, created = DoctorSpecialty.objects.get_or_create(
            doctor=doctor,
            specialty=specialty,
            defaults={
                'is_primary': True,
                'years_of_experience': 5 + i,
                'certification_date': '2020-01-01'
            }
        )
        if created:
            print(f"✅ Assigned {doctor.get_full_name()} to {specialty.name} (Primary)")
        else:
            print(f"✅ {doctor.get_full_name()} already has {specialty.name}")

def main():
    """Main function to create all sample data"""
    print("🏥 Creating admin user and sample data for MedCor Backend...")
    print("=" * 60)
    
    # Create superuser
    admin_user = create_superuser()
    
    # Create sample data
    hospitals = create_sample_hospitals()
    subscription_plans = create_sample_subscription_plans()
    create_sample_subscriptions(hospitals, subscription_plans)
    users = create_sample_users()
    
    # Get existing specialties and assign them to doctors
    specialties = Specialty.objects.filter(is_active=True)
    if specialties.exists():
        assign_doctor_specialties(users, specialties)
    
    print("=" * 60)
    print("✅ Sample data creation completed!")
    print(f"📊 You can now see all apps in the admin interface")
    print(f"🔑 Admin login: admin@medcor.com / admin123")
    print(f"🏥 Hospitals: {Hospital.objects.count()}")
    print(f"👥 Users: {User.objects.count()}")
    print(f"📋 Subscription Plans: {SubscriptionPlan.objects.count()}")
    print(f"🔗 Subscriptions: {Subscription.objects.count()}")

if __name__ == '__main__':
    main() 