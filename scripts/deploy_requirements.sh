#!/bin/bash

# Deployment script for updating requirements on remote server
# This script ensures the remote server has the correct dependencies

set -e

echo "🚀 Deploying requirements to remote server..."

# Configuration
REMOTE_USER="${REMOTE_USER:-ubuntu}"
REMOTE_HOST="${REMOTE_HOST:-your-server.com}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/html/medcor_backend2}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if required variables are set
if [ "$REMOTE_HOST" = "your-server.com" ]; then
    print_error "Please set REMOTE_HOST environment variable"
    print_status "Example: export REMOTE_HOST=your-server.com"
    exit 1
fi

# Check SSH connection
print_status "Testing SSH connection to $REMOTE_USER@$REMOTE_HOST..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o BatchMode=yes "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
    print_error "SSH connection failed. Please check your SSH key and server access."
    exit 1
fi
print_success "SSH connection established"

# Update local requirements
print_status "Updating local requirements files..."
python3 scripts/manage_requirements.py update-all

# Copy requirements files to remote server
print_status "Copying requirements files to remote server..."
scp -i "$SSH_KEY" requirements.txt "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
scp -i "$SSH_KEY" requirements-prod.txt "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"

# Copy the requirements management script
scp -i "$SSH_KEY" scripts/manage_requirements.py "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/scripts/"

# Execute remote deployment
print_status "Executing remote deployment..."
ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" << EOF
    set -e
    cd $REMOTE_PATH
    
    echo "📦 Activating virtual environment..."
    if [ -d "venv" ]; then
        source venv/bin/activate
    else
        echo "Creating virtual environment..."
        python3 -m venv venv
        source venv/bin/activate
    fi
    
    echo "🔄 Upgrading pip..."
    pip install --upgrade pip
    
    echo "📋 Installing production requirements..."
    pip install -r requirements-prod.txt
    
    echo "🧹 Cleaning up pip cache..."
    pip cache purge
    
    echo "✅ Requirements deployment completed!"
    
    echo "📊 Installed packages summary:"
    pip list | head -20
    
    echo "🔍 Checking for any issues..."
    python manage.py check --deploy || echo "Django check completed with warnings"
    
    echo "📈 System status:"
    free -h
    df -h /
EOF

print_success "Requirements deployment completed successfully!"

# Optional: Restart services
read -p "Do you want to restart the application services? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Restarting application services..."
    ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" << EOF
        sudo systemctl restart medcor-backend || echo "Service restart failed"
        sudo systemctl restart celery || echo "Celery restart failed"
        sudo systemctl restart mcp-server || echo "MCP server restart failed"
        echo "Services restart completed"
EOF
    print_success "Services restarted"
fi

print_success "🎉 Remote server deployment completed!"
print_status "You can now access your application at: https://$REMOTE_HOST"