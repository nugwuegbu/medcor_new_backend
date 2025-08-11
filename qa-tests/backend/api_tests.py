"""
Backend API QA Tests for MedCor Healthcare Platform
Django REST Framework API Testing
"""

import json
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.contenttypes.models import ContentType
from django_tenants.test.cases import TenantTestCase
from django_tenants.test.client import TenantClient

User = get_user_model()


class AuthenticationTests(APITestCase):
    """Test authentication endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.signup_url = reverse('api:signup')
        self.login_url = reverse('api:login')
        self.logout_url = reverse('api:logout')
        
        # Create test user
        self.test_user = User.objects.create_user(
            username='testuser@medcor.ai',
            email='testuser@medcor.ai',
            password='TestPass123!',
            first_name='Test',
            last_name='User'
        )
    
    def test_user_signup_success(self):
        """Test successful user signup"""
        data = {
            'email': 'newuser@medcor.ai',
            'password': 'NewPass123!',
            'password_confirm': 'NewPass123!',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'patient'
        }
        
        response = self.client.post(self.signup_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertIn('email', response.data)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)
        
        # Verify user was created
        user_exists = User.objects.filter(email='newuser@medcor.ai').exists()
        self.assertTrue(user_exists)
    
    def test_user_signup_duplicate_email(self):
        """Test signup with existing email"""
        data = {
            'email': 'testuser@medcor.ai',  # Already exists
            'password': 'NewPass123!',
            'password_confirm': 'NewPass123!',
            'first_name': 'Duplicate',
            'last_name': 'User',
            'role': 'patient'
        }
        
        response = self.client.post(self.signup_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
        self.assertIn('already exists', str(response.data['email']))
    
    def test_user_signup_password_mismatch(self):
        """Test signup with mismatched passwords"""
        data = {
            'email': 'newuser2@medcor.ai',
            'password': 'Pass123!',
            'password_confirm': 'DifferentPass123!',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'patient'
        }
        
        response = self.client.post(self.signup_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
    
    def test_user_signup_weak_password(self):
        """Test signup with weak password"""
        data = {
            'email': 'weakpass@medcor.ai',
            'password': '123',  # Too weak
            'password_confirm': '123',
            'first_name': 'Weak',
            'last_name': 'Pass',
            'role': 'patient'
        }
        
        response = self.client.post(self.signup_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
    
    def test_user_login_success(self):
        """Test successful login"""
        data = {
            'email': 'testuser@medcor.ai',
            'password': 'TestPass123!'
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'testuser@medcor.ai')
    
    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        data = {
            'email': 'testuser@medcor.ai',
            'password': 'WrongPassword'
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)
    
    def test_user_login_nonexistent_user(self):
        """Test login with non-existent user"""
        data = {
            'email': 'nonexistent@medcor.ai',
            'password': 'SomePassword123!'
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_user_logout(self):
        """Test user logout"""
        # First login
        self.client.force_authenticate(user=self.test_user)
        
        response = self.client.post(self.logout_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)


class DoctorEndpointTests(APITestCase):
    """Test doctor-related endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create test users
        self.patient = User.objects.create_user(
            username='patient@medcor.ai',
            email='patient@medcor.ai',
            password='PatientPass123!',
            role='patient'
        )
        
        self.doctor = User.objects.create_user(
            username='doctor@medcor.ai',
            email='doctor@medcor.ai',
            password='DoctorPass123!',
            role='doctor',
            specialty='Cardiology',
            license_number='MD12345'
        )
        
        self.admin = User.objects.create_user(
            username='admin@medcor.ai',
            email='admin@medcor.ai',
            password='AdminPass123!',
            role='admin',
            is_staff=True
        )
        
        self.doctors_url = reverse('api:doctors-list')
    
    def test_list_doctors_as_patient(self):
        """Test patient can view list of doctors"""
        self.client.force_authenticate(user=self.patient)
        
        response = self.client.get(self.doctors_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['email'], 'doctor@medcor.ai')
    
    def test_list_doctors_with_filters(self):
        """Test filtering doctors by specialty"""
        self.client.force_authenticate(user=self.patient)
        
        response = self.client.get(f'{self.doctors_url}?specialty=Cardiology')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        response = self.client.get(f'{self.doctors_url}?specialty=Neurology')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
    
    def test_get_doctor_detail(self):
        """Test getting specific doctor details"""
        self.client.force_authenticate(user=self.patient)
        
        detail_url = reverse('api:doctors-detail', kwargs={'pk': self.doctor.id})
        response = self.client.get(detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'doctor@medcor.ai')
        self.assertEqual(response.data['specialty'], 'Cardiology')
        self.assertNotIn('password', response.data)  # Password should not be exposed
    
    def test_update_doctor_profile_as_doctor(self):
        """Test doctor can update their own profile"""
        self.client.force_authenticate(user=self.doctor)
        
        detail_url = reverse('api:doctors-detail', kwargs={'pk': self.doctor.id})
        data = {
            'bio': 'Experienced cardiologist with 10 years of practice',
            'consultation_fee': 150.00
        }
        
        response = self.client.patch(detail_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['bio'], data['bio'])
        self.assertEqual(float(response.data['consultation_fee']), data['consultation_fee'])
    
    def test_patient_cannot_update_doctor_profile(self):
        """Test patient cannot update doctor profile"""
        self.client.force_authenticate(user=self.patient)
        
        detail_url = reverse('api:doctors-detail', kwargs={'pk': self.doctor.id})
        data = {'bio': 'Hacked bio'}
        
        response = self.client.patch(detail_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AppointmentTests(APITestCase):
    """Test appointment-related endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create test users
        self.patient = User.objects.create_user(
            username='patient@medcor.ai',
            email='patient@medcor.ai',
            password='PatientPass123!',
            role='patient'
        )
        
        self.doctor = User.objects.create_user(
            username='doctor@medcor.ai',
            email='doctor@medcor.ai',
            password='DoctorPass123!',
            role='doctor'
        )
        
        self.appointments_url = reverse('api:appointments-list')
        
        # Create test appointment
        from appointments.models import Appointment
        self.appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            date=datetime.now().date() + timedelta(days=7),
            time='14:00',
            reason='Regular checkup',
            status='scheduled'
        )
    
    def test_create_appointment_as_patient(self):
        """Test patient can create appointment"""
        self.client.force_authenticate(user=self.patient)
        
        future_date = datetime.now().date() + timedelta(days=14)
        data = {
            'doctor': self.doctor.id,
            'date': future_date.isoformat(),
            'time': '10:00',
            'reason': 'Consultation',
            'symptoms': 'Headache and fever'
        }
        
        response = self.client.post(self.appointments_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['patient'], self.patient.id)
        self.assertEqual(response.data['doctor'], self.doctor.id)
        self.assertEqual(response.data['status'], 'scheduled')
    
    def test_cannot_create_appointment_in_past(self):
        """Test cannot create appointment in the past"""
        self.client.force_authenticate(user=self.patient)
        
        past_date = datetime.now().date() - timedelta(days=1)
        data = {
            'doctor': self.doctor.id,
            'date': past_date.isoformat(),
            'time': '10:00',
            'reason': 'Consultation'
        }
        
        response = self.client.post(self.appointments_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('date', response.data)
    
    def test_list_patient_appointments(self):
        """Test patient can view their appointments"""
        self.client.force_authenticate(user=self.patient)
        
        response = self.client.get(self.appointments_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.appointment.id)
    
    def test_list_doctor_appointments(self):
        """Test doctor can view their appointments"""
        self.client.force_authenticate(user=self.doctor)
        
        response = self.client.get(self.appointments_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['doctor'], self.doctor.id)
    
    def test_cancel_appointment(self):
        """Test canceling an appointment"""
        self.client.force_authenticate(user=self.patient)
        
        cancel_url = reverse('api:appointments-cancel', kwargs={'pk': self.appointment.id})
        
        response = self.client.post(cancel_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'cancelled')
        
        # Verify appointment status is updated
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'cancelled')
    
    def test_reschedule_appointment(self):
        """Test rescheduling an appointment"""
        self.client.force_authenticate(user=self.patient)
        
        reschedule_url = reverse('api:appointments-reschedule', kwargs={'pk': self.appointment.id})
        new_date = datetime.now().date() + timedelta(days=10)
        
        data = {
            'date': new_date.isoformat(),
            'time': '15:00'
        }
        
        response = self.client.post(reschedule_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['date'], new_date.isoformat())
        self.assertEqual(response.data['time'], '15:00')
    
    def test_appointment_conflict_detection(self):
        """Test appointment conflict detection"""
        self.client.force_authenticate(user=self.patient)
        
        # Try to create conflicting appointment
        data = {
            'doctor': self.doctor.id,
            'date': self.appointment.date.isoformat(),
            'time': self.appointment.time,  # Same time as existing appointment
            'reason': 'Another consultation'
        }
        
        response = self.client.post(self.appointments_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('conflict', str(response.data).lower())


class MedicalRecordsTests(APITestCase):
    """Test medical records endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create test users
        self.patient = User.objects.create_user(
            username='patient@medcor.ai',
            email='patient@medcor.ai',
            password='PatientPass123!',
            role='patient'
        )
        
        self.doctor = User.objects.create_user(
            username='doctor@medcor.ai',
            email='doctor@medcor.ai',
            password='DoctorPass123!',
            role='doctor'
        )
        
        self.other_patient = User.objects.create_user(
            username='other@medcor.ai',
            email='other@medcor.ai',
            password='OtherPass123!',
            role='patient'
        )
        
        self.records_url = reverse('api:medical-records-list')
        
        # Create test medical record
        from medical_records.models import MedicalRecord
        self.record = MedicalRecord.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            record_type='consultation',
            diagnosis='Common cold',
            prescription='Rest and fluids',
            notes='Patient presented with mild symptoms'
        )
    
    def test_patient_can_view_own_records(self):
        """Test patient can view their own medical records"""
        self.client.force_authenticate(user=self.patient)
        
        response = self.client.get(self.records_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['diagnosis'], 'Common cold')
    
    def test_patient_cannot_view_others_records(self):
        """Test patient cannot view other patients' records"""
        self.client.force_authenticate(user=self.other_patient)
        
        response = self.client.get(self.records_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  # Should not see other patient's records
    
    def test_doctor_can_create_medical_record(self):
        """Test doctor can create medical record for patient"""
        self.client.force_authenticate(user=self.doctor)
        
        data = {
            'patient': self.patient.id,
            'record_type': 'lab_test',
            'test_name': 'Blood Test',
            'results': 'Normal',
            'notes': 'All values within normal range'
        }
        
        response = self.client.post(self.records_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['doctor'], self.doctor.id)
        self.assertEqual(response.data['patient'], self.patient.id)
    
    def test_patient_cannot_create_medical_record(self):
        """Test patient cannot create their own medical record"""
        self.client.force_authenticate(user=self.patient)
        
        data = {
            'patient': self.patient.id,
            'record_type': 'consultation',
            'diagnosis': 'Self-diagnosis',
            'notes': 'I think I have a cold'
        }
        
        response = self.client.post(self.records_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_upload_medical_document(self):
        """Test uploading medical document attachment"""
        self.client.force_authenticate(user=self.doctor)
        
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        # Create a test file
        test_file = SimpleUploadedFile(
            "test_report.pdf",
            b"PDF content here",
            content_type="application/pdf"
        )
        
        data = {
            'patient': self.patient.id,
            'record_type': 'lab_test',
            'document': test_file,
            'notes': 'Lab report attached'
        }
        
        response = self.client.post(self.records_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('document', response.data)
        self.assertTrue(response.data['document'].endswith('.pdf'))
    
    def test_filter_records_by_type(self):
        """Test filtering medical records by type"""
        self.client.force_authenticate(user=self.patient)
        
        # Create additional record
        from medical_records.models import MedicalRecord
        MedicalRecord.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            record_type='lab_test',
            test_name='X-Ray',
            results='Normal'
        )
        
        # Filter by consultation
        response = self.client.get(f'{self.records_url}?record_type=consultation')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['record_type'], 'consultation')
        
        # Filter by lab_test
        response = self.client.get(f'{self.records_url}?record_type=lab_test')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['record_type'], 'lab_test')


class ChatTests(APITestCase):
    """Test chat/messaging endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create test users
        self.patient = User.objects.create_user(
            username='patient@medcor.ai',
            email='patient@medcor.ai',
            password='PatientPass123!',
            role='patient'
        )
        
        self.doctor = User.objects.create_user(
            username='doctor@medcor.ai',
            email='doctor@medcor.ai',
            password='DoctorPass123!',
            role='doctor'
        )
        
        self.chat_url = reverse('api:chat-messages')
    
    def test_send_message_to_doctor(self):
        """Test patient can send message to doctor"""
        self.client.force_authenticate(user=self.patient)
        
        data = {
            'recipient': self.doctor.id,
            'message': 'Hello, I have a question about my prescription.',
            'message_type': 'text'
        }
        
        response = self.client.post(self.chat_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['sender'], self.patient.id)
        self.assertEqual(response.data['recipient'], self.doctor.id)
        self.assertEqual(response.data['message'], data['message'])
    
    def test_retrieve_conversation_history(self):
        """Test retrieving conversation history"""
        self.client.force_authenticate(user=self.patient)
        
        # Create some messages
        from chat.models import Message
        Message.objects.create(
            sender=self.patient,
            recipient=self.doctor,
            message='First message'
        )
        Message.objects.create(
            sender=self.doctor,
            recipient=self.patient,
            message='Reply to first message'
        )
        
        response = self.client.get(f'{self.chat_url}?with_user={self.doctor.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['message'], 'First message')
        self.assertEqual(response.data[1]['message'], 'Reply to first message')
    
    def test_ai_chat_endpoint(self):
        """Test AI chat assistant endpoint"""
        self.client.force_authenticate(user=self.patient)
        
        ai_chat_url = reverse('api:ai-chat')
        data = {
            'message': 'What are common symptoms of flu?',
            'context': 'health_advice'
        }
        
        with patch('openai.ChatCompletion.create') as mock_openai:
            mock_openai.return_value = {
                'choices': [{
                    'message': {
                        'content': 'Common flu symptoms include fever, cough, and body aches.'
                    }
                }]
            }
            
            response = self.client.post(ai_chat_url, data, format='json')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('response', response.data)
            self.assertIn('flu symptoms', response.data['response'])


class SubscriptionTests(APITestCase):
    """Test subscription and payment endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create test user
        self.patient = User.objects.create_user(
            username='patient@medcor.ai',
            email='patient@medcor.ai',
            password='PatientPass123!',
            role='patient'
        )
        
        self.subscription_url = reverse('api:subscriptions')
        self.payment_url = reverse('api:payments')
    
    def test_get_subscription_plans(self):
        """Test retrieving available subscription plans"""
        response = self.client.get(self.subscription_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        
        # Check plan structure
        if len(response.data) > 0:
            plan = response.data[0]
            self.assertIn('name', plan)
            self.assertIn('price', plan)
            self.assertIn('features', plan)
    
    @patch('stripe.Customer.create')
    @patch('stripe.Subscription.create')
    def test_create_subscription(self, mock_subscription, mock_customer):
        """Test creating a subscription"""
        self.client.force_authenticate(user=self.patient)
        
        # Mock Stripe responses
        mock_customer.return_value = {'id': 'cus_test123'}
        mock_subscription.return_value = {
            'id': 'sub_test123',
            'status': 'active',
            'current_period_end': 1234567890
        }
        
        data = {
            'plan_id': 'premium',
            'payment_method': 'pm_test123'
        }
        
        response = self.client.post(self.subscription_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'active')
        self.assertIn('subscription_id', response.data)
    
    def test_cancel_subscription(self):
        """Test canceling a subscription"""
        self.client.force_authenticate(user=self.patient)
        
        # Create a mock subscription
        from subscriptions.models import Subscription
        subscription = Subscription.objects.create(
            user=self.patient,
            stripe_subscription_id='sub_test123',
            status='active',
            plan='premium'
        )
        
        cancel_url = reverse('api:subscription-cancel', kwargs={'pk': subscription.id})
        
        with patch('stripe.Subscription.delete') as mock_delete:
            mock_delete.return_value = {'status': 'canceled'}
            
            response = self.client.post(cancel_url)
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['status'], 'canceled')


class TenantTests(TenantTestCase):
    """Test multi-tenant functionality"""
    
    def setUp(self):
        super().setUp()
        self.client = TenantClient(self.tenant)
        
        # Create hospital admin
        self.hospital_admin = User.objects.create_user(
            username='hospital_admin@hospital1.com',
            email='hospital_admin@hospital1.com',
            password='AdminPass123!',
            role='hospital_admin'
        )
    
    def test_tenant_isolation(self):
        """Test data isolation between tenants"""
        # Create data in first tenant
        self.client.force_authenticate(user=self.hospital_admin)
        
        doctor1 = User.objects.create_user(
            username='doctor1@hospital1.com',
            email='doctor1@hospital1.com',
            password='DoctorPass123!',
            role='doctor'
        )
        
        # Switch to different tenant
        from customers.models import Client
        tenant2 = Client.objects.create(
            domain_url='hospital2.medcor.ai',
            schema_name='hospital2',
            name='Hospital 2'
        )
        
        client2 = TenantClient(tenant2)
        
        # Try to access doctor from first tenant
        response = client2.get(reverse('api:doctors-list'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  # Should not see other tenant's data
    
    def test_hospital_admin_permissions(self):
        """Test hospital admin can manage their hospital"""
        self.client.force_authenticate(user=self.hospital_admin)
        
        # Create doctor for their hospital
        data = {
            'email': 'new_doctor@hospital1.com',
            'password': 'DoctorPass123!',
            'first_name': 'New',
            'last_name': 'Doctor',
            'role': 'doctor',
            'specialty': 'Pediatrics'
        }
        
        response = self.client.post(reverse('api:users-create'), data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['role'], 'doctor')


class SecurityTests(APITestCase):
    """Test security features"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.user = User.objects.create_user(
            username='testuser@medcor.ai',
            email='testuser@medcor.ai',
            password='TestPass123!'
        )
    
    def test_rate_limiting(self):
        """Test API rate limiting"""
        login_url = reverse('api:login')
        
        # Attempt multiple rapid requests
        for i in range(15):  # Assuming rate limit is 10 per minute
            data = {
                'email': f'test{i}@medcor.ai',
                'password': 'wrong'
            }
            response = self.client.post(login_url, data, format='json')
        
        # Last request should be rate limited
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
    
    def test_sql_injection_prevention(self):
        """Test SQL injection prevention"""
        self.client.force_authenticate(user=self.user)
        
        # Attempt SQL injection in search parameter
        malicious_input = "'; DROP TABLE users; --"
        response = self.client.get(f'/api/doctors/?search={malicious_input}')
        
        # Should handle safely without error
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])
    
    def test_xss_prevention(self):
        """Test XSS prevention in user input"""
        self.client.force_authenticate(user=self.user)
        
        # Attempt to inject script tag
        data = {
            'bio': '<script>alert("XSS")</script>',
            'about': '<img src=x onerror=alert("XSS")>'
        }
        
        response = self.client.patch(
            reverse('api:user-profile', kwargs={'pk': self.user.id}),
            data,
            format='json'
        )
        
        if response.status_code == status.HTTP_200_OK:
            # Check that script tags are escaped
            self.assertNotIn('<script>', response.data['bio'])
            self.assertNotIn('onerror=', response.data['about'])
    
    def test_unauthorized_access(self):
        """Test unauthorized access prevention"""
        # Try to access protected endpoint without authentication
        response = self.client.get(reverse('api:medical-records-list'))
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_cors_headers(self):
        """Test CORS headers are properly set"""
        response = self.client.options('/api/doctors/')
        
        self.assertIn('Access-Control-Allow-Origin', response)
        self.assertIn('Access-Control-Allow-Methods', response)


if __name__ == '__main__':
    import unittest
    unittest.main()