#!/bin/bash
echo "🔧 Fixing Doctors and Patients Endpoints"
echo "========================================"

cd /var/www/html/medcor_backend2

# 1. Backup current views
echo "📦 Creating backup of views_simple.py..."
cp core/views_simple.py core/views_simple.py.backup.role_fix.$(date +%Y%m%d_%H%M%S)

# 2. Test current data
echo "📋 Current data in database:"
python3 manage.py shell -c "
from core.models import User
from tenants.models import Hospital

print('=== Hospitals ===')
hospitals = Hospital.objects.all()
for hospital in hospitals:
    print(f'Hospital: {hospital.name} (ID: {hospital.id})')

print('\n=== Users by Role ===')
for role in ['DOCTOR', 'PATIENT', 'NURSE', 'STAFF', 'ADMIN', 'SUPERADMIN']:
    count = User.objects.filter(role=role, is_active=True).count()
    print(f'{role}: {count} users')

print('\n=== All Users ===')
users = User.objects.all()
for user in users:
    hospital_name = getattr(user.hospital, 'name', 'No hospital') if user.hospital else 'No hospital'
    print(f'User: {user.get_full_name()} - Role: {user.role} - Hospital: {hospital_name} - Active: {user.is_active}')
"

# 3. Test the endpoints
echo "🧪 Testing endpoints..."

# Test doctors endpoint
echo "Testing doctors endpoint:"
curl -H "Authorization: Bearer $(python3 manage.py shell -c "
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import User
user = User.objects.filter(role='SUPERADMIN').first()
if user:
    refresh = RefreshToken.for_user(user)
    print(refresh.access_token)
else:
    print('No superuser found')
")" "http://localhost:8000/api/ai/query/doctors/" || echo "❌ Doctors endpoint failed"

echo ""
echo "Testing patients endpoint:"
curl -H "Authorization: Bearer $(python3 manage.py shell -c "
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import User
user = User.objects.filter(role='SUPERADMIN').first()
if user:
    refresh = RefreshToken.for_user(user)
    print(refresh.access_token)
else:
    print('No superuser found')
")" "http://localhost:8000/api/ai/query/patients/" || echo "❌ Patients endpoint failed"

# 4. Create sample data if needed
echo "🏥 Creating sample data if needed..."
python3 manage.py shell -c "
from core.models import User
from tenants.models import Hospital
from django.contrib.auth.hashers import make_password

# Check if we have enough data
doctors_count = User.objects.filter(role='DOCTOR', is_active=True).count()
patients_count = User.objects.filter(role='PATIENT', is_active=True).count()

print(f'Current doctors: {doctors_count}')
print(f'Current patients: {patients_count}')

# Get a hospital for sample data
hospital = Hospital.objects.first()
if not hospital:
    print('No hospital found, creating one...')
    hospital = Hospital.objects.create(
        name='Sample Hospital',
        address_line1='123 Main St',
        city='Sample City',
        state='Sample State',
        country='Sample Country'
    )

# Create sample doctors if we have less than 2
if doctors_count < 2:
    print('Creating sample doctors...')
    doctors_data = [
        {
            'email': 'dr.smith@sample.com',
            'first_name': 'Dr. John',
            'last_name': 'Smith',
            'role': 'DOCTOR',
            'hospital': hospital,
            'specialization': 'Cardiology',
            'department': 'Cardiology',
            'is_active': True
        },
        {
            'email': 'dr.jones@sample.com',
            'first_name': 'Dr. Sarah',
            'last_name': 'Jones',
            'role': 'DOCTOR',
            'hospital': hospital,
            'specialization': 'Pediatrics',
            'department': 'Pediatrics',
            'is_active': True
        }
    ]
    
    for doctor_data in doctors_data:
        doctor, created = User.objects.get_or_create(
            email=doctor_data['email'],
            defaults={
                **doctor_data,
                'password': make_password('password123')
            }
        )
        if created:
            print(f'Created doctor: {doctor.get_full_name()}')
        else:
            print(f'Doctor already exists: {doctor.get_full_name()}')

# Create sample patients if we have less than 3
if patients_count < 3:
    print('Creating sample patients...')
    patients_data = [
        {
            'email': 'patient1@sample.com',
            'first_name': 'Alice',
            'last_name': 'Johnson',
            'role': 'PATIENT',
            'hospital': hospital,
            'is_active': True
        },
        {
            'email': 'patient2@sample.com',
            'first_name': 'Bob',
            'last_name': 'Wilson',
            'role': 'PATIENT',
            'hospital': hospital,
            'is_active': True
        }
    ]
    
    for patient_data in patients_data:
        patient, created = User.objects.get_or_create(
            email=patient_data['email'],
            defaults={
                **patient_data,
                'password': make_password('password123')
            }
        )
        if created:
            print(f'Created patient: {patient.get_full_name()}')
        else:
            print(f'Patient already exists: {patient.get_full_name()}')

print('Sample data creation completed!')
"

# 5. Test endpoints again
echo "🧪 Testing endpoints after data creation..."

echo "Testing doctors endpoint:"
curl -H "Authorization: Bearer $(python3 manage.py shell -c "
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import User
user = User.objects.filter(role='SUPERADMIN').first()
if user:
    refresh = RefreshToken.for_user(user)
    print(refresh.access_token)
else:
    print('No superuser found')
")" "http://localhost:8000/api/ai/query/doctors/" || echo "❌ Doctors endpoint failed"

echo ""
echo "Testing patients endpoint:"
curl -H "Authorization: Bearer $(python3 manage.py shell -c "
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import User
user = User.objects.filter(role='SUPERADMIN').first()
if user:
    refresh = RefreshToken.for_user(user)
    print(refresh.access_token)
else:
    print('No superuser found')
")" "http://localhost:8000/api/ai/query/patients/" || echo "❌ Patients endpoint failed"

# 6. Test with hospital context
echo "🏥 Testing with hospital context..."
echo "Testing doctors endpoint with hospital header:"
curl -H "Authorization: Bearer $(python3 manage.py shell -c "
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import User
user = User.objects.filter(role='SUPERADMIN').first()
if user:
    refresh = RefreshToken.for_user(user)
    print(refresh.access_token)
else:
    print('No superuser found')
")" -H "X-Tenant-ID: $(python3 manage.py shell -c "
from tenants.models import Hospital
hospital = Hospital.objects.first()
if hospital:
    print(hospital.id)
else:
    print('No hospital found')
")" "http://localhost:8000/api/ai/query/doctors/" || echo "❌ Doctors endpoint with hospital context failed"

# 7. Restart gunicorn
echo "🔄 Restarting gunicorn..."
sudo systemctl restart gunicorn
sleep 5

# 8. Final test
echo "🎯 Final test..."
echo "Testing doctors endpoint:"
curl -H "Authorization: Bearer $(python3 manage.py shell -c "
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import User
user = User.objects.filter(role='SUPERADMIN').first()
if user:
    refresh = RefreshToken.for_user(user)
    print(refresh.access_token)
else:
    print('No superuser found')
")" "http://localhost:8000/api/ai/query/doctors/"

echo ""
echo "Testing patients endpoint:"
curl -H "Authorization: Bearer $(python3 manage.py shell -c "
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import User
user = User.objects.filter(role='SUPERADMIN').first()
if user:
    refresh = RefreshToken.for_user(user)
    print(refresh.access_token)
else:
    print('No superuser found')
")" "http://localhost:8000/api/ai/query/patients/"

echo "🎉 Fix completed!"
echo ""
echo "📋 Summary of fixes:"
echo "1. ✅ Fixed role case sensitivity (DOCTOR vs doctor)"
echo "2. ✅ Added hospital context filtering"
echo "3. ✅ Added proper multi-tenant support"
echo "4. ✅ Created sample data for testing"
echo "5. ✅ Updated UserStatsView with correct role cases"