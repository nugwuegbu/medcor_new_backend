import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
from core.models import Doctor, Appointment, ChatMessage
from authentication.authentication import PasswordManager

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with initial data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🌱 Starting database seeding...'))
        
        # Create users
        self.create_users()
        
        # Create doctors
        self.create_doctors()
        
        # Create sample appointments
        self.create_appointments()
        
        self.stdout.write(self.style.SUCCESS('✅ Database seeding completed successfully!'))
    
    def create_users(self):
        """Create test users for all roles."""
        users_data = [
            {
                'username': 'admin_user',
                'email': 'admin@medcor.ai',
                'name': 'Admin User',
                'role': 'admin',
                'password': 'MedcorAdmin123!',
                'phone_number': '+1234567890'
            },
            {
                'username': 'dr_johnson',
                'email': 'doctor@medcor.ai',
                'name': 'Dr. Sarah Johnson',
                'role': 'doctor',
                'password': 'MedcorDoc123!',
                'phone_number': '+1234567891'
            },
            {
                'username': 'clinic_admin',
                'email': 'clinic@medcor.ai',
                'name': 'Clinic Administrator',
                'role': 'clinic',
                'password': 'MedcorClinic123!',
                'phone_number': '+1234567892'
            },
            {
                'username': 'patient_john',
                'email': 'patient@medcor.ai',
                'name': 'John Patient',
                'role': 'patient',
                'password': 'MedcorPatient123!',
                'phone_number': '+1234567893'
            },
            {
                'username': 'patient_jane',
                'email': 'jane@medcor.ai',
                'name': 'Jane Doe',
                'role': 'patient',
                'password': 'MedcorPatient123!',
                'phone_number': '+1234567894'
            }
        ]
        
        for user_data in users_data:
            if not User.objects.filter(email=user_data['email']).exists():
                password = user_data.pop('password')
                hashed_password = PasswordManager.hash_password(password)
                
                user = User.objects.create(
                    password=hashed_password,
                    is_new_user=False,
                    **user_data
                )
                
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Created user: {user.name} ({user.role})')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠️ User already exists: {user_data["email"]}')
                )
    
    def create_doctors(self):
        """Create sample doctors."""
        doctors_data = [
            {
                'name': 'Dr. Sarah Johnson',
                'specialty': 'Cardiology',
                'experience': 15,
                'education': 'MD from Harvard Medical School, Cardiology Fellowship at Mayo Clinic',
                'photo': '/api/placeholder/150/150',
                'bio': 'Dr. Sarah Johnson is a renowned cardiologist with over 15 years of experience in treating heart conditions. She specializes in preventive cardiology and has published numerous research papers on cardiovascular health.',
                'description': 'This is Dr. Sarah Johnson, your cardiology specialist with 15 years of experience in heart care.',
                'available': True
            },
            {
                'name': 'Dr. Michael Chen',
                'specialty': 'Neurology',
                'experience': 12,
                'education': 'MD from Stanford University, Neurology Residency at Johns Hopkins',
                'photo': '/api/placeholder/150/150',
                'bio': 'Dr. Michael Chen is a neurologist specializing in brain disorders and neurological conditions. He has extensive experience in treating epilepsy, migraines, and neurodegenerative diseases.',
                'description': 'This is Dr. Michael Chen, your neurology specialist with expertise in brain and nervous system disorders.',
                'available': True
            },
            {
                'name': 'Dr. Emily Rodriguez',
                'specialty': 'Dermatology',
                'experience': 10,
                'education': 'MD from UCLA, Dermatology Residency at UCSF',
                'photo': '/api/placeholder/150/150',
                'bio': 'Dr. Emily Rodriguez is a dermatologist with a passion for skin health and cosmetic dermatology. She specializes in treating acne, psoriasis, and skin cancer prevention.',
                'description': 'This is Dr. Emily Rodriguez, your dermatology specialist focusing on skin health and beauty.',
                'available': True
            },
            {
                'name': 'Dr. David Williams',
                'specialty': 'Orthopedics',
                'experience': 18,
                'education': 'MD from Yale University, Orthopedic Surgery Residency at Hospital for Special Surgery',
                'photo': '/api/placeholder/150/150',
                'bio': 'Dr. David Williams is an orthopedic surgeon with expertise in joint replacement and sports medicine. He has helped thousands of patients regain mobility and return to active lifestyles.',
                'description': 'This is Dr. David Williams, your orthopedic specialist with expertise in joint and bone health.',
                'available': True
            },
            {
                'name': 'Dr. Lisa Thompson',
                'specialty': 'Pediatrics',
                'experience': 8,
                'education': 'MD from University of Pennsylvania, Pediatric Residency at Children\'s Hospital of Philadelphia',
                'photo': '/api/placeholder/150/150',
                'bio': 'Dr. Lisa Thompson is a pediatrician dedicated to providing comprehensive care for children from infancy through adolescence. She focuses on preventive care and childhood development.',
                'description': 'This is Dr. Lisa Thompson, your pediatric specialist providing comprehensive care for children.',
                'available': True
            },
            {
                'name': 'Dr. James Wilson',
                'specialty': 'General Medicine',
                'experience': 20,
                'education': 'MD from Columbia University, Internal Medicine Residency at Mount Sinai Hospital',
                'photo': '/api/placeholder/150/150',
                'bio': 'Dr. James Wilson is a general practitioner with two decades of experience in primary care. He provides comprehensive medical care and focuses on preventive medicine and health maintenance.',
                'description': 'This is Dr. James Wilson, your general medicine specialist with 20 years of primary care experience.',
                'available': True
            }
        ]
        
        for doctor_data in doctors_data:
            if not Doctor.objects.filter(name=doctor_data['name']).exists():
                doctor = Doctor.objects.create(**doctor_data)
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Created doctor: {doctor.name} ({doctor.specialty})')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠️ Doctor already exists: {doctor_data["name"]}')
                )
    
    def create_appointments(self):
        """Create sample appointments."""
        # Get some doctors and patients
        doctors = Doctor.objects.all()[:3]  # Get first 3 doctors
        
        if not doctors.exists():
            self.stdout.write(
                self.style.WARNING('⚠️ No doctors found. Skipping appointment creation.')
            )
            return
        
        appointments_data = [
            {
                'patient_name': 'John Patient',
                'patient_email': 'patient@medcor.ai',
                'patient_phone': '+1234567893',
                'doctor': doctors[0],
                'appointment_date': timezone.now() + timedelta(days=1),
                'appointment_time': '10:00 AM',
                'reason': 'Annual checkup and consultation',
                'status': 'confirmed'
            },
            {
                'patient_name': 'Jane Doe',
                'patient_email': 'jane@medcor.ai',
                'patient_phone': '+1234567894',
                'doctor': doctors[1],
                'appointment_date': timezone.now() + timedelta(days=2),
                'appointment_time': '2:00 PM',
                'reason': 'Follow-up consultation',
                'status': 'pending'
            },
            {
                'patient_name': 'Mike Johnson',
                'patient_email': 'mike@example.com',
                'patient_phone': '+1234567895',
                'doctor': doctors[2],
                'appointment_date': timezone.now() + timedelta(days=3),
                'appointment_time': '11:30 AM',
                'reason': 'Skin examination',
                'status': 'pending'
            },
            {
                'patient_name': 'Sarah Williams',
                'patient_email': 'sarah@example.com',
                'patient_phone': '+1234567896',
                'doctor': doctors[0],
                'appointment_date': timezone.now() + timedelta(days=5),
                'appointment_time': '3:00 PM',
                'reason': 'Routine checkup',
                'status': 'confirmed'
            }
        ]
        
        for appointment_data in appointments_data:
            if not Appointment.objects.filter(
                patient_email=appointment_data['patient_email'],
                doctor=appointment_data['doctor'],
                appointment_date=appointment_data['appointment_date']
            ).exists():
                appointment = Appointment.objects.create(**appointment_data)
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Created appointment: {appointment.patient_name} with {appointment.doctor.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠️ Appointment already exists for {appointment_data["patient_email"]}')
                )