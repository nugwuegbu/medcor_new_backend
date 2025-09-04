"""
Serializers for the tenants app.
"""

from rest_framework import serializers

from .models import Hospital


class HospitalSerializer(serializers.ModelSerializer):
    """Serializer for Hospital model."""

    full_address = serializers.CharField(source="get_full_address", read_only=True)
    location_coordinates = serializers.SerializerMethodField()
    is_emergency_capable = serializers.BooleanField(read_only=True)
    is_trauma_center = serializers.BooleanField(read_only=True)

    class Meta:
        model = Hospital
        fields = [
            "id",
            "name",
            "slug",
            "hospital_type",
            "description",
            "phone_number",
            "email",
            "website",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "country",
            "postal_code",
            "latitude",
            "longitude",
            "full_address",
            "location_coordinates",
            "bed_count",
            "emergency_services",
            "trauma_center_level",
            "operating_hours",
            "services",
            "accreditations",
            "license_number",
            "is_active",
            "is_verified",
            "created_at",
            "updated_at",
            "is_emergency_capable",
            "is_trauma_center",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]

    def get_location_coordinates(self, obj):
        """Return location coordinates if available."""
        return obj.get_location_coordinates()

    def validate_name(self, value):
        """Validate hospital name uniqueness."""
        if Hospital.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError(
                "A hospital with this name already exists."
            )
        return value

    def validate_phone_number(self, value):
        """Validate phone number format."""
        if (
            value
            and not value.replace("-", "")
            .replace(" ", "")
            .replace("(", "")
            .replace(")", "")
            .replace("+", "")
            .isdigit()
        ):
            raise serializers.ValidationError("Please enter a valid phone number.")
        return value


class HospitalCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new hospitals."""

    class Meta:
        model = Hospital
        fields = [
            "name",
            "hospital_type",
            "description",
            "phone_number",
            "email",
            "website",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "country",
            "postal_code",
            "latitude",
            "longitude",
            "bed_count",
            "emergency_services",
            "trauma_center_level",
            "operating_hours",
            "services",
            "accreditations",
            "license_number",
        ]

    def validate_name(self, value):
        """Validate hospital name uniqueness."""
        if Hospital.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError(
                "A hospital with this name already exists."
            )
        return value


class HospitalUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating hospitals."""

    class Meta:
        model = Hospital
        fields = [
            "name",
            "hospital_type",
            "description",
            "phone_number",
            "email",
            "website",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "country",
            "postal_code",
            "latitude",
            "longitude",
            "bed_count",
            "emergency_services",
            "trauma_center_level",
            "operating_hours",
            "services",
            "accreditations",
            "license_number",
            "is_active",
            "is_verified",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]


class HospitalListSerializer(serializers.ModelSerializer):
    """Simplified serializer for hospital lists."""

    full_address = serializers.CharField(source="get_full_address", read_only=True)
    is_emergency_capable = serializers.BooleanField(read_only=True)

    class Meta:
        model = Hospital
        fields = [
            "id",
            "name",
            "slug",
            "hospital_type",
            "city",
            "state",
            "full_address",
            "emergency_services",
            "is_active",
            "is_verified",
            "is_emergency_capable",
        ]
