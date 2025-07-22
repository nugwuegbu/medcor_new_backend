"""
URL configuration for medcor_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/', include('api.urls')),
    path('api/treatments/', include('treatment.urls')),
    path('api/appointments/', include('appointment.urls')),
    path('', include('tenants.urls')),  # Include tenant management URLs
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)