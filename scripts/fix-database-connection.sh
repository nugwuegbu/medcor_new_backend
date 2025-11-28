#!/bin/bash

# Script to fix database connection issues
# This ensures the AWS RDS database connection is properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log "🔧 Fixing database connection..."

# Navigate to project directory
cd /var/www/html/medcor_backend2

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
    log "✅ Virtual environment activated"
else
    error "❌ Virtual environment not found"
    exit 1
fi

# Ensure .env file exists and has correct database settings
log "🔧 Setting up database configuration..."

# Create .env file from env.prod if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f "env.prod" ]; then
        cp env.prod .env
        log "✅ .env file created from env.prod"
    else
        error "❌ env.prod file not found"
        exit 1
    fi
fi

# Verify database configuration in .env
log "🔍 Verifying database configuration..."
if grep -q "DATABASE_HOST=medcore.czouassyu7f2.il-central-1.rds.amazonaws.com" .env; then
    log "✅ Database host is correctly configured"
else
    warning "⚠️  Database host not found in .env, adding it..."
    echo "DATABASE_HOST=medcore.czouassyu7f2.il-central-1.rds.amazonaws.com" >> .env
fi

# Set environment variables for this session
log "🔧 Loading environment variables..."
export $(cat .env | grep -v '^#' | xargs)

# Verify environment variables are loaded
log "🔍 Verifying environment variables..."
echo "DATABASE_HOST: $DATABASE_HOST"
echo "DATABASE_NAME: $DATABASE_NAME"
echo "DATABASE_USER: $DATABASE_USER"

# Test database connection
log "🧪 Testing database connection..."
if python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()
from django.db import connection
connection.ensure_connection()
print('Database connection successful!')
" 2>/dev/null; then
    log "✅ Database connection test passed"
else
    error "❌ Database connection test failed"
    log "Trying to run migrations with explicit environment variables..."
    
    # Run migrations with explicit environment variables
    DATABASE_HOST=medcore.czouassyu7f2.il-central-1.rds.amazonaws.com \
    DATABASE_NAME=medcor_db2 \
    DATABASE_USER=postgres \
    DATABASE_PASS=3765R7vmFQwF6ddlNyWa \
    DATABASE_PORT=5432 \
    python manage.py migrate
fi

# Run migrations normally
log "🗄️ Running database migrations..."
python manage.py migrate

# Collect static files
log "📁 Collecting static files..."
python manage.py collectstatic --noinput

log "🎉 Database connection fix completed!"
log "🌐 Your API should now work with the AWS RDS database"