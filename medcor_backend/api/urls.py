from django.urls import path
from . import views

urlpatterns = [
    # Doctor endpoints
    path('doctors/', views.DoctorListView.as_view(), name='doctor-list'),
    
    # Appointment endpoints
    path('appointments/', views.AppointmentListView.as_view(), name='appointment-list'),
    path('appointments/create/', views.CreateAppointmentView.as_view(), name='create-appointment'),
    
    # Chat endpoints
    path('chat/messages/', views.ChatMessageListView.as_view(), name='chat-messages'),
    path('chat/messages/create/', views.CreateChatMessageView.as_view(), name='create-chat-message'),
    
    # Analysis endpoints
    path('hair-analysis/', views.HairAnalysisView.as_view(), name='hair-analysis'),
    path('skin-analysis/', views.SkinAnalysisView.as_view(), name='skin-analysis'),
    path('lips-analysis/', views.LipsAnalysisView.as_view(), name='lips-analysis'),
    
    # Utility endpoints
    path('location-weather/', views.location_weather_view, name='location-weather'),
    
    # Admin endpoints
    path('admin/stats/', views.AdminStatsView.as_view(), name='admin-stats'),
    path('admin/users/', views.AdminUsersView.as_view(), name='admin-users'),
]