from rest_framework import serializers
from .models import Slot, SlotExclusion, Appointment
from tenants.serializers import UserBaseSerializer
from treatment.serializers import TreatmentSerializer
from treatment.models import Treatment


class SlotSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    day_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = Slot
        fields = [
            'id', 'doctor', 'doctor_name', 'start_time', 'end_time',
            'day_of_week', 'day_display', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class SlotExclusionSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    
    class Meta:
        model = SlotExclusion
        fields = [
            'id', 'doctor', 'doctor_name', 'exclusion_start_date',
            'exclusion_end_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    treatment_name = serializers.CharField(source='treatment.name', read_only=True)
    status_display = serializers.CharField(source='get_appointment_status_display', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_name', 'doctor', 'doctor_name',
            'slot', 'treatment', 'treatment_name', 'appointment_slot_date',
            'appointment_slot_start_time', 'appointment_slot_end_time',
            'appointment_status', 'status_display', 'medical_record',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class AppointmentDetailSerializer(AppointmentSerializer):
    patient_details = UserBaseSerializer(source='patient', read_only=True)
    doctor_details = UserBaseSerializer(source='doctor', read_only=True)
    slot_details = SlotSerializer(source='slot', read_only=True)
    treatment_details = TreatmentSerializer(source='treatment', read_only=True)
    
    class Meta(AppointmentSerializer.Meta):
        fields = AppointmentSerializer.Meta.fields + [
            'patient_details', 'doctor_details', 'slot_details', 'treatment_details'
        ]


class AppointmentCreateSerializer(serializers.ModelSerializer):
    # Make slot and treatment optional
    slot = serializers.PrimaryKeyRelatedField(
        queryset=Slot.objects.all(),
        required=False,
        allow_null=True
    )
    treatment = serializers.PrimaryKeyRelatedField(
        queryset=Treatment.objects.all(),
        required=False,
        allow_null=True
    )
    # Make medical_record a text field instead of file field
    medical_record = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
    )
    
    class Meta:
        model = Appointment
        fields = [
            'patient', 'doctor', 'slot', 'treatment',
            'appointment_slot_date', 'appointment_slot_start_time',
            'appointment_slot_end_time', 'appointment_status', 'medical_record'
        ]
    
    def validate(self, attrs):
        # Validate appointment slot times
        if attrs.get('appointment_slot_start_time') and attrs.get('appointment_slot_end_time'):
            if attrs['appointment_slot_start_time'] >= attrs['appointment_slot_end_time']:
                raise serializers.ValidationError(
                    "Start time must be before end time"
                )
        
        # Check if the slot belongs to the selected doctor (only if slot is provided)
        if attrs.get('slot') and attrs.get('doctor'):
            if attrs['slot'].doctor != attrs['doctor']:
                raise serializers.ValidationError(
                    "Selected slot does not belong to the selected doctor"
                )
        
        return attrs


class AppointmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            'appointment_slot_date', 'appointment_slot_start_time',
            'appointment_slot_end_time', 'appointment_status', 'medical_record'
        ]