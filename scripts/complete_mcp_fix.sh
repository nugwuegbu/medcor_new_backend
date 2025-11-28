#!/bin/bash

# Complete MCP Server Fix Script
# This script fixes all MCP server issues on AWS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚀 Complete MCP Server Fix"
echo "========================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root or with sudo"
    exit 1
fi

PROJECT_DIR="/var/www/html/medcor_backend2"
MCP_FILE="$PROJECT_DIR/mcp_server.py"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory not found: $PROJECT_DIR"
    exit 1
fi

# Check if MCP server file exists
if [ ! -f "$MCP_FILE" ]; then
    print_error "MCP server file not found: $MCP_FILE"
    exit 1
fi

print_status "Stopping MCP server service..."
systemctl stop mcp-server 2>/dev/null || true

# Create a backup
print_status "Creating backup of MCP server file..."
cp "$MCP_FILE" "$MCP_FILE.backup.$(date +%Y%m%d_%H%M%S)"

# Fix 1: Replace all @mcp.prompt() with @mcp.tool()
print_status "Fixing @mcp.prompt() decorators..."

# Count occurrences before fix
PROMPT_COUNT=$(grep -c "@mcp\.prompt()" "$MCP_FILE" || echo "0")
print_status "Found $PROMPT_COUNT @mcp.prompt() decorators"

if [ "$PROMPT_COUNT" -gt 0 ]; then
    sed -i 's/@mcp\.prompt()/@mcp.tool()/g' "$MCP_FILE"
    print_success "Fixed $PROMPT_COUNT @mcp.prompt() decorators"
fi

# Fix 2: Replace any remaining @mcp.prompt with @mcp.tool
print_status "Fixing any remaining @mcp.prompt decorators..."
sed -i 's/@mcp\.prompt/@mcp.tool/g' "$MCP_FILE"

# Fix 3: Fix the mcp.run() call
print_status "Fixing mcp.run() call..."

# Check if mcp.run() has host and port parameters
if grep -q "mcp.run(host=" "$MCP_FILE"; then
    print_status "Found mcp.run() with host/port parameters, fixing..."
    sed -i 's/mcp\.run(host="0\.0\.0\.0", port=8001)/mcp.run()/g' "$MCP_FILE"
    sed -i 's/mcp\.run(host="0\.0\.0\.0", port=[0-9]*)/mcp.run()/g' "$MCP_FILE"
    print_success "Fixed mcp.run() call"
fi

# Fix 4: Ensure the file ends with proper mcp.run() call
print_status "Ensuring proper mcp.run() call at end of file..."

# Check if the file ends with mcp.run()
if ! tail -5 "$MCP_FILE" | grep -q "mcp.run()"; then
    print_status "Adding proper mcp.run() call at end of file..."
    echo "" >> "$MCP_FILE"
    echo "if __name__ == \"__main__\":" >> "$MCP_FILE"
    echo "    # Run the MCP server with STDIO transport" >> "$MCP_FILE"
    echo "    mcp.run()" >> "$MCP_FILE"
fi

# Count final decorators
TOOL_COUNT=$(grep -c "@mcp\.tool()" "$MCP_FILE" || echo "0")
print_status "Final count: $TOOL_COUNT @mcp.tool() decorators"

# Verify the fix
print_status "Verifying MCP server file syntax..."
if python3 -m py_compile "$MCP_FILE" 2>/dev/null; then
    print_success "MCP server file syntax is valid"
else
    print_error "MCP server file has syntax errors"
    print_status "Checking for errors:"
    python3 -m py_compile "$MCP_FILE" || true
    exit 1
fi

# Test Django setup
print_status "Testing Django setup..."
cd "$PROJECT_DIR"
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    export DJANGO_SETTINGS_MODULE=medcor_backend2.settings
    export PYTHONPATH="$PROJECT_DIR"
    
    if python manage.py check --deploy 2>/dev/null; then
        print_success "Django setup is valid"
    else
        print_warning "Django check failed, but continuing..."
    fi
else
    print_warning "Virtual environment not found, skipping Django check"
fi

# Test the MCP server directly
print_status "Testing MCP server directly..."
cd "$PROJECT_DIR"
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    export DJANGO_SETTINGS_MODULE=medcor_backend2.settings
    export PYTHONPATH="$PROJECT_DIR"
    
    # Test if the MCP server can be imported
    if python -c "import mcp_server" 2>/dev/null; then
        print_success "MCP server can be imported successfully"
    else
        print_error "MCP server import failed"
        print_status "Testing import with error details:"
        python -c "import mcp_server" || true
        exit 1
    fi
fi

# Start the MCP server service
print_status "Starting MCP server service..."
if systemctl start mcp-server; then
    print_success "MCP server service started"
else
    print_error "Failed to start MCP server service"
    print_status "Checking service logs:"
    journalctl -u mcp-server --no-pager -n 10
    exit 1
fi

# Wait a moment for the service to start
sleep 5

# Check service status
print_status "Checking service status..."
if systemctl is-active --quiet mcp-server; then
    print_success "MCP server service is running!"
    
    # Show service status
    print_status "Service status:"
    systemctl status mcp-server --no-pager
    
    print_success "🎉 Complete MCP server fix completed successfully!"
    print_status "The MCP server is now running as a systemd service"
    
else
    print_error "MCP server service failed to start"
    print_status "Checking service logs:"
    journalctl -u mcp-server --no-pager -n 20
    exit 1
fi

print_status "Service management commands:"
echo "  Status:  sudo systemctl status mcp-server"
echo "  Logs:    sudo journalctl -u mcp-server -f"
echo "  Restart: sudo systemctl restart mcp-server"
echo "  Stop:    sudo systemctl stop mcp-server"