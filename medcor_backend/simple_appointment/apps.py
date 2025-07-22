from django.apps import AppConfig

class SimpleAppointmentConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'simple_appointment'
    verbose_name = 'Patient Appointments'