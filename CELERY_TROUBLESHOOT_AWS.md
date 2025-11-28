# Celery Service Troubleshooting Guide for AWS

## Current Issue
Celery service is failing to start with exit code 1.

## Diagnostic Steps

### 1. Check Systemd Journal Logs
```bash
sudo journalctl -u celery.service -n 50 --no-pager
```

### 2. Check Celery Log File (if exists)
```bash
sudo tail -50 /var/log/celery/worker.log
```

### 3. Check Permissions
```bash
# Check if directories exist and have correct permissions
ls -la /var/log/celery/
ls -la /var/run/celery/
```

### 4. Test Celery Manually
```bash
cd /var/www/html/medcor_backend2
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=medcor_backend2.settings
export PYTHONPATH=/var/www/html/medcor_backend2

# Test Celery app import
python -c "from medcor_backend2.celery import app; print('OK')"

# Test Celery worker (dry run)
celery -A medcor_backend2 worker --loglevel=info --dry-run
```

### 5. Check RabbitMQ Status
```bash
sudo systemctl status rabbitmq-server
sudo rabbitmqctl status
```

### 6. Check Service Configuration
```bash
sudo cat /etc/systemd/system/celery.service
```

## Common Issues and Fixes

### Issue 1: NumPy/OpenCV Compatibility (Current)
If you see NumPy errors, fix NumPy version:
```bash
source venv/bin/activate
pip uninstall numpy -y
pip install "numpy<2.0"
```

### Issue 2: Missing Directories
```bash
sudo mkdir -p /var/log/celery
sudo mkdir -p /var/run/celery
sudo chown -R www-data:www-data /var/log/celery
sudo chown -R www-data:www-data /var/run/celery
```

### Issue 3: RabbitMQ Not Running
```bash
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server
```

### Issue 4: Django Settings Not Loaded
Ensure the service file has correct environment variables:
- `DJANGO_SETTINGS_MODULE=medcor_backend2.settings`
- `PYTHONPATH=/var/www/html/medcor_backend2`

### Issue 5: Virtual Environment Path
Ensure the service file uses the correct venv path:
- `/var/www/html/medcor_backend2/venv/bin/celery`

## Quick Fix Script

```bash
#!/bin/bash
cd /var/www/html/medcor_backend2
source venv/bin/activate

# Fix NumPy if needed
pip install "numpy<2.0" --force-reinstall

# Create directories
sudo mkdir -p /var/log/celery /var/run/celery
sudo chown -R www-data:www-data /var/log/celery /var/run/celery

# Ensure RabbitMQ is running
sudo systemctl start rabbitmq-server

# Test Celery
export DJANGO_SETTINGS_MODULE=medcor_backend2.settings
celery -A medcor_backend2 inspect active

# Restart service
sudo systemctl restart celery.service
sudo systemctl status celery.service
```




























