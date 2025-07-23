"""
Comprehensive serializers for all medical entities
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import Doctor as CoreDoctor, Appointment as CoreAppointment
from simple_treatment.models import Treatment
from simple_appointment.models import Doctor as SimpleDoctor, Appointment as SimpleAppointment


# User-based serializers for Patient, Doctor, Nurse roles
class PatientSerializer(serializers.ModelSerializer):
    """Serializer for Patient users"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 
                 'is_active', 'date_joined', 'last_login']
        read_only_fields = ['id', 'date_joined', 'last_login']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class PatientCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Patient users"""
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'confirm_password']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        # Add patient role logic here if needed
        return user


class CoreDoctorSerializer(serializers.ModelSerializer):
    """Serializer for Core Doctor model"""
    appointment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CoreDoctor
        fields = ['id', 'name', 'specialty', 'experience', 'education', 'photo', 
                 'bio', 'description', 'avatar_id', 'available', 'appointment_count']
    
    def get_appointment_count(self, obj):
        return obj.appointments.count()


class CoreDoctorCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Core Doctor"""
    class Meta:
        model = CoreDoctor
        fields = ['name', 'specialty', 'experience', 'education', 'photo', 
                 'bio', 'description', 'avatar_id', 'available']


class TreatmentSerializer(serializers.ModelSerializer):
    """Serializer for Treatment model"""
    created_by_name = serializers.SerializerMethodField()
    appointment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Treatment
        fields = ['id', 'name', 'description', 'cost', 'duration_minutes', 
                 'is_active', 'created_by', 'created_by_name', 'created_at', 
                 'updated_at', 'appointment_count']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
    
    def get_created_by_name(self, obj):
        return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
    
    def get_appointment_count(self, obj):
        return obj.appointments.count()


class TreatmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Treatment"""
    class Meta:
        model = Treatment
        fields = ['name', 'description', 'cost', 'duration_minutes', 'is_active']


class CoreAppointmentSerializer(serializers.ModelSerializer):
    """Serializer for Core Appointment model"""
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)
    doctor_specialty = serializers.CharField(source='doctor.specialty', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = CoreAppointment
        fields = ['id', 'patient_name', 'patient_email', 'patient_phone', 
                 'doctor', 'doctor_name', 'doctor_specialty', 'appointment_date', 
                 'appointment_time', 'reason', 'status', 'status_display', 'created_at']
        read_only_fields = ['id', 'created_at']


class CoreAppointmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Core Appointment"""
    class Meta:
        model = CoreAppointment
        fields = ['patient_name', 'patient_email', 'patient_phone', 
                 'doctor', 'appointment_date', 'appointment_time', 'reason']


class SimpleAppointmentSerializer(serializers.ModelSerializer):
    """Serializer for Simple Appointment model"""
    doctor_name = serializers.SerializerMethodField()
    doctor_specialization = serializers.CharField(source='doctor.specialization', read_only=True)
    treatment_name = serializers.CharField(source='treatment.name', read_only=True)
    treatment_cost = serializers.DecimalField(source='treatment.cost', max_digits=10, decimal_places=2, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = SimpleAppointment
        fields = ['id', 'patient_name', 'patient_email', 'patient_phone', 
                 'doctor', 'doctor_name', 'doctor_specialization', 'treatment', 
                 'treatment_name', 'treatment_cost', 'appointment_date', 'status', 
                 'status_display', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.user.get_full_name()}"


class SimpleAppointmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Simple Appointment"""
    class Meta:
        model = SimpleAppointment
        fields = ['patient_name', 'patient_email', 'patient_phone', 
                 'doctor', 'treatment', 'appointment_date', 'notes']


class SimpleDoctorSerializer(serializers.ModelSerializer):
    """Serializer for Simple Doctor model"""
    user_name = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    appointment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SimpleDoctor
        fields = ['id', 'user', 'user_name', 'user_email', 'specialization', 
                 'license_number', 'experience_years', 'is_available', 'appointment_count']
        read_only_fields = ['id']
    
    def get_user_name(self, obj):
        return f"Dr. {obj.user.get_full_name()}"
    
    def get_appointment_count(self, obj):
        return obj.appointments.count()


class SimpleDoctorCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Simple Doctor"""
    class Meta:
        model = SimpleDoctor
        fields = ['user', 'specialization', 'license_number', 'experience_years', 'is_available']


# Statistics serializers
class DoctorStatsSerializer(serializers.Serializer):
    """Serializer for doctor statistics"""
    total_doctors = serializers.IntegerField()
    available_doctors = serializers.IntegerField()
    specializations = serializers.DictField()
    top_doctors = serializers.ListField()


class AppointmentStatsSerializer(serializers.Serializer):
    """Serializer for appointment statistics"""
    total_appointments = serializers.IntegerField()
    pending_appointments = serializers.IntegerField()
    confirmed_appointments = serializers.IntegerField()
    completed_appointments = serializers.IntegerField()
    cancelled_appointments = serializers.IntegerField()
    today_appointments = serializers.IntegerField()
    this_week_appointments = serializers.IntegerField()


class TreatmentStatsSerializer(serializers.Serializer):
    """Serializer for treatment statistics"""
    total_treatments = serializers.IntegerField()
    active_treatments = serializers.IntegerField()
    average_cost = serializers.DecimalField(max_digits=10, decimal_places=2)
    popular_treatments = serializers.ListField()