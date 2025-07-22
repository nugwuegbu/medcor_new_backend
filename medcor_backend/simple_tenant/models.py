from django.db import models
from core.models import TimeStampedModel


class Tenant(TimeStampedModel):
    """
    Simple tenant model for hospital/clinic management.
    Each tenant represents a separate medical organization.
    """
    name = models.CharField(max_length=100, help_text="Hospital or clinic name")
    schema_name = models.CharField(max_length=63, unique=True, help_text="Database schema identifier")
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    # Branding fields
    logo_url = models.URLField(blank=True, null=True, help_text="URL to tenant's logo image")
    primary_color = models.CharField(max_length=7, default="#2563eb", help_text="Primary brand color (hex format)")
    secondary_color = models.CharField(max_length=7, default="#64748b", help_text="Secondary brand color (hex format)")
    accent_color = models.CharField(max_length=7, default="#06b6d4", help_text="Accent color for highlights")
    background_color = models.CharField(max_length=7, default="#ffffff", help_text="Background color")
    text_color = models.CharField(max_length=7, default="#1e293b", help_text="Primary text color")
    
    # Custom styling
    custom_css = models.TextField(blank=True, null=True, help_text="Custom CSS for advanced styling")
    favicon_url = models.URLField(blank=True, null=True, help_text="URL to custom favicon")
    
    # Typography
    font_family = models.CharField(
        max_length=100, 
        default="Inter, system-ui, sans-serif",
        help_text="Custom font family"
    )
    
    # Layout preferences
    sidebar_style = models.CharField(
        max_length=20,
        choices=[
            ('light', 'Light Sidebar'),
            ('dark', 'Dark Sidebar'),
            ('branded', 'Branded Sidebar'),
        ],
        default='light'
    )
    
    class Meta:
        verbose_name = "Medical Tenant"
        verbose_name_plural = "Medical Tenants"
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def get_branding_css(self):
        """Generate CSS variables for tenant branding"""
        return f"""
        :root {{
            --tenant-primary-color: {self.primary_color};
            --tenant-secondary-color: {self.secondary_color};
            --tenant-accent-color: {self.accent_color};
            --tenant-background-color: {self.background_color};
            --tenant-text-color: {self.text_color};
            --tenant-font-family: {self.font_family};
        }}
        
        .tenant-branded {{
            --primary: {self.primary_color};
            --secondary: {self.secondary_color};
            --accent: {self.accent_color};
            background-color: {self.background_color};
            color: {self.text_color};
            font-family: {self.font_family};
        }}
        
        .tenant-sidebar-{self.sidebar_style} {{
            background-color: {'var(--tenant-primary-color)' if self.sidebar_style == 'branded' else 'inherit'};
        }}
        
        {self.custom_css or ''}
        """


class Domain(TimeStampedModel):
    """
    Domain routing for tenants.
    Each domain points to a specific medical tenant.
    """
    domain = models.CharField(max_length=253, unique=True, help_text="Domain name (e.g., clinic.example.com)")
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='domains')
    is_primary = models.BooleanField(default=False, help_text="Primary domain for this tenant")
    
    class Meta:
        verbose_name = "Tenant Domain"
        verbose_name_plural = "Tenant Domains"
        ordering = ['domain']

    def __str__(self):
        return f"{self.domain} → {self.tenant.name}"

    def save(self, *args, **kwargs):
        # Ensure only one primary domain per tenant
        if self.is_primary:
            Domain.objects.filter(tenant=self.tenant, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)


class TenantBrandingPreset(TimeStampedModel):
    """
    Pre-defined branding presets for quick tenant setup
    """
    name = models.CharField(max_length=100, help_text="Preset name (e.g., Medical Blue, Healthcare Green)")
    description = models.TextField(blank=True, help_text="Description of this branding preset")
    
    # Preset colors
    primary_color = models.CharField(max_length=7, help_text="Primary brand color")
    secondary_color = models.CharField(max_length=7, help_text="Secondary brand color")
    accent_color = models.CharField(max_length=7, help_text="Accent color")
    background_color = models.CharField(max_length=7, default="#ffffff")
    text_color = models.CharField(max_length=7, default="#1e293b")
    
    # Preset styling
    font_family = models.CharField(max_length=100, default="Inter, system-ui, sans-serif")
    sidebar_style = models.CharField(max_length=20, default='light')
    preset_css = models.TextField(blank=True, help_text="CSS template for this preset")
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Branding Preset"
        verbose_name_plural = "Branding Presets"
        ordering = ['name']

    def __str__(self):
        return self.name

    def apply_to_tenant(self, tenant):
        """Apply this preset to a tenant"""
        tenant.primary_color = self.primary_color
        tenant.secondary_color = self.secondary_color
        tenant.accent_color = self.accent_color
        tenant.background_color = self.background_color
        tenant.text_color = self.text_color
        tenant.font_family = self.font_family
        tenant.sidebar_style = self.sidebar_style
        tenant.custom_css = self.preset_css
        tenant.save()