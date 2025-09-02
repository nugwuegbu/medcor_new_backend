"""
Signals for YouCam AI Analysis
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import YouCamAnalysis, AnalysisHistory


@receiver(post_save, sender=YouCamAnalysis)
def create_analysis_history(sender, instance, created, **kwargs):
    """
    Create analysis history entry when analysis is completed
    """
    if instance.status == 'completed' and instance.user:
        AnalysisHistory.objects.get_or_create(
            user=instance.user,
            analysis=instance,
            defaults={
                'viewed_at': instance.completed_at
            }
        )