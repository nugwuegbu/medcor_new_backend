"""
Serializers for appointment models.
"""

from rest_framework import serializers
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Appointment, DoctorAvailabilitySlot
from core.serializers import UserSerializer


class DoctorAvailabilitySlotSerializer(serializers.ModelSerializer):
    """Serializer for DoctorAvailabilitySlot model."""
    
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    doctor_email = serializers.EmailField(source='doctor.email', read_only=True)
    doctor_specialization = serializers.CharField(source='doctor.specialization', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)
    available_spots = serializers.IntegerField(read_only=True)
    duration = serializers.IntegerField(read_only=True)  # Computed from start_time and end_time
    time_slots = serializers.SerializerMethodField()
    
    class Meta:
        model = DoctorAvailabilitySlot
        fields = [
            'id', 'hospital', 'hospital_name', 'doctor', 'doctor_name',
            'doctor_email', 'doctor_specialization', 'start_time',
            'end_time', 'duration', 'slot_duration_minutes', 'max_appointments',
            'current_appointments', 'status', 'is_recurring',
            'recurrence_pattern', 'recurrence_end_date', 'day_of_week',
            'allowed_appointment_types', 'notes', 'advance_booking_days',
            'minimum_notice_hours', 'is_available', 'is_past',
            'available_spots', 'time_slots', 'created_at', 'updated_at'
        ]
        read_only_fields = ['current_appointments', 'is_available', 'is_past', 'available_spots', 'duration']
    
    def get_time_slots(self, obj):
        """Get individual time slots based on duration."""
        if hasattr(obj, 'generate_time_slots'):
            return obj.generate_time_slots()
        return []
    
    def validate(self, data):
        """Validate slot data."""
        # Ensure end time is after start time
        if 'start_time' in data and 'end_time' in data:
            if data['start_time'] >= data['end_time']:
                raise serializers.ValidationError("End time must be after start time.")
        
        # Ensure start time is not in the past
        if 'start_time' in data and data['start_time'] < timezone.now():
            raise serializers.ValidationError("Cannot create slots in the past.")
        
        # Validate recurrence settings
        if data.get('is_recurring') and data.get('recurrence_pattern') == 'WEEKLY':
            if 'day_of_week' not in data or data['day_of_week'] is None:
                raise serializers.ValidationError(
                    "Day of week is required for weekly recurring slots."
                )
        
        return data


class DoctorAvailabilitySlotCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating doctor availability slots."""
    
    generate_slots = serializers.BooleanField(
        write_only=True,
        default=False,
        help_text="If true, generate multiple slots based on slot_duration_minutes"
    )
    
    class Meta:
        model = DoctorAvailabilitySlot
        fields = [
            'doctor', 'start_time', 'end_time',
            'slot_duration_minutes', 'max_appointments', 'status',
            'is_recurring', 'recurrence_pattern', 'recurrence_end_date',
            'day_of_week', 'allowed_appointment_types', 'notes',
            'advance_booking_days', 'minimum_notice_hours', 'generate_slots'
        ]
    
    def create(self, validated_data):
        """Create slot(s) based on configuration."""
        generate_slots = validated_data.pop('generate_slots', False)
        
        # Set hospital from doctor
        if 'hospital' not in validated_data and 'doctor' in validated_data:
            validated_data['hospital'] = validated_data['doctor'].hospital
        
        # Set created_by from request user
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        
        if generate_slots:
            # Generate multiple slots based on duration
            slots = []
            current_time = validated_data['start_time']
            end_time = validated_data['end_time']
            slot_duration = timedelta(minutes=validated_data['slot_duration_minutes'])
            
            while current_time + slot_duration <= end_time:
                slot_data = validated_data.copy()
                slot_data['start_time'] = current_time
                slot_data['end_time'] = current_time + slot_duration
                slot = DoctorAvailabilitySlot.objects.create(**slot_data)
                slots.append(slot)
                current_time += slot_duration
            
            # Return the first slot as representative
            return slots[0] if slots else super().create(validated_data)
        else:
            return super().create(validated_data)


class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer for Appointment model."""
    
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_email = serializers.EmailField(source='patient.email', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    doctor_email = serializers.EmailField(source='doctor.email', read_only=True)
    doctor_specialization = serializers.CharField(source='doctor.specialization', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    is_past = serializers.BooleanField(read_only=True)
    is_today = serializers.BooleanField(read_only=True)
    is_upcoming = serializers.BooleanField(read_only=True)
    slot_details = DoctorAvailabilitySlotSerializer(source='slot', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'hospital', 'hospital_name', 'patient', 'patient_name',
            'patient_email', 'doctor', 'doctor_name', 'doctor_email',
            'doctor_specialization', 'appointment_type', 'status',
            'scheduled_date', 'scheduled_time', 'duration_minutes',
            'end_time', 'slot', 'slot_details', 'check_in_time',
            'start_time', 'end_time_actual', 'reason', 'symptoms',
            'notes', 'is_telemedicine', 'meeting_link', 'meeting_id',
            'meeting_password', 'is_follow_up', 'parent_appointment',
            'cancellation_reason', 'cancelled_by', 'cancelled_at',
            'rescheduled_from', 'reminder_sent', 'reminder_sent_at',
            'is_past', 'is_today', 'is_upcoming', 'metadata',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'end_time', 'is_past', 'is_today', 'is_upcoming',
            'created_at', 'updated_at'
        ]
    
    def validate(self, data):
        """Validate appointment data."""
        # Ensure appointment date is not in the past
        if 'scheduled_date' in data and data['scheduled_date'] < timezone.now().date():
            raise serializers.ValidationError("Cannot schedule appointments in the past.")
        
        # Validate doctor and patient belong to same hospital
        if 'doctor' in data and 'patient' in data:
            if data['doctor'].hospital_id != data['patient'].hospital_id:
                raise serializers.ValidationError(
                    "Doctor and patient must belong to the same hospital."
                )
        
        # If slot is provided, validate it's available
        if 'slot' in data and data['slot']:
            slot = data['slot']
            if not slot.is_available:
                raise serializers.ValidationError("Selected slot is not available.")
            
            # Ensure slot belongs to the selected doctor
            if 'doctor' in data and slot.doctor_id != data['doctor'].id:
                raise serializers.ValidationError("Slot does not belong to the selected doctor.")
            
            # Auto-fill scheduling details from slot
            data['scheduled_date'] = slot.date
            data['scheduled_time'] = slot.start_time
            data['duration_minutes'] = slot.slot_duration_minutes
        
        return data
    
    def create(self, validated_data):
        """Create appointment and update slot if provided."""
        slot = validated_data.get('slot')
        
        # Set hospital from patient or doctor if not provided
        if 'hospital' not in validated_data:
            if 'patient' in validated_data:
                validated_data['hospital'] = validated_data['patient'].hospital
            elif 'doctor' in validated_data:
                validated_data['hospital'] = validated_data['doctor'].hospital
        
        appointment = super().create(validated_data)
        
        # Book the slot if provided
        if slot:
            slot.book_slot(appointment)
        
        return appointment


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating appointments."""
    
    class Meta:
        model = Appointment
        fields = [
            'patient', 'doctor', 'appointment_type', 'scheduled_date',
            'scheduled_time', 'duration_minutes', 'slot', 'reason',
            'symptoms', 'notes', 'is_telemedicine'
        ]
    
    def validate(self, data):
        """Validate appointment creation data."""
        # Call parent validation
        data = super().validate(data)
        
        # Additional validation for appointment creation
        if 'scheduled_date' in data and data['scheduled_date'] < timezone.now().date():
            raise serializers.ValidationError("Cannot schedule appointments in the past.")
        
        # Check if slot is provided and available
        if 'slot' in data and data['slot']:
            slot = data['slot']
            if not slot.is_available:
                raise serializers.ValidationError("Selected slot is not available for booking.")
            
            # Auto-populate scheduling from slot
            data['scheduled_date'] = slot.date
            data['scheduled_time'] = slot.start_time
            if not data.get('duration_minutes'):
                data['duration_minutes'] = slot.slot_duration_minutes
        
        return data


class AppointmentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating appointment details."""
    
    class Meta:
        model = Appointment
        fields = [
            'status', 'appointment_type', 'scheduled_date', 'scheduled_time',
            'duration_minutes', 'reason', 'symptoms', 'notes',
            'check_in_time', 'start_time', 'end_time_actual',
            'cancellation_reason', 'cancelled_by', 'cancelled_at'
        ]
    
    def validate_status(self, value):
        """Validate status transitions."""
        if self.instance:
            current_status = self.instance.status
            
            # Define valid status transitions
            valid_transitions = {
                'SCHEDULED': ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
                'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
                'COMPLETED': [],  # Cannot change from completed
                'CANCELLED': [],  # Cannot change from cancelled
                'NO_SHOW': [],  # Cannot change from no-show
                'RESCHEDULED': ['SCHEDULED', 'CANCELLED']
            }
            
            if value not in valid_transitions.get(current_status, []):
                raise serializers.ValidationError(
                    f"Cannot transition from {current_status} to {value}"
                )
        
        return value