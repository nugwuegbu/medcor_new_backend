"""
Comprehensive serializers for tenant-based medical entities
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from simple_tenant.models import Tenant, Domain, TenantBrandingPreset
from core.models import Doctor as CoreDoctor, Appointment as CoreAppointment
from simple_treatment.models import Treatment
from simple_appointment.models import Doctor as SimpleDoctor
from drf_spectacular.utils import extend_schema_field


# Tenant Management Serializers
class TenantSerializer(serializers.ModelSerializer):
    """Serializer for Tenant model with branding information"""
    domain_count = serializers.SerializerMethodField()
    primary_domain = serializers.SerializerMethodField()
    
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'schema_name', 'contact_email', 'contact_phone', 
                 'address', 'is_active', 'logo_url', 'primary_color', 'secondary_color',
                 'accent_color', 'background_color', 'text_color', 'font_family', 
                 'sidebar_style', 'custom_css', 'favicon_url', 'domain_count', 
                 'primary_domain', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    @extend_schema_field(serializers.IntegerField())
    def get_domain_count(self, obj):
        return obj.domains.count()
    
    @extend_schema_field(serializers.CharField())
    def get_primary_domain(self, obj):
        primary = obj.domains.filter(is_primary=True).first()
        return primary.domain if primary else None


class TenantCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new tenants"""
    class Meta:
        model = Tenant
        fields = ['name', 'schema_name', 'contact_email', 'contact_phone', 
                 'address', 'logo_url', 'primary_color', 'secondary_color']


class DomainSerializer(serializers.ModelSerializer):
    """Serializer for Domain model"""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = Domain
        fields = ['id', 'domain', 'tenant', 'tenant_name', 'is_primary', 'created_at']
        read_only_fields = ['id', 'created_at']


class TenantBrandingPresetSerializer(serializers.ModelSerializer):
    """Serializer for TenantBrandingPreset model"""
    applied_to_tenants = serializers.SerializerMethodField()
    
    class Meta:
        model = TenantBrandingPreset
        fields = ['id', 'name', 'description', 'primary_color', 'secondary_color',
                 'accent_color', 'background_color', 'text_color', 'font_family',
                 'sidebar_style', 'preset_css', 'is_active', 'applied_to_tenants',
                 'created_at']
        read_only_fields = ['id', 'created_at']
    
    @extend_schema_field(serializers.IntegerField())
    def get_applied_to_tenants(self, obj):
        # Count tenants using this preset (approximate by color matching)
        return Tenant.objects.filter(primary_color=obj.primary_color).count()


# Tenant-based User Management Serializers
class TenantPatientSerializer(serializers.ModelSerializer):
    """Serializer for Patient users within tenant context"""
    full_name = serializers.SerializerMethodField()
    appointment_count = serializers.SerializerMethodField()
    last_appointment = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name',
                 'is_active', 'date_joined', 'last_login', 'appointment_count', 
                 'last_appointment']
        read_only_fields = ['id', 'date_joined', 'last_login']
    
    @extend_schema_field(serializers.CharField())
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()
    
    @extend_schema_field(serializers.IntegerField())
    def get_appointment_count(self, obj):
        # Count appointments from core appointments
        return CoreAppointment.objects.filter(patient_email=obj.email).count()
    
    @extend_schema_field(serializers.DateTimeField())
    def get_last_appointment(self, obj):
        last_apt = CoreAppointment.objects.filter(patient_email=obj.email).first()
        return last_apt.appointment_date if last_apt else None


class TenantPatientCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Patient users within tenant"""
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
        return user


class TenantDoctorSerializer(serializers.ModelSerializer):
    """Serializer for Doctor users within tenant context"""
    user_info = serializers.SerializerMethodField()
    appointment_count = serializers.SerializerMethodField()
    specialization_info = serializers.SerializerMethodField()
    
    class Meta:
        model = SimpleDoctor
        fields = ['id', 'user', 'user_info', 'specialization', 'license_number',
                 'experience_years', 'is_available', 'appointment_count', 
                 'specialization_info']
        read_only_fields = ['id']
    
    @extend_schema_field(serializers.DictField())
    def get_user_info(self, obj):
        return {
            'id': obj.user.id,
            'name': f"Dr. {obj.user.get_full_name()}",
            'email': obj.user.email,
            'is_active': obj.user.is_active,
            'date_joined': obj.user.date_joined
        }
    
    @extend_schema_field(serializers.IntegerField())
    def get_appointment_count(self, obj):
        return obj.appointments.count()
    
    @extend_schema_field(serializers.DictField())
    def get_specialization_info(self, obj):
        return {
            'specialty': obj.specialization,
            'experience_years': obj.experience_years,
            'license_number': obj.license_number,
            'is_available': obj.is_available
        }


class TenantDoctorCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Doctor users within tenant"""
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = SimpleDoctor
        fields = ['user_id', 'specialization', 'license_number', 'experience_years', 'is_available']
    
    def create(self, validated_data):
        user_id = validated_data.pop('user_id')
        user = User.objects.get(id=user_id)
        doctor = SimpleDoctor.objects.create(user=user, **validated_data)
        return doctor


class TenantNurseSerializer(serializers.ModelSerializer):
    """Serializer for Nurse users within tenant context"""
    full_name = serializers.SerializerMethodField()
    department = serializers.CharField(default="General")
    shift = serializers.CharField(default="Day")
    certification = serializers.CharField(default="RN")
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name',
                 'is_active', 'date_joined', 'department', 'shift', 'certification']
        read_only_fields = ['id', 'date_joined']
    
    @extend_schema_field(serializers.CharField())
    def get_full_name(self, obj):
        return f"Nurse {obj.first_name} {obj.last_name}".strip()


class TenantNurseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Nurse users within tenant"""
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    department = serializers.CharField(default="General")
    shift = serializers.CharField(default="Day")
    certification = serializers.CharField(default="RN")
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 
                 'confirm_password', 'department', 'shift', 'certification']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        # Remove non-user fields
        validated_data.pop('confirm_password')
        validated_data.pop('department')
        validated_data.pop('shift') 
        validated_data.pop('certification')
        
        user = User.objects.create_user(**validated_data)
        return user


# Statistics Serializers
class TenantStatsSerializer(serializers.Serializer):
    """Serializer for tenant statistics"""
    total_tenants = serializers.IntegerField()
    active_tenants = serializers.IntegerField()
    total_domains = serializers.IntegerField()
    tenants_with_branding = serializers.IntegerField()
    recent_tenants = serializers.ListField()


class TenantUserStatsSerializer(serializers.Serializer):
    """Serializer for tenant user statistics"""
    total_patients = serializers.IntegerField()
    total_doctors = serializers.IntegerField()
    total_nurses = serializers.IntegerField()
    active_users = serializers.IntegerField()
    recent_registrations = serializers.IntegerField()
    user_distribution = serializers.DictField()