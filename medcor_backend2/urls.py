"""
URL configuration for medcor_backend2 project.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from core.views_health import health_check, liveness_check, readiness_check
from core.ai_query_views import HealthAwareQueryView

urlpatterns = [
    # Health checks
    path("api/health/", health_check, name="health-check"),
    path("api/ready/", readiness_check, name="readiness-check"),
    path("api/live/", liveness_check, name="liveness-check"),
    # Admin
    path("admin/", admin.site.urls),
    # API Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # Authentication & Core
    path("api/auth/", include("core.urls")),
    # AI Query endpoint (direct access) - MUST come before langchain_ai.urls
    path("api/ai/query/", HealthAwareQueryView.as_view(), name="ai_query"),
    # Chat, Voice, and Avatar APIs (temporarily disabled)
    # path('api/', include('core.chat_urls')),
    # Apps
    path("api/tenants/", include("tenants.urls")),
    path("api/appointments/", include("appointments.urls")),
    path("api/medical-records/", include("medical_records.urls")),
    path("api/treatments/", include("treatments.urls")),
    path("api/subscription-plans/", include("subscription_plans.urls")),
    path("api/specialty/", include("specialty.urls")),
    path("api/email/", include("email_service.urls")),
    path("api/youcam/", include("youcam.urls")),
    path("api/dentscape/", include("dentscape.urls")),
    # Note: langchain_ai.urls includes 'query/' but it won't match '/api/ai/query/' due to order
    # It will only handle URLs under '/api/ai/' that don't match 'query/'
    path("api/ai/", include("langchain_ai.urls")),
    path("api/knowledgebase/", include("knowledgebase.urls")),
    path("api/chatwidget/", include("chatwidget.urls")),
    path("api/", include("services.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
