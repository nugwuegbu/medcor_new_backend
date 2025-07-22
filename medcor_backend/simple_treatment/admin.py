from django.contrib import admin
from .models import Treatment

@admin.register(Treatment)
class TreatmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'cost', 'duration_minutes', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'cost', 'duration_minutes')
        }),
        ('Status', {
            'fields': ('is_active', 'created_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)