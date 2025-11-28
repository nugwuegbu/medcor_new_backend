#!/bin/bash

# MedCor Backend Deployment Script
# Usage: ./deploy.sh [environment] [version]

set -e

# Configuration
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
DEPLOYMENT_PATH="/var/www/html/medcor_backend2"
BACKUP_DIR="/var/backups/medcor"
LOG_FILE="/var/log/medcor-deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a $LOG_FILE
}

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
        exit 1
    fi
}

# Create backup
create_backup() {
    log "Creating backup of current deployment..."
    
    if [ -d "$DEPLOYMENT_PATH" ]; then
        BACKUP_NAME="medcor-backup-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        cp -r "$DEPLOYMENT_PATH" "$BACKUP_DIR/$BACKUP_NAME"
        log "Backup created: $BACKUP_DIR/$BACKUP_NAME"
        
        # Keep only last 5 backups
        cd "$BACKUP_DIR"
        ls -t | tail -n +6 | xargs -r rm -rf
    else
        warning "No existing deployment found to backup"
    fi
}

# Update system packages
update_system() {
    log "Updating system packages..."
    apt-get update -y
    apt-get upgrade -y
}

# Install Docker if not present
install_docker() {
    if ! command -v docker &> /dev/null; then
        log "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        usermod -aG docker ubuntu
        systemctl enable docker
        systemctl start docker
        rm get-docker.sh
    else
        log "Docker already installed"
    fi
}

# Install Docker Compose if not present
install_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        log "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    else
        log "Docker Compose already installed"
    fi
}

# Install AWS CLI if not present
install_aws_cli() {
    if ! command -v aws &> /dev/null; then
        log "Installing AWS CLI..."
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
        unzip awscliv2.zip
        ./aws/install
        rm -rf aws awscliv2.zip
    else
        log "AWS CLI already installed"
    fi
}

# Login to ECR
login_ecr() {
    log "Logging in to AWS ECR..."
    aws ecr get-login-password --region us-east-1 | \
    docker login --username AWS --password-stdin $ECR_REGISTRY
}

# Pull latest image
pull_image() {
    log "Pulling latest Docker image..."
    docker pull $ECR_REGISTRY/$ECR_REPOSITORY:$VERSION
}

# Stop existing containers and services
stop_containers() {
    log "Stopping existing containers and services..."
    cd "$DEPLOYMENT_PATH"
    
    # Stop Docker containers
    if [ -f "docker-compose.prod.yml" ]; then
        docker-compose -f docker-compose.prod.yml down --timeout 30 || true
    fi
    
    # Stop existing Celery service if running
    if systemctl is-active --quiet celery.service; then
        log "Stopping existing Celery service..."
        sudo systemctl stop celery.service || true
    fi
    
    # Stop MCP service if running
    if systemctl is-active --quiet mcp-server.service; then
        log "Stopping existing MCP server service..."
        sudo systemctl stop mcp-server.service || true
    fi
    
    # Check RabbitMQ service status
    if systemctl is-active --quiet rabbitmq-server.service; then
        log "RabbitMQ service is running"
    else
        warning "RabbitMQ service is not running, starting it..."
        sudo systemctl start rabbitmq-server.service || true
    fi
}

# Update environment configuration
update_environment() {
    log "Updating environment configuration..."
    cd "$DEPLOYMENT_PATH"
    
    if [ "$ENVIRONMENT" = "development" ]; then
        cp .env.dev .env
    else
        cp .env.prod .env
    fi
    
    # Install MCP server systemd service
    log "Installing MCP server systemd service..."
    sudo cp scripts/mcp-server.service /etc/systemd/system/
    sudo systemctl daemon-reload
}

# Start new containers and services
start_containers() {
    log "Starting new containers and services..."
    cd "$DEPLOYMENT_PATH"
    
    # Start Docker containers
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Start Celery service
    log "Starting Celery service..."
    sudo systemctl start celery.service || {
        warning "Failed to start Celery service, continuing with deployment"
    }
    
    # Start MCP server service
    log "Starting MCP server service..."
    sudo systemctl start mcp-server.service || {
        warning "Failed to start MCP server service, continuing with deployment"
    }
    
    # Ensure RabbitMQ service is running
    log "Ensuring RabbitMQ service is running..."
    sudo systemctl start rabbitmq-server.service || true
    sudo systemctl enable rabbitmq-server.service || true
    
    # Enable services to start on boot
    sudo systemctl enable celery.service || true
    sudo systemctl enable mcp-server.service || true
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    cd "$DEPLOYMENT_PATH"
    
    docker-compose -f docker-compose.prod.yml exec -T web python manage.py migrate
}

# Collect static files
collect_static() {
    log "Collecting static files..."
    cd "$DEPLOYMENT_PATH"
    
    docker-compose -f docker-compose.prod.yml exec -T web python manage.py collectstatic --noinput
}

# Health check
health_check() {
    log "Performing health check..."
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        # Check main API health
        if curl -f http://localhost/api/health/ > /dev/null 2>&1; then
            log "Main API health check passed"
            
            # Check MCP server health
            if curl -f http://localhost:8001/health/ > /dev/null 2>&1; then
                log "MCP server health check passed"
                
                # Check Celery service status
                if systemctl is-active --quiet celery.service; then
                    log "Celery service is running"
                    
                    # Check RabbitMQ service status
                    if systemctl is-active --quiet rabbitmq-server.service; then
                        log "RabbitMQ service is running"
                        log "All health checks passed"
                        return 0
                    else
                        warning "RabbitMQ service is not running"
                    fi
                else
                    warning "Celery service is not running"
                fi
            else
                warning "MCP server health check failed"
            fi
        else
            warning "Main API health check failed"
        fi
        
        warning "Health check attempt $attempt failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
    return 1
}

# Cleanup old images
cleanup_images() {
    log "Cleaning up old Docker images..."
    docker image prune -f
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$message\"}" \
        "$SLACK_WEBHOOK_URL" || true
    fi
}

# Main deployment function
deploy() {
    log "Starting deployment for $ENVIRONMENT environment (version: $VERSION)"
    
    # Pre-deployment checks
    check_permissions
    update_system
    install_docker
    install_docker_compose
    install_aws_cli
    
    # Create backup
    create_backup
    
    # Login and pull image
    login_ecr
    pull_image
    
    # Deploy
    stop_containers
    update_environment
    start_containers
    run_migrations
    collect_static
    
    # Post-deployment checks
    if health_check; then
        cleanup_images
        log "Deployment completed successfully!"
        send_notification "success" "✅ MedCor Backend deployment successful ($ENVIRONMENT)"
        exit 0
    else
        error "Deployment failed health check"
        send_notification "failure" "❌ MedCor Backend deployment failed ($ENVIRONMENT)"
        exit 1
    fi
}

# Rollback function
rollback() {
    log "Starting rollback..."
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR" | head -n1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        error "No backup found for rollback"
        exit 1
    fi
    
    log "Rolling back to: $LATEST_BACKUP"
    
    # Stop current containers
    stop_containers
    
    # Restore from backup
    rm -rf "$DEPLOYMENT_PATH"
    cp -r "$BACKUP_DIR/$LATEST_BACKUP" "$DEPLOYMENT_PATH"
    
    # Start containers
    start_containers
    
    # Health check
    if health_check; then
        log "Rollback completed successfully!"
        send_notification "success" "🔄 MedCor Backend rollback successful"
        exit 0
    else
        error "Rollback failed health check"
        exit 1
    fi
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "health")
        health_check
        ;;
    *)
        echo "Usage: $0 [deploy|rollback|health] [environment] [version]"
        echo "  deploy   - Deploy the application (default)"
        echo "  rollback - Rollback to previous version"
        echo "  health   - Check application health"
        exit 1
        ;;
esac