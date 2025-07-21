from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Client


@receiver(post_save, sender=User)
def on_user_created(sender, instance, created, **kwargs):
    """
    Signal to handle user creation and setup.
    Basic user setup for tenant-aware user management.
    """
    if created:
        # Log user creation
        print(f"User created: {instance.get_display_name()} ({instance.email})")
        
        # Additional user setup can be added here
        # For now, we keep it simple since django-tenant-users 
        # integration is causing import issues