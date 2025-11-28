#!/usr/bin/env python3
"""
MCP Service Wrapper with Keepalive for Systemd
Keeps the service running even when no clients are connected
"""

import os
import sys
import logging
import signal
import time

# Setup logging first
try:
    os.makedirs('/var/log', exist_ok=True)
except:
    pass

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr),
    ]
)
logger = logging.getLogger('mcp-server')

# Add log file if possible
try:
    log_file_handler = logging.FileHandler('/var/log/mcp-server.log')
    log_file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(log_file_handler)
except:
    pass

# Global shutdown flag
shutdown = False

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    global shutdown
    logger.info(f"Received signal {signum}, shutting down...")
    shutdown = True

def main():
    """Main MCP server service entry point"""
    global shutdown
    
    # Register signal handlers
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        logger.info("Starting MCP server service...")
        
        # Setup Django
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medcor_backend2.settings")
        logger.info("Setting up Django...")
        
        import django
        django.setup()
        logger.info("Django setup complete")
        
        # Import after Django setup
        logger.info("Importing MCP server module...")
        from mcp_server import mcp
        
        logger.info("✅ MCP server module loaded successfully")
        logger.info("MCP server is ready (STDIO transport)")
        logger.info("Service will keep running until stopped...")
        
        # For STDIO transport, mcp.run() blocks waiting for input
        # This should keep the service alive
        # If it exits immediately, it means there's an error
        try:
            mcp.run()
        except SystemExit:
            # This can happen with STDIO transport
            logger.info("MCP server exited (this is normal for STDIO transport)")
        except Exception as e:
            logger.error(f"MCP server runtime error: {e}", exc_info=True)
            raise
        
        # Keep service alive if mcp.run() returns
        logger.info("MCP server loop ended, keeping service alive...")
        while not shutdown:
            time.sleep(5)
            logger.debug("MCP service heartbeat...")
        
    except ImportError as e:
        logger.error(f"Import error: {e}", exc_info=True)
        sys.exit(1)
    except Exception as e:
        logger.error(f"MCP server error: {e}", exc_info=True)
        sys.exit(1)
    finally:
        logger.info("MCP server service stopped")

if __name__ == "__main__":
    main()









