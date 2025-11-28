#!/bin/bash

# Script to start local development environment
echo "🚀 Starting MedCor Local Development Environment"
echo "=============================================="

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Check if Redis is running
echo "🔄 Checking Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running. Please start Redis first:"
    echo "   sudo systemctl start redis-server"
    echo "   # or"
    echo "   redis-server"
    exit 1
fi
echo "✅ Redis is running"

# Fix database configuration
echo "🔄 Fixing database configuration..."
sed -i 's/DATABASE_ENGINE=""/DATABASE_ENGINE="django.db.backends.postgresql"/' .env

# Test database connection
echo "🔄 Testing database connection..."
python manage.py check --database default

if [ $? -ne 0 ]; then
    echo "❌ Database connection failed. Please check your PostgreSQL setup."
    echo "💡 Make sure PostgreSQL is running and the database 'medcor_db2' exists."
    echo "💡 You can create the database with:"
    echo "   sudo -u postgres createdb medcor_db2"
    exit 1
fi

echo "✅ Database connection successful!"

# Start Celery in background
echo "🔄 Starting Celery worker..."
celery -A medcor_backend2 worker --loglevel=info --concurrency=2 &
CELERY_PID=$!

# Wait a moment for Celery to start
sleep 3

# Check if Celery started successfully
if ps -p $CELERY_PID > /dev/null; then
    echo "✅ Celery worker started (PID: $CELERY_PID)"
else
    echo "❌ Failed to start Celery worker"
    exit 1
fi

# Start Django development server
echo "🔄 Starting Django development server..."
echo "🌐 Server will be available at: http://localhost:8000"
echo "🤖 AI endpoints will be available at: http://localhost:8000/api/ai/"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $CELERY_PID 2>/dev/null
    echo "✅ Cleanup complete"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start Django server
python manage.py runserver

# This will only run if Django server exits
cleanup