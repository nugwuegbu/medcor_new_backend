"""
Celery tasks for YouCam AI Analysis
"""

import logging

from celery import shared_task
from django.db import models
from django.utils import timezone

from .models import AnalysisStatus, YouCamAnalysis
from .youcam_client import YouCamAPIError, YouCamClient

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_youcam_analysis(self, analysis_id):
    """
    Celery task to process YouCam AI analysis asynchronously.

    Args:
        analysis_id (str): UUID of the YouCamAnalysis instance
    """
    try:
        # Get the analysis request
        analysis = YouCamAnalysis.objects.get(id=analysis_id)

        # Update status to processing
        analysis.status = AnalysisStatus.PROCESSING
        analysis.celery_task_id = self.request.id
        analysis.save()

        logger.info(
            f"Starting YouCam analysis for {analysis.analysis_type}: {analysis_id}"
        )

        # Initialize YouCam client
        client = YouCamClient()

        # Perform analysis based on type
        if analysis.analysis_type == "skin_analysis":
            result = client.analyze_skin(analysis.image)
        elif analysis.analysis_type == "face_analyzer":
            result = client.analyze_face(analysis.image)
        elif analysis.analysis_type == "hair_extension":
            result = client.analyze_hair_extension(analysis.image)
        elif analysis.analysis_type == "lips_analysis":
            result = client.analyze_lips(analysis.image)
        else:
            raise ValueError(f"Unsupported analysis type: {analysis.analysis_type}")

        # Update analysis with results
        analysis.raw_response = result.get("raw_data", {})
        analysis.analysis_results = result.get("results", {})
        analysis.issues_detected = result.get("issues_detected", [])
        analysis.recommendations = result.get("recommendations", [])
        analysis.status = AnalysisStatus.COMPLETED
        analysis.completed_at = timezone.now()
        analysis.save()

        logger.info(f"YouCam analysis completed successfully: {analysis_id}")

        return {
            "status": "success",
            "analysis_id": analysis_id,
            "analysis_type": analysis.analysis_type,
            "completed_at": analysis.completed_at.isoformat(),
            "confidence_score": result.get("confidence_score", 0),
        }

    except YouCamAnalysis.DoesNotExist:
        logger.error(f"YouCamAnalysis with id {analysis_id} not found")
        raise self.retry(countdown=60, max_retries=3)

    except YouCamAPIError as exc:
        logger.error(f"YouCam API error for analysis {analysis_id}: {str(exc)}")

        # Update status to failed
        try:
            analysis = YouCamAnalysis.objects.get(id=analysis_id)
            analysis.status = AnalysisStatus.FAILED
            analysis.error_message = str(exc)
            analysis.retry_count += 1
            analysis.save()
        except YouCamAnalysis.DoesNotExist:
            pass

        # Retry the task
        raise self.retry(countdown=60, max_retries=3)

    except Exception as exc:
        logger.error(
            f"Unexpected error processing YouCam analysis {analysis_id}: {str(exc)}"
        )

        # Update status to failed
        try:
            analysis = YouCamAnalysis.objects.get(id=analysis_id)
            analysis.status = AnalysisStatus.FAILED
            analysis.error_message = str(exc)
            analysis.retry_count += 1
            analysis.save()
        except YouCamAnalysis.DoesNotExist:
            pass

        # Retry the task
        raise self.retry(countdown=60, max_retries=3)


@shared_task
def retry_failed_youcam_analyses():
    """
    Task to retry failed YouCam analyses that haven't exceeded max retries.
    """
    failed_analyses = YouCamAnalysis.objects.filter(
        status=AnalysisStatus.FAILED, retry_count__lt=models.F("max_retries")
    )

    retry_count = 0
    for analysis in failed_analyses:
        process_youcam_analysis.delay(str(analysis.id))
        retry_count += 1
        logger.info(f"Retrying failed YouCam analysis: {analysis.id}")

    logger.info(f"Retried {retry_count} failed YouCam analyses")
    return f"Retried {retry_count} failed YouCam analyses"


@shared_task
def cleanup_old_youcam_analyses():
    """
    Task to cleanup old YouCam analyses (older than 90 days).
    """
    from datetime import timedelta

    cutoff_date = timezone.now() - timedelta(days=90)
    old_analyses = YouCamAnalysis.objects.filter(
        created_at__lt=cutoff_date,
        status__in=[AnalysisStatus.COMPLETED, AnalysisStatus.FAILED],
    )

    count = old_analyses.count()
    old_analyses.delete()

    logger.info(f"Cleaned up {count} old YouCam analyses")
    return f"Cleaned up {count} old YouCam analyses"


@shared_task
def generate_analysis_report(analysis_id):
    """
    Generate a detailed analysis report for a completed analysis.

    Args:
        analysis_id (str): UUID of the YouCamAnalysis instance
    """
    try:
        analysis = YouCamAnalysis.objects.get(id=analysis_id)

        if analysis.status != AnalysisStatus.COMPLETED:
            raise ValueError(f"Analysis {analysis_id} is not completed")

        # Generate report data
        report_data = {
            "analysis_id": str(analysis.id),
            "analysis_type": analysis.get_analysis_type_display(),
            "created_at": analysis.created_at.isoformat(),
            "completed_at": analysis.completed_at.isoformat(),
            "results": analysis.analysis_results,
            "issues_detected": analysis.issues_detected,
            "recommendations": analysis.recommendations,
            "image_url": analysis.image.url if analysis.image else None,
        }

        logger.info(f"Generated analysis report for {analysis_id}")
        return report_data

    except YouCamAnalysis.DoesNotExist:
        logger.error(f"YouCamAnalysis with id {analysis_id} not found")
        return None
    except Exception as exc:
        logger.error(f"Error generating analysis report for {analysis_id}: {str(exc)}")
        return None


@shared_task
def batch_process_analyses(analysis_ids):
    """
    Process multiple analyses in batch.

    Args:
        analysis_ids (list): List of analysis IDs to process
    """
    results = []

    for analysis_id in analysis_ids:
        try:
            result = process_youcam_analysis.delay(analysis_id)
            results.append(
                {"analysis_id": analysis_id, "task_id": result.id, "status": "queued"}
            )
        except Exception as exc:
            results.append(
                {"analysis_id": analysis_id, "error": str(exc), "status": "failed"}
            )

    logger.info(f"Batch processed {len(analysis_ids)} analyses")
    return results
