#!/bin/bash

# Start both Django and MCP servers

cd "$(dirname "$0")"

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "❌ Virtual environment not found!"
    exit 1
fi

# Kill any existing servers
echo "🛑 Stopping any existing servers..."
pkill -f "manage.py runserver" 2>/dev/null
pkill -f "mcp_server.py" 2>/dev/null
sleep 2

# Start Django server
echo "🚀 Starting Django server on port 8002..."
nohup python3 start_server.py > /tmp/django_server.log 2>&1 &
DJANGO_PID=$!
echo "   Django PID: $DJANGO_PID"

# Start MCP server
echo "🚀 Starting MCP server..."
nohup python3 mcp_server.py > /tmp/mcp_server.log 2>&1 &
MCP_PID=$!
echo "   MCP PID: $MCP_PID"

# Wait a bit for servers to start
sleep 3

# Check if servers are running
if ps -p $DJANGO_PID > /dev/null && ps -p $MCP_PID > /dev/null; then
    echo ""
    echo "✅ Both servers started successfully!"
    echo ""
    echo "📊 Server Information:"
    echo "   Django Server: http://localhost:8002"
    echo "   Health Check:  http://localhost:8002/api/health/"
    echo "   Admin Panel:   http://localhost:8002/admin/"
    echo "   API Docs:      http://localhost:8002/api/docs/"
    echo ""
    echo "📝 Logs:"
    echo "   Django: tail -f /tmp/django_server.log"
    echo "   MCP:    tail -f /tmp/mcp_server.log"
    echo ""
    echo "🛑 To stop servers:"
    echo "   pkill -f 'manage.py runserver'"
    echo "   pkill -f 'mcp_server.py'"
else
    echo "❌ Failed to start servers. Check logs:"
    echo "   tail /tmp/django_server.log"
    echo "   tail /tmp/mcp_server.log"
    exit 1
fi










