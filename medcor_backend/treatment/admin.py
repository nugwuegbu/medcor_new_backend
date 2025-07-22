from django.contrib import admin
from .models import Treatment


@admin.register(Treatment)
class TreatmentAdmin(admin.ModelAdmin):
    """Admin interface for Treatment model."""
    
    list_display = ['name', 'cost', 'tenant', 'is_active', 'created_at']
    list_filter = ['is_active', 'tenant', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('tenant', 'name', 'image', 'description')
        }),
        ('Pricing', {
            'fields': ('cost',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']