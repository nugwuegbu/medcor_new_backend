#!/bin/bash

# Debug MCP Server Issues
echo "🔍 Debugging MCP Server..."

# Reset the service failure count
sudo systemctl reset-failed mcp-server

# Check the service logs
echo "📋 Recent service logs:"
sudo journalctl -u mcp-server --no-pager -n 20

# Test the MCP server directly
echo "🧪 Testing MCP server directly..."
cd /var/www/html/medcor_backend2
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=medcor_backend2.settings
export PYTHONPATH=/var/www/html/medcor_backend2

echo "Testing Python import..."
python -c "import mcp_server; print('✅ MCP server imports successfully')"

echo "Testing MCP server execution (will timeout after 10 seconds)..."
timeout 10s python mcp_server.py || echo "❌ MCP server execution failed or timed out"

# Check if there are any syntax errors
echo "🔍 Checking for syntax errors..."
python -m py_compile mcp_server.py && echo "✅ Syntax is valid" || echo "❌ Syntax errors found"

# Check the end of the file
echo "📄 Last 10 lines of mcp_server.py:"
tail -10 mcp_server.py