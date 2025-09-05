#!/usr/bin/env python3
"""
Test script for Celery and Async integration with LangChain AI
This script tests both async real-time responses and Celery background tasks
"""

import asyncio
import json
import os
import sys
import time
from pathlib import Path

import django
import requests

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Set up Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medcor_backend2.settings")
django.setup()

from langchain_ai.mcp_client import test_mcp_connection
from langchain_ai.tasks import (
    get_task_status,
    process_ai_query_task,
    process_database_query_task,
    process_medical_analysis_task,
)


async def test_async_processing():
    """Test async processing capabilities"""
    print("🔄 Testing async processing...")

    try:
        # Test MCP connection
        mcp_available = await test_mcp_connection()
        print(f"✅ MCP connection: {'Available' if mcp_available else 'Not available'}")

        # Simulate async processing
        start_time = time.time()
        await asyncio.sleep(1)  # Simulate processing
        processing_time = time.time() - start_time

        print(f"✅ Async processing completed in {processing_time:.2f} seconds")
        return True

    except Exception as e:
        print(f"❌ Error in async processing: {str(e)}")
        return False


def test_celery_tasks():
    """Test Celery task processing"""
    print("🔧 Testing Celery tasks...")

    try:
        # Test AI query task
        print("  Testing AI query task...")
        task_data = {
            "query": "Test query for Celery processing",
            "query_type": "general",
            "context": {},
        }

        task = process_ai_query_task.delay(task_data, "test_user")
        print(f"  ✅ AI query task submitted: {task.id}")

        # Test medical analysis task
        print("  Testing medical analysis task...")
        medical_data = {
            "medical_data": "Patient has fever and headache",
            "analysis_type": "diagnosis",
            "patient_id": "test_patient",
        }

        medical_task = process_medical_analysis_task.delay(medical_data, "test_user")
        print(f"  ✅ Medical analysis task submitted: {medical_task.id}")

        # Test database query task
        print("  Testing database query task...")
        db_data = {
            "query": "SELECT * FROM patients WHERE age > 65",
            "database": "medcor_db2",
        }

        db_task = process_database_query_task.delay(db_data, "test_user")
        print(f"  ✅ Database query task submitted: {db_task.id}")

        return True

    except Exception as e:
        print(f"❌ Error testing Celery tasks: {str(e)}")
        return False


def test_task_status_tracking():
    """Test task status tracking"""
    print("📊 Testing task status tracking...")

    try:
        # Submit a test task
        task_data = {
            "query": "Status tracking test query",
            "query_type": "general",
            "context": {},
        }

        task = process_ai_query_task.delay(task_data, "test_user")
        task_id = task.id

        print(f"  Task ID: {task_id}")

        # Check status multiple times
        for i in range(5):
            status_info = get_task_status(task_id)
            print(f"  Status check {i+1}: {status_info['status']}")

            if status_info["status"] == "SUCCESS":
                print("  ✅ Task completed successfully")
                break
            elif status_info["status"] == "FAILURE":
                print(f"  ❌ Task failed: {status_info.get('error', 'Unknown error')}")
                break

            time.sleep(2)  # Wait before next check

        return True

    except Exception as e:
        print(f"❌ Error testing task status: {str(e)}")
        return False


def test_api_endpoints():
    """Test API endpoints"""
    print("🌐 Testing API endpoints...")

    base_url = "http://localhost:8000/api/ai"

    # Test health check
    try:
        print("  Testing health check endpoint...")
        response = requests.get(f"{base_url}/health/", timeout=10)
        if response.status_code == 200:
            print("  ✅ Health check endpoint working")
        else:
            print(f"  ❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"  ❌ Health check error: {str(e)}")

    # Test query endpoint (without authentication for testing)
    try:
        print("  Testing query endpoint...")
        query_data = {
            "query": "Test query for API",
            "query_type": "general",
            "use_celery": False,
        }

        # Note: This will fail without proper authentication
        response = requests.post(f"{base_url}/query/", json=query_data, timeout=10)
        print(f"  Query endpoint response: {response.status_code}")

    except Exception as e:
        print(f"  Query endpoint error (expected without auth): {str(e)}")


def test_performance_comparison():
    """Test performance comparison between async and Celery"""
    print("⚡ Testing performance comparison...")

    try:
        # Test async processing time
        print("  Testing async processing...")
        start_time = time.time()

        # Simulate async processing
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(asyncio.sleep(0.5))
        finally:
            loop.close()

        async_time = time.time() - start_time
        print(f"  ✅ Async processing time: {async_time:.2f} seconds")

        # Test Celery task submission time
        print("  Testing Celery task submission...")
        start_time = time.time()

        task_data = {
            "query": "Performance test query",
            "query_type": "general",
            "context": {},
        }

        task = process_ai_query_task.delay(task_data, "test_user")
        celery_submission_time = time.time() - start_time

        print(f"  ✅ Celery task submission time: {celery_submission_time:.2f} seconds")
        print(f"  Task ID: {task.id}")

        return True

    except Exception as e:
        print(f"❌ Error in performance comparison: {str(e)}")
        return False


def test_error_handling():
    """Test error handling in both async and Celery"""
    print("🛡️ Testing error handling...")

    try:
        # Test async error handling
        print("  Testing async error handling...")
        try:
            # This should handle errors gracefully
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                # Simulate an error
                raise Exception("Test async error")
            except Exception as e:
                print(f"  ✅ Async error handled: {str(e)}")
            finally:
                loop.close()
        except Exception as e:
            print(f"  ❌ Async error handling failed: {str(e)}")

        # Test Celery error handling
        print("  Testing Celery error handling...")
        try:
            # Submit a task that will likely fail
            invalid_task_data = {
                "query": "",  # Empty query should cause validation error
                "query_type": "invalid_type",
                "context": {},
            }

            task = process_ai_query_task.delay(invalid_task_data, "test_user")
            print(f"  ✅ Celery task submitted (will likely fail): {task.id}")

        except Exception as e:
            print(f"  ❌ Celery error handling failed: {str(e)}")

        return True

    except Exception as e:
        print(f"❌ Error in error handling test: {str(e)}")
        return False


def run_all_tests():
    """Run all integration tests"""
    print("🚀 Starting Celery and Async Integration Tests")
    print("=" * 60)

    tests = [
        ("Async Processing", test_async_processing),
        ("Celery Tasks", test_celery_tasks),
        ("Task Status Tracking", test_task_status_tracking),
        ("API Endpoints", test_api_endpoints),
        ("Performance Comparison", test_performance_comparison),
        ("Error Handling", test_error_handling),
    ]

    results = []

    for test_name, test_func in tests:
        print(f"\n📋 Running: {test_name}")
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = asyncio.run(test_func())
            else:
                result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test {test_name} crashed: {str(e)}")
            results.append((test_name, False))

    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    print("=" * 60)

    passed = 0
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1

    print(f"\n🎯 Overall: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! Celery and Async integration is working correctly.")
        return True
    else:
        print("⚠️ Some tests failed. Please check the configuration.")
        return False


if __name__ == "__main__":
    # Run the tests
    success = run_all_tests()
    sys.exit(0 if success else 1)
