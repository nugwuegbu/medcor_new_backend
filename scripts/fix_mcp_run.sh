#!/bin/bash

# Fix MCP run() call specifically
echo "🔧 Fixing mcp.run() call..."

# Stop service
sudo systemctl stop mcp-server

# Fix the mcp.run() call with multiple patterns
sed -i 's/mcp\.run(host="0\.0\.0\.0", port=8001)/mcp.run()/g' /var/www/html/medcor_backend2/mcp_server.py
sed -i 's/mcp\.run(host="0\.0\.0\.0", port=[0-9]*)/mcp.run()/g' /var/www/html/medcor_backend2/mcp_server.py
sed -i 's/mcp\.run(host=.*, port=.*)/mcp.run()/g' /var/www/html/medcor_backend2/mcp_server.py

# Check if there are any remaining mcp.run() calls with parameters
if grep -q "mcp\.run(" /var/www/html/medcor_backend2/mcp_server.py; then
    echo "Found mcp.run() calls:"
    grep -n "mcp\.run(" /var/www/html/medcor_backend2/mcp_server.py
fi

# Start service
sudo systemctl start mcp-server
sleep 3
sudo systemctl status mcp-server