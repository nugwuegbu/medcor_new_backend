#!/usr/bin/env python
"""
Script to create demo users in Django backend with proper roles
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.insert(0, '/home/runner/workspace/medcor_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

# Demo users configuration
DEMO_USERS = [
    {
        'email': 'admin@medcor.ai',
        'username': 'admin@medcor.ai',
        'password': 'Admin123!',
        'is_staff': True,
        'is_superuser': True,
        'first_name': 'Admin',
        'last_name': 'User',
    },
    {
        'email': 'doctor@medcor.ai',
        'username': 'doctor@medcor.ai',
        'password': 'Doctor123!',
        'is_staff': False,
        'is_superuser': False,
        'first_name': 'Dr. John',
        'last_name': 'Smith',
    },
    {
        'email': 'patient@medcor.ai',
        'username': 'patient@medcor.ai',
        'password': 'Patient123!',
        'is_staff': False,
        'is_superuser': False,
        'first_name': 'Sarah',
        'last_name': 'Johnson',
    },
    {
        'email': 'clinic@medcor.ai',
        'username': 'clinic@medcor.ai', 
        'password': 'Clinic123!',
        'is_staff': True,
        'is_superuser': False,
        'first_name': 'Clinic',
        'last_name': 'Manager',
    }
]

@transaction.atomic
def create_demo_users():
    """Create or update demo users"""
    for user_data in DEMO_USERS:
        email = user_data['email']
        username = user_data['username']
        password = user_data.pop('password')
        
        try:
            # Try to get existing user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': username,
                    **user_data
                }
            )
            
            if not created:
                # Update existing user
                for key, value in user_data.items():
                    setattr(user, key, value)
            
            # Set password for both new and existing users
            user.set_password(password)
            user.save()
            
            print(f"{'Created' if created else 'Updated'} user: {email} (staff: {user.is_staff}, superuser: {user.is_superuser})")
            
        except Exception as e:
            print(f"Error creating/updating user {email}: {e}")

if __name__ == '__main__':
    print("Creating demo users for Django backend...")
    create_demo_users()
    print("\nDemo users created successfully!")
    print("\nYou can now login with:")
    for user in DEMO_USERS:
        role = 'Admin' if user['is_superuser'] else ('Staff' if user['is_staff'] else 'User')
        print(f"  - {user['email']} / {user['password']} ({role})")