#!/bin/bash

# Clean AWS RDS Fix - No API Keys
# This script configures Django to connect to AWS RDS

echo "🔧 Configuring AWS RDS Connection"
echo "================================="

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

# AWS RDS Configuration
RDS_HOST="medcore.czouassyu7f2.il-central-1.rds.amazonaws.com"
RDS_PORT="5432"
RDS_DB="medcor_db2"
RDS_USER="postgres"
RDS_PASS="3765R7vmFQwF6ddlNyWa"

echo "🌐 AWS RDS Configuration:"
echo "   Host: $RDS_HOST"
echo "   Port: $RDS_PORT"
echo "   Database: $RDS_DB"
echo "   User: $RDS_USER"
echo

# 1. Create .env file with AWS RDS configuration
echo "1️⃣ Creating .env file with AWS RDS configuration:"
cat > .env << 'EOF'
# AWS RDS Database Configuration
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=medcor_db2
DATABASE_USER=postgres
DATABASE_PASSWORD=3765R7vmFQwF6ddlNyWa
DATABASE_HOST=medcore.czouassyu7f2.il-central-1.rds.amazonaws.com
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

# Redis Configuration (for Celery)
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# OpenAI Configuration (set your actual key on the server)
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE

# MCP Server Configuration
MCP_SERVER_URL=http://localhost:8001
MCP_SERVER_TIMEOUT=30
EOF

echo "✅ .env file created with AWS RDS configuration"
echo

# 2. Install PostgreSQL client
echo "2️⃣ Installing PostgreSQL client:"
sudo apt update
sudo apt install -y postgresql-client
echo "✅ PostgreSQL client installed"
echo

# 3. Test RDS connection
echo "3️⃣ Testing AWS RDS connection:"
if PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" -c "SELECT 1;" &>/dev/null; then
    echo "✅ AWS RDS connection successful"
else
    echo "❌ AWS RDS connection failed"
    echo "   Server IP: $(curl -s ifconfig.me 2>/dev/null || echo 'Unable to determine')"
    echo "   Please check AWS RDS security groups allow this IP"
fi
echo

# 4. Test Django connection
echo "4️⃣ Testing Django database connection:"
source venv/bin/activate
python manage.py check --database default
if [ $? -eq 0 ]; then
    echo "✅ Django database connection successful"
else
    echo "❌ Django database connection failed"
fi
echo

# 5. Run migrations
echo "5️⃣ Running database migrations:"
python manage.py migrate --noinput
if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed"
fi
echo

# 6. Restart services
echo "6️⃣ Restarting services:"
sudo systemctl restart gunicorn
sudo systemctl restart celery
sudo systemctl restart nginx
echo "✅ All services restarted"
echo

# 7. Test application
echo "7️⃣ Testing application:"
sleep 5
if curl -s -o /dev/null -w "%{http_code}" https://api.medcor.ai/admin/ | grep -q "200\|302"; then
    echo "✅ Application is responding"
    echo "🌐 Admin interface: https://api.medcor.ai/admin/"
else
    echo "⚠️  Application may still have issues"
    echo "   Check logs: sudo journalctl -u gunicorn -f"
fi
echo

echo "🎯 AWS RDS Connection Fix Complete!"
echo "==================================="
echo "AWS RDS Configuration:"
echo "   Host: $RDS_HOST"
echo "   Port: $RDS_PORT"
echo "   Database: $RDS_DB"
echo "   User: $RDS_USER"
echo
echo "If issues persist, check:"
echo "1. AWS RDS security groups allow this server's IP: $(curl -s ifconfig.me 2>/dev/null || echo 'Unable to determine')"
echo "2. RDS instance is running and accessible"
echo "3. Database credentials are correct"
echo "4. Network connectivity between server and RDS"