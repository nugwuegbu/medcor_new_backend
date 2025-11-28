#!/bin/bash
echo "🔧 Simple string-based logging fix for AWS server..."

cd /var/www/html/medcor_backend2

# Create logs directory
mkdir -p logs
chmod 755 logs

# Backup current settings
cp medcor_backend2/settings.py medcor_backend2/settings.py.backup.string.$(date +%Y%m%d_%H%M%S)

echo "📋 Current logging configuration:"
grep -A 5 -B 5 "filename.*django.log" medcor_backend2/settings.py

# Fix the logging configuration to use a simple string path
echo "🔧 Updating logging configuration to use string path..."
sed -i 's/"filename": os.path.join(BASE_DIR, "logs", "django.log")/"filename": "\/var\/www\/html\/medcor_backend2\/logs\/django.log"/' medcor_backend2/settings.py

echo "📋 Updated logging configuration:"
grep -A 5 -B 5 "filename.*django.log" medcor_backend2/settings.py

# Test Django configuration with virtual environment
echo "🧪 Testing Django configuration..."
source venv/bin/activate
python3 manage.py check --deploy

# Restart gunicorn
echo "🔄 Restarting gunicorn..."
sudo systemctl restart gunicorn
sleep 3

# Check status
echo "📊 Checking gunicorn status..."
sudo systemctl status gunicorn --no-pager

echo "📋 Recent logs:"
sudo journalctl -u gunicorn --no-pager -n 15

# Test the application
echo "🧪 Testing the application..."
curl -I http://localhost:8000/ || echo "❌ Local test failed"
curl -I http://51.16.221.91:8000/ || echo "❌ External test failed"