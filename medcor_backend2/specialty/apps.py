from django.apps import AppConfig


class SpecialtyConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'specialty'
    verbose_name = 'Medical Specialties'
    
    def ready(self):
        """Initialize app when Django starts"""
        # Import signal handlers if needed
        pass