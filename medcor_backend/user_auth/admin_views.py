"""
Admin-specific API views for doctors and patients management
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample

User = get_user_model()


class DoctorsListAPIView(APIView):
    """
    Get list of doctors only
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        operation_id='doctors_list',
        summary='Get Doctors List',
        description='Retrieve list of all doctors in the system',
        responses={
            200: OpenApiResponse(
                description='List of doctors',
                examples=[
                    OpenApiExample(
                        'Doctors List',
                        value=[
                            {
                                'id': 2,
                                'username': 'doctor1',
                                'email': 'doctor1@medcor.ai',
                                'first_name': 'Dr. John',
                                'last_name': 'Smith',
                                'role': 'doctor',
                                'is_active': True,
                                'created_at': '2025-07-23T05:30:00Z'
                            }
                        ]
                    )
                ]
            ),
            403: OpenApiResponse(description='Access denied. Admin privileges required.'),
        },
        tags=['User Management']
    )
    def get(self, request):
        """Get all doctors for admin management"""
        user = request.user
        
        if not (user.is_staff or user.is_superuser):
            return Response({
                'error': 'Access denied. Admin privileges required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            doctors = []
            
            # Filter users by role field - this is the correct approach
            doctor_users = User.objects.filter(
                role='doctor',
                is_active=True
            ).order_by('first_name', 'last_name')
            
            for u in doctor_users:
                doctors.append({
                    'id': u.id,
                    'username': u.username,
                    'email': u.email,
                    'first_name': u.first_name,
                    'last_name': u.last_name,
                    'role': 'doctor',
                    'is_active': u.is_active,
                    'created_at': u.created_at.isoformat() if hasattr(u, 'created_at') and u.created_at else None,
                    'last_login': u.last_login.isoformat() if u.last_login else None,
                    'phone_number': getattr(u, 'phone_number', None),
                    'specialty': getattr(u, 'specialty', None),
                    'department': getattr(u, 'department', None),
                })
            
            return Response(doctors, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to fetch doctors: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PatientsListAPIView(APIView):
    """
    Get list of patients only
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        operation_id='patients_list',
        summary='Get Patients List',
        description='Retrieve list of all patients in the system',
        responses={
            200: OpenApiResponse(
                description='List of patients',
                examples=[
                    OpenApiExample(
                        'Patients List',
                        value=[
                            {
                                'id': 3,
                                'username': 'patient1',
                                'email': 'patient1@medcor.ai',
                                'first_name': 'John',
                                'last_name': 'Doe',
                                'role': 'patient',
                                'is_active': True,
                                'created_at': '2025-07-23T06:00:00Z'
                            }
                        ]
                    )
                ]
            ),
            403: OpenApiResponse(description='Access denied. Admin privileges required.'),
        },
        tags=['User Management']
    )
    def get(self, request):
        """Get all patients for admin management"""
        user = request.user
        
        if not (user.is_staff or user.is_superuser):
            return Response({
                'error': 'Access denied. Admin privileges required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            patients = []
            
            # Filter users by role field - this is the correct approach
            patient_users = User.objects.filter(
                role='patient',
                is_active=True
            ).order_by('first_name', 'last_name')
            
            for u in patient_users:
                patients.append({
                    'id': u.id,
                    'username': u.username,
                    'email': u.email,
                    'first_name': u.first_name,
                    'last_name': u.last_name,
                    'role': 'patient',
                    'is_active': u.is_active,
                    'created_at': u.created_at.isoformat() if hasattr(u, 'created_at') and u.created_at else None,
                    'last_login': u.last_login.isoformat() if u.last_login else None,
                    'phone_number': getattr(u, 'phone_number', None),
                    'blood_type': getattr(u, 'blood_type', None),
                    'medical_record_number': getattr(u, 'medical_record_number', None),
                })
            
            return Response(patients, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to fetch patients: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)