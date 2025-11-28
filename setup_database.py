#!/usr/bin/env python
"""
Database setup script for MedCor Backend 2.
Creates database tables and loads initial data.
"""

import os
import sys
from pathlib import Path

import django

# Add the project directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medcor_backend2.settings")
django.setup()

from datetime import datetime, timedelta

from django.core.management import call_command
from django.db import connection
from django.utils import timezone

from core.models import User
from subscription_plans.models import Subscription, SubscriptionPlan
from tenants.models import Hospital


def setup_database():
    """Setup database with migrations and initial data."""

    print("📊 Starting database setup...")

    # Run migrations
    print("\n🔄 Running migrations...")
    try:
        call_command("makemigrations", interactive=False)
        call_command("migrate", interactive=False)
        print("✅ Migrations completed successfully!")
    except Exception as e:
        print(f"❌ Migration error: {e}")
        return False

    # Create default subscription plans
    print("\n💳 Creating subscription plans...")
    try:
        plans = [
            {
                "name": "Free Plan",
                "slug": "free",
                "plan_type": "FREE",
                "description": "Basic features for small clinics",
                "price": 0,
                "max_users": 5,
                "max_doctors": 2,
                "max_patients": 50,
                "max_appointments_per_month": 100,
                "storage_gb": 1,
                "has_telemedicine": False,
                "has_api_access": False,
            },
            {
                "name": "Basic Plan",
                "slug": "basic",
                "plan_type": "BASIC",
                "description": "Essential features for growing clinics",
                "price": 99,
                "max_users": 20,
                "max_doctors": 10,
                "max_patients": 500,
                "max_appointments_per_month": 1000,
                "storage_gb": 10,
                "has_telemedicine": True,
                "has_api_access": False,
            },
            {
                "name": "Professional Plan",
                "slug": "professional",
                "plan_type": "PROFESSIONAL",
                "description": "Advanced features for established hospitals",
                "price": 299,
                "max_users": 100,
                "max_doctors": 50,
                "max_patients": 5000,
                "max_appointments_per_month": 10000,
                "storage_gb": 100,
                "has_telemedicine": True,
                "has_api_access": True,
                "has_custom_branding": True,
                "has_priority_support": True,
            },
            {
                "name": "Enterprise Plan",
                "slug": "enterprise",
                "plan_type": "ENTERPRISE",
                "description": "Complete solution for large healthcare networks",
                "price": 999,
                "max_users": 1000,
                "max_doctors": 500,
                "max_patients": 50000,
                "max_appointments_per_month": 100000,
                "storage_gb": 1000,
                "has_telemedicine": True,
                "has_analytics": True,
                "has_api_access": True,
                "has_custom_branding": True,
                "has_priority_support": True,
                "has_multi_location": True,
                "has_advanced_reporting": True,
            },
        ]

        for plan_data in plans:
            plan, created = SubscriptionPlan.objects.get_or_create(
                slug=plan_data["slug"], defaults=plan_data
            )
            if created:
                print(f"  ✅ Created plan: {plan.name}")
            else:
                print(f"  ℹ️  Plan already exists: {plan.name}")

    except Exception as e:
        print(f"❌ Error creating subscription plans: {e}")

    # Create default hospital (tenant)
    print("\n🏥 Creating default hospital...")
    try:
        hospital, created = Hospital.objects.get_or_create(
            subdomain="demo",
            defaults={
                "name": "Demo Hospital",
                "registration_number": "DEMO-001",
                "email": "admin@demohospital.com",
                "phone_number": "+1-555-0100",
                "address_line1": "123 Medical Center Drive",
                "city": "San Francisco",
                "state": "CA",
                "country": "USA",
                "postal_code": "94102",
                "hospital_type": "General",
                "is_active": True,
            },
        )

        if created:
            print(f"  ✅ Created hospital: {hospital.name}")

            # Create subscription for the hospital
            free_plan = SubscriptionPlan.objects.get(slug="free")
            subscription = Subscription.objects.create(
                hospital=hospital,
                plan=free_plan,
                status="ACTIVE",
                start_date=timezone.now(),
                end_date=timezone.now() + timedelta(days=365),
                current_period_start=timezone.now(),
                current_period_end=timezone.now() + timedelta(days=30),
            )
            print(f"  ✅ Created subscription for {hospital.name}")
        else:
            print(f"  ℹ️  Hospital already exists: {hospital.name}")

    except Exception as e:
        print(f"❌ Error creating hospital: {e}")

    # Create superuser
    print("\n👤 Creating superuser...")
    try:
        if not User.objects.filter(email="admin@medcor.ai").exists():
            superuser = User.objects.create_superuser(
                email="admin@medcor.ai",
                password="admin123",
                first_name="System",
                last_name="Admin",
                role="ADMIN",
            )
            print("  ✅ Created superuser: admin@medcor.ai (password: admin123)")
        else:
            print("  ℹ️  Superuser already exists")

    except Exception as e:
        print(f"❌ Error creating superuser: {e}")

    # Create demo users
    print("\n👥 Creating demo users...")
    try:
        demo_hospital = Hospital.objects.get(subdomain="demo")

        demo_users = [
            {
                "email": "doctor@demo.com",
                "first_name": "John",
                "last_name": "Smith",
                "role": "DOCTOR",
                "department": "Cardiology",
                "specialization": "Cardiologist",
                "password": "demo123",
            },
            {
                "email": "nurse@demo.com",
                "first_name": "Jane",
                "last_name": "Doe",
                "role": "NURSE",
                "department": "Emergency",
                "password": "demo123",
            },
            {
                "email": "patient@demo.com",
                "first_name": "Bob",
                "last_name": "Wilson",
                "role": "PATIENT",
                "password": "demo123",
            },
        ]

        for user_data in demo_users:
            if not User.objects.filter(email=user_data["email"]).exists():
                password = user_data.pop("password")
                user = User.objects.create_user(
                    hospital=demo_hospital, password=password, **user_data
                )
                print(f"  ✅ Created {user.role.lower()}: {user.email}")
            else:
                print(f"  ℹ️  User already exists: {user_data['email']}")

    except Exception as e:
        print(f"❌ Error creating demo users: {e}")

    print("\n✨ Database setup complete!")
    print("\n📝 You can now:")
    print("  1. Access Django admin at: http://localhost:8002/admin")
    print("  2. Login with: admin@medcor.ai / admin123")
    print("  3. Access API docs at: http://localhost:8002/api/docs")
    print("  4. Use demo accounts:")
    print("     - Doctor: doctor@demo.com / demo123")
    print("     - Nurse: nurse@demo.com / demo123")
    print("     - Patient: patient@demo.com / demo123")

    return True


if __name__ == "__main__":
    setup_database()
