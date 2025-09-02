from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Custom admin for User model."""
    
    list_display = ('email', 'username', 'first_name', 'last_name', 'role', 'hospital', 'is_active', 'is_staff', 'created_at')
    list_filter = ('role', 'is_active', 'is_staff', 'is_verified', 'hospital', 'created_at')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('username', 'first_name', 'last_name', 'phone_number', 'date_of_birth', 'gender')}),
        ('Address', {'fields': ('address_line1', 'address_line2', 'city', 'state', 'country', 'postal_code')}),
        ('Professional', {'fields': ('role', 'hospital', 'license_number', 'specialization', 'department', 'years_of_experience')}),
        ('Profile', {'fields': ('profile_picture', 'bio', 'preferred_language', 'timezone')}),
        ('Medical Info', {'fields': ('blood_type', 'allergies', 'medical_conditions', 'current_medications')}),
        ('Emergency Contact', {'fields': ('emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified', 'email_verified', 'phone_verified')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'first_name', 'last_name', 'role', 'hospital'),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'last_login')
    
    # Add autocomplete for hospital field
    autocomplete_fields = ['hospital']
