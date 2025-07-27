from rest_framework import serializers
from .models import Client, Domain, User
from tenant_users.tenants.models import UserTenantPermissions


class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = ['id', 'domain', 'tenant', 'is_primary', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ClientSerializer(serializers.ModelSerializer):
    domains = DomainSerializer(many=True, read_only=True)
    
    class Meta:
        model = Client
        fields = [
            'id', 'schema_name', 'name', 'paid_until', 'on_trial',
            'domains', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class UserBaseSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone_number', 'is_active', 'date_joined', 'last_login'
        ]
        read_only_fields = ['date_joined', 'last_login']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class DoctorSerializer(UserBaseSerializer):
    class Meta(UserBaseSerializer.Meta):
        fields = UserBaseSerializer.Meta.fields + [
            'specialization', 'experience_years', 'bio', 'consultation_fee'
        ]


class PatientSerializer(UserBaseSerializer):
    class Meta(UserBaseSerializer.Meta):
        fields = UserBaseSerializer.Meta.fields + [
            'date_of_birth', 'gender', 'medical_record_number',
            'insurance_provider', 'blood_type', 'allergies', 'emergency_contact'
        ]


class NurseSerializer(UserBaseSerializer):
    class Meta(UserBaseSerializer.Meta):
        fields = UserBaseSerializer.Meta.fields + [
            'department', 'shift_schedule', 'license_number'
        ]


class AdminSerializer(UserBaseSerializer):
    class Meta(UserBaseSerializer.Meta):
        fields = UserBaseSerializer.Meta.fields + [
            'is_staff', 'is_superuser', 'permissions'
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm', 'first_name', 'last_name',
            'role', 'phone_number', 'specialization', 'experience_years',
            'date_of_birth', 'gender', 'department', 'shift_schedule'
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