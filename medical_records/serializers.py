"""
Serializers for Medical Records models.
"""

from rest_framework import serializers

from .models import MedicalDocument, MedicalRecord


class MedicalDocumentSerializer(serializers.ModelSerializer):
    """Serializer for MedicalDocument model."""

    uploaded_by_name = serializers.CharField(
        source="uploaded_by.get_full_name", read_only=True
    )

    class Meta:
        model = MedicalDocument
        fields = [
            "id",
            "hospital",
            "medical_record",
            "document_type",
            "title",
            "description",
            "file",
            "file_size",
            "file_type",
            "uploaded_by",
            "uploaded_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "uploaded_by_name",
            "file_size",
            "file_type",
        ]

    def create(self, validated_data):
        """Handle file upload and metadata extraction."""
        if "file" in validated_data:
            file = validated_data["file"]
            validated_data["file_size"] = file.size
            validated_data["file_type"] = file.content_type
        return super().create(validated_data)


class MedicalRecordSerializer(serializers.ModelSerializer):
    """Serializer for MedicalRecord model."""

    documents = MedicalDocumentSerializer(many=True, read_only=True)
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )

    class Meta:
        model = MedicalRecord
        fields = [
            "id",
            "hospital",
            "patient",
            "patient_name",
            "created_by",
            "created_by_name",
            "record_type",
            "title",
            "description",
            "diagnosis",
            "symptoms",
            "vital_signs",
            "lab_results",
            "attachments",
            "appointment",
            "is_confidential",
            "access_restricted",
            "created_at",
            "updated_at",
            "metadata",
            "documents",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "patient_name",
            "created_by_name",
        ]

    def validate(self, data):
        """Validate medical record data."""
        # Ensure vital_signs is a dictionary if provided
        if "vital_signs" in data and not isinstance(data["vital_signs"], dict):
            raise serializers.ValidationError("Vital signs must be a dictionary")

        # Ensure lab_results is a dictionary if provided
        if "lab_results" in data and not isinstance(data["lab_results"], dict):
            raise serializers.ValidationError("Lab results must be a dictionary")

        # Ensure attachments is a list if provided
        if "attachments" in data and not isinstance(data["attachments"], list):
            raise serializers.ValidationError("Attachments must be a list")

        return data


class MedicalRecordListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for medical record listings."""

    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )
    document_count = serializers.IntegerField(source="documents.count", read_only=True)

    class Meta:
        model = MedicalRecord
        fields = [
            "id",
            "patient_name",
            "created_by_name",
            "record_type",
            "title",
            "created_at",
            "is_confidential",
            "document_count",
        ]
        read_only_fields = fields


class CreateMedicalRecordSerializer(serializers.ModelSerializer):
    """Serializer for creating medical records with documents."""

    documents = MedicalDocumentSerializer(many=True, required=False)

    class Meta:
        model = MedicalRecord
        fields = [
            "hospital",
            "patient",
            "created_by",
            "record_type",
            "title",
            "description",
            "diagnosis",
            "symptoms",
            "vital_signs",
            "lab_results",
            "attachments",
            "appointment",
            "is_confidential",
            "access_restricted",
            "metadata",
            "documents",
        ]

    def create(self, validated_data):
        """Create medical record with documents."""
        documents_data = validated_data.pop("documents", [])
        medical_record = MedicalRecord.objects.create(**validated_data)

        for document_data in documents_data:
            MedicalDocument.objects.create(
                medical_record=medical_record,
                hospital=medical_record.hospital,
                **document_data,
            )

        return medical_record

    def update(self, instance, validated_data):
        """Update medical record."""
        documents_data = validated_data.pop("documents", None)

        # Update medical record fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Handle documents if provided
        if documents_data is not None:
            # Create new documents (typically we don't delete existing ones)
            for document_data in documents_data:
                MedicalDocument.objects.create(
                    medical_record=instance, hospital=instance.hospital, **document_data
                )

        return instance


class PatientMedicalHistorySerializer(serializers.Serializer):
    """Serializer for patient medical history summary."""

    total_records = serializers.IntegerField()
    records_by_type = serializers.DictField()
    recent_diagnoses = serializers.ListField()
    allergies = serializers.ListField()
    recent_lab_results = serializers.ListField()
    recent_appointments = serializers.IntegerField()
    confidential_records = serializers.IntegerField()
