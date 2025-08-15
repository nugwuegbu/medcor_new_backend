from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Hospital
from .serializers import HospitalSerializer


class HospitalViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing hospitals.
    """
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter based on user's access."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Superusers can see all hospitals
        if user.is_superuser:
            return queryset
        
        # Users can only see their own hospital
        if hasattr(user, 'hospital'):
            return queryset.filter(id=user.hospital.id)
        
        return queryset.none()
