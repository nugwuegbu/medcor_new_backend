#!/bin/bash
echo "🔍 Debugging and fixing logging configuration on AWS server..."

# Navigate to project directory
cd /var/www/html/medcor_backend2

echo "📋 Current working directory: $(pwd)"
echo "📋 Current settings.py content around logging:"
grep -A 10 -B 5 "filename.*django.log" medcor_backend2/settings.py

echo "📋 Checking if logs directory exists:"
ls -la logs/ 2>/dev/null || echo "❌ logs directory does not exist"

echo "📋 Checking if os is imported:"
grep -n "import os" medcor_backend2/settings.py || echo "❌ os import not found"

echo "🔧 Creating logs directory..."
mkdir -p logs
chmod 755 logs
echo "✅ logs directory created"

echo "🔧 Fixing the logging configuration with a more robust approach..."

# Create a temporary Python script to fix the settings
cat > /tmp/fix_settings.py << 'EOF'
import os
import re

# Read the settings file
with open('medcor_backend2/settings.py', 'r') as f:
    content = f.read()

# Get the base directory (assuming it's defined as BASE_DIR)
base_dir_match = re.search(r'BASE_DIR\s*=\s*[^\n]+', content)
if base_dir_match:
    print(f"Found BASE_DIR: {base_dir_match.group()}")
else:
    print("❌ BASE_DIR not found in settings.py")

# Fix the filename in the logging configuration
# Look for the file handler configuration
file_handler_pattern = r'("file":\s*{[^}]*"filename":\s*)"[^"]*"([^}]*})'
replacement = r'\1os.path.join(BASE_DIR, "logs", "django.log")\2'

new_content = re.sub(file_handler_pattern, replacement, content, flags=re.DOTALL)

# Check if the replacement was made
if new_content != content:
    print("✅ Logging configuration updated")
    
    # Write the updated content back
    with open('medcor_backend2/settings.py', 'w') as f:
        f.write(new_content)
    
    print("📋 Updated logging configuration:")
    grep_pattern = r'"file":\s*{[^}]*"filename":\s*[^,]*'
    import re
    match = re.search(grep_pattern, new_content, re.DOTALL)
    if match:
        print(match.group())
else:
    print("❌ No changes made to logging configuration")
    print("📋 Current file handler configuration:")
    file_handler_match = re.search(r'"file":\s*{[^}]*}', content, re.DOTALL)
    if file_handler_match:
        print(file_handler_match.group())
EOF

# Run the Python script
python3 /tmp/fix_settings.py

echo "📋 Final logging configuration:"
grep -A 10 -B 5 "filename.*django.log" medcor_backend2/settings.py

echo "🧪 Testing Django configuration..."
python3 manage.py check --deploy

echo "🔄 Restarting gunicorn..."
sudo systemctl restart gunicorn
sleep 3

echo "📊 Checking gunicorn status..."
sudo systemctl status gunicorn --no-pager

echo "📋 Recent logs:"
sudo journalctl -u gunicorn --no-pager -n 10