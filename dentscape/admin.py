"""
Dentscape AI Admin Configuration
"""

from django.contrib import admin
from .models import DentscapeSimulation, DentscapeAnalysis, DentscapeHistory


@admin.register(DentscapeSimulation)
class DentscapeSimulationAdmin(admin.ModelAdmin):
    """Admin interface for Dentscape Simulation"""
    
    list_display = [
        'id', 'tracking_user_id', 'simulation_type', 'status', 'created_at', 'completed_at'
    ]
    list_filter = ['simulation_type', 'status', 'created_at']
    search_fields = ['tracking_user_id', 'simulation_type']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'tracking_user_id', 'simulation_type', 'image')
        }),
        ('Processing Status', {
            'fields': ('status', 'celery_task_id', 'retry_count', 'max_retries')
        }),
        ('Results', {
            'fields': ('raw_response', 'simulation_results', 'before_image_url', 'after_image_url')
        }),
        ('Error Handling', {
            'fields': ('error_message',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at')
        })
    )


@admin.register(DentscapeAnalysis)
class DentscapeAnalysisAdmin(admin.ModelAdmin):
    """Admin interface for Dentscape Analysis"""
    
    list_display = [
        'id', 'tracking_user_id', 'analysis_type', 'status', 'created_at', 'completed_at'
    ]
    list_filter = ['analysis_type', 'status', 'created_at']
    search_fields = ['tracking_user_id', 'analysis_type']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'tracking_user_id', 'analysis_type', 'image')
        }),
        ('Processing Status', {
            'fields': ('status', 'celery_task_id', 'retry_count', 'max_retries')
        }),
        ('Results', {
            'fields': ('raw_response', 'analysis_results', 'measurements', 'annotations_image_url')
        }),
        ('Error Handling', {
            'fields': ('error_message',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at')
        })
    )


@admin.register(DentscapeHistory)
class DentscapeHistoryAdmin(admin.ModelAdmin):
    """Admin interface for Dentscape History"""
    
    list_display = [
        'id', 'tracking_user_id', 'simulation', 'analysis', 'viewed_at', 'feedback_rating'
    ]
    list_filter = ['viewed_at', 'feedback_rating']
    search_fields = ['tracking_user_id']
    readonly_fields = ['id', 'viewed_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'tracking_user_id', 'simulation', 'analysis')
        }),
        ('User Interaction', {
            'fields': ('viewed_at', 'feedback_rating', 'feedback_comment')
        })
    )
