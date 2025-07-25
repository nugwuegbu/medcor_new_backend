from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Client, Domain
from .forms import UserAdminForm
from django_tenants.admin import TenantAdminMixin
from django.core.exceptions import ValidationError


#@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    """Custom user admin for tenant users."""
    form = UserAdminForm

    list_display = [
        'email', 'username', 'role', 'is_active', 'face_registered',
        'created_at'
    ]
    list_filter = ['role', 'is_active', 'face_registered', 'created_at']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('email', 'username', 'first_name', 'last_name',
                       'is_active', 'is_verified')
        }),
        ('Personal Information', {
            'fields': ('phone_number', 'date_of_birth', 'address',
                       'emergency_contact', 'emergency_phone')
        }),
        ('Medical Information', {
            'fields': ('medical_record_number', 'insurance_provider',
                       'insurance_policy_number', 'blood_type', 'allergies')
        }),
        ('Role & Access', {
            'fields': ('role', )
        }),
        ('Face Recognition', {
            'fields':
            ('face_id', 'person_id', 'face_registered', 'last_face_login')
        }),
        ('OAuth', {
            'fields': ('oauth_provider', 'oauth_provider_id')
        }),
        ('Consent & Privacy', {
            'fields':
            ('consent_version', 'consent_date', 'last_login_ip', 'is_new_user')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    readonly_fields = ['created_at', 'updated_at']

    def delete_model(self, request, obj):

        if obj.id in Client.objects.values_list("owner_id", flat=True):
            raise ValidationError(
                "You cannot delete a user that is a tenant owner.")

        # Cancel the delete if the user still belongs to any tenant
        if obj.tenants.count() > 0:
            raise ValidationError("Cannot delete a tenant owner.")

        # Otherwise, delete the user
        obj.delete(force_drop=True)


#@admin.register(Client)
class ClientAdmin(TenantAdminMixin, admin.ModelAdmin):
    """Admin for tenant clients."""

    list_display = ['name', 'schema_name', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'schema_name']
    ordering = ['-created_at']

    def delete_model(self, request, obj):
        obj.delete(force_drop=True)


#@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    """Admin for tenant domains."""

    list_display = ['domain', 'tenant', 'is_primary']
    list_filter = ['is_primary']
    search_fields = ['domain']


admin.site.register(User, UserAdmin)
admin.site.register(Client, ClientAdmin)
admin.site.register(Domain, DomainAdmin)
