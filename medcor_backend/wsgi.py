"""
WSGI config for medcor_backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

import os
from django.core.wsgi import get_wsgi_application

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')

# Create the WSGI application
application = get_wsgi_application()