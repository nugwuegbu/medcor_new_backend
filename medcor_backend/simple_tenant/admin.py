from django.contrib import admin
from .models import Tenant, Domain


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    """Admin interface for medical tenants."""
    
    list_display = ['name', 'schema_name', 'contact_email', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'schema_name', 'contact_email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'schema_name', 'is_active')
        }),
        ('Contact Details', {
            'fields': ('contact_email', 'contact_phone', 'address')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    """Admin interface for tenant domains."""
    
    list_display = ['domain', 'tenant', 'is_primary', 'created_at']
    list_filter = ['is_primary', 'created_at']
    search_fields = ['domain', 'tenant__name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Domain Configuration', {
            'fields': ('domain', 'tenant', 'is_primary')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )