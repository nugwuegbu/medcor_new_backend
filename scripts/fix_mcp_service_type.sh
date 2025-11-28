#!/bin/bash

# Fix MCP Service Type - Change from simple to forking
echo "🔧 Fixing MCP service type..."

# Stop the service
sudo systemctl stop mcp-server

# Update the service file to use forking type
sudo sed -i 's/Type=simple/Type=forking/' /etc/systemd/system/mcp-server.service

# Add PID file
sudo sed -i '/ExecStart=/a PIDFile=/var/run/mcp-server.pid' /etc/systemd/system/mcp-server.service

# Update ExecStart to run in background
sudo sed -i 's|ExecStart=/var/www/html/medcor_backend2/venv/bin/python /var/www/html/medcor_backend2/mcp_server.py|ExecStart=/var/www/html/medcor_backend2/venv/bin/python /var/www/html/medcor_backend2/mcp_server.py &|' /etc/systemd/system/mcp-server.service

# Reload systemd
sudo systemctl daemon-reload

# Reset failure count
sudo systemctl reset-failed mcp-server

# Start the service
sudo systemctl start mcp-server

# Wait and check status
sleep 3
sudo systemctl status mcp-server