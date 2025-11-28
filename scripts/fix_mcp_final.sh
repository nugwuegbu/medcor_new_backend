#!/bin/bash

# Final MCP Service Fix
echo "🚀 Final MCP Service Fix"
echo "======================="

# Stop the service
sudo systemctl stop mcp-server

# Create a simple MCP service wrapper without file logging
echo "📝 Creating simplified MCP service wrapper..."
cat > /var/www/html/medcor_backend2/mcp_service.py << 'EOF'
#!/usr/bin/env python3
"""
MCP Service Wrapper for Systemd - Simplified Version
"""

import os
import sys
import logging

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medcor_backend2.settings")
import django
django.setup()

# Import the MCP server
from mcp_server import mcp

# Setup simple logging to stdout only
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
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

# Reset failure count
sudo systemctl reset-failed mcp-server

# Test the service wrapper
echo "🧪 Testing simplified MCP service wrapper..."
cd /var/www/html/medcor_backend2
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=medcor_backend2.settings
export PYTHONPATH=/var/www/html/medcor_backend2

# Test if it can be imported
python -c "import mcp_service; print('✅ Simplified MCP service wrapper imports successfully')"

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