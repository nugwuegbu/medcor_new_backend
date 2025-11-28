#!/bin/bash

# Celery Service Fix Script for AWS
# This script diagnoses and fixes Celery service issues

set -e

PROJECT_DIR="/var/www/html/medcor_backend2"
VENV_PATH="$PROJECT_DIR/venv"
CELERY_LOG_DIR="/var/log/celery"
CELERY_RUN_DIR="/var/run/celery"

echo "=== Celery Service Diagnostic and Fix ==="
echo ""

# Step 1: Check current service status
echo "1. Checking Celery service status..."
sudo systemctl status celery.service --no-pager | head -15 || true
echo ""

# Step 2: Check journal logs for actual error
echo "2. Checking systemd journal logs for errors..."
sudo journalctl -u celery.service -n 50 --no-pager | grep -i "error\|fail\|exception\|traceback" || echo "No obvious errors in recent logs"
echo ""

# Step 3: Fix NumPy compatibility
echo "3. Fixing NumPy compatibility issue..."
cd "$PROJECT_DIR"
source "$VENV_PATH/bin/activate"
pip uninstall numpy -y 2>/dev/null || true
pip install "numpy<2.0" --quiet
echo "✅ NumPy fixed"
echo ""

# Step 4: Create required directories
echo "4. Creating required directories..."
sudo mkdir -p "$CELERY_LOG_DIR"
sudo mkdir -p "$CELERY_RUN_DIR"
sudo chown -R www-data:www-data "$CELERY_LOG_DIR" "$CELERY_RUN_DIR" 2>/dev/null || sudo chown -R root:root "$CELERY_LOG_DIR" "$CELERY_RUN_DIR"
echo "✅ Directories created"
echo ""

# Step 5: Ensure RabbitMQ is running
echo "5. Checking RabbitMQ status..."
if sudo systemctl is-active --quiet rabbitmq-server; then
    echo "✅ RabbitMQ is running"
else
    echo "⚠️  Starting RabbitMQ..."
    sudo systemctl start rabbitmq-server
    sudo systemctl enable rabbitmq-server
    echo "✅ RabbitMQ started"
fi
echo ""

# Step 6: Test Celery import manually
echo "6. Testing Celery import..."
cd "$PROJECT_DIR"
source "$VENV_PATH/bin/activate"
export DJANGO_SETTINGS_MODULE=medcor_backend2.settings
export PYTHONPATH="$PROJECT_DIR"

if python -c "from medcor_backend2.celery import app; print('✅ Celery app import OK')" 2>&1; then
    echo "✅ Celery app can be imported"
else
    echo "❌ ERROR: Celery app import failed!"
    echo "This is likely the root cause. Error details:"
    python -c "from medcor_backend2.celery import app" 2>&1 || true
    exit 1
fi
echo ""

# Step 7: Update systemd service file
echo "7. Updating Celery systemd service file..."
sudo tee /etc/systemd/system/celery.service > /dev/null << 'EOF'
[Unit]
Description=Celery Worker for MedCor
After=network.target rabbitmq-server.service
Requires=rabbitmq-server.service

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/var/www/html/medcor_backend2
Environment="PATH=/var/www/html/medcor_backend2/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="DJANGO_SETTINGS_MODULE=medcor_backend2.settings"
Environment="PYTHONPATH=/var/www/html/medcor_backend2"
Environment="PYTHONUNBUFFERED=1"
ExecStart=/var/www/html/medcor_backend2/venv/bin/celery -A medcor_backend2 worker --loglevel=info --pidfile=/var/run/celery/worker.pid --logfile=/var/log/celery/worker.log
ExecStop=/bin/kill -s TERM $MAINPID
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Service file updated"
echo ""

# Step 8: Reload systemd and restart
echo "8. Reloading systemd and restarting Celery..."
sudo systemctl daemon-reload
sudo systemctl restart celery.service
sleep 3

# Step 9: Check final status
echo "9. Checking final service status..."
if sudo systemctl is-active --quiet celery.service; then
    echo "✅ Celery service is now running!"
    sudo systemctl status celery.service --no-pager | head -15
else
    echo "❌ Celery service is still not running. Checking logs..."
    sudo journalctl -u celery.service -n 30 --no-pager | tail -30
    echo ""
    echo "Trying to run Celery manually to see the actual error:"
    cd "$PROJECT_DIR"
    source "$VENV_PATH/bin/activate"
    export DJANGO_SETTINGS_MODULE=medcor_backend2.settings
    export PYTHONPATH="$PROJECT_DIR"
    timeout 5 celery -A medcor_backend2 worker --loglevel=info 2>&1 | head -20 || true
fi

echo ""
echo "=== Diagnostic Complete ==="
