#!/bin/bash

# Fix PostgreSQL Connection Error on Production Server
# This script diagnoses and fixes database connection issues

echo "🔍 Diagnosing PostgreSQL Connection Issue on Production Server"
echo "=============================================================="

# Check if we're on the production server
if [ ! -d "/var/www/html/medcor_backend2" ]; then
    echo "❌ This script should be run on the production server"
    echo "   Expected directory: /var/www/html/medcor_backend2"
    exit 1
fi

cd /var/www/html/medcor_backend2

echo "📋 Current Environment:"
echo "   Working Directory: $(pwd)"
echo "   User: $(whoami)"
echo "   Date: $(date)"
echo

# 1. Check PostgreSQL service status
echo "1️⃣ Checking PostgreSQL Service Status:"
echo "----------------------------------------"
if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL service is running"
    systemctl status postgresql --no-pager -l
else
    echo "❌ PostgreSQL service is not running"
    echo "   Attempting to start PostgreSQL..."
    sudo systemctl start postgresql
    if systemctl is-active --quiet postgresql; then
        echo "✅ PostgreSQL service started successfully"
    else
        echo "❌ Failed to start PostgreSQL service"
        echo "   Checking PostgreSQL installation..."
        if command -v psql &> /dev/null; then
            echo "✅ PostgreSQL is installed"
        else
            echo "❌ PostgreSQL is not installed"
            echo "   Installing PostgreSQL..."
            sudo apt update
            sudo apt install -y postgresql postgresql-contrib
        fi
    fi
fi
echo

# 2. Check PostgreSQL port
echo "2️⃣ Checking PostgreSQL Port (5432):"
echo "------------------------------------"
if netstat -tlnp 2>/dev/null | grep :5432 || ss -tlnp 2>/dev/null | grep :5432; then
    echo "✅ PostgreSQL is listening on port 5432"
else
    echo "❌ PostgreSQL is not listening on port 5432"
    echo "   Checking PostgreSQL configuration..."
    sudo -u postgres psql -c "SHOW port;" 2>/dev/null || echo "   Cannot connect to PostgreSQL"
fi
echo

# 3. Check database configuration
echo "3️⃣ Checking Database Configuration:"
echo "------------------------------------"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "   Database settings:"
    grep -E "DATABASE_|DB_" .env | head -10
else
    echo "❌ .env file not found"
    echo "   Creating .env file from env.prod..."
    if [ -f "env.prod" ]; then
        cp env.prod .env
        echo "✅ .env file created from env.prod"
    else
        echo "❌ env.prod file not found"
        echo "   Creating basic .env file..."
        cat > .env << EOF
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
fi
echo

# 4. Check if database exists
echo "4️⃣ Checking Database Existence:"
echo "--------------------------------"
DB_NAME=$(grep DATABASE_NAME .env | cut -d'=' -f2 | tr -d ' ')
DB_USER=$(grep DATABASE_USER .env | cut -d'=' -f2 | tr -d ' ')
DB_PASSWORD=$(grep DATABASE_PASSWORD .env | cut -d'=' -f2 | tr -d ' ')

if [ -n "$DB_NAME" ] && [ -n "$DB_USER" ]; then
    echo "   Database Name: $DB_NAME"
    echo "   Database User: $DB_USER"
    
    # Test database connection
    if PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
        echo "✅ Database connection successful"
    else
        echo "❌ Database connection failed"
        echo "   Attempting to create database and user..."
        
        # Create database user
        sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "   User may already exist"
        sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;" 2>/dev/null || echo "   User privileges updated"
        
        # Create database
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "   Database may already exist"
        
        # Test connection again
        if PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
            echo "✅ Database and user created successfully"
        else
            echo "❌ Still cannot connect to database"
        fi
    fi
else
    echo "❌ Database configuration incomplete"
fi
echo

# 5. Run Django migrations
echo "5️⃣ Running Django Migrations:"
echo "------------------------------"
source venv/bin/activate
if python manage.py migrate --check &>/dev/null; then
    echo "✅ Database migrations are up to date"
else
    echo "⚠️  Running database migrations..."
    python manage.py migrate
    if [ $? -eq 0 ]; then
        echo "✅ Migrations completed successfully"
    else
        echo "❌ Migration failed"
    fi
fi
echo

# 6. Test Django database connection
echo "6️⃣ Testing Django Database Connection:"
echo "---------------------------------------"
if python manage.py check --database default &>/dev/null; then
    echo "✅ Django database connection successful"
else
    echo "❌ Django database connection failed"
    echo "   Checking Django settings..."
    python manage.py check --deploy
fi
echo

# 7. Restart services
echo "7️⃣ Restarting Services:"
echo "------------------------"
echo "   Restarting PostgreSQL..."
sudo systemctl restart postgresql
sleep 2

echo "   Restarting Gunicorn..."
sudo systemctl restart gunicorn
sleep 2

echo "   Restarting Celery..."
sudo systemctl restart celery
sleep 2

echo "   Restarting Nginx..."
sudo systemctl restart nginx
sleep 2

echo "✅ All services restarted"
echo

# 8. Final status check
echo "8️⃣ Final Status Check:"
echo "----------------------"
echo "   PostgreSQL: $(systemctl is-active postgresql)"
echo "   Gunicorn: $(systemctl is-active gunicorn)"
echo "   Celery: $(systemctl is-active celery)"
echo "   Nginx: $(systemctl is-active nginx)"
echo

# 9. Test the application
echo "9️⃣ Testing Application:"
echo "-----------------------"
if curl -s -o /dev/null -w "%{http_code}" https://api.medcor.ai/admin/ | grep -q "200\|302"; then
    echo "✅ Application is responding"
else
    echo "❌ Application is not responding properly"
    echo "   Checking logs..."
    echo "   Gunicorn logs:"
    sudo journalctl -u gunicorn --no-pager -l | tail -5
    echo
    echo "   Nginx logs:"
    sudo journalctl -u nginx --no-pager -l | tail -5
fi
echo

echo "🎯 PostgreSQL Connection Fix Complete!"
echo "======================================"
echo "If issues persist, check:"
echo "1. Database credentials in .env file"
echo "2. PostgreSQL configuration in /etc/postgresql/*/main/postgresql.conf"
echo "3. PostgreSQL authentication in /etc/postgresql/*/main/pg_hba.conf"
echo "4. Firewall settings for port 5432"
echo
echo "To test manually:"
echo "  PGPASSWORD='$DB_PASSWORD' psql -h localhost -U $DB_USER -d $DB_NAME -c 'SELECT 1;'"