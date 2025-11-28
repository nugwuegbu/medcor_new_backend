#!/bin/bash

# Fix MCP Service Log Permissions
echo "🔧 Fixing MCP service log permissions..."

# Stop the service
sudo systemctl stop mcp-server

# Create log directory and file with proper permissions
sudo mkdir -p /var/log
sudo touch /var/log/mcp-server.log
sudo chown ubuntu:ubuntu /var/log/mcp-server.log
sudo chmod 644 /var/log/mcp-server.log

# Alternative: Update the service wrapper to use a different log location
echo "📝 Updating MCP service wrapper to use project log directory..."
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

# Setup logging to project directory
log_file = '/var/www/html/medcor_backend2/logs/mcp-server.log'
os.makedirs(os.path.dirname(log_file), exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
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

# Start the service
echo "🚀 Starting MCP server service..."
sudo systemctl start mcp-server

# Wait and check status
sleep 3
echo "📊 Service status:"
sudo systemctl status mcp-server --no-pager

# Check logs
echo "📋 Recent logs:"
sudo journalctl -u mcp-server --no-pager -n 10