"""
Serializers for ChatWidget models.
"""

from urllib.parse import unquote, urlsplit

from rest_framework import serializers
from .models import (
    ChatWidgetCustomization,
    Theme,
    Features,
    Avatar,
    Voice,
    VoiceSettings,
    AvartaVideos,
    AvartaCollect
)


class VoiceSettingsSerializer(serializers.ModelSerializer):
    """Serializer for VoiceSettings model."""
    
    class Meta:
        model = VoiceSettings
        fields = [
            'stability',
            'similarity_boost',
            'style',
            'speed',
            'speaker_boost',
        ]


class AvartaVideosSerializer(serializers.ModelSerializer):
    """Serializer for AvartaVideos model."""
    
    class Meta:
        model = AvartaVideos
        fields = [
            'welcome_video',
            'speaking_video',
            'waiting_video',
        ]

class ThemeSerializer(serializers.ModelSerializer):
    """Serializer for Theme model."""
    
    class Meta:
        model = Theme
        fields = [
            'company_logo',
            'primary_color',
            'secondary_color',
            'accent_color',
            'background_color',
            'text_color',
            'user_message_background',
            'assistant_message_background',
            'message_overlay_color',
            'input_background',
            'glow_border_color',
        ]


class FeaturesSerializer(serializers.ModelSerializer):
    """Serializer for Features model."""
    
    class Meta:
        model = Features
        fields = [
            'face_analysis',
            'hair_analysis',
            'skin_analysis',
            'lips_analysis',
            'hair_extension_analysis',
            'dental_analysis',
            'doctors_profiles',
        ]


class AvatarSerializer(serializers.ModelSerializer):
    """Serializer for Avatar model."""
    avarta_videos = serializers.SerializerMethodField()
    
    class Meta:
        model = Avatar
        fields = [
            'avarta_interaction_type',
            'avarta_videos',
        ]
    
    def get_avarta_videos(self, obj):
        """Return avarta_videos if it exists, otherwise return None."""
        try:
            # Use getattr to avoid triggering a query if the relationship doesn't exist
            avarta_videos = getattr(obj, 'avarta_videos', None)
            if avarta_videos is not None:
                return AvartaVideosSerializer(avarta_videos).data
        except Exception:
            # Handle case where table doesn't exist or relationship is broken
            pass
        return None

    def create(self, validated_data):
        avarta_videos_data = validated_data.pop('avarta_videos', None)
        avatar = Avatar.objects.create(**validated_data)
        if avarta_videos_data:
            AvartaVideos.objects.create(avatar=avatar, **avarta_videos_data)
        return avatar

    def update(self, instance, validated_data):
        avarta_videos_data = validated_data.pop('avarta_videos', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if avarta_videos_data:
            AvartaVideos.objects.update_or_create(avatar=instance, defaults=avarta_videos_data)
        return instance

class VoiceSerializer(serializers.ModelSerializer):
    """Serializer for Voice model."""
    voice_settings = VoiceSettingsSerializer(required=False, allow_null=True)
    
    class Meta:
        model = Voice
        fields = [
            'voice_id',
            'voice_settings',
        ]
    
    def create(self, validated_data):
        voice_settings_data = validated_data.pop('voice_settings', None)
        voice = Voice.objects.create(**validated_data)
        if voice_settings_data:
            VoiceSettings.objects.create(voice=voice, **voice_settings_data)
        return voice
    
    def update(self, instance, validated_data):
        voice_settings_data = validated_data.pop('voice_settings', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if voice_settings_data:
            VoiceSettings.objects.update_or_create(voice=instance, defaults=voice_settings_data)
        return instance



    
class ChatWidgetCustomizationSerializer(serializers.ModelSerializer):
    """Main serializer for ChatWidgetCustomization with nested serializers."""
    
    theme = ThemeSerializer(required=False, allow_null=True)
    features = FeaturesSerializer(required=False, allow_null=True)
    avatar = AvatarSerializer(required=False, allow_null=True)
    voice = VoiceSerializer(required=False, allow_null=True)
    
    
    class Meta:
        model = ChatWidgetCustomization
        fields = [
            'id',
            'hospital',
            'theme',
            'features',
            'avatar',
            'voice',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Create ChatWidgetCustomization with nested objects."""
        # Extract nested data
        theme_data = validated_data.pop('theme', None)
        features_data = validated_data.pop('features', None)
        avatar_data = validated_data.pop('avatar', None)
        voice_data = validated_data.pop('voice', None)
        
        # Create main customization object
        customization = ChatWidgetCustomization.objects.create(**validated_data)
        
        # Create nested objects if data provided
        if theme_data:
            Theme.objects.create(chatwidget_customization=customization, **theme_data)
        
        if features_data:
            Features.objects.create(chatwidget_customization=customization, **features_data)
        
        if avatar_data:
            Avatar.objects.create(chatwidget_customization=customization, **avatar_data)
        
        if voice_data:
            # Extract voice_settings from voice_data
            voice_settings_data = voice_data.pop('voice_settings', None)
            voice = Voice.objects.create(chatwidget_customization=customization, **voice_data)
            # Create voice_settings if provided
            if voice_settings_data:
                VoiceSettings.objects.create(voice=voice, **voice_settings_data)
        
        
        return customization
    
    def update(self, instance, validated_data):
        """Update ChatWidgetCustomization with nested objects."""
        # Extract nested data
        theme_data = validated_data.pop('theme', None)
        features_data = validated_data.pop('features', None)
        avatar_data = validated_data.pop('avatar', None)
        voice_data = validated_data.pop('voice', None)
        
        # Update main customization object
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update or create nested objects
        if theme_data is not None:
            theme, created = Theme.objects.get_or_create(
                chatwidget_customization=instance,
                defaults=theme_data
            )
            if not created:
                for attr, value in theme_data.items():
                    setattr(theme, attr, value)
                theme.save()
        
        if features_data is not None:
            features, created = Features.objects.get_or_create(
                chatwidget_customization=instance,
                defaults=features_data
            )
            if not created:
                for attr, value in features_data.items():
                    setattr(features, attr, value)
                features.save()
        
        if avatar_data is not None:
            avatar, created = Avatar.objects.get_or_create(
                chatwidget_customization=instance,
                defaults=avatar_data
            )
            if not created:
                for attr, value in avatar_data.items():
                    setattr(avatar, attr, value)
                avatar.save()
        
        if voice_data is not None:
            # Extract voice_settings from voice_data
            voice_settings_data = voice_data.pop('voice_settings', None)
            voice, created = Voice.objects.get_or_create(
                chatwidget_customization=instance,
                defaults=voice_data
            )
            if not created:
                for attr, value in voice_data.items():
                    setattr(voice, attr, value)
                voice.save()
            # Update or create voice_settings if provided
            if voice_settings_data is not None:
                VoiceSettings.objects.update_or_create(
                    voice=voice,
                    defaults=voice_settings_data
                )
        
        return instance


class ChatWidgetCreateSerializer(serializers.Serializer):
    """Serializer for creating chatwidget customization with nested structure."""
    
    theme = ThemeSerializer(required=False, allow_null=True)
    features = FeaturesSerializer(required=False, allow_null=True)
    avatar = AvatarSerializer(required=False, allow_null=True)
    voice = VoiceSerializer(required=False, allow_null=True)
    
    def create(self, validated_data):
        """Create ChatWidgetCustomization with nested objects."""
        hospital_id = self.context.get('hospital_id')
        
        if not hospital_id:
            raise serializers.ValidationError("Hospital ID is required")
        
        # Check if customization already exists
        try:
            from tenants.models import Hospital
            hospital = Hospital.objects.get(id=hospital_id)
            
            if hasattr(hospital, 'chatwidget_customization'):
                raise serializers.ValidationError(
                    "ChatWidget customization already exists for this hospital. You can only update it."
                )
        except Hospital.DoesNotExist:
            raise serializers.ValidationError("Hospital not found")
        
        # Extract nested data
        theme_data = validated_data.pop('theme', None)
        features_data = validated_data.pop('features', None)
        avatar_data = validated_data.pop('avatar', None)
        voice_data = validated_data.pop('voice', None)
        
        # Create main customization object
        customization = ChatWidgetCustomization.objects.create(hospital=hospital)
        
        # Create nested objects if data provided
        if theme_data:
            Theme.objects.create(chatwidget_customization=customization, **theme_data)
        
        if features_data:
            Features.objects.create(chatwidget_customization=customization, **features_data)
        
        if avatar_data:
            Avatar.objects.create(chatwidget_customization=customization, **avatar_data)
        
        if voice_data:
            # Extract voice_settings from voice_data
            voice_settings_data = voice_data.pop('voice_settings', None)
            voice = Voice.objects.create(chatwidget_customization=customization, **voice_data)
            # Create voice_settings if provided
            if voice_settings_data:
                VoiceSettings.objects.create(voice=voice, **voice_settings_data)
        
        
        return customization


class ChatWidgetUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating ChatWidgetCustomization without hospital field (hospital comes from URL)."""
    
    theme = ThemeSerializer(required=False, allow_null=True)
    features = FeaturesSerializer(required=False, allow_null=True)
    avatar = AvatarSerializer(required=False, allow_null=True)
    voice = VoiceSerializer(required=False, allow_null=True)
    
    class Meta:
        model = ChatWidgetCustomization
        fields = [
            'id',
            'theme',
            'features',
            'avatar',
            'voice',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def update(self, instance, validated_data):
        """Update ChatWidgetCustomization with nested objects."""
        # Extract nested data
        theme_data = validated_data.pop('theme', None)
        features_data = validated_data.pop('features', None)
        avatar_data = validated_data.pop('avatar', None)
        voice_data = validated_data.pop('voice', None)
        
        # Update main customization object
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update or create nested objects
        if theme_data is not None:
            theme, created = Theme.objects.get_or_create(
                chatwidget_customization=instance,
                defaults=theme_data
            )
            if not created:
                for attr, value in theme_data.items():
                    setattr(theme, attr, value)
                theme.save()
        
        if features_data is not None:
            features, created = Features.objects.get_or_create(
                chatwidget_customization=instance,
                defaults=features_data
            )
            if not created:
                for attr, value in features_data.items():
                    setattr(features, attr, value)
                features.save()
        
        if avatar_data is not None:
            avatar, created = Avatar.objects.get_or_create(
                chatwidget_customization=instance,
                defaults=avatar_data
            )
            if not created:
                for attr, value in avatar_data.items():
                    setattr(avatar, attr, value)
                avatar.save()
        
        if voice_data is not None:
            # Extract voice_settings from voice_data
            voice_settings_data = voice_data.pop('voice_settings', None)
            voice, created = Voice.objects.get_or_create(
                chatwidget_customization=instance,
                defaults=voice_data
            )
            if not created:
                for attr, value in voice_data.items():
                    setattr(voice, attr, value)
                voice.save()
            # Update or create voice_settings if provided
            if voice_settings_data is not None:
                VoiceSettings.objects.update_or_create(
                    voice=voice,
                    defaults=voice_settings_data
                )
        
        return instance


class AvartaCollectSerializer(serializers.ModelSerializer):
    """Serializer for AvartaCollect model."""
    
    # Nested duration object for API response
    duration = serializers.SerializerMethodField()
    # Nested fileSize object for API response
    file_size = serializers.SerializerMethodField()
    # Upload date as timestamp
    upload_date = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = AvartaCollect
        fields = [
            'id',
            'name',
            'hospital',
            'talking_video_url',
            'waiting_video_url',
            'opening_video_url',
            'duration',
            'file_size',
            'upload_date',
            'usage_count',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'upload_date']
    
    def get_duration(self, obj):
        """Return duration as nested object matching JSON structure."""
        return {
            'talking': obj.duration_talking,
            'waiting': obj.duration_waiting,
            'opening': obj.duration_opening,
        }
    
    def get_file_size(self, obj):
        """Return file size as nested object matching JSON structure."""
        return {
            'talking': obj.file_size_talking,
            'waiting': obj.file_size_waiting,
            'opening': obj.file_size_opening,
        }
    
    def to_internal_value(self, data):
        """Convert nested duration and fileSize objects to flat fields."""
        # Handle duration object
        if 'duration' in data and isinstance(data['duration'], dict):
            duration_data = data.pop('duration')
            data['duration_talking'] = duration_data.get('talking')
            data['duration_waiting'] = duration_data.get('waiting')
            data['duration_opening'] = duration_data.get('opening')
        
        # Handle fileSize object (convert camelCase to snake_case)
        if 'fileSize' in data and isinstance(data['fileSize'], dict):
            file_size_data = data.pop('fileSize')
            data['file_size_talking'] = file_size_data.get('talking')
            data['file_size_waiting'] = file_size_data.get('waiting')
            data['file_size_opening'] = file_size_data.get('opening')
        elif 'file_size' in data and isinstance(data['file_size'], dict):
            file_size_data = data.pop('file_size')
            data['file_size_talking'] = file_size_data.get('talking')
            data['file_size_waiting'] = file_size_data.get('waiting')
            data['file_size_opening'] = file_size_data.get('opening')
        
        # Handle uploadDate
        if 'uploadDate' in data:
            data['created_at'] = data.pop('uploadDate')
        
        return super().to_internal_value(data)

    def to_representation(self, instance):
        """Return absolute URLs for file/image fields if request is available."""
        representation = super().to_representation(instance)
        request = self.context.get('request')

        def build_abs_url(field_attr, current_value):
            # Get underlying field value; could be FileField/ImageField or string
            field = getattr(instance, field_attr, None)
            url = None
            if field is not None and hasattr(field, "name") and field.name:
                try:
                    url = field.url
                except (ValueError, AttributeError):
                    url = None
            if not url:
                url = current_value or ""
            if not url:
                return url

            raw_url = unquote(str(url))
            if raw_url.startswith(("http://", "https://")):
                return raw_url

            split_result = urlsplit(raw_url)
            path = split_result.path
            query = split_result.query

            if not path:
                return raw_url

            if not path.startswith("/"):
                path = f"/{path}"

            while "/media/media/" in path:
                path = path.replace("/media/media/", "/media/")

            def append_query(base):
                if query:
                    separator = "&" if "?" in base else "?"
                    return f"{base}{separator}{query}"
                return base

            if request:
                return append_query(request.build_absolute_uri(path))

            try:
                from django.conf import settings
                try:
                    from django.contrib.sites.models import Site

                    site = Site.objects.get_current()
                    scheme = getattr(settings, "DEFAULT_HTTP_PROTOCOL", "https")
                    base_url = f"{scheme}://{site.domain}"
                    return append_query(f"{base_url}{path}")
                except Exception:
                    allowed_hosts = getattr(settings, "ALLOWED_HOSTS", []) or []
                    if allowed_hosts and allowed_hosts[0] and allowed_hosts[0] != "*":
                        scheme = getattr(settings, "DEFAULT_HTTP_PROTOCOL", "https")
                        domain = allowed_hosts[0]
                        return append_query(f"{scheme}://{domain}{path}")
                    api_base_url = getattr(settings, "API_BASE_URL", None)
                    if api_base_url:
                        base = f"{api_base_url.rstrip('/')}{path}"
                        return append_query(base)
            except Exception:
                pass

            return append_query(path)

        # Normalize the four media fields into absolute URLs
        for field_name, attr in [
            ('talking_video_url', 'talking_video_url'),
            ('waiting_video_url', 'waiting_video_url'),
            ('opening_video_url', 'opening_video_url'),
        ]:
            representation[field_name] = build_abs_url(attr, representation.get(field_name))

        return representation
