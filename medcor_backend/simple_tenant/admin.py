from django.contrib import admin
from django.utils.safestring import mark_safe
from .models import Tenant, Domain, TenantBrandingPreset


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    """Admin interface for medical tenants with branding customization."""
    
    list_display = ['name', 'schema_name', 'contact_email', 'is_active', 'branding_preview', 'created_at']
    list_filter = ['is_active', 'sidebar_style', 'created_at']
    search_fields = ['name', 'schema_name', 'contact_email']
    readonly_fields = ['created_at', 'updated_at', 'branding_preview_large']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'schema_name', 'is_active')
        }),
        ('Contact Details', {
            'fields': ('contact_email', 'contact_phone', 'address')
        }),
        ('Branding & Visual Identity', {
            'fields': (
                'logo_url', 'favicon_url', 'branding_preview_large',
                ('primary_color', 'secondary_color', 'accent_color'),
                ('background_color', 'text_color'),
                'font_family', 'sidebar_style'
            ),
            'description': 'Customize the visual appearance and branding for this tenant'
        }),
        ('Advanced Styling', {
            'fields': ('custom_css',),
            'classes': ('collapse',),
            'description': 'Advanced CSS customization for developers'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def branding_preview(self, obj):
        """Small color preview for list view"""
        return mark_safe(
            f'<div style="display: flex; gap: 4px;">'
            f'<div style="width: 20px; height: 20px; background-color: {obj.primary_color}; border-radius: 3px; border: 1px solid #ddd;" title="Primary: {obj.primary_color}"></div>'
            f'<div style="width: 20px; height: 20px; background-color: {obj.secondary_color}; border-radius: 3px; border: 1px solid #ddd;" title="Secondary: {obj.secondary_color}"></div>'
            f'<div style="width: 20px; height: 20px; background-color: {obj.accent_color}; border-radius: 3px; border: 1px solid #ddd;" title="Accent: {obj.accent_color}"></div>'
            f'</div>'
        )
    branding_preview.short_description = 'Colors'
    
    def branding_preview_large(self, obj):
        """Large branding preview for detail view"""
        logo_html = f'<img src="{obj.logo_url}" style="max-height: 60px; margin-bottom: 10px;" alt="Logo">' if obj.logo_url else ''
        
        return mark_safe(
            f'<div style="padding: 20px; background-color: {obj.background_color}; color: {obj.text_color}; font-family: {obj.font_family}; border-radius: 8px; border: 1px solid #ddd; max-width: 400px;">'
            f'{logo_html}'
            f'<h3 style="color: {obj.primary_color}; margin: 0 0 10px 0; font-family: {obj.font_family};">{obj.name}</h3>'
            f'<p style="margin: 0 0 15px 0; color: {obj.text_color};">Sample medical content with branded styling</p>'
            f'<div style="display: flex; gap: 8px; margin-bottom: 15px;">'
            f'<button style="background-color: {obj.primary_color}; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-family: {obj.font_family};">Primary Action</button>'
            f'<button style="background-color: {obj.secondary_color}; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-family: {obj.font_family};">Secondary</button>'
            f'<button style="background-color: {obj.accent_color}; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-family: {obj.font_family};">Accent</button>'
            f'</div>'
            f'<div style="font-size: 12px; color: {obj.secondary_color};">'
            f'Primary: {obj.primary_color} | Secondary: {obj.secondary_color} | Accent: {obj.accent_color}<br>'
            f'Font: {obj.font_family} | Sidebar: {obj.get_sidebar_style_display()}'
            f'</div>'
            f'</div>'
        )
    branding_preview_large.short_description = 'Branding Preview'
    
    class Media:
        css = {
            'all': ('admin/css/tenant-branding.css',)
        }
        js = ('admin/js/tenant-branding.js',)


@admin.register(TenantBrandingPreset)
class TenantBrandingPresetAdmin(admin.ModelAdmin):
    """Admin interface for tenant branding presets."""
    
    list_display = ['name', 'description', 'color_preview', 'is_active', 'created_at']
    list_filter = ['is_active', 'sidebar_style', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'preset_preview']
    
    fieldsets = (
        ('Preset Information', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Color Scheme', {
            'fields': (
                ('primary_color', 'secondary_color', 'accent_color'),
                ('background_color', 'text_color'),
                'preset_preview'
            )
        }),
        ('Typography & Layout', {
            'fields': ('font_family', 'sidebar_style')
        }),
        ('Custom Styling', {
            'fields': ('preset_css',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def color_preview(self, obj):
        """Color preview for list view"""
        return mark_safe(
            f'<div style="display: flex; gap: 3px;">'
            f'<div style="width: 16px; height: 16px; background-color: {obj.primary_color}; border-radius: 2px; border: 1px solid #ddd;"></div>'
            f'<div style="width: 16px; height: 16px; background-color: {obj.secondary_color}; border-radius: 2px; border: 1px solid #ddd;"></div>'
            f'<div style="width: 16px; height: 16px; background-color: {obj.accent_color}; border-radius: 2px; border: 1px solid #ddd;"></div>'
            f'</div>'
        )
    color_preview.short_description = 'Colors'
    
    def preset_preview(self, obj):
        """Preview of the preset styling"""
        return mark_safe(
            f'<div style="padding: 15px; background-color: {obj.background_color}; color: {obj.text_color}; font-family: {obj.font_family}; border-radius: 6px; border: 1px solid #ddd; max-width: 350px;">'
            f'<h4 style="color: {obj.primary_color}; margin: 0 0 8px 0; font-family: {obj.font_family};">Sample Medical Clinic</h4>'
            f'<p style="margin: 0 0 12px 0; color: {obj.text_color}; font-size: 14px;">This is how your medical platform will look with the "{obj.name}" preset.</p>'
            f'<div style="display: flex; gap: 6px;">'
            f'<span style="background-color: {obj.primary_color}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px;">Primary</span>'
            f'<span style="background-color: {obj.secondary_color}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px;">Secondary</span>'
            f'<span style="background-color: {obj.accent_color}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px;">Accent</span>'
            f'</div>'
            f'</div>'
        )
    preset_preview.short_description = 'Preview'
    
    actions = ['apply_to_selected_tenants']
    
    def apply_to_selected_tenants(self, request, queryset):
        """Apply selected presets to tenants (custom action)"""
        # This would typically show a form to select tenants
        self.message_user(request, f"Selected {queryset.count()} presets. Use individual preset admin to apply to specific tenants.")
    apply_to_selected_tenants.short_description = "Apply presets to tenants"


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