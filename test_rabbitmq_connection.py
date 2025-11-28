#!/usr/bin/env python3
"""
Test script to verify RabbitMQ connection for Celery
"""

import os
import sys
import django
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).resolve().parent
sys.path.insert(0, str(project_root))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

from celery import current_app
import pika
from kombu import Connection

def test_rabbitmq_connection():
    """Test RabbitMQ connection using pika"""
    print("🔧 Testing RabbitMQ connection with pika...")
    
    broker_url = current_app.conf.broker_url
    print(f"Broker URL: {broker_url}")
    
    try:
        # Parse the broker URL
        if broker_url.startswith('amqp://'):
            # Extract connection details
            url_parts = broker_url.replace('amqp://', '').split('@')
            if len(url_parts) == 2:
                credentials_part = url_parts[0]
                host_part = url_parts[1]
                
                if ':' in credentials_part:
                    username, password = credentials_part.split(':')
                else:
                    username, password = 'guest', 'guest'
                
                if ':' in host_part:
                    host, port = host_part.split(':')
                    port = int(port)
                else:
                    host = host_part
                    port = 5672
                
                # Test connection
                connection = pika.BlockingConnection(
                    pika.ConnectionParameters(
                        host=host,
                        port=port,
                        virtual_host='/',
                        credentials=pika.PlainCredentials(username, password)
                    )
                )
                
                print(f"✅ Successfully connected to RabbitMQ at {host}:{port}")
                print(f"   Username: {username}")
                print(f"   Virtual Host: /")
                
                connection.close()
                return True
            else:
                print("❌ Invalid broker URL format")
                return False
        else:
            print("❌ Not a RabbitMQ broker URL")
            return False
            
    except Exception as e:
        print(f"❌ Failed to connect to RabbitMQ: {str(e)}")
        return False

def test_celery_connection():
    """Test Celery connection using kombu"""
    print("\n🔧 Testing Celery connection with kombu...")
    
    broker_url = current_app.conf.broker_url
    print(f"Broker URL: {broker_url}")
    
    try:
        with Connection(broker_url) as conn:
            conn.connect()
            print("✅ Successfully connected to Celery broker")
            return True
    except Exception as e:
        print(f"❌ Failed to connect to Celery broker: {str(e)}")
        return False

def test_celery_task():
    """Test a simple Celery task"""
    print("\n🔧 Testing Celery task execution...")
    
    try:
        from langchain_ai.tasks import process_ai_query_async
        
        # Submit a simple task
        result = process_ai_query_async.delay("Test query for RabbitMQ")
        print(f"✅ Task submitted successfully. Task ID: {result.id}")
        
        # Check task status
        print(f"   Task status: {result.status}")
        print(f"   Task ready: {result.ready()}")
        
        return True
    except Exception as e:
        print(f"❌ Failed to submit Celery task: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Testing RabbitMQ and Celery Configuration")
    print("=" * 50)
    
    # Test RabbitMQ connection
    rabbitmq_ok = test_rabbitmq_connection()
    
    # Test Celery connection
    celery_ok = test_celery_connection()
    
    # Test Celery task (only if connections are OK)
    task_ok = False
    if rabbitmq_ok and celery_ok:
        task_ok = test_celery_task()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"   RabbitMQ Connection: {'✅ PASS' if rabbitmq_ok else '❌ FAIL'}")
    print(f"   Celery Connection: {'✅ PASS' if celery_ok else '❌ FAIL'}")
    print(f"   Celery Task: {'✅ PASS' if task_ok else '❌ FAIL'}")
    
    if rabbitmq_ok and celery_ok and task_ok:
        print("\n🎉 All tests passed! RabbitMQ and Celery are working correctly.")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests failed. Please check your RabbitMQ configuration.")
        sys.exit(1)