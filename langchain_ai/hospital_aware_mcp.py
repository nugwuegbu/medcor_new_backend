"""
Hospital-aware MCP tool wrapper
Provides tools that automatically filter data by hospital context
"""

import logging
from typing import Any, Dict, List, Optional

from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied

User = get_user_model()
logger = logging.getLogger(__name__)


class HospitalAwareMCPTools:
    """
    Wrapper for MCP tools that automatically handles hospital context
    """
    
    def __init__(self, user: Optional[User] = None):
        self.user = user
        self.hospital_id = None
        self.hospital = None
        
        if user and hasattr(user, 'hospital') and user.hospital:
            self.hospital_id = str(user.hospital.id)
            self.hospital = user.hospital
            logger.info(f"Hospital context set: {self.hospital_id} for user {user.id}")
        else:
            logger.warning(f"No hospital context available for user {user.id if user else 'anonymous'}")

    def _validate_hospital_access(self, requested_hospital_id: str = None) -> bool:
        """Validate that user has access to the requested hospital"""
        if not self.hospital_id:
            raise PermissionDenied("No hospital context available")
            
        if requested_hospital_id and requested_hospital_id != self.hospital_id:
            raise PermissionDenied(f"Access denied to hospital {requested_hospital_id}")
            
        return True

    def _inject_hospital_context(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Inject hospital context into MCP tool parameters"""
        if not self.hospital_id:
            return parameters
            
        # List of tools that require hospital_id
        hospital_aware_tools = {
            'list_users', 'list_doctors', 'list_appointments', 'list_medical_records',
            'list_treatments', 'create_appointment', 'create_medical_record', 
            'create_treatment', 'list_appointment_slots', 'get_doctors_by_specialty',
            'get_todays_appointments', 'get_upcoming_appointments', 'create_user'
        }
        
        # Check if this tool needs hospital context
        tool_name = parameters.get('tool_name', '')
        if any(tool in tool_name for tool in hospital_aware_tools) or \
           any(tool in str(parameters) for tool in hospital_aware_tools):
            if 'hospital_id' not in parameters:
                parameters['hospital_id'] = self.hospital_id
                logger.debug(f"Injected hospital_id {self.hospital_id} into parameters")
                
        return parameters

    def get_hospital_context(self) -> Dict[str, Any]:
        """Get current hospital context information"""
        if not self.hospital:
            return {"hospital_id": None, "hospital_name": None, "has_context": False}
            
        return {
            "hospital_id": self.hospital_id,
            "hospital_name": self.hospital.name,
            "hospital_type": self.hospital.hospital_type,
            "has_context": True
        }

    async def list_doctors_with_context(self, **filters) -> List[Dict[str, Any]]:
        """List doctors with automatic hospital filtering"""
        self._validate_hospital_access()
        
        # Import here to avoid circular imports
        from .mcp_client import get_mcp_client
        
        async with get_mcp_client(user=self.user) as client:
            response = await client.call_tool("list_doctors", filters)
            return response.data if response.success else []

    async def list_appointments_with_context(self, **filters) -> List[Dict[str, Any]]:
        """List appointments with automatic hospital filtering"""
        self._validate_hospital_access()
        
        from .mcp_client import get_mcp_client
        
        async with get_mcp_client(user=self.user) as client:
            response = await client.call_tool("list_appointments", filters)
            return response.data if response.success else []

    async def list_medical_records_with_context(self, **filters) -> List[Dict[str, Any]]:
        """List medical records with automatic hospital filtering"""
        self._validate_hospital_access()
        
        from .mcp_client import get_mcp_client
        
        async with get_mcp_client(user=self.user) as client:
            response = await client.call_tool("list_medical_records", filters)
            return response.data if response.success else []

    async def create_appointment_with_context(self, **data) -> Dict[str, Any]:
        """Create appointment with automatic hospital context"""
        self._validate_hospital_access()
        
        from .mcp_client import get_mcp_client
        
        async with get_mcp_client(user=self.user) as client:
            response = await client.call_tool("create_appointment", data)
            return response.data if response.success else {"success": False, "error": "Failed to create appointment"}

    def get_hospital_statistics(self) -> Dict[str, Any]:
        """Get statistics for the current hospital"""
        if not self.hospital:
            return {"error": "No hospital context available"}
            
        # Import here to avoid circular imports
        from core.models import User
        from appointments.models import Appointment
        from medical_records.models import MedicalRecord
        
        try:
            stats = {
                "hospital_id": self.hospital_id,
                "hospital_name": self.hospital.name,
                "total_doctors": User.objects.filter(hospital=self.hospital, role="DOCTOR", is_active=True).count(),
                "total_patients": User.objects.filter(hospital=self.hospital, role="PATIENT", is_active=True).count(),
                "total_nurses": User.objects.filter(hospital=self.hospital, role="NURSE", is_active=True).count(),
                "total_appointments": Appointment.objects.filter(hospital=self.hospital).count(),
                "total_medical_records": MedicalRecord.objects.filter(hospital=self.hospital).count(),
                "active_appointments": Appointment.objects.filter(hospital=self.hospital, status="SCHEDULED").count(),
            }
            return stats
        except Exception as e:
            logger.error(f"Error getting hospital statistics: {str(e)}")
            return {"error": str(e)}


def get_hospital_aware_tools(user: Optional[User] = None) -> HospitalAwareMCPTools:
    """Get hospital-aware MCP tools instance"""
    return HospitalAwareMCPTools(user=user)