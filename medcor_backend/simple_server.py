#!/usr/bin/env python
"""
Simple Django server for port 8000 access
"""
import os
import sys
import django
from django.conf import settings
from django.core.management import execute_from_command_line
from django.http import JsonResponse, HttpResponse
from django.urls import path
from django.core.wsgi import get_wsgi_application

# Simple Django configuration
settings.configure(
    DEBUG=True,
    SECRET_KEY='simple-dev-key-for-port-8000',
    ROOT_URLCONF=__name__,
    ALLOWED_HOSTS=['*'],
    MIDDLEWARE=[
        'django.middleware.security.SecurityMiddleware',
        'django.middleware.common.CommonMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
    ],
    INSTALLED_APPS=[
        'django.contrib.contenttypes',
        'django.contrib.auth',
    ],
    DATABASES={
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    },
)

django.setup()

# Simple views
def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'message': 'Django backend running on port 8000',
        'version': '1.0.0'
    })

def api_info(request):
    return JsonResponse({
        'backend': 'Django MedCor Backend',
        'port': 8000,
        'endpoints': {
            '/': 'Health check',
            '/api/': 'API information',
            '/api/health/': 'Health status',
        }
    })

def root_view(request):
    return HttpResponse("""
    <html>
    <head><title>Django Backend - Port 8000</title></head>
    <body>
        <h1>Django Backend Running Successfully</h1>
        <p><strong>Port:</strong> 8000</p>
        <p><strong>Status:</strong> Active</p>
        <h2>Available Endpoints:</h2>
        <ul>
            <li><a href="/api/">/api/</a> - API information</li>
            <li><a href="/api/health/">/api/health/</a> - Health check</li>
        </ul>
    </body>
    </html>
    """)

# URL patterns
urlpatterns = [
    path('', root_view, name='root'),
    path('api/', api_info, name='api_info'),
    path('api/health/', health_check, name='health'),
]

if __name__ == '__main__':
    execute_from_command_line(['simple_server.py', 'runserver', '0.0.0.0:8000'])