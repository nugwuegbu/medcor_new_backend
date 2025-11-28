#!/bin/bash

# Complete MCP Service Fix
echo "🚀 Complete MCP Service Fix"
echo "=========================="

# Stop the service
sudo systemctl stop mcp-server

# Create a proper MCP service wrapper
echo "📝 Creating MCP service wrapper..."
cat > /var/www/html/medcor_backend2/mcp_service.py << 'EOF'
#!/usr/bin/env python3
"""
MCP Service Wrapper for Systemd
"""

import os
import sys
import time
import signal
import logging
from datetime import datetime

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medcor_backend2.settings")
import django
django.setup()

# Import the MCP server
from mcp_server import mcp

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/mcp-server.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('mcp-server')

def main():
    """Main MCP server service loop"""
    logger.info("Starting MCP server service...")
    
    try:
        # Run the MCP server
        logger.info("MCP server is running...")
        mcp.run()
        
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt, shutting down...")
    except Exception as e:
        logger.error(f"MCP server error: {e}")
        raise
    finally:
        logger.info("MCP server service stopped")

if __name__ == "__main__":
    main()
EOF

# Make it executable
chmod +x /var/www/html/medcor_backend2/mcp_service.py

# Update the systemd service file
echo "🔧 Updating systemd service file..."
sudo tee /etc/systemd/system/mcp-server.service > /dev/null << 'EOF'
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
Environment=PYTHONUNBUFFERED=1
ExecStart=/var/www/html/medcor_backend2/venv/bin/python /var/www/html/medcor_backend2/mcp_service.py
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mcp-server

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/html/medcor_backend2

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

# Reset failure count
sudo systemctl reset-failed mcp-server

# Test the service wrapper
echo "🧪 Testing MCP service wrapper..."
cd /var/www/html/medcor_backend2
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=medcor_backend2.settings
export PYTHONPATH=/var/www/html/medcor_backend2

# Test if the wrapper can be imported
python -c "import mcp_service; print('✅ MCP service wrapper imports successfully')"

# Start the service
echo "🚀 Starting MCP server service..."
sudo systemctl start mcp-server

# Wait and check status
sleep 5
echo "📊 Service status:"
sudo systemctl status mcp-server --no-pager

# Check logs
echo "📋 Recent logs:"
sudo journalctl -u mcp-server --no-pager -n 10