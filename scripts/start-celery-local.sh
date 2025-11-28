#!/bin/bash

# Script to start Celery locally for development
echo "🚀 Starting Celery Worker for Local Development"
echo "=============================================="

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running. Please start Redis first:"
    echo "   sudo systemctl start redis-server"
    echo "   # or"
    echo "   redis-server"
    exit 1
fi

echo "✅ Redis is running"

# Start Celery worker
echo "🔄 Starting Celery worker..."
celery -A medcor_backend2 worker --loglevel=info --concurrency=2

echo "✅ Celery worker started successfully!"
echo "📝 You can now run your Django server in another terminal:"
echo "   python manage.py runserver"