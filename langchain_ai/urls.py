"""
URL configuration for LangChain AI app
"""

from django.urls import path

from . import views

app_name = "langchain_ai"

urlpatterns = [
    # Query processing endpoints
    path("query/", views.process_query, name="process_query"),
    path("medical/", views.process_medical_query, name="process_medical_query"),
    path("database/", views.process_database_query, name="process_database_query"),
    # Task management endpoints
    path(
        "task/<str:task_id>/status/", views.get_task_status_view, name="get_task_status"
    ),
    # Health and monitoring
    path("health/", views.health_check, name="health_check"),
]
