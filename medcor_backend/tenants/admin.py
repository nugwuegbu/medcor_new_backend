from django.contrib import admin
from django_tenants.admin import TenantAdminMixin

from .models import Client, Domain


class ClientAdmin(TenantAdminMixin, admin.ModelAdmin):
    """
    Admin interface for Client (Tenant) model.
    """
    list_display = ('name', 'schema_name', 'created_on')
    list_filter = ('created_on',)
    search_fields = ('name', 'schema_name')
    ordering = ('-created_on',)
    
    fieldsets = (
        (None, {
            'fields': ('name', 'schema_name')
        }),
        ('Advanced options', {
            'classes': ('collapse',),
            'fields': ('auto_create_schema', 'auto_drop_schema'),
        }),
    )


class DomainAdmin(admin.ModelAdmin):
    """
    Admin interface for Domain model.
    """
    list_display = ('domain', 'tenant', 'is_primary')
    list_filter = ('is_primary',)
    search_fields = ('domain', 'tenant__name')
    ordering = ('domain',)
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related('tenant')


# Register models with admin
admin.site.register(Client, ClientAdmin)
admin.site.register(Domain, DomainAdmin)


# Customize admin site headers
admin.site.site_header = "Medcor.ai Healthcare Management"
admin.site.site_title = "Medcor.ai Admin"
admin.site.index_title = "Healthcare Platform Administration"