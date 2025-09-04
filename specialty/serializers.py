from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import DoctorSpecialty, Specialty, SpecialtyStatistics

User = get_user_model()


class SpecialtySerializer(serializers.ModelSerializer):
    """Serializer for Specialty model"""

    total_doctors = serializers.SerializerMethodField()
    statistics = serializers.SerializerMethodField()

    class Meta:
        model = Specialty
        fields = [
            "id",
            "code",
            "name",
            "description",
            "certification_required",
            "years_of_training",
            "is_active",
            "created_at",
            "updated_at",
            "total_doctors",
            "statistics",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_total_doctors(self, obj):
        """Get total number of doctors with this specialty"""
        return obj.specialists.count()

    def get_statistics(self, obj):
        """Get specialty statistics if available"""
        try:
            stats = obj.statistics
            return {
                "total_appointments": stats.total_appointments,
                "average_rating": float(stats.average_rating),
                "appointment_requests_last_month": stats.appointment_requests_last_month,
                "average_wait_days": float(stats.average_wait_days),
            }
        except SpecialtyStatistics.DoesNotExist:
            return None


class SpecialtyListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing specialties"""

    doctor_count = serializers.IntegerField(source="specialists.count", read_only=True)

    class Meta:
        model = Specialty
        fields = ["id", "code", "name", "doctor_count", "is_active"]


class DoctorSpecialtySerializer(serializers.ModelSerializer):
    """Serializer for DoctorSpecialty relationship"""

    specialty_details = SpecialtySerializer(source="specialty", read_only=True)
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)

    class Meta:
        model = DoctorSpecialty
        fields = [
            "id",
            "doctor",
            "doctor_name",
            "specialty",
            "specialty_details",
            "is_primary",
            "certification_date",
            "certification_number",
            "institution",
            "years_of_experience",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "doctor_name"]

    def validate(self, data):
        """Validate doctor specialty data"""
        # Check if doctor has the correct role
        doctor = data.get("doctor")
        if doctor and doctor.role != "doctor":
            raise serializers.ValidationError(
                "Only users with 'doctor' role can have specialties"
            )

        # Ensure at least one primary specialty
        if not data.get("is_primary", False):
            existing_primary = DoctorSpecialty.objects.filter(
                doctor=doctor, is_primary=True
            ).exists()
            if not existing_primary:
                data["is_primary"] = True

        return data


class DoctorSpecialtyCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating doctor specialties"""

    class Meta:
        model = DoctorSpecialty
        fields = [
            "doctor",
            "specialty",
            "is_primary",
            "certification_date",
            "certification_number",
            "institution",
            "years_of_experience",
        ]

    def create(self, validated_data):
        """Create doctor specialty with default if needed"""
        doctor = validated_data.get("doctor")

        # If no specialty provided, use default
        if not validated_data.get("specialty"):
            validated_data["specialty"] = Specialty.get_default_specialty()

        # Create the doctor specialty
        return super().create(validated_data)


class DoctorWithSpecialtiesSerializer(serializers.ModelSerializer):
    """Serializer for doctor with their specialties"""

    specialties = serializers.SerializerMethodField()
    primary_specialty = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "specialties",
            "primary_specialty",
        ]

    def get_specialties(self, obj):
        """Get all specialties for the doctor"""
        doctor_specialties = obj.doctor_specialties.select_related("specialty")
        return DoctorSpecialtySerializer(doctor_specialties, many=True).data

    def get_primary_specialty(self, obj):
        """Get the primary specialty for the doctor"""
        primary = obj.doctor_specialties.filter(is_primary=True).first()
        if primary:
            return {
                "id": primary.specialty.id,
                "code": primary.specialty.code,
                "name": primary.specialty.name,
            }
        return None


class SpecialtyStatisticsSerializer(serializers.ModelSerializer):
    """Serializer for specialty statistics"""

    specialty_name = serializers.CharField(source="specialty.name", read_only=True)
    specialty_code = serializers.CharField(source="specialty.code", read_only=True)

    class Meta:
        model = SpecialtyStatistics
        fields = [
            "id",
            "specialty",
            "specialty_name",
            "specialty_code",
            "total_doctors",
            "total_appointments",
            "average_rating",
            "appointment_requests_last_month",
            "average_wait_days",
            "last_updated",
        ]
        read_only_fields = ["last_updated"]


class BulkSpecialtyAssignSerializer(serializers.Serializer):
    """Serializer for bulk assigning specialties to doctors"""

    doctor_ids = serializers.ListField(child=serializers.IntegerField(), required=True)
    specialty_id = serializers.IntegerField(required=True)
    is_primary = serializers.BooleanField(default=False)

    def validate_doctor_ids(self, value):
        """Validate that all doctor IDs exist and are doctors"""
        doctors = User.objects.filter(id__in=value, role="doctor")
        if len(doctors) != len(value):
            invalid_ids = set(value) - set(doctors.values_list("id", flat=True))
            raise serializers.ValidationError(f"Invalid doctor IDs: {invalid_ids}")
        return value

    def validate_specialty_id(self, value):
        """Validate that specialty exists"""
        if not Specialty.objects.filter(id=value).exists():
            raise serializers.ValidationError("Specialty does not exist")
        return value
