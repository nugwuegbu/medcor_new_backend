from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import Slot, SlotExclusion, Appointment
from tenants.models import User
from treatment.models import Treatment


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user serializer for nested relationships"""
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role']


class TreatmentBasicSerializer(serializers.ModelSerializer):
    """Basic treatment serializer for nested relationships"""
    class Meta:
        model = Treatment
        fields = ['id', 'name', 'cost', 'description']


class SlotSerializer(serializers.ModelSerializer):
    """Serializer for Slot model"""
    doctor = UserBasicSerializer(read_only=True)
    doctor_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='doctor'),
        source='doctor',
        write_only=True
    )
    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = Slot
        fields = [
            'id', 'doctor', 'doctor_id', 'start_time', 'end_time', 
            'day_of_week', 'day_of_week_display', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, attrs):
        """Validate slot times"""
        if attrs['start_time'] >= attrs['end_time']:
            raise serializers.ValidationError(_("Start time must be before end time"))
        return attrs


class SlotCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating slots"""
    class Meta:
        model = Slot
        fields = ['doctor', 'start_time', 'end_time', 'day_of_week']

    def validate(self, attrs):
        """Validate slot times"""
        if attrs['start_time'] >= attrs['end_time']:
            raise serializers.ValidationError(_("Start time must be before end time"))
        return attrs


class SlotExclusionSerializer(serializers.ModelSerializer):
    """Serializer for SlotExclusion model"""
    doctor = UserBasicSerializer(read_only=True)
    doctor_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='doctor'),
        source='doctor',
        write_only=True
    )
    
    class Meta:
        model = SlotExclusion
        fields = [
            'id', 'doctor', 'doctor_id', 'exclusion_start_date', 
            'exclusion_end_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, attrs):
        """Validate exclusion dates"""
        if attrs['exclusion_start_date'] > attrs['exclusion_end_date']:
            raise serializers.ValidationError(_("Start date must be before or equal to end date"))
        return attrs


class SlotExclusionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating slot exclusions"""
    class Meta:
        model = SlotExclusion
        fields = ['doctor', 'exclusion_start_date', 'exclusion_end_date']

    def validate(self, attrs):
        """Validate exclusion dates"""
        if attrs['exclusion_start_date'] > attrs['exclusion_end_date']:
            raise serializers.ValidationError(_("Start date must be before or equal to end date"))
        return attrs


class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer for Appointment model"""
    patient = UserBasicSerializer(read_only=True)
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='patient'),
        source='patient',
        write_only=True
    )
    doctor = UserBasicSerializer(read_only=True)
    doctor_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='doctor'),
        source='doctor',
        write_only=True
    )
    slot = SlotSerializer(read_only=True)
    slot_id = serializers.PrimaryKeyRelatedField(
        queryset=Slot.objects.all(),
        source='slot',
        write_only=True
    )
    treatment = TreatmentBasicSerializer(read_only=True)
    treatment_id = serializers.PrimaryKeyRelatedField(
        queryset=Treatment.objects.all(),
        source='treatment',
        write_only=True
    )
    appointment_status_display = serializers.CharField(source='get_appointment_status_display', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_id', 'doctor', 'doctor_id',
            'slot', 'slot_id', 'treatment', 'treatment_id',
            'appointment_slot_date', 'appointment_slot_start_time',
            'appointment_slot_end_time', 'appointment_status',
            'appointment_status_display', 'medical_record',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, attrs):
        """Validate appointment times"""
        if attrs['appointment_slot_start_time'] >= attrs['appointment_slot_end_time']:
            raise serializers.ValidationError(_("Start time must be before end time"))
        return attrs


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating appointments"""
    class Meta:
        model = Appointment
        fields = [
            'patient', 'doctor', 'slot', 'treatment',
            'appointment_slot_date', 'appointment_slot_start_time',
            'appointment_slot_end_time', 'appointment_status',
            'medical_record'
        ]

    def validate(self, attrs):
        """Validate appointment times"""
        if attrs['appointment_slot_start_time'] >= attrs['appointment_slot_end_time']:
            raise serializers.ValidationError(_("Start time must be before end time"))
        return attrs


class AppointmentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating appointments"""
    class Meta:
        model = Appointment
        fields = [
            'appointment_slot_date', 'appointment_slot_start_time',
            'appointment_slot_end_time', 'appointment_status',
            'medical_record'
        ]

    def validate(self, attrs):
        """Validate appointment times"""
        if 'appointment_slot_start_time' in attrs and 'appointment_slot_end_time' in attrs:
            if attrs['appointment_slot_start_time'] >= attrs['appointment_slot_end_time']:
                raise serializers.ValidationError(_("Start time must be before end time"))
        return attrs


class AppointmentListSerializer(serializers.ModelSerializer):
    """Compact serializer for appointment lists"""
    patient_name = serializers.CharField(source='patient.first_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.first_name', read_only=True)
    treatment_name = serializers.CharField(source='treatment.name', read_only=True)
    appointment_status_display = serializers.CharField(source='get_appointment_status_display', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'patient_name', 'doctor_name', 'treatment_name',
            'appointment_slot_date', 'appointment_slot_start_time',
            'appointment_status', 'appointment_status_display',
            'created_at'
        ]