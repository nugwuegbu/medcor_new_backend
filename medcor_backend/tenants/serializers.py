from rest_framework import serializers
from .models import Client, Domain, User


class DomainSerializer(serializers.ModelSerializer):
    """
    Serializer for Domain model.
    """
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = Domain
        fields = ['id', 'domain', 'tenant', 'tenant_name', 'is_primary']
        read_only_fields = ['id']


class ClientSerializer(serializers.ModelSerializer):
    """
    Serializer for Client (Tenant) model.
    """
    domains = DomainSerializer(many=True, read_only=True, source='domain_set')
    domain_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'schema_name', 'created_on', 
            'auto_create_schema', 'domains', 'domain_count'
        ]
        read_only_fields = ['id', 'schema_name', 'created_on']
    
    def get_domain_count(self, obj):
        """Return the count of domains for this tenant."""
        return obj.domain_set.count()


class CreateClientSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new Client (Tenant).
    """
    domain_name = serializers.CharField(write_only=True, help_text="Primary domain for the tenant")
    
    class Meta:
        model = Client
        fields = ['name', 'schema_name', 'domain_name']
        
    def create(self, validated_data):
        """
        Create a new client with its primary domain.
        """
        domain_name = validated_data.pop('domain_name')
        
        # Create the client
        client = Client.objects.create(**validated_data)
        
        # Create the primary domain
        Domain.objects.create(
            domain=domain_name,
            tenant=client,
            is_primary=True
        )
        
        return client


class AdminStatsSerializer(serializers.Serializer):
    """
    Serializer for admin dashboard statistics.
    """
    total_tenants = serializers.IntegerField()
    total_domains = serializers.IntegerField()
    active_tenants = serializers.IntegerField()
    recent_tenants = serializers.ListField()
    tenant_growth = serializers.DictField()
    
    class Meta:
        fields = [
            'total_tenants', 'total_domains', 'active_tenants', 
            'recent_tenants', 'tenant_growth'
        ]


# User Role-Based Serializers

class BaseUserSerializer(serializers.ModelSerializer):
    """
    Base serializer for User model with common fields.
    """
    full_name = serializers.SerializerMethodField()
    tenant_names = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'profile_picture', 'date_of_birth', 
            'address', 'emergency_contact', 'emergency_phone',
            'role', 'is_active', 'date_joined', 'last_login',
            'tenant_names'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'full_name', 'tenant_names']
    
    def get_full_name(self, obj):
        """Return the user's full name."""
        return f"{obj.first_name} {obj.last_name}".strip()
    
    def get_tenant_names(self, obj):
        """Return list of tenant names the user belongs to."""
        return [tenant.name for tenant in obj.tenants.all()]


class PatientSerializer(BaseUserSerializer):
    """
    Serializer for Patient role users with medical information.
    """
    appointment_count = serializers.SerializerMethodField()
    last_appointment = serializers.SerializerMethodField()
    
    class Meta(BaseUserSerializer.Meta):
        fields = BaseUserSerializer.Meta.fields + [
            'medical_record_number', 'insurance_provider', 
            'insurance_policy_number', 'blood_type', 'allergies',
            'face_registered', 'appointment_count', 'last_appointment'
        ]
        read_only_fields = BaseUserSerializer.Meta.read_only_fields + [
            'appointment_count', 'last_appointment'
        ]
    
    def get_appointment_count(self, obj):
        """Return the total number of appointments for this patient."""
        return getattr(obj, 'appointment_count', 0)
    
    def get_last_appointment(self, obj):
        """Return the date of the last appointment."""
        return getattr(obj, 'last_appointment', None)


class DoctorSerializer(BaseUserSerializer):
    """
    Serializer for Doctor role users with professional information.
    """
    patient_count = serializers.SerializerMethodField()
    upcoming_appointments = serializers.SerializerMethodField()
    specialization = serializers.CharField(max_length=100, required=False, allow_blank=True)
    license_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    years_of_experience = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta(BaseUserSerializer.Meta):
        fields = BaseUserSerializer.Meta.fields + [
            'specialization', 'license_number', 'years_of_experience',
            'patient_count', 'upcoming_appointments'
        ]
        read_only_fields = BaseUserSerializer.Meta.read_only_fields + [
            'patient_count', 'upcoming_appointments'
        ]
    
    def get_patient_count(self, obj):
        """Return the total number of patients for this doctor."""
        return getattr(obj, 'patient_count', 0)
    
    def get_upcoming_appointments(self, obj):
        """Return the count of upcoming appointments."""
        return getattr(obj, 'upcoming_appointments', 0)


class NurseSerializer(BaseUserSerializer):
    """
    Serializer for Nurse role users with nursing-specific information.
    """
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shift_schedule = serializers.CharField(max_length=50, required=False, allow_blank=True)
    certification_level = serializers.CharField(max_length=50, required=False, allow_blank=True)
    assigned_patients = serializers.SerializerMethodField()
    
    class Meta(BaseUserSerializer.Meta):
        fields = BaseUserSerializer.Meta.fields + [
            'department', 'shift_schedule', 'certification_level',
            'assigned_patients'
        ]
        read_only_fields = BaseUserSerializer.Meta.read_only_fields + [
            'assigned_patients'
        ]
    
    def get_assigned_patients(self, obj):
        """Return the count of assigned patients."""
        return getattr(obj, 'assigned_patients', 0)


# Create/Update Serializers

class CreatePatientSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new patients.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'confirm_password', 'first_name', 'last_name',
            'phone_number', 'date_of_birth', 'address', 'emergency_contact',
            'emergency_phone', 'medical_record_number', 'insurance_provider',
            'insurance_policy_number', 'blood_type', 'allergies'
        ]
    
    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return attrs
    
    def create(self, validated_data):
        """Create a new patient user."""
        validated_data.pop('confirm_password')
        validated_data['role'] = 'patient'
        user = User.objects.create_user(**validated_data)
        return user


class CreateDoctorSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new doctors.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    specialization = serializers.CharField(max_length=100, required=False, allow_blank=True)
    license_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    years_of_experience = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'confirm_password', 'first_name', 'last_name',
            'phone_number', 'address', 'specialization', 'license_number',
            'years_of_experience'
        ]
    
    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return attrs
    
    def create(self, validated_data):
        """Create a new doctor user."""
        validated_data.pop('confirm_password')
        validated_data['role'] = 'doctor'
        user = User.objects.create_user(**validated_data)
        return user


class CreateNurseSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new nurses.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shift_schedule = serializers.CharField(max_length=50, required=False, allow_blank=True)
    certification_level = serializers.CharField(max_length=50, required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'confirm_password', 'first_name', 'last_name',
            'phone_number', 'address', 'department', 'shift_schedule',
            'certification_level'
        ]
    
    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return attrs
    
    def create(self, validated_data):
        """Create a new nurse user."""
        validated_data.pop('confirm_password')
        validated_data['role'] = 'nurse'
        user = User.objects.create_user(**validated_data)
        return user


# List Serializers (minimal data for list views)

class PatientListSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for patient list views.
    """
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'medical_record_number', 'is_active',
            'date_joined'
        ]
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class DoctorListSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for doctor list views.
    """
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'is_active', 'date_joined'
        ]
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class NurseListSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for nurse list views.
    """
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'is_active', 'date_joined'
        ]
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()