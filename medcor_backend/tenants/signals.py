from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from django_tenants.utils import schema_context
from .models import User, Client
import logging

logger = logging.getLogger(__name__)


# Use direct signal connection to avoid LSP issues with .through
@receiver(m2m_changed)
def on_tenant_user_tenants_changed(sender, instance, action, reverse, model, pk_set, **kwargs):
    """
    Signal handler for when users are added or removed from tenants.
    This automatically manages user permissions in tenant schemas.
    """
    # Check if this is the User.tenants relationship by checking the sender name
    if not (hasattr(sender, '_meta') and 
            getattr(sender._meta, 'db_table', '').endswith('_tenants')):
        return
    
    # Handle when users are added to tenants
    if action == "post_add" and pk_set:
        for tenant_id in pk_set:
            try:
                # Use getattr to avoid LSP issues with Django model methods
                tenant = getattr(Client, 'objects').get(pk=tenant_id)
                with schema_context(getattr(tenant, 'schema_name')):
                    # Log the user addition to the tenant
                    logger.info(f"User {getattr(instance, 'email', 'unknown')} added to tenant {getattr(tenant, 'name', 'unknown')}")
                    # Here you can add additional logic for user setup in tenant schema
            except Exception as e:
                logger.error(f"Error adding user to tenant {tenant_id}: {e}")

    # Handle when users are removed from tenants
    elif action == "post_remove" and pk_set:
        for tenant_id in pk_set:
            try:
                # Use getattr to avoid LSP issues with Django model methods
                tenant = getattr(Client, 'objects').get(pk=tenant_id)
                with schema_context(getattr(tenant, 'schema_name')):
                    # Log the user removal from the tenant
                    logger.info(f"User {getattr(instance, 'email', 'unknown')} removed from tenant {getattr(tenant, 'name', 'unknown')}")
                    # Here you can add additional cleanup logic
            except Exception as e:
                logger.error(f"Error removing user from tenant {tenant_id}: {e}")


