from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django_tenants.utils import schema_context
from tenant_users.permissions.models import UserTenantPermissions
from tenant_users.tenants.models import UserTenantRelationship
from .models import User, Client


@receiver(post_save, sender=UserTenantRelationship)
def on_user_tenant_relationship_created(sender, instance, created, **kwargs):
    """
    Automatically create UserTenantPermissions when a user is added to a tenant.
    This signal is triggered when UserTenantRelationship is created.
    """
    if created:
        # Get the tenant from the relationship
        tenant = instance.tenant
        user = instance.user
        
        # Switch to the tenant's schema and create permissions
        with schema_context(tenant.schema_name):
            UserTenantPermissions.objects.get_or_create(profile=user)


@receiver(post_delete, sender=UserTenantRelationship)
def on_user_tenant_relationship_deleted(sender, instance, **kwargs):
    """
    Automatically delete UserTenantPermissions when a user is removed from a tenant.
    This signal is triggered when UserTenantRelationship is deleted.
    """
    # Get the tenant from the relationship
    tenant = instance.tenant
    user = instance.user
    
    # Switch to the tenant's schema and delete permissions
    with schema_context(tenant.schema_name):
        UserTenantPermissions.objects.filter(profile=user).delete()