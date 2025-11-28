#!/bin/bash
echo "🔧 Fixing Django ALLOWED_HOSTS configuration on AWS server..."

# Navigate to project directory
cd /var/www/html/medcor_backend2

# Backup current settings
cp medcor_backend2/settings.py medcor_backend2/settings.py.backup.allowed_hosts.$(date +%Y%m%d_%H%M%S)

# Get the server's public IP
SERVER_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "51.16.221.91")

echo "🌐 Server IP detected: $SERVER_IP"

# Add the IP to ALLOWED_HOSTS if it's not already there
if ! grep -q "'$SERVER_IP'" medcor_backend2/settings.py; then
    echo "➕ Adding $SERVER_IP to ALLOWED_HOSTS..."
    
    # Find the ALLOWED_HOSTS line and add the IP
    sed -i "/ALLOWED_HOSTS = \[/a\\    '$SERVER_IP'," medcor_backend2/settings.py
    
    # Also add localhost and common variations
    sed -i "/ALLOWED_HOSTS = \[/a\\    'localhost'," medcor_backend2/settings.py
    sed -i "/ALLOWED_HOSTS = \[/a\\    '127.0.0.1'," medcor_backend2/settings.py
    
    echo "✅ Added $SERVER_IP, localhost, and 127.0.0.1 to ALLOWED_HOSTS"
else
    echo "ℹ️  $SERVER_IP already in ALLOWED_HOSTS"
fi

# Show the current ALLOWED_HOSTS setting
echo "📋 Current ALLOWED_HOSTS setting:"
grep -A 10 "ALLOWED_HOSTS = \[" medcor_backend2/settings.py

# Restart gunicorn service
echo "🔄 Restarting gunicorn service..."
sudo systemctl restart gunicorn

# Wait a moment for the service to start
sleep 3

# Check status
echo "📊 Checking service status..."
sudo systemctl status gunicorn --no-pager

# Test the endpoint
echo "🧪 Testing the endpoint..."
curl -I http://localhost:8000/ || echo "❌ Local test failed"
curl -I http://$SERVER_IP:8000/ || echo "❌ External test failed"

echo "🎉 ALLOWED_HOSTS fix completed!"