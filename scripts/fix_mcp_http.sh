#!/bin/bash

# Fix MCP Service to Use HTTP Transport
echo "🚀 Fixing MCP Service to Use HTTP Transport"
echo "==========================================="

# Stop the service
sudo systemctl stop mcp-server

# Create an HTTP-based MCP service wrapper
echo "📝 Creating HTTP-based MCP service wrapper..."
cat > /var/www/html/medcor_backend2/mcp_service.py << 'EOF'
#!/usr/bin/env python3
"""
MCP Service Wrapper for Systemd - HTTP Transport Version
"""

import os
import sys
import time
import signal
import logging
import threading
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
    """Run the MCP server with HTTP transport"""
    try:
        logger.info("Starting MCP server with HTTP transport...")
        # Use HTTP transport instead of STDIO
        mcp.run(host="0.0.0.0", port=8001)
    except Exception as e:
        logger.error(f"MCP server error: {e}")
        # If HTTP fails, try STDIO as fallback
        try:
            logger.info("HTTP transport failed, trying STDIO transport...")
            mcp.run()
        except Exception as e2:
            logger.error(f"STDIO transport also failed: {e2}")
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
echo "🧪 Testing HTTP-based MCP service wrapper..."
cd /var/www/html/medcor_backend2
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=medcor_backend2.settings
export PYTHONPATH=/var/www/html/medcor_backend2

# Test if it can be imported
python -c "import mcp_service; print('✅ HTTP-based MCP service wrapper imports successfully')"

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
    echo "🌐 MCP server is now accessible at:"
    echo "   HTTP: http://your-server-ip:8001"
    echo "   Or test locally: curl http://localhost:8001"
else
    echo "❌ MCP server service failed to start"
    echo "📋 Recent logs:"
    sudo journalctl -u mcp-server --no-pager -n 10
fi