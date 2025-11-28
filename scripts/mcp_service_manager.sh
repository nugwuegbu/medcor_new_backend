#!/bin/bash

# MCP Server Service Manager
# Easy management of the MCP server systemd service

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVICE_NAME="mcp-server"

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

show_help() {
    echo "MCP Server Service Manager"
    echo "========================="
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     - Start the MCP server service"
    echo "  stop      - Stop the MCP server service"
    echo "  restart   - Restart the MCP server service"
    echo "  status    - Show service status"
    echo "  logs      - Show service logs (follow mode)"
    echo "  logs-tail - Show last 50 lines of logs"
    echo "  enable    - Enable service to start on boot"
    echo "  disable   - Disable service from starting on boot"
    echo "  setup     - Setup the service (run as root)"
    echo "  test      - Test MCP server functionality"
    echo "  help      - Show this help message"
    echo ""
}

start_service() {
    print_status "Starting MCP server service..."
    if sudo systemctl start "$SERVICE_NAME"; then
        print_success "MCP server service started"
    else
        print_error "Failed to start MCP server service"
        exit 1
    fi
}

stop_service() {
    print_status "Stopping MCP server service..."
    if sudo systemctl stop "$SERVICE_NAME"; then
        print_success "MCP server service stopped"
    else
        print_error "Failed to stop MCP server service"
        exit 1
    fi
}

restart_service() {
    print_status "Restarting MCP server service..."
    if sudo systemctl restart "$SERVICE_NAME"; then
        print_success "MCP server service restarted"
    else
        print_error "Failed to restart MCP server service"
        exit 1
    fi
}

show_status() {
    print_status "MCP server service status:"
    sudo systemctl status "$SERVICE_NAME" --no-pager
}

show_logs() {
    print_status "Showing MCP server logs (Ctrl+C to exit):"
    sudo journalctl -u "$SERVICE_NAME" -f
}

show_logs_tail() {
    print_status "Last 50 lines of MCP server logs:"
    sudo journalctl -u "$SERVICE_NAME" --no-pager -n 50
}

enable_service() {
    print_status "Enabling MCP server service to start on boot..."
    if sudo systemctl enable "$SERVICE_NAME"; then
        print_success "MCP server service enabled"
    else
        print_error "Failed to enable MCP server service"
        exit 1
    fi
}

disable_service() {
    print_status "Disabling MCP server service from starting on boot..."
    if sudo systemctl disable "$SERVICE_NAME"; then
        print_success "MCP server service disabled"
    else
        print_error "Failed to disable MCP server service"
        exit 1
    fi
}

setup_service() {
    print_status "Setting up MCP server service..."
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run 'sudo $0 setup' to setup the service"
        exit 1
    fi
    
    # Run the setup script
    if [ -f "scripts/setup_mcp_service.sh" ]; then
        bash scripts/setup_mcp_service.sh
    else
        print_error "Setup script not found: scripts/setup_mcp_service.sh"
        exit 1
    fi
}

test_service() {
    print_status "Testing MCP server functionality..."
    
    # Check if service is running
    if ! systemctl is-active --quiet "$SERVICE_NAME"; then
        print_error "MCP server service is not running"
        exit 1
    fi
    
    # Check if MCP server is responding (basic check)
    print_status "Checking MCP server process..."
    if pgrep -f "mcp_server.py" > /dev/null; then
        print_success "MCP server process is running"
    else
        print_error "MCP server process not found"
        exit 1
    fi
    
    # Check service health
    print_status "Checking service health..."
    if systemctl is-healthy "$SERVICE_NAME" 2>/dev/null || systemctl is-active --quiet "$SERVICE_NAME"; then
        print_success "MCP server service is healthy"
    else
        print_warning "MCP server service may have issues"
    fi
    
    print_success "MCP server test completed"
}

# Main script logic
case "${1:-help}" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        restart_service
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    logs-tail)
        show_logs_tail
        ;;
    enable)
        enable_service
        ;;
    disable)
        disable_service
        ;;
    setup)
        setup_service
        ;;
    test)
        test_service
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac