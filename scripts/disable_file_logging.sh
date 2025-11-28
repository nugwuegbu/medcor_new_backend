#!/bin/bash
echo "🔧 Disabling File Logging to Get Gunicorn Working"
echo "================================================"

cd /var/www/html/medcor_backend2

# 1. Backup current settings
echo "📦 Creating backup..."
cp medcor_backend2/settings.py medcor_backend2/settings.py.backup.no_file_logging.$(date +%Y%m%d_%H%M%S)

# 2. Show current logging configuration
echo "📋 Current LOGGING configuration:"
grep -A 20 "LOGGING = {" medcor_backend2/settings.py

# 3. Create a minimal logging configuration without file handler
echo "🔧 Creating minimal logging configuration..."
cat > /tmp/minimal_logging_config.py << 'EOF'
# Minimal Logging Configuration (Console Only)
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
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "youcam": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "email_service": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}
EOF

# 4. Replace the logging configuration using Python
echo "🔄 Updating logging configuration..."
python3 -c "
import re

# Read the settings file
with open('medcor_backend2/settings.py', 'r') as f:
    content = f.read()

# Read the new logging configuration
with open('/tmp/minimal_logging_config.py', 'r') as f:
    new_logging = f.read()

# Find and replace the LOGGING configuration
logging_pattern = r'LOGGING = \{.*?\n\}'
new_content = re.sub(logging_pattern, new_logging, content, flags=re.DOTALL)

# Write the updated content
with open('medcor_backend2/settings.py', 'w') as f:
    f.write(new_content)

print('✅ Logging configuration updated (file logging disabled)')
"

# 5. Verify the change
echo "📋 Updated LOGGING configuration:"
grep -A 20 "LOGGING = {" medcor_backend2/settings.py

# 6. Test Django configuration
echo "🧪 Testing Django configuration..."
source venv/bin/activate
python3 manage.py check --deploy

# 7. Restart gunicorn
echo "🔄 Restarting gunicorn..."
sudo systemctl restart gunicorn
sleep 5

# 8. Check status
echo "📊 Checking gunicorn status..."
sudo systemctl status gunicorn --no-pager

# 9. Test the application
echo "🧪 Testing the application..."
curl -I http://localhost:8000/ || echo "❌ Local test failed"
curl -I http://51.16.221.91:8000/ || echo "❌ External test failed"

# 10. Show recent logs
echo "📋 Recent gunicorn logs:"
sudo journalctl -u gunicorn --no-pager -n 15

echo "🎉 File logging disabled - gunicorn should now work!"
echo "📝 Note: Logs will only go to console/systemd journal"