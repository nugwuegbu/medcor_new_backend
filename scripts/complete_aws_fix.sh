#!/bin/bash
echo "🚀 Complete AWS Server Fix for MedCor Backend"
echo "=============================================="

# Navigate to project directory
cd /var/www/html/medcor_backend2

# Create backup
BACKUP_FILE="medcor_backend2/settings.py.backup.complete.$(date +%Y%m%d_%H%M%S)"
cp medcor_backend2/settings.py "$BACKUP_FILE"
echo "📦 Created backup: $BACKUP_FILE"

# Step 1: Fix logging configuration
echo "🔧 Step 1: Fixing logging configuration..."
mkdir -p logs
chmod 755 logs

# Fix the logging filename to use absolute path
sed -i 's/"filename": "django.log",/"filename": os.path.join(BASE_DIR, "logs", "django.log"),/' medcor_backend2/settings.py
echo "✅ Logging configuration fixed"

# Step 2: Fix ALLOWED_HOSTS
echo "🌐 Step 2: Fixing ALLOWED_HOSTS configuration..."

# Get the server's public IP
SERVER_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "51.16.221.91")
echo "🌐 Server IP detected: $SERVER_IP"

# Add IPs to ALLOWED_HOSTS if not already present
if ! grep -q "'$SERVER_IP'" medcor_backend2/settings.py; then
    sed -i "/ALLOWED_HOSTS = \[/a\\    '$SERVER_IP'," medcor_backend2/settings.py
    echo "✅ Added $SERVER_IP to ALLOWED_HOSTS"
fi

if ! grep -q "'localhost'" medcor_backend2/settings.py; then
    sed -i "/ALLOWED_HOSTS = \[/a\\    'localhost'," medcor_backend2/settings.py
    echo "✅ Added localhost to ALLOWED_HOSTS"
fi

if ! grep -q "'127.0.0.1'" medcor_backend2/settings.py; then
    sed -i "/ALLOWED_HOSTS = \[/a\\    '127.0.0.1'," medcor_backend2/settings.py
    echo "✅ Added 127.0.0.1 to ALLOWED_HOSTS"
fi

# Step 3: Show current configuration
echo "📋 Current ALLOWED_HOSTS setting:"
grep -A 10 "ALLOWED_HOSTS = \[" medcor_backend2/settings.py

echo "📋 Current logging configuration:"
grep -A 5 '"filename":' medcor_backend2/settings.py

# Step 4: Restart services
echo "🔄 Step 3: Restarting services..."

# Stop gunicorn first
sudo systemctl stop gunicorn
sleep 2

# Start gunicorn
sudo systemctl start gunicorn
sleep 3

# Check status
echo "📊 Checking gunicorn status..."
sudo systemctl status gunicorn --no-pager

# Step 5: Test the application
echo "🧪 Step 4: Testing the application..."

# Test local connection
echo "Testing local connection..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/ | grep -q "200\|301\|302"; then
    echo "✅ Local connection successful"
else
    echo "❌ Local connection failed"
fi

# Test external connection
echo "Testing external connection..."
if curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP:8000/ | grep -q "200\|301\|302"; then
    echo "✅ External connection successful"
else
    echo "❌ External connection failed"
fi

# Show recent logs
echo "📋 Recent gunicorn logs:"
sudo journalctl -u gunicorn --no-pager -n 20

echo "🎉 Complete fix applied!"
echo "🌐 Your application should now be accessible at: http://$SERVER_IP:8000/"