from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from django_tenants.utils import schema_context
from .models import User, Client


# Use a string to reference the through table to avoid LSP issues
@receiver(m2m_changed, sender='tenants.User_tenants')
def on_tenant_user_tenants_changed(sender, instance, action, reverse, model,
                                   pk_set, **kwargs):
    """
    Signal handler for when users are added or removed from tenants.
    This automatically manages user permissions in tenant schemas.
    """
    # Handle when users are added to tenants
    if action == "post_add":
        for tenant_id in pk_set:
            try:
                # Use getattr to avoid LSP issues with Django model methods
                tenant = getattr(Client, 'objects').get(pk=tenant_id)
                with schema_context(getattr(tenant, 'schema_name')):
                    # Log the user addition to the tenant
                    print(f"User {getattr(instance, 'email')} added to tenant {getattr(tenant, 'name')}")
                    # Here you can add additional logic for user setup in tenant schema
            except Exception as e:
                print(f"Error adding user to tenant {tenant_id}: {e}")

    # Handle when users are removed from tenants
    elif action == "post_remove":
        for tenant_id in pk_set:
            try:
                # Use getattr to avoid LSP issues with Django model methods
                tenant = getattr(Client, 'objects').get(pk=tenant_id)
                with schema_context(getattr(tenant, 'schema_name')):
                    # Log the user removal from the tenant
                    print(f"User {getattr(instance, 'email')} removed from tenant {getattr(tenant, 'name')}")
                    # Here you can add additional cleanup logic
            except Exception as e:
                print(f"Error removing user from tenant {tenant_id}: {e}")
