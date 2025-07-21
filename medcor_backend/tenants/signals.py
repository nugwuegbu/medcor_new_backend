from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from django_tenants.utils import schema_context
from .models import User

# Try to import UserTenantPermissions
UserTenantPermissions = None
try:
    from tenant_users.permissions.models import UserTenantPermissions
except ImportError:
    pass


# Get the through model for the User.tenants relationship
def get_user_tenants_through_model():
    """Get the through model for User.tenants many-to-many relationship."""
    # Use getattr to avoid LSP "through" unknown member error
    tenants_field = getattr(User, 'tenants')
    return getattr(tenants_field, 'through')


@receiver(m2m_changed, sender=get_user_tenants_through_model())
def on_tenant_users_tenants_changed(
        sender, instance, action, reverse, model, pk_set, **kwargs
):
    """
    Automatically manage UserTenantPermissions when user is added to or removed from a tenant.
    """
    if not UserTenantPermissions:
        return  # Skip if UserTenantPermissions is not available
    
    # Automatically create 'UserTenantPermissions' when user is added to a tenant
    if action == "post_add":
        for tenant_id in pk_set:
            tenant = model.objects.get(pk=tenant_id)
            with schema_context(tenant.schema_name):
                try:
                    # Use getattr to access objects manager safely
                    permissions_manager = getattr(UserTenantPermissions, 'objects', None)
                    if permissions_manager:
                        permissions_manager.get_or_create(profile=instance)
                except Exception as e:
                    print(f"Error creating UserTenantPermissions: {e}")

    # Automatically delete 'UserTenantPermissions' when user is removed from a tenant
    if action == "post_remove":
        for tenant_id in pk_set:
            tenant = model.objects.get(pk=tenant_id)
            with schema_context(tenant.schema_name):
                try:
                    # Use getattr to access objects manager safely
                    permissions_manager = getattr(UserTenantPermissions, 'objects', None)
                    if permissions_manager:
                        permissions_manager.filter(profile=instance).delete()
                except Exception as e:
                    print(f"Error deleting UserTenantPermissions: {e}")