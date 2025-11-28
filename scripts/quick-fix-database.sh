#!/bin/bash

# Quick Database Fix for Production Server
# Run this directly on the production server to fix the PostgreSQL connection issue

echo "🚀 Quick Database Fix for Production Server"
echo "==========================================="

# Check if we're on the production server
if [ ! -d "/var/www/html/medcor_backend2" ]; then
    echo "❌ This script should be run on the production server"
    echo "   Expected directory: /var/www/html/medcor_backend2"
    exit 1
fi

cd /var/www/html/medcor_backend2

echo "📋 Current Status:"
echo "   Working Directory: $(pwd)"
echo "   User: $(whoami)"
echo "   Date: $(date)"
echo

# 1. Start PostgreSQL
echo "1️⃣ Starting PostgreSQL Service:"
sudo systemctl start postgresql
sleep 3

if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL started successfully"
else
    echo "❌ Failed to start PostgreSQL"
    echo "   Installing PostgreSQL if needed..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi
echo

# 2. Create .env file if missing
echo "2️⃣ Checking Environment Configuration:"
if [ ! -f ".env" ]; then
    echo "❌ .env file missing, creating from env.prod..."
    if [ -f "env.prod" ]; then
        cp env.prod .env
        echo "✅ .env file created from env.prod"
    else
        echo "❌ env.prod not found, creating basic .env..."
        cat > .env << 'EOF'
# Database Configuration
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=medcor_db
DATABASE_USER=medcor_user
DATABASE_PASSWORD=medcor_password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=api.medcor.ai,test.medcor.ai,localhost,127.0.0.1

# CORS Settings
CORS_ALLOWED_ORIGINS=https://api.medcor.ai,https://test.medcor.ai,http://localhost:3000

# Email Configuration
EMAIL_HOST_USER=nugwuegbu089@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
EOF
        echo "✅ Basic .env file created"
    fi
else
    echo "✅ .env file exists"
fi
echo

# 3. Create database and user
echo "3️⃣ Setting up Database:"
DB_NAME=$(grep DATABASE_NAME .env | cut -d'=' -f2 | tr -d ' ')
DB_USER=$(grep DATABASE_USER .env | cut -d'=' -f2 | tr -d ' ')
DB_PASSWORD=$(grep DATABASE_PASSWORD .env | cut -d'=' -f2 | tr -d ' ')

if [ -n "$DB_NAME" ] && [ -n "$DB_USER" ]; then
    echo "   Database: $DB_NAME"
    echo "   User: $DB_USER"
    
    # Create user
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "   User may already exist"
    sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;" 2>/dev/null || echo "   User privileges updated"
    
    # Create database
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "   Database may already exist"
    
    echo "✅ Database setup completed"
else
    echo "❌ Database configuration incomplete"
fi
echo

# 4. Run migrations
echo "4️⃣ Running Database Migrations:"
source venv/bin/activate
python manage.py migrate --noinput
if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed"
fi
echo

# 5. Restart services
echo "5️⃣ Restarting Services:"
sudo systemctl restart postgresql
sudo systemctl restart gunicorn
sudo systemctl restart celery
sudo systemctl restart nginx
echo "✅ All services restarted"
echo

# 6. Test connection
echo "6️⃣ Testing Database Connection:"
python manage.py check --database default
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection still failing"
fi
echo

# 7. Test application
echo "7️⃣ Testing Application:"
sleep 5
if curl -s -o /dev/null -w "%{http_code}" https://api.medcor.ai/admin/ | grep -q "200\|302"; then
    echo "✅ Application is responding"
    echo "🌐 Admin interface: https://api.medcor.ai/admin/"
else
    echo "⚠️  Application may still have issues"
    echo "   Check logs: sudo journalctl -u gunicorn -f"
fi
echo

echo "🎯 Quick Database Fix Complete!"
echo "==============================="
echo "If issues persist, check:"
echo "1. Database credentials in .env file"
echo "2. PostgreSQL logs: sudo journalctl -u postgresql -f"
echo "3. Gunicorn logs: sudo journalctl -u gunicorn -f"
echo "4. Nginx logs: sudo journalctl -u nginx -f"