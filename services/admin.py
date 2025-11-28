"""
Services admin interface
"""
from django.contrib import admin
from .models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    """Admin interface for Service model"""
    
    list_display = ('service_name', 'hospital', 'price', 'created_at', 'updated_at')
    list_filter = ('hospital', 'created_at', 'updated_at')
    search_fields = ('service_name', 'hospital__name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Service Information', {
            'fields': ('id', 'hospital', 'service_name', 'price')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )