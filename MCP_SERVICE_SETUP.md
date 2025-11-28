# MCP Server Service Setup Guide

This guide shows you how to set up the MCP server as a systemd service on your AWS server.

## 🚀 Quick Setup (One Command)

**Run this single command on your AWS server:**

```bash
sudo bash scripts/setup_mcp_service.sh
```

## 📋 Manual Setup Steps

### Step 1: Upload Scripts to AWS Server

```bash
# Upload the setup script to your AWS server
scp scripts/setup_mcp_service.sh ubuntu@your-server-ip:/var/www/html/medcor_backend2/scripts/
scp scripts/mcp_service_manager.sh ubuntu@your-server-ip:/var/www/html/medcor_backend2/scripts/
scp scripts/start_mcp_server.sh ubuntu@your-server-ip:/var/www/html/medcor_backend2/scripts/

# Make them executable
ssh ubuntu@your-server-ip "chmod +x /var/www/html/medcor_backend2/scripts/*.sh"
```

### Step 2: Setup the Service

```bash
# SSH into your AWS server
ssh ubuntu@your-server-ip

# Navigate to project directory
cd /var/www/html/medcor_backend2

# Run the setup script as root
sudo bash scripts/setup_mcp_service.sh
```

### Step 3: Verify the Service

```bash
# Check service status
sudo systemctl status mcp-server

# Check if it's running
sudo systemctl is-active mcp-server

# View logs
sudo journalctl -u mcp-server -f
```

## 🛠️ Service Management

### Using the Service Manager Script

```bash
# Start the service
bash scripts/mcp_service_manager.sh start

# Stop the service
bash scripts/mcp_service_manager.sh stop

# Restart the service
bash scripts/mcp_service_manager.sh restart

# Check status
bash scripts/mcp_service_manager.sh status

# View logs
bash scripts/mcp_service_manager.sh logs

# Test the service
bash scripts/mcp_service_manager.sh test
```

### Using Systemctl Commands

```bash
# Start service
sudo systemctl start mcp-server

# Stop service
sudo systemctl stop mcp-server

# Restart service
sudo systemctl restart mcp-server

# Check status
sudo systemctl status mcp-server

# Enable auto-start on boot
sudo systemctl enable mcp-server

# Disable auto-start on boot
sudo systemctl disable mcp-server

# View logs
sudo journalctl -u mcp-server -f
```

## 🔧 Service Configuration

The service is configured with the following settings:

- **User**: ubuntu
- **Working Directory**: /var/www/html/medcor_backend2
- **Python Executable**: /var/www/html/medcor_backend2/venv/bin/python
- **Auto Restart**: Yes (with 5-second delay)
- **Logs**: Systemd journal
- **Security**: Restricted permissions

## 📊 Monitoring and Logs

### View Real-time Logs

```bash
# Follow logs in real-time
sudo journalctl -u mcp-server -f

# View last 50 lines
sudo journalctl -u mcp-server -n 50

# View logs from today
sudo journalctl -u mcp-server --since today
```

### Check Service Health

```bash
# Check if service is running
sudo systemctl is-active mcp-server

# Check if service is enabled
sudo systemctl is-enabled mcp-server

# Check service health
sudo systemctl is-healthy mcp-server
```

## 🚨 Troubleshooting

### Common Issues

1. **Service fails to start**

   ```bash
   # Check logs for errors
   sudo journalctl -u mcp-server -n 20

   # Check if virtual environment exists
   ls -la /var/www/html/medcor_backend2/venv/

   # Check if MCP server file exists
   ls -la /var/www/html/medcor_backend2/mcp_server.py
   ```

2. **Permission issues**

   ```bash
   # Fix ownership
   sudo chown -R ubuntu:ubuntu /var/www/html/medcor_backend2

   # Fix permissions
   sudo chmod +x /var/www/html/medcor_backend2/scripts/*.sh
   ```

3. **Django settings issues**
   ```bash
   # Test Django setup
   cd /var/www/html/medcor_backend2
   source venv/bin/activate
   python manage.py check
   ```

### Manual Service File Creation

If the automated setup fails, create the service file manually:

```bash
sudo nano /etc/systemd/system/mcp-server.service
```

Add this content:

```ini
[Unit]
Description=MedCor MCP Server
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/var/www/html/medcor_backend2
Environment=DJANGO_SETTINGS_MODULE=medcor_backend2.settings
Environment=PYTHONPATH=/var/www/html/medcor_backend2
ExecStart=/var/www/html/medcor_backend2/venv/bin/python /var/www/html/medcor_backend2/mcp_server.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then reload and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mcp-server
sudo systemctl start mcp-server
```

## ✅ Verification

After setup, verify everything is working:

```bash
# Check service status
sudo systemctl status mcp-server

# Check if MCP server is responding
ps aux | grep mcp_server.py

# Test Django functionality
cd /var/www/html/medcor_backend2
source venv/bin/activate
python manage.py check
```

## 🔄 Auto-Start on Boot

The service is automatically configured to start on boot. To verify:

```bash
# Check if enabled
sudo systemctl is-enabled mcp-server

# If not enabled, enable it
sudo systemctl enable mcp-server
```

## 📝 Service Files Created

- `/etc/systemd/system/mcp-server.service` - Systemd service file
- `scripts/setup_mcp_service.sh` - Setup script
- `scripts/mcp_service_manager.sh` - Management script
- `scripts/start_mcp_server.sh` - Manual startup script

## 🎉 Success!

Once setup is complete, your MCP server will:

- ✅ Start automatically on boot
- ✅ Restart automatically if it crashes
- ✅ Log all output to systemd journal
- ✅ Run with proper security restrictions
- ✅ Be manageable with standard systemctl commands

The MCP server is now running as a proper system service! 🚀
