from rest_framework import serializers
from .models import Client, Domain


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