from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from tenants.models import User, Client, Domain
import random
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Add sample data to the existing database'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Adding sample data...'))
        
        # Create sample users
        self.create_sample_users()
        
        # Create sample tenants/clients
        self.create_sample_tenants()
        
        self.stdout.write(self.style.SUCCESS('Sample data added successfully!'))

    def create_sample_tenants(self):
        # Create medical tenants/clients
        tenant_data = [
            {
                'name': 'MedCor Main Clinic',
                'schema_name': 'medcor_main',
                'paid_until': datetime.now().date() + timedelta(days=365),
                'on_trial': False
            },
            {
                'name': 'Heart Care Cardiology',
                'schema_name': 'heart_care',
                'paid_until': datetime.now().date() + timedelta(days=365),
                'on_trial': False
            },
            {
                'name': 'Dental Excellence Center',
                'schema_name': 'dental_center',
                'paid_until': datetime.now().date() + timedelta(days=30),
                'on_trial': True
            }
        ]
        
        for tenant_info in tenant_data:
            client, created = Client.objects.get_or_create(
                name=tenant_info['name'],
                schema_name=tenant_info['schema_name'],
                defaults={
                    'paid_until': tenant_info['paid_until'],
                    'on_trial': tenant_info['on_trial']
                }
            )
            
            if created:
                # Create associated domain
                domain, domain_created = Domain.objects.get_or_create(
                    domain=f"{tenant_info['schema_name']}.medcor.ai",
                    tenant=client,
                    defaults={'is_primary': True}
                )
                
                self.stdout.write(f'Created client: {client.name}')
                if domain_created:
                    self.stdout.write(f'Created domain: {domain.domain}')

    def create_sample_users(self):
        # Create sample doctors
        doctor_data = [
            {
                'email': 'dr.ahmed@medcor.ai',
                'first_name': 'Ahmed',
                'last_name': 'Al-Hassan',
                'role': 'doctor'
            },
            {
                'email': 'dr.sarah@medcor.ai',
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'role': 'doctor'
            },
            {
                'email': 'dr.mohammad@medcor.ai',
                'first_name': 'Mohammad',
                'last_name': 'Al-Rashid',
                'role': 'doctor'
            }
        ]
        
        for doctor_info in doctor_data:
            user, created = User.objects.get_or_create(
                email=doctor_info['email'],
                defaults={
                    'first_name': doctor_info['first_name'],
                    'last_name': doctor_info['last_name'],
                    'role': doctor_info['role'],
                    'password': make_password('doctor123'),
                    'is_active': True
                }
            )
            
            if created:
                self.stdout.write(f'Created doctor: Dr. {user.first_name} {user.last_name}')

        # Create sample patients
        patient_data = [
            {
                'email': 'patient1@example.com',
                'first_name': 'Omar',
                'last_name': 'Al-Mansoori',
                'role': 'patient'
            },
            {
                'email': 'patient2@example.com',
                'first_name': 'Fatima',
                'last_name': 'Al-Zahra',
                'role': 'patient'
            },
            {
                'email': 'patient3@example.com',
                'first_name': 'John',
                'last_name': 'Smith',
                'role': 'patient'
            }
        ]
        
        for patient_info in patient_data:
            user, created = User.objects.get_or_create(
                email=patient_info['email'],
                defaults={
                    'first_name': patient_info['first_name'],
                    'last_name': patient_info['last_name'],
                    'role': patient_info['role'],
                    'password': make_password('patient123'),
                    'is_active': True
                }
            )
            
            if created:
                self.stdout.write(f'Created patient: {user.first_name} {user.last_name}')