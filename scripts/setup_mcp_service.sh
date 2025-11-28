#!/bin/bash

# MCP Server Service Setup Script
# This script sets up the MCP server as a systemd service on AWS

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

echo "🚀 MCP Server Service Setup"
echo "=========================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root or with sudo"
    exit 1
fi

# Configuration
SERVICE_NAME="mcp-server"
SERVICE_USER="ubuntu"
PROJECT_DIR="/var/www/html/medcor_backend2"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory not found: $PROJECT_DIR"
    exit 1
fi

# Check if MCP server file exists
if [ ! -f "$PROJECT_DIR/mcp_server.py" ]; then
    print_error "MCP server file not found: $PROJECT_DIR/mcp_server.py"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "$PROJECT_DIR/venv" ]; then
    print_error "Virtual environment not found: $PROJECT_DIR/venv"
    exit 1
fi

print_status "Setting up MCP server service..."

# Create the service file
print_status "Creating systemd service file..."
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=MedCor MCP Server
Documentation=https://github.com/your-repo/medcor-backend2
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service
Requires=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$PROJECT_DIR
Environment=DJANGO_SETTINGS_MODULE=medcor_backend2.settings
Environment=PYTHONPATH=$PROJECT_DIR
Environment=PYTHONUNBUFFERED=1
ExecStart=$PROJECT_DIR/venv/bin/python $PROJECT_DIR/mcp_server.py
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=5
StartLimitBurst=3
StartLimitInterval=60
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mcp-server

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$PROJECT_DIR
ReadOnlyPaths=$PROJECT_DIR/venv

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

print_success "Service file created: $SERVICE_FILE"

# Set proper permissions
print_status "Setting permissions..."
chown root:root "$SERVICE_FILE"
chmod 644 "$SERVICE_FILE"

# Ensure project directory has correct ownership
chown -R $SERVICE_USER:$SERVICE_USER "$PROJECT_DIR"

# Reload systemd
print_status "Reloading systemd daemon..."
systemctl daemon-reload

# Enable the service
print_status "Enabling MCP server service..."
systemctl enable "$SERVICE_NAME"

# Start the service
print_status "Starting MCP server service..."
systemctl start "$SERVICE_NAME"

# Wait a moment for the service to start
sleep 3

# Check service status
print_status "Checking service status..."
if systemctl is-active --quiet "$SERVICE_NAME"; then
    print_success "MCP server service is running!"
else
    print_error "MCP server service failed to start"
    print_status "Checking service logs..."
    journalctl -u "$SERVICE_NAME" --no-pager -n 20
    exit 1
fi

# Show service status
print_status "Service status:"
systemctl status "$SERVICE_NAME" --no-pager

print_success "🎉 MCP server service setup completed!"
echo ""
print_status "Service management commands:"
echo "  Start:   sudo systemctl start $SERVICE_NAME"
echo "  Stop:    sudo systemctl stop $SERVICE_NAME"
echo "  Restart: sudo systemctl restart $SERVICE_NAME"
echo "  Status:  sudo systemctl status $SERVICE_NAME"
echo "  Logs:    sudo journalctl -u $SERVICE_NAME -f"
echo ""
print_status "The MCP server is now running as a systemd service!"