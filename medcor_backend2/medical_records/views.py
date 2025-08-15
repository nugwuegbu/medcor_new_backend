from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import MedicalRecord

class MedicalRecordViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing medical records.
    """
    queryset = MedicalRecord.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter based on user's access."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter by hospital
        if not user.is_superuser:
            if hasattr(user, 'hospital'):
                queryset = queryset.filter(hospital=user.hospital)
        
        # Patients can only see their own records
        if user.role == 'PATIENT':
            queryset = queryset.filter(patient=user)
        
        return queryset
