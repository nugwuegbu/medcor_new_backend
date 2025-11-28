#!/bin/bash

# Check and Fix MCP Service
echo "🔍 Checking and Fixing MCP Service"
echo "=================================="

# Check current service status
echo "📊 Current service status:"
sudo systemctl status mcp-server --no-pager

# Check what's actually running
echo "🔍 Current processes:"
ps aux | grep mcp

# Check the current service wrapper file
echo "📄 Current service wrapper content:"
head -50 /var/www/html/medcor_backend2/mcp_service.py

# Stop the service
echo "🛑 Stopping MCP server service..."
sudo systemctl stop mcp-server

# Wait a moment
sleep 2

# Kill any remaining processes
echo "🧹 Cleaning up any remaining processes..."
sudo pkill -f mcp_server.py || true
sudo pkill -f mcp_service.py || true

# Create the correct service wrapper
echo "📝 Creating correct MCP service wrapper..."
cat > /var/www/html/medcor_backend2/mcp_service.py << 'EOF'
#!/usr/bin/env python3
"""
MCP Service Wrapper for Systemd - Correct Version
"""

import os
import sys
import time
import signal
import logging
import threading
import subprocess
from datetime import datetime

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medcor_backend2.settings")
import django
django.setup()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger('mcp-server')

# Global flag for shutdown
shutdown_flag = False

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    global shutdown_flag
    logger.info(f"Received signal {signum}, initiating shutdown...")
    shutdown_flag = True

def run_mcp_server():
    """Run the MCP server using subprocess"""
    try:
        logger.info("Starting MCP server...")
        
        # Run the MCP server as a subprocess
        process = subprocess.Popen(
            [sys.executable, '/var/www/html/medcor_backend2/mcp_server.py'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd='/var/www/html/medcor_backend2'
        )
        
        # Keep the process alive
        while not shutdown_flag and process.poll() is None:
            time.sleep(1)
            
        if process.poll() is not None:
            logger.error(f"MCP server process exited with code {process.returncode}")
            stdout, stderr = process.communicate()
            if stdout:
                logger.info(f"MCP server stdout: {stdout}")
            if stderr:
                logger.error(f"MCP server stderr: {stderr}")
                
    except Exception as e:
        logger.error(f"MCP server error: {e}")
        raise

def main():
    """Main service loop"""
    global shutdown_flag
    
    # Setup signal handlers
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    logger.info("Starting MCP server service...")
    
    # Start MCP server in a separate thread
    mcp_thread = threading.Thread(target=run_mcp_server, daemon=True)
    mcp_thread.start()
    
    # Keep the main thread alive
    try:
        while not shutdown_flag:
            time.sleep(1)
            if not mcp_thread.is_alive():
                logger.error("MCP server thread died, restarting...")
                mcp_thread = threading.Thread(target=run_mcp_server, daemon=True)
                mcp_thread.start()
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt, shutting down...")
    finally:
        shutdown_flag = True
        logger.info("MCP server service stopped")

if __name__ == "__main__":
    main()
EOF

# Make it executable
chmod +x /var/www/html/medcor_backend2/mcp_service.py

# Reset failure count
sudo systemctl reset-failed mcp-server

# Start the service
echo "🚀 Starting MCP server service..."
sudo systemctl start mcp-server

# Wait and check status
sleep 5
echo "📊 Service status:"
sudo systemctl status mcp-server --no-pager

# Check if it's running
if sudo systemctl is-active --quiet mcp-server; then
    echo "✅ MCP server service is running successfully!"
    echo "📋 Recent logs:"
    sudo journalctl -u mcp-server --no-pager -n 10
else
    echo "❌ MCP server service failed to start"
    echo "📋 Recent logs:"
    sudo journalctl -u mcp-server --no-pager -n 10
fi