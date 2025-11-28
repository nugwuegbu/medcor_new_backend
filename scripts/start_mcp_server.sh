#!/bin/bash

# MCP Server Startup Script
# This script starts the MCP server with proper environment setup

set -e

# Configuration
PROJECT_DIR="/var/www/html/medcor_backend2"
VENV_DIR="$PROJECT_DIR/venv"
MCP_SERVER="$PROJECT_DIR/mcp_server.py"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as correct user
if [ "$USER" != "ubuntu" ]; then
    print_error "This script should be run as 'ubuntu' user"
    exit 1
fi

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory not found: $PROJECT_DIR"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    print_error "Virtual environment not found: $VENV_DIR"
    exit 1
fi

# Check if MCP server exists
if [ ! -f "$MCP_SERVER" ]; then
    print_error "MCP server not found: $MCP_SERVER"
    exit 1
fi

# Change to project directory
cd "$PROJECT_DIR"

# Activate virtual environment
print_status "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Set environment variables
export DJANGO_SETTINGS_MODULE=medcor_backend2.settings
export PYTHONPATH="$PROJECT_DIR"
export PYTHONUNBUFFERED=1

# Check if MCP server is already running
if pgrep -f "mcp_server.py" > /dev/null; then
    print_error "MCP server is already running"
    print_status "Use 'pkill -f mcp_server.py' to stop it first"
    exit 1
fi

# Start MCP server
print_status "Starting MCP server..."
print_status "Project directory: $PROJECT_DIR"
print_status "Python executable: $(which python)"
print_status "Django settings: $DJANGO_SETTINGS_MODULE"

# Run the MCP server
exec python "$MCP_SERVER"