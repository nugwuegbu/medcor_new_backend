from rest_framework import serializers
from .models import Client, Domain, User
from tenant_users.tenants.models import UserTenantPermissions


class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = ['id', 'domain', 'tenant', 'is_primary', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ClientSerializer(serializers.ModelSerializer):
    """
    Serializer for Client (Hospital/Clinic) model with comprehensive field documentation.
    """
    domains = DomainSerializer(many=True, read_only=True)
    total_users = serializers.SerializerMethodField(read_only=True)
    is_active = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Client
        fields = [
            'id', 'schema_name', 'name', 'domains', 
            'total_users', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_users', 'is_active']
        extra_kwargs = {
            'schema_name': {
                'help_text': 'Unique schema identifier for the tenant (lowercase, no spaces)',
                'required': True,
                'min_length': 3,
                'max_length': 63,
            },
            'name': {
                'help_text': 'Display name of the hospital or clinic',
                'required': True,
                'min_length': 2,
                'max_length': 100,
            }
        }
    
    def get_total_users(self, obj):
        """Get total number of users for this client."""
        # In a real implementation, you'd filter by tenant
        return User.objects.count()
    
    def get_is_active(self, obj):
        """Check if client has recent activity."""
        from django.utils import timezone
        from datetime import timedelta
        thirty_days_ago = timezone.now() - timedelta(days=30)
        # Check if any users have logged in recently
        return User.objects.filter(last_login__gte=thirty_days_ago).exists()
    
    def validate_schema_name(self, value):
        """Validate schema name follows PostgreSQL schema naming conventions."""
        import re
        if not re.match(r'^[a-z][a-z0-9_]*$', value):
            raise serializers.ValidationError(
                "Schema name must start with a letter and contain only lowercase letters, numbers, and underscores."
            )
        if len(value) > 63:
            raise serializers.ValidationError(
                "Schema name must be 63 characters or less."
            )
        return value
    
    def validate_name(self, value):
        """Validate client display name."""
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                "Name must be at least 2 characters long."
            )
        return value.strip()


class ClientCreateSerializer(serializers.ModelSerializer):
    """
    Specialized serializer for creating new clients with additional validation.
    """
    admin_email = serializers.EmailField(
        write_only=True, 
        required=False,
        help_text="Email for the initial admin user of this client"
    )
    admin_password = serializers.CharField(
        write_only=True, 
        required=False,
        min_length=8,
        help_text="Password for the initial admin user"
    )
    primary_domain = serializers.CharField(
        write_only=True,
        required=False,
        help_text="Primary domain for this client (e.g., hospital.medcor.ai)"
    )
    
    class Meta:
        model = Client
        fields = [
            'schema_name', 'name', 
            'admin_email', 'admin_password', 'primary_domain'
        ]
        
    def create(self, validated_data):
        """Create client and optionally set up initial admin user and domain."""
        admin_email = validated_data.pop('admin_email', None)
        admin_password = validated_data.pop('admin_password', None)
        primary_domain = validated_data.pop('primary_domain', None)
        
        # Create the client
        client = super().create(validated_data)
        
        # Create primary domain if provided
        if primary_domain:
            Domain.objects.create(
                domain=primary_domain,
                tenant=client,
                is_primary=True
            )
        
        # Create admin user if credentials provided
        if admin_email and admin_password:
            # This would typically be done in a signal or separate process
            # to ensure it's created in the tenant's schema
            pass
        
        return client


class ClientStatisticsSerializer(serializers.Serializer):
    """
    Serializer for client statistics response.
    """
    name = serializers.CharField(read_only=True)
    schema_name = serializers.CharField(read_only=True)
    statistics = serializers.DictField(
        child=serializers.IntegerField(),
        read_only=True,
        help_text="Dictionary containing various statistics"
    )
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class UserBaseSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone_number', 'is_active', 'created_at', 'last_login'
        ]
        read_only_fields = ['created_at', 'last_login']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class DoctorSerializer(UserBaseSerializer):
    class Meta(UserBaseSerializer.Meta):
        fields = UserBaseSerializer.Meta.fields


class PatientSerializer(UserBaseSerializer):
    class Meta(UserBaseSerializer.Meta):
        fields = UserBaseSerializer.Meta.fields + [
            'date_of_birth', 'medical_record_number',
            'insurance_provider', 'blood_type', 'allergies', 'emergency_contact'
        ]


class NurseSerializer(UserBaseSerializer):
    class Meta(UserBaseSerializer.Meta):
        fields = UserBaseSerializer.Meta.fields


class AdminSerializer(UserBaseSerializer):
    class Meta(UserBaseSerializer.Meta):
        fields = UserBaseSerializer.Meta.fields + [
            'is_staff', 'is_superuser'
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm', 'first_name', 'last_name',
            'role', 'phone_number', 'date_of_birth'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user