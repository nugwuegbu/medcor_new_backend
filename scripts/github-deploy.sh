#!/bin/bash

# GitHub Actions Deployment Script for MedCor Backend
# This script handles the deployment process on the production server

set -e  # Exit on any error

# Configuration
PROJECT_DIR="/var/www/html/medcor_backend2"
BACKUP_DIR="/var/www/html/backups"
LOG_FILE="/var/log/medcor-deploy.log"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check if service is running
check_service() {
    local service_name=$1
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f "$PROJECT_DIR/$DOCKER_COMPOSE_FILE" ps "$service_name" | grep -q "Up"; then
            log "✅ $service_name is running"
            return 0
        fi
        log "⏳ Waiting for $service_name to start... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    error "❌ $service_name failed to start after $max_attempts attempts"
    return 1
}

# Function to perform health check
health_check() {
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost/api/health/ > /dev/null; then
            log "✅ Health check passed"
            return 0
        fi
        log "⏳ Health check attempt $attempt/$max_attempts..."
        sleep 15
        ((attempt++))
    done
    
    error "❌ Health check failed after $max_attempts attempts"
    return 1
}

# Function to create backup
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/medcor_backend2_backup_$timestamp"
    
    log "📦 Creating backup at $backup_path"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Copy current deployment
    if [ -d "$PROJECT_DIR" ]; then
        cp -r "$PROJECT_DIR" "$backup_path"
        log "✅ Backup created successfully"
    else
        warning "No existing deployment found to backup"
    fi
}

# Function to stop services
stop_services() {
    log "🛑 Stopping current services..."
    
    # Stop old systemd services that might conflict with Docker
    log "🛑 Stopping old systemd services..."
    sudo systemctl stop gunicorn.service 2>/dev/null || true
    sudo systemctl stop celery.service 2>/dev/null || true
    sudo systemctl stop nginx 2>/dev/null || true
    log "✅ Old systemd services stopped"
    
    # Stop Docker services
    if [ -f "$PROJECT_DIR/$DOCKER_COMPOSE_FILE" ]; then
        cd "$PROJECT_DIR"
        docker-compose down --remove-orphans || true
        log "✅ Docker services stopped"
    else
        warning "No docker-compose.yml found, skipping Docker service stop"
    fi
}

# Function to start services
start_services() {
    log "🚀 Starting services..."
    
    cd "$PROJECT_DIR"
    
    # Set proper permissions
    chmod +x run_server.sh 2>/dev/null || true
    chmod +x scripts/deploy.sh 2>/dev/null || true
    
    # Copy environment file if it exists
    if [ -f "env.prod" ] && [ ! -f ".env" ]; then
        cp env.prod .env
        log "✅ Environment file copied"
    fi
    
    # Start services
    docker-compose up -d --build
    
    # Wait for services to start
    log "⏳ Waiting for services to start..."
    sleep 30
    
    # Check each service
    check_service "web"
    check_service "celery"
    check_service "celery-beat"
    check_service "mcp-server"
    check_service "nginx"
    
    log "✅ All services started successfully"
}

# Function to perform health check
perform_health_check() {
    log "🏥 Performing health check..."
    
    if health_check; then
        log "✅ Application is healthy and responding"
        return 0
    else
        error "❌ Application health check failed"
        return 1
    fi
}

# Function to rollback deployment
rollback() {
    local latest_backup=$(ls -t "$BACKUP_DIR"/medcor_backend2_backup_* 2>/dev/null | head -n1)
    
    if [ -n "$latest_backup" ]; then
        error "🔄 Rolling back to previous deployment: $latest_backup"
        
        # Stop current services
        stop_services
        
        # Remove failed deployment
        rm -rf "$PROJECT_DIR"
        
        # Restore from backup
        mv "$latest_backup" "$PROJECT_DIR"
        
        # Start services
        start_services
        
        if perform_health_check; then
            log "✅ Rollback successful"
        else
            error "❌ Rollback failed - manual intervention required"
            exit 1
        fi
    else
        error "❌ No backup found for rollback"
        exit 1
    fi
}

# Function to clean up old backups
cleanup_backups() {
    log "🧹 Cleaning up old backups (keeping last 5)..."
    
    # Keep only the last 5 backups
    ls -t "$BACKUP_DIR"/medcor_backend2_backup_* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true
    
    # Clean up old Docker images
    docker image prune -f > /dev/null 2>&1 || true
    
    log "✅ Cleanup completed"
}

# Main deployment function
deploy() {
    log "🚀 Starting MedCor Backend deployment..."
    
    # Create backup
    create_backup
    
    # Stop current services
    stop_services
    
    # Start services
    start_services
    
    # Perform health check
    if perform_health_check; then
        log "✅ Deployment successful!"
        cleanup_backups
    else
        error "❌ Deployment failed, initiating rollback..."
        rollback
        exit 1
    fi
}

# Main execution
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "health-check")
        perform_health_check
        ;;
    "status")
        cd "$PROJECT_DIR"
        docker-compose ps
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health-check|status}"
        exit 1
        ;;
esac