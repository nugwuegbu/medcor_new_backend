#!/bin/bash
# One-line MCP server fix for AWS
sudo systemctl stop mcp-server && sed -i 's/@mcp\.prompt()/@mcp.tool()/g' /var/www/html/medcor_backend2/mcp_server.py && sudo systemctl start mcp-server && sleep 3 && sudo systemctl status mcp-server