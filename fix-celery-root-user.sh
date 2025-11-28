#!/bin/bash

# Fix Celery Service - Run as Non-Root User
# This script fixes the Celery service to run as www-data instead of root

set -e

echo "🔧 Fixing Celery service to run as non-root user..."

# Step 1: Create celery user if it doesn't exist
if ! id "celery" &>/dev/null; then
    echo "Creating celery user..."
    useradd -r -s /bin/false celery
    echo "✅ Celery user created"
else
    echo "✅ Celery user already exists"
fi

# Step 2: Create necessary directories
echo "Creating Celery directories..."
mkdir -p /var/log/celery
mkdir -p /var/run/celery

# Step 3: Set proper ownership
echo "Setting directory permissions..."
chown -R celery:celery /var/log/celery
chown -R celery:celery /var/run/celery

# Step 4: Update Celery systemd service file
echo "Updating Celery systemd service file..."
cat > /etc/systemd/system/celery.service << 'EOF'
[Unit]
Description=Celery Worker for MedCor
After=network.target rabbitmq-server.service
Requires=rabbitmq-server.service

[Service]
Type=simple
User=celery
Group=celery
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

# Step 5: Give celery user access to project directory
echo "Setting project directory permissions..."
chown -R celery:celery /var/www/html/medcor_backend2
# Or if you want to keep ownership but allow access:
# chmod -R g+rx /var/www/html/medcor_backend2
# usermod -a -G $(stat -c '%G' /var/www/html/medcor_backend2) celery

# Step 6: Reload systemd
echo "Reloading systemd..."
systemctl daemon-reload

# Step 7: Stop current service
echo "Stopping current Celery service..."
systemctl stop celery.service || true
pkill -9 -f "celery.*worker" || true

# Step 8: Start service
echo "Starting Celery service..."
systemctl start celery.service

# Step 9: Enable service
systemctl enable celery.service

# Step 10: Check status
sleep 3
echo ""
echo "Checking service status..."
systemctl status celery.service --no-pager | head -20

echo ""
echo "✅ Celery service fixed!"
echo "View logs with: journalctl -u celery.service -f"













