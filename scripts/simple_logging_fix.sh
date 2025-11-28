#!/bin/bash
echo "🔧 Simple logging fix for AWS server..."

cd /var/www/html/medcor_backend2

# Create logs directory
mkdir -p logs
chmod 755 logs

# Backup current settings
cp medcor_backend2/settings.py medcor_backend2/settings.py.backup.$(date +%Y%m%d_%H%M%S)

echo "📋 Current logging configuration:"
grep -A 5 -B 5 "filename.*django.log" medcor_backend2/settings.py

# Use a more specific sed command to replace the filename
sed -i 's/"filename": "django.log"/"filename": os.path.join(BASE_DIR, "logs", "django.log")/' medcor_backend2/settings.py

echo "📋 Updated logging configuration:"
grep -A 5 -B 5 "filename.*django.log" medcor_backend2/settings.py

# Test Django configuration
echo "🧪 Testing Django configuration..."
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