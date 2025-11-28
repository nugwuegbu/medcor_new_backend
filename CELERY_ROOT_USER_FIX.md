# Fix Celery Service - Root User Issue

## 🚨 Problem

Celery service is failing with:
```
SecurityWarning: You're running the worker with superuser privileges: this is absolutely not recommended!
Please specify a different user using the --uid option.
```

**Status:** Service exits with code 1 and keeps restarting (restart counter: 52123+)

---

## ✅ Solution

Run Celery as a non-root user (recommended: `celery` or `www-data`)

---

## 🔧 Quick Fix

### **Option 1: Use the Fix Script (Recommended)**

```bash
# On your server
cd /var/www/html/medcor_backend2
chmod +x fix-celery-root-user.sh
sudo ./fix-celery-root-user.sh
```

### **Option 2: Manual Fix**

#### **Step 1: Create Celery User**

```bash
sudo useradd -r -s /bin/false celery
```

#### **Step 2: Create Directories**

```bash
sudo mkdir -p /var/log/celery
sudo mkdir -p /var/run/celery
sudo chown -R celery:celery /var/log/celery
sudo chown -R celery:celery /var/run/celery
```

#### **Step 3: Update Service File**

```bash
sudo nano /etc/systemd/system/celery.service
```

**Change these lines:**
```ini
# FROM:
User=root
Group=root

# TO:
User=celery
Group=celery
```

**Or use this complete service file:**

```ini
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
```

#### **Step 4: Set Project Permissions**

```bash
# Option A: Change ownership (if you want celery to own everything)
sudo chown -R celery:celery /var/www/html/medcor_backend2

# Option B: Add celery to www-data group (if project is owned by www-data)
sudo usermod -a -G www-data celery
sudo chmod -R g+rx /var/www/html/medcor_backend2
```

#### **Step 5: Reload and Restart**

```bash
sudo systemctl daemon-reload
sudo systemctl stop celery.service
sudo systemctl start celery.service
sudo systemctl status celery.service
```

---

## 🔍 Alternative: Use www-data User

If your project is already owned by `www-data`, you can use that instead:

```bash
# Update service file
sudo sed -i 's/User=root/User=www-data/' /etc/systemd/system/celery.service
sudo sed -i 's/Group=root/Group=www-data/' /etc/systemd/system/celery.service

# Set directory ownership
sudo chown -R www-data:www-data /var/log/celery
sudo chown -R www-data:www-data /var/run/celery

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart celery.service
```

---

## ✅ Verification

After fixing, check:

```bash
# Check service status
sudo systemctl status celery.service

# Check logs
sudo journalctl -u celery.service -f

# Should see:
# ✅ No security warnings
# ✅ Service running
# ✅ No exit errors
```

---

## 🆘 Troubleshooting

### **Issue: Permission Denied**

```bash
# Fix project directory permissions
sudo chown -R celery:celery /var/www/html/medcor_backend2
# OR
sudo chmod -R 755 /var/www/html/medcor_backend2
```

### **Issue: Cannot Write to Log File**

```bash
# Fix log directory permissions
sudo chown -R celery:celery /var/log/celery
sudo chmod -R 755 /var/log/celery
```

### **Issue: Cannot Write PID File**

```bash
# Fix PID directory permissions
sudo chown -R celery:celery /var/run/celery
sudo chmod -R 755 /var/run/celery
```

### **Issue: Cannot Access Virtual Environment**

```bash
# Make venv accessible
sudo chmod -R 755 /var/www/html/medcor_backend2/venv
# OR change ownership
sudo chown -R celery:celery /var/www/html/medcor_backend2/venv
```

---

## 📝 Summary

**Problem:** Celery refuses to run as root user  
**Solution:** Run as `celery` or `www-data` user  
**Time:** ~2 minutes  
**Risk:** Low (just changing user)

**Quick Command:**
```bash
sudo useradd -r -s /bin/false celery && \
sudo mkdir -p /var/log/celery /var/run/celery && \
sudo chown -R celery:celery /var/log/celery /var/run/celery && \
sudo sed -i 's/User=root/User=celery/' /etc/systemd/system/celery.service && \
sudo sed -i 's/Group=root/Group=celery/' /etc/systemd/system/celery.service && \
sudo systemctl daemon-reload && \
sudo systemctl restart celery.service
```

---

## ✅ After Fix

Your Celery service should:
- ✅ Start without security warnings
- ✅ Run continuously without crashes
- ✅ Process tasks normally
- ✅ Log to `/var/log/celery/worker.log`













