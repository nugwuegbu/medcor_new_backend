#!/bin/bash

# MedCor Backend 2 - Django Server Startup Script
# Always runs on port 8002 to avoid conflict with medcor_backend on port 8000

echo "🏥 Starting MedCor Backend 2 on port 8002..."
echo "📝 Remember: medcor_backend runs on port 8000, medcor_backend2 runs on port 8002"

# Change to the medcor_backend2 directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/upgrade pip
pip install --upgrade pip

# Install requirements
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run migrations
echo "🔄 Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Start the Django development server on port 8002
echo "🚀 Starting Django server on port 8002..."
echo "📊 API Documentation: http://localhost:8002/api/docs/"
echo "🔐 Admin Panel: http://localhost:8002/admin/"
python manage.py runserver 0.0.0.0:8002