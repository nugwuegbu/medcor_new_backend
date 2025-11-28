#!/bin/bash
echo "🔧 Complete Logging Configuration Fix for AWS Server"
echo "=================================================="

cd /var/www/html/medcor_backend2

# 1. Backup current settings
echo "📦 Creating backup..."
cp medcor_backend2/settings.py medcor_backend2/settings.py.backup.$(date +%Y%m%d_%H%M%S)

# 2. Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs
chmod 755 logs

# 3. Check current logging configuration
echo "📋 Current LOGGING configuration:"
grep -A 20 "LOGGING = {" medcor_backend2/settings.py

# 4. Create new logging configuration
echo "🔧 Creating new logging configuration..."
cat > /tmp/new_logging_config.py << 'EOF'
# Logging Configuration
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "file": {
            "level": "INFO",
            "class": "logging.FileHandler",
            "filename": "/var/www/html/medcor_backend2/logs/django.log",
            "formatter": "verbose",
        },
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "root": {
        "handlers": ["console", "file"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
        "youcam": {
            "handlers": ["console", "file"],
            "level": "DEBUG",
            "propagate": False,
        },
        "email_service": {
            "handlers": ["console", "file"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}
EOF

# 5. Replace the logging configuration using Python
echo "🔄 Updating logging configuration..."
python3 -c "
import re

# Read the settings file
with open('medcor_backend2/settings.py', 'r') as f:
    content = f.read()

# Read the new logging configuration
with open('/tmp/new_logging_config.py', 'r') as f:
    new_logging = f.read()

# Find and replace the LOGGING configuration
logging_pattern = r'LOGGING = \{.*?\n\}'
new_content = re.sub(logging_pattern, new_logging, content, flags=re.DOTALL)

# Write the updated content
with open('medcor_backend2/settings.py', 'w') as f:
    f.write(new_content)

print('✅ Logging configuration updated')
"

# 6. Verify the change
echo "📋 Updated LOGGING configuration:"
grep -A 20 "LOGGING = {" medcor_backend2/settings.py

# 7. Test Django configuration
echo "🧪 Testing Django configuration..."
source venv/bin/activate
python3 manage.py check --deploy

# 8. Restart gunicorn
echo "🔄 Restarting gunicorn..."
sudo systemctl restart gunicorn
sleep 3

# 9. Check status
echo "📊 Checking gunicorn status..."
sudo systemctl status gunicorn --no-pager

# 10. Test the application
echo "🧪 Testing the application..."
curl -I http://localhost:8000/ || echo "❌ Local test failed"
curl -I http://51.16.221.91:8000/ || echo "❌ External test failed"

# 11. Show recent logs
echo "📋 Recent gunicorn logs:"
sudo journalctl -u gunicorn --no-pager -n 10

echo "🎉 Complete logging fix applied!"