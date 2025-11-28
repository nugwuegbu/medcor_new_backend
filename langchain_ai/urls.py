"""
URL configuration for LangChain AI app
"""

from django.urls import path

from . import views_cbv

app_name = "langchain_ai"

urlpatterns = [
    # Intelligent query processing (combines AI and Database queries)
    path("query/", views_cbv.ProcessQueryView.as_view(), name="process_query"),
    # Task management endpoints
    path(
        "task/<str:task_id>/status/", views_cbv.GetTaskStatusView.as_view(), name="get_task_status"
    ),
    # Health and monitoring
    path("health/", views_cbv.AIHealthCheckView.as_view(), name="health_check"),
]
