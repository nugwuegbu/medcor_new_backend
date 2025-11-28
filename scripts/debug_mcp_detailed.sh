#!/bin/bash

# Detailed MCP Debug Script
echo "🔍 Detailed MCP Debug"
echo "===================="

# Reset failure count
sudo systemctl reset-failed mcp-server

# Check recent logs
echo "📋 Recent service logs:"
sudo journalctl -u mcp-server --no-pager -n 20

# Test the service wrapper directly
echo "🧪 Testing MCP service wrapper directly..."
cd /var/www/html/medcor_backend2
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=medcor_backend2.settings
export PYTHONPATH=/var/www/html/medcor_backend2

echo "Testing Python import..."
python -c "import mcp_service; print('✅ MCP service wrapper imports successfully')"

echo "Testing MCP server import..."
python -c "from mcp_server import mcp; print('✅ MCP server imports successfully')"

echo "Testing MCP service execution (will timeout after 5 seconds)..."
timeout 5s python mcp_service.py || echo "❌ MCP service execution failed or timed out"

# Check if the log file was created
echo "📄 Checking log file:"
if [ -f "/var/www/html/medcor_backend2/logs/mcp-server.log" ]; then
    echo "✅ Log file exists:"
    tail -10 /var/www/html/medcor_backend2/logs/mcp-server.log
else
    echo "❌ Log file not found"
fi

# Check the service wrapper file
echo "📄 Service wrapper file content:"
head -30 /var/www/html/medcor_backend2/mcp_service.py

# Check if there are any syntax errors
echo "🔍 Checking for syntax errors..."
python -m py_compile mcp_service.py && echo "✅ Syntax is valid" || echo "❌ Syntax errors found"