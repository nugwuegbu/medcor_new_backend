#!/bin/bash

# Final Working MCP Service Fix
echo "🚀 Final Working MCP Service Fix"
echo "==============================="

# Stop the service
sudo systemctl stop mcp-server

# Create a working MCP service wrapper that handles STDIO properly
echo "📝 Creating working MCP service wrapper..."
cat > /var/www/html/medcor_backend2/mcp_service.py << 'EOF'
#!/usr/bin/env python3
"""
MCP Service Wrapper for Systemd - Working Version
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
    """Run the MCP server using subprocess to handle STDIO properly"""
    try:
        logger.info("Starting MCP server...")
        
        # Run the MCP server as a subprocess with proper STDIO handling
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

# Test the service wrapper
echo "🧪 Testing working MCP service wrapper..."
cd /var/www/html/medcor_backend2
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=medcor_backend2.settings
export PYTHONPATH=/var/www/html/medcor_backend2

# Test if it can be imported
python -c "import mcp_service; print('✅ Working MCP service wrapper imports successfully')"

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
    echo ""
    echo "🎉 MCP server is now running as a systemd service!"
    echo "📝 Note: This MCP server uses STDIO transport and is designed for programmatic access"
    echo "🔧 Service management commands:"
    echo "   Status:  sudo systemctl status mcp-server"
    echo "   Logs:    sudo journalctl -u mcp-server -f"
    echo "   Restart: sudo systemctl restart mcp-server"
    echo "   Stop:    sudo systemctl stop mcp-server"
else
    echo "❌ MCP server service failed to start"
    echo "📋 Recent logs:"
    sudo journalctl -u mcp-server --no-pager -n 10
fi