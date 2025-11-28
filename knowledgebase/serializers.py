from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Ai_Identity, Behavior, Response, Source, SourceFile
from tenants.serializers import HospitalSerializer
from drf_spectacular.utils import extend_schema_field

User = get_user_model()


class MultipleFileField(serializers.ListField):
    """Custom field for handling multiple file uploads in Swagger"""
    
    def __init__(self, **kwargs):
        super().__init__(
            child=serializers.FileField(),
            **kwargs
        )
    
    @extend_schema_field({
        'type': 'array',
        'items': {
            'type': 'string',
            'format': 'binary'
        },
        'description': 'Multiple files to upload (PDF, DOC, TXT, etc.)'
    })
    def to_representation(self, value):
        return super().to_representation(value)


# Nested serializers for each group
class IdentityGroupSerializer(serializers.ModelSerializer):
    """Serializer for identity group fields"""
    
    class Meta:
        model = Ai_Identity
        fields = ['agent_name', 'agent_title', 'system_prompt']


class BehaviorGroupSerializer(serializers.ModelSerializer):
    """Serializer for behavior group fields"""
    
    class Meta:
        model = Behavior
        fields = [
            'communication_tone', 'communication_style', 'confidence_level', 
            'response_length', 'enable_follow_up_questions', 'enable_appointment_booking', 
            'enable_personalization'
        ]


class ResponseGroupSerializer(serializers.ModelSerializer):
    """Serializer for response group fields"""
    
    class Meta:
        model = Response
        fields = [
            'greeting_message', 'appointment_booking', 'general_inquiries', 
            'fallback_response', 'emergency_response', 'business_hours', 'medical_specialties'
        ]


class SourceFileSerializer(serializers.ModelSerializer):
    """Serializer for individual source files"""
    file_name = serializers.CharField(read_only=True)
    file_size = serializers.IntegerField(read_only=True)
    file_type = serializers.CharField(read_only=True)
    source_id = serializers.UUIDField(write_only=True, required=False, help_text="ID of the source this file belongs to.")
    
    class Meta:
        model = SourceFile
        fields = [
            'id',
            'source_id',
            'file',
            'file_name',
            'file_size',
            'file_type',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'file_name', 'file_size', 'file_type', 'created_at']

    def to_representation(self, instance):
        """Override to return full URL for file field"""
        representation = super().to_representation(instance)
        
        if not instance.file:
            return representation
        
        # Get the request from context to build absolute URL
        request = self.context.get('request')
        from django.conf import settings
        
        # Get the file URL from Django
        file_url = instance.file.url
        
        # Fix double /media/ if it exists (handle all occurrences)
        while '/media/media/' in file_url:
            file_url = file_url.replace('/media/media/', '/media/')
        
        # Ensure the URL starts with /
        if not file_url.startswith('/'):
            file_url = '/' + file_url
        
        if request:
            # Build absolute URL using request
            representation['file'] = request.build_absolute_uri(file_url)
        else:
            # Fallback: construct URL from settings or Sites framework
            try:
                # Try to get site domain from Django Sites framework
                from django.contrib.sites.models import Site
                try:
                    site = Site.objects.get_current()
                    scheme = getattr(settings, 'DEFAULT_HTTP_PROTOCOL', 'https')
                    base_url = f"{scheme}://{site.domain}"
                    representation['file'] = f"{base_url}{file_url}"
                except:
                    # Try to get from ALLOWED_HOSTS or settings
                    allowed_hosts = getattr(settings, 'ALLOWED_HOSTS', [])
                    if allowed_hosts and allowed_hosts[0] and allowed_hosts[0] != '*':
                        domain = allowed_hosts[0]
                        scheme = getattr(settings, 'DEFAULT_HTTP_PROTOCOL', 'https')
                        base_url = f"{scheme}://{domain}"
                        representation['file'] = f"{base_url}{file_url}"
                    else:
                        # Try to get from a custom setting
                        api_base_url = getattr(settings, 'API_BASE_URL', None)
                        if api_base_url:
                            representation['file'] = f"{api_base_url.rstrip('/')}{file_url}"
                        else:
                            # Last resort: use relative path (shouldn't happen in production)
                            representation['file'] = file_url
            except Exception:
                # Last resort: use relative path
                representation['file'] = file_url
        
        return representation

    def create(self, validated_data):
        validated_data.pop('source_id', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('source_id', None)
        return super().update(instance, validated_data)


class SourceGroupSerializer(serializers.ModelSerializer):
    """Serializer for source group fields with file support"""
    source_files = SourceFileSerializer(many=True, read_only=True)
    files_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Source
        fields = ['source_files', 'files_count', 'is_active']
        read_only_fields = ['source_files', 'files_count']
    
    def get_files_count(self, obj):
        """Get the count of associated source files"""
        return obj.get_files_count()
    
    def to_representation(self, instance):
        """Override to ensure request context is passed to nested SourceFileSerializer"""
        representation = super().to_representation(instance)
        
        # Always re-serialize source_files with request context to ensure full URLs
        request = self.context.get('request')
        # Use the filtered files (is_active=True) like the model method
        source_files = instance.get_files() if hasattr(instance, 'get_files') else instance.source_files.filter(is_active=True)
        representation['source_files'] = SourceFileSerializer(
            source_files, many=True, context={'request': request}
        ).data
        
        return representation


class UnifiedKnowledgeBaseSerializer(serializers.Serializer):
    """Unified serializer that combines all four knowledge base components with grouped fields"""
    
    # Hospital information
    hospital_id = serializers.UUIDField(write_only=True)
    hospital_name = serializers.CharField(read_only=True)
    hospital_address = serializers.CharField(read_only=True)
    
    # Grouped fields using nested serializers
    identity = IdentityGroupSerializer(required=False, help_text="AI Identity configuration")
    behavior = BehaviorGroupSerializer(required=False, help_text="AI Behavior configuration")
    response = ResponseGroupSerializer(required=False, help_text="AI Response templates")
    source = SourceGroupSerializer(required=False, help_text="Knowledge base source files")
    
    # Common timestamps
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        """Create all four components for a hospital"""
        hospital_id = validated_data.pop('hospital_id')
        from tenants.models import Hospital
        hospital = Hospital.objects.get(id=hospital_id)
        
        # Extract grouped data (now from nested serializers)
        identity_data = validated_data.pop('identity', {})
        behavior_data = validated_data.pop('behavior', {})
        response_data = validated_data.pop('response', {})
        source_data = validated_data.pop('source', {})
        
        # Create AI Identity
        ai_identity_data = {
            'hospital': hospital,
            'agent_name': identity_data.get('agent_name', 'MedCor AI Assistant'),
            'agent_title': identity_data.get('agent_title', 'AI Medical Assistant'),
            'system_prompt': identity_data.get('system_prompt', 'You are a helpful AI medical assistant.'),
            'is_active': identity_data.get('is_active', True)
        }
        ai_identity = Ai_Identity.objects.create(**ai_identity_data)
        
        # Create Behavior
        behavior_create_data = {
            'hospital': hospital,
            'communication_tone': behavior_data.get('communication_tone', 'Professional'),
            'communication_style': behavior_data.get('communication_style', 'Conversational'),
            'confidence_level': behavior_data.get('confidence_level', 'Balanced'),
            'response_length': behavior_data.get('response_length', 'Medium'),
            'enable_follow_up_questions': behavior_data.get('enable_follow_up_questions', True),
            'enable_appointment_booking': behavior_data.get('enable_appointment_booking', True),
            'enable_personalization': behavior_data.get('enable_personalization', True),
            'is_active': behavior_data.get('is_active', True)
        }
        behavior = Behavior.objects.create(**behavior_create_data)
        
        # Create Response
        response_create_data = {
            'hospital': hospital,
            'greeting_message': response_data.get('greeting_message', 'Hello! I\'m your AI medical assistant. How can I help you today?'),
            'appointment_booking': response_data.get('appointment_booking', 'I can help you book an appointment. Please let me know your preferred date and time.'),
            'general_inquiries': response_data.get('general_inquiries', 'I\'m here to help with your medical inquiries. What would you like to know?'),
            'fallback_response': response_data.get('fallback_response', 'I\'m not sure how to help with that. Please contact our medical staff for assistance.'),
            'emergency_response': response_data.get('emergency_response', 'This appears to be a medical emergency. Please call emergency services immediately or go to the nearest emergency room.'),
            'business_hours': response_data.get('business_hours', 'Our business hours are Monday-Friday 9AM-5PM. Please contact us during these hours.'),
            'medical_specialties': response_data.get('medical_specialties', 'We offer various medical specialties. Please let me know what specific area you\'re interested in.'),
            'is_active': response_data.get('is_active', True)
        }
        response = Response.objects.create(**response_create_data)
        
        # Create Source
        source_create_data = {
            'hospital': hospital,
            'is_active': source_data.get('is_active', True)
        }
        source = Source.objects.create(**source_create_data)
        
        return {
            'ai_identity': ai_identity,
            'behavior': behavior,
            'response': response,
            'source': source,
            'hospital': hospital
        }

    def update(self, instance, validated_data):
        """Update all four components for a hospital"""
        hospital = instance['hospital']
        
        # Extract grouped data
        identity_data = validated_data.pop('identity', {})
        behavior_data = validated_data.pop('behavior', {})
        response_data = validated_data.pop('response', {})
        source_data = validated_data.pop('source', {})
        
        # Update AI Identity
        if 'ai_identity' in instance and identity_data:
            ai_identity = instance['ai_identity']
            if 'agent_name' in identity_data:
                ai_identity.agent_name = identity_data['agent_name']
            if 'agent_title' in identity_data:
                ai_identity.agent_title = identity_data['agent_title']
            if 'system_prompt' in identity_data:
                ai_identity.system_prompt = identity_data['system_prompt']
            if 'is_active' in identity_data:
                ai_identity.is_active = identity_data['is_active']
            ai_identity.save()
        
        # Update Behavior
        if 'behavior' in instance and behavior_data:
            behavior = instance['behavior']
            if 'communication_tone' in behavior_data:
                behavior.communication_tone = behavior_data['communication_tone']
            if 'communication_style' in behavior_data:
                behavior.communication_style = behavior_data['communication_style']
            if 'confidence_level' in behavior_data:
                behavior.confidence_level = behavior_data['confidence_level']
            if 'response_length' in behavior_data:
                behavior.response_length = behavior_data['response_length']
            if 'enable_follow_up_questions' in behavior_data:
                behavior.enable_follow_up_questions = behavior_data['enable_follow_up_questions']
            if 'enable_appointment_booking' in behavior_data:
                behavior.enable_appointment_booking = behavior_data['enable_appointment_booking']
            if 'enable_personalization' in behavior_data:
                behavior.enable_personalization = behavior_data['enable_personalization']
            if 'is_active' in behavior_data:
                behavior.is_active = behavior_data['is_active']
            behavior.save()
        
        # Update Response
        if 'response' in instance and response_data:
            response = instance['response']
            if 'greeting_message' in response_data:
                response.greeting_message = response_data['greeting_message']
            if 'appointment_booking' in response_data:
                response.appointment_booking = response_data['appointment_booking']
            if 'general_inquiries' in response_data:
                response.general_inquiries = response_data['general_inquiries']
            if 'fallback_response' in response_data:
                response.fallback_response = response_data['fallback_response']
            if 'emergency_response' in response_data:
                response.emergency_response = response_data['emergency_response']
            if 'business_hours' in response_data:
                response.business_hours = response_data['business_hours']
            if 'medical_specialties' in response_data:
                response.medical_specialties = response_data['medical_specialties']
            if 'is_active' in response_data:
                response.is_active = response_data['is_active']
            response.save()
        
        # Update Source
        if 'source' in instance and instance['source'] and source_data:
            source = instance['source']
            if 'is_active' in source_data:
                source.is_active = source_data['is_active']
            source.save()
        elif source_data:
            # Create new source if source_data provided but no existing source
            source_create_data = {
                'hospital': hospital,
                'is_active': source_data.get('is_active', True)
            }
            source = Source.objects.create(**source_create_data)
            instance['source'] = source
        
        return instance

    def to_representation(self, instance):
        """Convert the combined data to a grouped representation"""
        if isinstance(instance, dict):
            # Handle combined instance
            ai_identity = instance.get('ai_identity')
            behavior = instance.get('behavior')
            response = instance.get('response')
            source = instance.get('source')
            hospital = instance.get('hospital')
        else:
            # Handle individual model instances
            ai_identity = getattr(instance, 'ai_identity', None)
            behavior = getattr(instance, 'behavior', None)
            response = getattr(instance, 'response', None)
            source = getattr(instance, 'source', None)
            hospital = instance
        
        result = {
            'hospital_id': str(hospital.id) if hospital else None,
            'hospital_name': hospital.name if hospital else None,
            'hospital_address': hospital.get_full_address() if hospital else None,
            'created_at': None,
            'updated_at': None
        }
        
        # Group AI Identity data
        identity_data = {}
        if ai_identity:
            identity_data = {
                'agent_name': ai_identity.agent_name,
                'agent_title': ai_identity.agent_title,
                'system_prompt': ai_identity.system_prompt
            }
            result['created_at'] = ai_identity.created_at
            result['updated_at'] = ai_identity.updated_at
        
        # Group Behavior data
        behavior_data = {}
        if behavior:
            behavior_data = {
                'communication_tone': behavior.communication_tone,
                'communication_style': behavior.communication_style,
                'confidence_level': behavior.confidence_level,
                'response_length': behavior.response_length,
                'enable_follow_up_questions': behavior.enable_follow_up_questions,
                'enable_appointment_booking': behavior.enable_appointment_booking,
                'enable_personalization': behavior.enable_personalization
            }
            if not result['created_at']:
                result['created_at'] = behavior.created_at
            if not result['updated_at'] or behavior.updated_at > result['updated_at']:
                result['updated_at'] = behavior.updated_at
        
        # Group Response data
        response_data = {}
        if response:
            response_data = {
                'greeting_message': response.greeting_message,
                'appointment_booking': response.appointment_booking,
                'general_inquiries': response.general_inquiries,
                'fallback_response': response.fallback_response,
                'emergency_response': response.emergency_response,
                'business_hours': response.business_hours,
                'medical_specialties': response.medical_specialties
            }
            if not result['created_at']:
                result['created_at'] = response.created_at
            if not result['updated_at'] or response.updated_at > result['updated_at']:
                result['updated_at'] = response.updated_at
        
        # Group Source data
        source_data = {}
        if source:
            source_files = source.source_files.all()
            # Pass request context to SourceFileSerializer for full URLs
            request = self.context.get('request')
            # Use SourceGroupSerializer with request context to ensure full URLs
            source_group_serializer = SourceGroupSerializer(source, context={'request': request})
            source_data = source_group_serializer.data
            if not result['created_at']:
                result['created_at'] = source.created_at
            if not result['updated_at'] or source.updated_at > result['updated_at']:
                result['updated_at'] = source.updated_at
        
        # Add grouped data to result using nested serializers
        if identity_data:
            result['identity'] = IdentityGroupSerializer(ai_identity).data if ai_identity else identity_data
        if behavior_data:
            result['behavior'] = BehaviorGroupSerializer(behavior).data if behavior else behavior_data
        if response_data:
            result['response'] = ResponseGroupSerializer(response).data if response else response_data
        if source_data:
            result['source'] = source_data
        
        return result


# Individual model serializers (for backward compatibility)
class Ai_IdentitySerializer(serializers.ModelSerializer):
    """Serializer for Ai_Identity model"""
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_address = serializers.CharField(source='hospital.address', read_only=True)

    class Meta:
        model = Ai_Identity
        fields = [
            'id', 'hospital_name', 'hospital_address',
            'agent_name', 'agent_title', 'system_prompt', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        """Create a new AI Identity"""
        # hospital_id should be passed from the view context
        hospital_id = self.context.get('hospital_id')
        if not hospital_id:
            raise serializers.ValidationError("hospital_id is required")
        from tenants.models import Hospital
        hospital = Hospital.objects.get(id=hospital_id)
        validated_data['hospital'] = hospital
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update an existing AI Identity"""
        # hospital_id should be passed from the view context
        hospital_id = self.context.get('hospital_id')
        if hospital_id:
            from tenants.models import Hospital
            hospital = Hospital.objects.get(id=hospital_id)
            validated_data['hospital'] = hospital
        return super().update(instance, validated_data)


class BehaviorSerializer(serializers.ModelSerializer):
    """Serializer for Behavior model"""
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_address = serializers.CharField(source='hospital.address', read_only=True)

    class Meta:
        model = Behavior
        fields = [
            'id', 'hospital_name', 'hospital_address',
            'communication_tone', 'communication_style', 'confidence_level',
            'response_length', 'enable_follow_up_questions', 'enable_appointment_booking',
            'enable_personalization', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        """Create a new Behavior"""
        # hospital_id should be passed from the view context
        hospital_id = self.context.get('hospital_id')
        if not hospital_id:
            raise serializers.ValidationError("hospital_id is required")
        from tenants.models import Hospital
        hospital = Hospital.objects.get(id=hospital_id)
        validated_data['hospital'] = hospital
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update an existing Behavior"""
        # hospital_id should be passed from the view context
        hospital_id = self.context.get('hospital_id')
        if hospital_id:
            from tenants.models import Hospital
            hospital = Hospital.objects.get(id=hospital_id)
            validated_data['hospital'] = hospital
        return super().update(instance, validated_data)


class ResponseSerializer(serializers.ModelSerializer):
    """Serializer for Response model"""
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_address = serializers.CharField(source='hospital.address', read_only=True)

    class Meta:
        model = Response
        fields = [
            'id', 'hospital_name', 'hospital_address',
            'greeting_message', 'appointment_booking', 'general_inquiries', 
            'fallback_response', 'emergency_response', 'business_hours', 
            'medical_specialties', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        """Create a new Response"""
        # hospital_id should be passed from the view context
        hospital_id = self.context.get('hospital_id')
        if not hospital_id:
            raise serializers.ValidationError("hospital_id is required")
        from tenants.models import Hospital
        hospital = Hospital.objects.get(id=hospital_id)
        validated_data['hospital'] = hospital
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update an existing Response"""
        # hospital_id should be passed from the view context
        hospital_id = self.context.get('hospital_id')
        if hospital_id:
            from tenants.models import Hospital
            hospital = Hospital.objects.get(id=hospital_id)
            validated_data['hospital'] = hospital
        return super().update(instance, validated_data)


class SourceSerializer(serializers.ModelSerializer):
    """Serializer for Source model"""
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_address = serializers.CharField(source='hospital.address', read_only=True)
    source_files = SourceFileSerializer(many=True, read_only=True)
    hospital_id = serializers.UUIDField(write_only=True, required=False, help_text="ID of the hospital this source belongs to.")

    class Meta:
        model = Source
        fields = [
            'id',
            'hospital_id',
            'hospital_name',
            'hospital_address',
            'source_files',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        """Create a new Source"""
        hospital_id = validated_data.pop('hospital_id', None) or self.context.get('hospital_id')
        if not hospital_id:
            raise serializers.ValidationError("hospital_id is required")
        from tenants.models import Hospital
        hospital = Hospital.objects.get(id=hospital_id)
        validated_data['hospital'] = hospital
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update an existing Source"""
        hospital_id = validated_data.pop('hospital_id', None) or self.context.get('hospital_id')
        if hospital_id:
            from tenants.models import Hospital
            hospital = Hospital.objects.get(id=hospital_id)
            validated_data['hospital'] = hospital
        return super().update(instance, validated_data)
    
    def to_representation(self, instance):
        """Override to ensure request context is passed to nested SourceFileSerializer"""
        representation = super().to_representation(instance)
        
        # Always re-serialize source_files with request context to ensure full URLs
        request = self.context.get('request')
        if 'source_files' in representation:
            source_files = instance.source_files.filter(is_active=True)
            representation['source_files'] = SourceFileSerializer(
                source_files, many=True, context={'request': request}
            ).data
        
        return representation