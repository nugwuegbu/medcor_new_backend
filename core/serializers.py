"""
Serializers for core user authentication and management.
"""

from django.contrib.auth import authenticate
from django.db.models import Prefetch
from rest_framework import serializers

from tenants.models import Hospital

from .models import User, Certification


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with hospital details and doctor specialization."""

    hospital = serializers.PrimaryKeyRelatedField(
        queryset=Hospital.objects.all(), required=False, allow_null=True
    )
    hospital_name = serializers.CharField(source="hospital.name", read_only=True)
    full_name = serializers.CharField(source="get_full_name", read_only=True)
    specialization_name = serializers.CharField(source="specialization.name", read_only=True)
    specialization_code = serializers.CharField(source="specialization.code", read_only=True)
    doctor_specialties = serializers.SerializerMethodField()
    primary_specialty = serializers.SerializerMethodField()
    certifications = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone_number",
            "date_of_birth",
            "gender",
            "role",
            "hospital",
            "hospital_name",
            "department",
            "specialization",
            "specialization_name",
            "specialization_code",
            "is_active",
            "is_verified",
            "created_at",
            "updated_at",
            "profile_picture",
            "bio",
            "linkedin_url",
            "facebook_url",
            "twitter_url",
            "preferred_language",
            "timezone",
            "doctor_specialties",
            "primary_specialty",
            "certifications",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "hospital_name"]

    def get_doctor_specialties(self, obj):
        """Get all specialties if user is a doctor."""
        if obj.role != "DOCTOR":
            return None

        try:
            # Import here to avoid circular import
            from specialty.models import DoctorSpecialty

            specialties = (
                DoctorSpecialty.objects.filter(doctor=obj)
                .select_related("specialty")
                .order_by("-is_primary", "specialty__name")
            )

            return [
                {
                    "id": ds.specialty.id,
                    "code": ds.specialty.code,
                    "name": ds.specialty.name,
                    "is_primary": ds.is_primary,
                    "certification_date": ds.certification_date,
                    "years_of_experience": ds.years_of_experience,
                }
                for ds in specialties
            ]
        except Exception:
            # Return empty list if database table doesn't exist yet
            return []

    def get_primary_specialty(self, obj):
        """Get the primary specialty if user is a doctor."""
        if obj.role != "DOCTOR":
            return None

        try:
            # Import here to avoid circular import
            from specialty.models import DoctorSpecialty

            primary = (
                DoctorSpecialty.objects.filter(doctor=obj, is_primary=True)
                .select_related("specialty")
                .first()
            )

            if primary:
                return {
                    "id": primary.specialty.id,
                    "code": primary.specialty.code,
                    "name": primary.specialty.name,
                }

            # If no primary specialty, check for default General Medicine
            from specialty.models import Specialty

            if obj.hospital:
                default = Specialty.get_default_specialty(obj.hospital)
                return {"id": default.id, "code": default.code, "name": default.name}
            else:
                # Return default specialty if no hospital
                return {"id": 1, "code": "GEN", "name": "General Medicine"}
        except Exception:
            # Return default specialty if database error
            return {"id": 1, "code": "GEN", "name": "General Medicine"}
    
    def get_certifications(self, obj):
        """Get all certifications for the user."""
        try:
            # Check if certifications are prefetched
            if (
                hasattr(obj, "_prefetched_objects_cache")
                and "certifications" in obj._prefetched_objects_cache
            ):
                certifications = obj.certifications.all()
            else:
                certifications = obj.certifications.filter(is_active=True)
            
            return CertificationSerializer(certifications, many=True, context=self.context).data
        except Exception:
            # Return empty list if database error
            return []


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users."""

    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    hospital = serializers.PrimaryKeyRelatedField(
        queryset=Hospital.objects.all(), required=False, allow_null=True
    )
    specialization = serializers.IntegerField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "hospital",
            "department",
            "specialization",
            "linkedin_url",
            "facebook_url",
            "twitter_url",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set the queryset for specialization field
        try:
            from specialty.models import Specialty
            self.fields['specialization'].queryset = Specialty.objects.filter(is_active=True)
        except ImportError:
            # Handle case where specialty app is not available
            pass

    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("Passwords don't match")
        attrs.pop("password_confirm")
        return attrs

    def create(self, validated_data):
        """Create user with hashed password."""
        password = validated_data.pop("password")
        
        # Handle specialization ID
        specialization_id = validated_data.pop("specialization", None)
        if specialization_id:
            try:
                from specialty.models import Specialty
                validated_data["specialization"] = Specialty.objects.get(id=specialization_id)
            except (Specialty.DoesNotExist, ImportError):
                validated_data["specialization"] = None
        
        user = User.objects.create_user(password=password, **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        """Validate credentials."""
        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            user = authenticate(
                request=self.context.get("request"), username=email, password=password
            )

            if not user:
                raise serializers.ValidationError("Invalid credentials")

            if not user.is_active:
                raise serializers.ValidationError("User account is disabled")

            attrs["user"] = user
            return attrs
        else:
            raise serializers.ValidationError("Must include email and password")


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""

    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        """Validate password change."""
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError("New passwords don't match")
        return attrs

    def validate_old_password(self, value):
        """Validate old password."""
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value


class DoctorSpecialtyInfoSerializer(serializers.Serializer):
    """Lightweight serializer for doctor's specialty information."""

    id = serializers.IntegerField(read_only=True)
    code = serializers.CharField(read_only=True)
    name = serializers.CharField(read_only=True)
    is_primary = serializers.BooleanField(read_only=True)
    years_of_experience = serializers.IntegerField(read_only=True)
    certification_date = serializers.DateField(read_only=True)


class DoctorSerializer(UserSerializer):
    """Serializer for doctor users with specialization information."""

    appointments_count = serializers.IntegerField(read_only=True)
    patients_count = serializers.IntegerField(read_only=True)
    specialties = serializers.SerializerMethodField()
    primary_specialty = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + [
            "license_number",
            "years_of_experience",
            "appointments_count",
            "patients_count",
            "specialties",
            "primary_specialty",
        ]

    def get_specialties(self, obj):
        """Get all specialties for the doctor."""
        if obj.role != "DOCTOR":
            return []

        try:
            # Check if doctor_specialties are prefetched
            if (
                hasattr(obj, "_prefetched_objects_cache")
                and "doctor_specialties" in obj._prefetched_objects_cache
            ):
                doctor_specialties = obj.doctor_specialties.all()
            else:
                # Import here to avoid circular import
                from specialty.models import DoctorSpecialty

                doctor_specialties = DoctorSpecialty.objects.filter(
                    doctor=obj
                ).select_related("specialty")

            return [
                {
                    "id": ds.specialty.id,
                    "code": ds.specialty.code,
                    "name": ds.specialty.name,
                    "is_primary": ds.is_primary,
                    "years_of_experience": ds.years_of_experience,
                    "certification_date": ds.certification_date,
                }
                for ds in doctor_specialties
            ]
        except Exception:
            # Return empty list if database error
            return []

    def get_primary_specialty(self, obj):
        """Get the primary specialty for the doctor."""
        if obj.role != "DOCTOR":
            return None

        try:
            # Import here to avoid circular import
            from specialty.models import DoctorSpecialty

            primary = (
                DoctorSpecialty.objects.filter(doctor=obj, is_primary=True)
                .select_related("specialty")
                .first()
            )

            if primary:
                return {
                    "id": primary.specialty.id,
                    "code": primary.specialty.code,
                    "name": primary.specialty.name,
                    "years_of_experience": primary.years_of_experience,
                }
            return None
        except Exception:
            # Return default if database error
            return {
                "id": 1,
                "code": "GEN",
                "name": "General Medicine",
                "years_of_experience": 0,
            }


class PatientSerializer(UserSerializer):
    """Serializer for patient users."""

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + [
            "blood_type",
            "allergies",
            "medical_conditions",
            "current_medications",
            "emergency_contact_name",
            "emergency_contact_phone",
            "emergency_contact_relationship",
        ]


class CertificationSerializer(serializers.ModelSerializer):
    """Serializer for Certification model."""
    
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    days_until_expiry = serializers.IntegerField(read_only=True)
    file_document_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Certification
        fields = [
            "id",
            "user",
            "user_name",
            "user_email",
            "certification_name",
            "certification_type",
            "certification_license_id",
            "issue_date",
            "expiry_date",
            "file_document",
            "file_document_url",
            "issuing_authority",
            "description",
            "is_verified",
            "is_active",
            "is_expired",
            "days_until_expiry",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "is_expired", "days_until_expiry"]
    
    def get_file_document_url(self, obj):
        """Get the URL for the uploaded file."""
        if obj.file_document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file_document.url)
            return obj.file_document.url
        return None
    
    def validate(self, attrs):
        """Validate certification data."""
        issue_date = attrs.get('issue_date')
        expiry_date = attrs.get('expiry_date')
        
        if issue_date and expiry_date:
            if expiry_date <= issue_date:
                raise serializers.ValidationError("Expiry date must be after issue date.")
        
        return attrs


class CertificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating certifications."""
    
    class Meta:
        model = Certification
        fields = [
            "certification_name",
            "certification_type",
            "certification_license_id",
            "issue_date",
            "expiry_date",
            "file_document",
            "issuing_authority",
            "description",
        ]
    
    def validate(self, attrs):
        """Validate certification data."""
        issue_date = attrs.get('issue_date')
        expiry_date = attrs.get('expiry_date')
        
        if issue_date and expiry_date:
            if expiry_date <= issue_date:
                raise serializers.ValidationError("Expiry date must be after issue date.")
        
        return attrs
