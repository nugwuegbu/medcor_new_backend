#!/bin/bash

# Quick fix for Django logging configuration on AWS server
# Run this command on your AWS server

echo "🔧 Quick fix for Django logging configuration..."

# Navigate to project directory and create logs folder
cd /var/www/html/medcor_backend2 && mkdir -p logs && chmod 755 logs

# Fix the logging configuration using sed
sed -i 's/"filename": "django.log",/"filename": os.path.join(BASE_DIR, "logs", "django.log"),/' medcor_backend2/settings.py

echo "✅ Logging configuration fixed!"
echo "🔄 Restarting gunicorn service..."

# Restart gunicorn service
sudo systemctl restart gunicorn

# Check service status
echo "📊 Checking service status..."
sudo systemctl status gunicorn --no-pager

echo "🎉 Fix completed! Check the status above to confirm gunicorn is running."