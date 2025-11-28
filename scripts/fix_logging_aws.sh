#!/bin/bash

# Fix Django Logging Configuration on AWS Server
# This script fixes the logging configuration issue that prevents gunicorn from starting

echo "🔧 Fixing Django logging configuration on AWS server..."

# Navigate to the project directory
cd /var/www/html/medcor_backend2 || {
    echo "❌ Error: Could not find project directory at /var/www/html/medcor_backend2"
    echo "Please update the path in this script to match your actual project location"
    exit 1
}

# Create logs directory if it doesn't exist
echo "📁 Creating logs directory..."
mkdir -p logs
chmod 755 logs

# Backup the current settings.py
echo "💾 Creating backup of settings.py..."
cp medcor_backend2/settings.py medcor_backend2/settings.py.backup.$(date +%Y%m%d_%H%M%S)

# Fix the logging configuration
echo "🔨 Updating logging configuration in settings.py..."

# Create a temporary Python script to fix the logging configuration
cat > fix_logging.py << 'EOF'
import os
import re

# Read the settings.py file
with open('medcor_backend2/settings.py', 'r') as f:
    content = f.read()

# Find the logging configuration section
logging_start = content.find('# Logging Configuration')
if logging_start == -1:
    print("❌ Error: Could not find logging configuration section")
    exit(1)

# Find the end of the logging configuration
logging_end = content.find('}', logging_start)
if logging_end == -1:
    print("❌ Error: Could not find end of logging configuration")
    exit(1)

# Extract the logging configuration
logging_section = content[logging_start:logging_end + 1]

# Check if the fix is already applied
if 'os.path.join(BASE_DIR, "logs", "django.log")' in logging_section:
    print("✅ Logging configuration already fixed")
    exit(0)

# Replace the filename in the file handler
old_filename = '"filename": "django.log",'
new_filename = '"filename": os.path.join(BASE_DIR, "logs", "django.log"),'

if old_filename in logging_section:
    logging_section = logging_section.replace(old_filename, new_filename)
    
    # Replace the entire logging section in the content
    new_content = content[:logging_start] + logging_section + content[logging_end + 1:]
    
    # Write the updated content back to the file
    with open('medcor_backend2/settings.py', 'w') as f:
        f.write(new_content)
    
    print("✅ Successfully updated logging configuration")
else:
    print("❌ Error: Could not find the filename configuration to replace")
    print("Current logging section:")
    print(logging_section)
    exit(1)
EOF

# Run the Python script to fix the logging configuration
python3 fix_logging.py

# Clean up the temporary script
rm fix_logging.py

# Set proper ownership for the logs directory
echo "🔐 Setting proper ownership for logs directory..."
sudo chown -R www-data:www-data logs/ 2>/dev/null || echo "⚠️  Could not set ownership (may need to run with sudo)"

# Test Django configuration
echo "🧪 Testing Django configuration..."
source venv/bin/activate 2>/dev/null || {
    echo "⚠️  Virtual environment not found, trying without activation..."
    python3 manage.py check --deploy
}

if [ $? -eq 0 ]; then
    echo "✅ Django configuration check passed"
else
    echo "❌ Django configuration check failed"
    echo "Please check the error messages above"
fi

# Test gunicorn configuration
echo "🧪 Testing gunicorn configuration..."
source venv/bin/activate 2>/dev/null || echo "⚠️  Virtual environment not found, trying without activation..."
gunicorn --check-config medcor_backend2.wsgi:application

if [ $? -eq 0 ]; then
    echo "✅ Gunicorn configuration check passed"
else
    echo "❌ Gunicorn configuration check failed"
    echo "Please check the error messages above"
fi

echo ""
echo "🎉 Logging configuration fix completed!"
echo ""
echo "Next steps:"
echo "1. Restart the gunicorn service: sudo systemctl restart gunicorn"
echo "2. Check service status: sudo systemctl status gunicorn"
echo "3. Check logs: sudo journalctl -u gunicorn -f"
echo ""
echo "If you need to revert the changes, restore from backup:"
echo "cp medcor_backend2/settings.py.backup.* medcor_backend2/settings.py"