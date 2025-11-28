#!/bin/bash
echo "🔧 Fixing pathlib.Path logging configuration on AWS server..."

cd /var/www/html/medcor_backend2

# Create logs directory
mkdir -p logs
chmod 755 logs

# Backup current settings
cp medcor_backend2/settings.py medcor_backend2/settings.py.backup.pathlib.$(date +%Y%m%d_%H%M%S)

echo "📋 Current BASE_DIR definition:"
grep -n "BASE_DIR" medcor_backend2/settings.py

echo "📋 Current logging configuration:"
grep -A 5 -B 5 "filename.*django.log" medcor_backend2/settings.py

# Fix the logging configuration to use pathlib syntax
echo "🔧 Updating logging configuration to use pathlib syntax..."
sed -i 's/"filename": os.path.join(BASE_DIR, "logs", "django.log")/"filename": str(BASE_DIR \/ "logs" \/ "django.log")/' medcor_backend2/settings.py

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