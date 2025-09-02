"""
YouCam AI Analysis App Configuration
"""

from django.apps import AppConfig


class YoucamConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'youcam'
    verbose_name = 'YouCam AI Analysis'
    
    def ready(self):
        """Import signal handlers when app is ready"""
        import youcam.signals