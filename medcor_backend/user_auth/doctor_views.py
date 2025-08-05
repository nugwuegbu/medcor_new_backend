from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from tenants.models import User

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def doctor_list(request):
    """Get list of all doctors"""
    doctors = User.objects.filter(role='doctor', is_active=True)
    # Return simplified doctor data without serializer
    doctor_data = []
    for doctor in doctors:
        doctor_data.append({
            'id': doctor.id,
            'email': doctor.email,
            'first_name': doctor.first_name or 'Dr.',
            'last_name': doctor.last_name or 'Smith',
            'username': doctor.username,
            'role': doctor.role,
            'is_active': doctor.is_active
        })
    return Response(doctor_data)