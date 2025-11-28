#!/usr/bin/env python3
"""
Create a proper MCP service that can run as a systemd service
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

# Global flag for graceful shutdown
shutdown_flag = False

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    global shutdown_flag
    logger.info(f"Received signal {signum}, initiating graceful shutdown...")
    shutdown_flag = True

def main():
    """Main MCP server service loop"""
    global shutdown_flag
    
    # Setup signal handlers
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
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