"""
Celery tasks for LangChain AI operations
This module handles long-running AI tasks using Celery
"""

import asyncio
import json
import logging
from typing import Dict, Any, Optional
from celery import shared_task
from django.conf import settings
from django.core.cache import cache
from .mcp_client import get_mcp_client, test_mcp_connection

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_ai_query_task(self, query_data: Dict[str, Any], user_id: str = None):
    """
    Celery task for processing AI queries that may take longer to complete
    This is used for complex queries that require multiple tool calls or extensive processing
    """
    try:
        # Update task status
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Processing query...', 'progress': 10}
        )
        
        # Extract query information
        query = query_data.get('query', '')
        query_type = query_data.get('query_type', 'general')
        context = query_data.get('context', {})
        
        # Simulate AI processing (replace with actual LangChain integration)
        result = asyncio.run(_process_query_async(query, query_type, context))
        
        # Update task status
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Generating response...', 'progress': 80}
        )
        
        # Cache the result
        task_id = self.request.id
        cache.set(f"ai_query_result_{task_id}", result, timeout=3600)  # 1 hour cache
        
        return {
            'status': 'SUCCESS',
            'result': result,
            'task_id': task_id,
            'user_id': user_id
        }
        
    except Exception as exc:
        logger.error(f"Error in process_ai_query_task: {str(exc)}")
        
        # Retry the task
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60, exc=exc)
        
        return {
            'status': 'FAILURE',
            'error': str(exc),
            'task_id': self.request.id,
            'user_id': user_id
        }


@shared_task(bind=True, max_retries=3)
def process_medical_analysis_task(self, medical_data: Dict[str, Any], user_id: str = None):
    """
    Celery task for processing medical data analysis
    This handles complex medical queries that may require multiple data sources
    """
    try:
        # Update task status
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Analyzing medical data...', 'progress': 20}
        )
        
        # Extract medical data
        data = medical_data.get('medical_data', '')
        analysis_type = medical_data.get('analysis_type', 'general')
        patient_id = medical_data.get('patient_id')
        
        # Simulate medical analysis (replace with actual LangChain integration)
        result = asyncio.run(_process_medical_analysis_async(data, analysis_type, patient_id))
        
        # Update task status
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Generating medical report...', 'progress': 90}
        )
        
        # Cache the result
        task_id = self.request.id
        cache.set(f"medical_analysis_result_{task_id}", result, timeout=7200)  # 2 hours cache
        
        return {
            'status': 'SUCCESS',
            'result': result,
            'task_id': task_id,
            'user_id': user_id,
            'analysis_type': analysis_type
        }
        
    except Exception as exc:
        logger.error(f"Error in process_medical_analysis_task: {str(exc)}")
        
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60, exc=exc)
        
        return {
            'status': 'FAILURE',
            'error': str(exc),
            'task_id': self.request.id,
            'user_id': user_id
        }


@shared_task(bind=True, max_retries=3)
def process_database_query_task(self, query_data: Dict[str, Any], user_id: str = None):
    """
    Celery task for processing database queries
    This handles complex database operations that may take time
    """
    try:
        # Update task status
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Executing database query...', 'progress': 30}
        )
        
        # Extract query information
        query = query_data.get('query', '')
        database = query_data.get('database', 'default')
        
        # Simulate database query processing (replace with actual MCP integration)
        result = asyncio.run(_process_database_query_async(query, database))
        
        # Update task status
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Processing results...', 'progress': 85}
        )
        
        # Cache the result
        task_id = self.request.id
        cache.set(f"db_query_result_{task_id}", result, timeout=1800)  # 30 minutes cache
        
        return {
            'status': 'SUCCESS',
            'result': result,
            'task_id': task_id,
            'user_id': user_id,
            'database': database
        }
        
    except Exception as exc:
        logger.error(f"Error in process_database_query_task: {str(exc)}")
        
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60, exc=exc)
        
        return {
            'status': 'FAILURE',
            'error': str(exc),
            'task_id': self.request.id,
            'user_id': user_id
        }


@shared_task(bind=True, max_retries=3)
def process_code_analysis_task(self, code_data: Dict[str, Any], user_id: str = None):
    """
    Celery task for processing code analysis
    This handles complex code analysis that may require multiple passes
    """
    try:
        # Update task status
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Analyzing code...', 'progress': 25}
        )
        
        # Extract code information
        code = code_data.get('code', '')
        language = code_data.get('language', 'python')
        analysis_type = code_data.get('analysis_type', 'general')
        
        # Simulate code analysis (replace with actual LangChain integration)
        result = asyncio.run(_process_code_analysis_async(code, language, analysis_type))
        
        # Update task status
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Generating analysis report...', 'progress': 90}
        )
        
        # Cache the result
        task_id = self.request.id
        cache.set(f"code_analysis_result_{task_id}", result, timeout=1800)  # 30 minutes cache
        
        return {
            'status': 'SUCCESS',
            'result': result,
            'task_id': task_id,
            'user_id': user_id,
            'language': language,
            'analysis_type': analysis_type
        }
        
    except Exception as exc:
        logger.error(f"Error in process_code_analysis_task: {str(exc)}")
        
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60, exc=exc)
        
        return {
            'status': 'FAILURE',
            'error': str(exc),
            'task_id': self.request.id,
            'user_id': user_id
        }


@shared_task(bind=True)
def cleanup_old_results_task(self):
    """
    Celery task for cleaning up old cached results
    This runs periodically to clean up expired cache entries
    """
    try:
        # This would clean up old cache entries
        # Implementation depends on your cache backend
        logger.info("Cleaning up old AI query results...")
        
        return {
            'status': 'SUCCESS',
            'message': 'Cleanup completed'
        }
        
    except Exception as exc:
        logger.error(f"Error in cleanup_old_results_task: {str(exc)}")
        return {
            'status': 'FAILURE',
            'error': str(exc)
        }


# Async helper functions (these would be replaced with actual LangChain integration)
async def _process_query_async(query: str, query_type: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """Async helper for processing queries"""
    # Simulate processing time
    await asyncio.sleep(2)
    
    return {
        'success': True,
        'response': f"Processed {query_type} query: {query[:50]}...",
        'query_type': query_type,
        'tools_used': ['mcp_tool_1', 'mcp_tool_2'],
        'processing_time': 2.0
    }


async def _process_medical_analysis_async(data: str, analysis_type: str, patient_id: str = None) -> Dict[str, Any]:
    """Async helper for medical analysis"""
    # Simulate processing time
    await asyncio.sleep(3)
    
    return {
        'success': True,
        'response': f"Medical analysis completed for {analysis_type} analysis",
        'analysis_type': analysis_type,
        'patient_id': patient_id,
        'tools_used': ['medical_db_tool', 'diagnosis_tool'],
        'processing_time': 3.0
    }


async def _process_database_query_async(query: str, database: str) -> Dict[str, Any]:
    """Async helper for database queries"""
    # Simulate processing time
    await asyncio.sleep(1.5)
    
    return {
        'success': True,
        'response': f"Database query executed on {database}",
        'database': database,
        'tools_used': ['db_query_tool'],
        'processing_time': 1.5
    }


async def _process_code_analysis_async(code: str, language: str, analysis_type: str) -> Dict[str, Any]:
    """Async helper for code analysis"""
    # Simulate processing time
    await asyncio.sleep(2.5)
    
    return {
        'success': True,
        'response': f"Code analysis completed for {language} code",
        'language': language,
        'analysis_type': analysis_type,
        'tools_used': ['code_analysis_tool', 'security_tool'],
        'processing_time': 2.5
    }


# Utility functions for task management
def get_task_status(task_id: str) -> Dict[str, Any]:
    """Get the status of a Celery task"""
    from celery.result import AsyncResult
    
    task_result = AsyncResult(task_id)
    
    if task_result.state == 'PENDING':
        return {
            'status': 'PENDING',
            'message': 'Task is waiting to be processed'
        }
    elif task_result.state == 'PROGRESS':
        return {
            'status': 'PROGRESS',
            'message': task_result.info.get('status', 'Processing...'),
            'progress': task_result.info.get('progress', 0)
        }
    elif task_result.state == 'SUCCESS':
        return {
            'status': 'SUCCESS',
            'result': task_result.result
        }
    elif task_result.state == 'FAILURE':
        return {
            'status': 'FAILURE',
            'error': str(task_result.info)
        }
    else:
        return {
            'status': task_result.state,
            'message': 'Unknown task state'
        }


def get_cached_result(task_id: str, result_type: str) -> Optional[Dict[str, Any]]:
    """Get cached result for a completed task"""
    cache_key = f"{result_type}_result_{task_id}"
    return cache.get(cache_key)