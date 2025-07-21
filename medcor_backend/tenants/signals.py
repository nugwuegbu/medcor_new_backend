from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django_tenants.utils import schema_context
try:
    from tenant_users.permissions.models import UserTenantPermissions
except ImportError:
    # Fallback if tenant_users.permissions is not available
    UserTenantPermissions = None

try:
    from tenant_users.tenants.models import UserTenantRelationship
except ImportError:
    # Create a simple signal for user creation instead
    UserTenantRelationship = None

from .models import User, Client


@receiver(post_save, sender=User)
def on_user_created(sender, instance, created, **kwargs):
    """
    Signal to handle user creation and tenant setup.
    Since we're using UserProfile inheritance, we'll handle permissions here.
    """
    if created and UserTenantPermissions:
        # Basic user setup - permissions will be handled by tenant management
        pass


# Only register UserTenantRelationship signals if the model is available
if UserTenantRelationship:
    @receiver(post_save, sender=UserTenantRelationship)
    def on_user_tenant_relationship_created(sender, instance, created, **kwargs):
        """
        Automatically create UserTenantPermissions when a user is added to a tenant.
        This signal is triggered when UserTenantRelationship is created.
        """
        if created and UserTenantPermissions:
            # Get the tenant from the relationship
            tenant = instance.tenant
            user = instance.user
            
            # Switch to the tenant's schema and create permissions
            with schema_context(tenant.schema_name):
                try:
                    UserTenantPermissions.objects.get_or_create(profile=user)
                except Exception as e:
                    print(f"Error creating UserTenantPermissions: {e}")


    @receiver(post_delete, sender=UserTenantRelationship)
    def on_user_tenant_relationship_deleted(sender, instance, **kwargs):
        """
        Automatically delete UserTenantPermissions when a user is removed from a tenant.
        This signal is triggered when UserTenantRelationship is deleted.
        """
        if UserTenantPermissions:
            # Get the tenant from the relationship
            tenant = instance.tenant
            user = instance.user
            
            # Switch to the tenant's schema and delete permissions
            with schema_context(tenant.schema_name):
                try:
                    UserTenantPermissions.objects.filter(profile=user).delete()
                except Exception as e:
                    print(f"Error deleting UserTenantPermissions: {e}")