from django.db import models
from django_tenants.models import TenantMixin, DomainMixin


class Client(TenantMixin):
    """
    Tenant model for multi-tenancy support.
    Each tenant represents a hospital/clinic using the system.
    """
    name = models.CharField(max_length=100)
    created_on = models.DateField(auto_now_add=True)
    
    # Default true, schema will be automatically created and synced when it is saved
    auto_create_schema = True

    def __str__(self):
        return self.name


class Domain(DomainMixin):
    """
    Domain model for tenant routing.
    Each domain points to a specific tenant.
    """
    pass