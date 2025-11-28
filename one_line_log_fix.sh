#!/bin/bash
# One-line fix for MCP service log permissions
sudo systemctl stop mcp-server && sudo mkdir -p /var/www/html/medcor_backend2/logs && sed -i 's|/var/log/mcp-server.log|/var/www/html/medcor_backend2/logs/mcp-server.log|' /var/www/html/medcor_backend2/mcp_service.py && sudo systemctl start mcp-server && sleep 3 && sudo systemctl status mcp-server