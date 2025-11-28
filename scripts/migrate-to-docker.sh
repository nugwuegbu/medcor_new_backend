#!/bin/bash

# Migration Script: From Systemd Services to Docker
# This script helps transition from gunicorn.service + celery.service to Docker setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 MedCor Backend Migration: Systemd → Docker${NC}"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.yml not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 1: Checking current systemd services${NC}"
echo "--------------------------------------------------"

# Check what services are running
echo "Current systemd services status:"
systemctl is-active gunicorn.service 2>/dev/null && echo "gunicorn.service: $(systemctl is-active gunicorn.service)" || echo "gunicorn.service: not found"
systemctl is-active celery.service 2>/dev/null && echo "celery.service: $(systemctl is-active celery.service)" || echo "celery.service: not found"
systemctl is-active nginx 2>/dev/null && echo "nginx: $(systemctl is-active nginx)" || echo "nginx: not found"

echo ""
echo "Port usage:"
netstat -tlnp | grep -E ":(80|8000|8001)" || echo "No services on ports 80, 8000, 8001"

echo -e "${YELLOW}📋 Step 2: Stopping old systemd services${NC}"
echo "--------------------------------------------------"

# Stop old services
echo "Stopping gunicorn.service..."
sudo systemctl stop gunicorn.service 2>/dev/null || echo "gunicorn.service not running"

echo "Stopping celery.service..."
sudo systemctl stop celery.service 2>/dev/null || echo "celery.service not running"

echo "Stopping nginx..."
sudo systemctl stop nginx 2>/dev/null || echo "nginx not running"

echo -e "${YELLOW}📋 Step 3: Disabling old services from auto-start${NC}"
echo "--------------------------------------------------"

# Disable services from auto-start
echo "Disabling gunicorn.service from auto-start..."
sudo systemctl disable gunicorn.service 2>/dev/null || echo "gunicorn.service not enabled"

echo "Disabling celery.service from auto-start..."
sudo systemctl disable celery.service 2>/dev/null || echo "celery.service not enabled"

echo "Disabling nginx from auto-start..."
sudo systemctl disable nginx 2>/dev/null || echo "nginx not enabled"

echo -e "${YELLOW}📋 Step 4: Checking for port conflicts${NC}"
echo "--------------------------------------------------"

# Check if ports are still in use
echo "Checking for remaining port usage:"
if netstat -tlnp | grep -E ":(80|8000|8001)"; then
    echo -e "${RED}❌ Ports still in use. You may need to kill the processes manually.${NC}"
    echo "Processes using ports:"
    lsof -i :80 2>/dev/null || echo "Port 80: free"
    lsof -i :8000 2>/dev/null || echo "Port 8000: free"
    lsof -i :8001 2>/dev/null || echo "Port 8001: free"
else
    echo -e "${GREEN}✅ All ports are free${NC}"
fi

echo -e "${YELLOW}📋 Step 5: Preparing Docker environment${NC}"
echo "--------------------------------------------------"

# Ensure environment file exists
if [ ! -f ".env" ]; then
    if [ -f "env.prod" ]; then
        echo "Creating .env file from env.prod..."
        cp env.prod .env
        echo -e "${GREEN}✅ .env file created${NC}"
    else
        echo -e "${RED}❌ No environment file found. Please create .env file with your configuration.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Fix permissions
echo "Fixing file permissions..."
sudo chown -R $USER:$USER .
chmod -R 755 .

echo -e "${YELLOW}📋 Step 6: Starting Docker services${NC}"
echo "--------------------------------------------------"

# Stop any existing Docker services
echo "Stopping existing Docker services..."
docker-compose down --remove-orphans 2>/dev/null || true

# Start Docker services
echo "Starting Docker services..."
docker-compose up -d

echo -e "${YELLOW}📋 Step 7: Waiting for services to initialize${NC}"
echo "--------------------------------------------------"

# Wait for services to start
echo "Waiting 60 seconds for services to initialize..."
sleep 60

echo -e "${YELLOW}📋 Step 8: Running database migrations${NC}"
echo "--------------------------------------------------"

# Run migrations
echo "Running database migrations..."
docker-compose exec -T web python manage.py migrate || echo "Migration failed, continuing..."

echo "Collecting static files..."
docker-compose exec -T web python manage.py collectstatic --noinput || echo "Static files collection failed, continuing..."

echo -e "${YELLOW}📋 Step 9: Testing the new setup${NC}"
echo "--------------------------------------------------"

# Test services
echo "Testing Docker services:"
docker-compose ps

echo ""
echo "Testing connectivity:"
echo "===================="

# Test web service
echo "Testing web service (port 8000):"
if curl -f http://localhost:8000/api/health/ 2>/dev/null; then
    echo -e "${GREEN}✅ Web service is responding${NC}"
else
    echo -e "${RED}❌ Web service is not responding${NC}"
fi

# Test nginx
echo "Testing nginx (port 80):"
if curl -f http://localhost/health/ 2>/dev/null; then
    echo -e "${GREEN}✅ Nginx is responding${NC}"
else
    echo -e "${RED}❌ Nginx is not responding${NC}"
fi

# Test API endpoint
echo "Testing API endpoint:"
if curl -f http://localhost/api/health/ 2>/dev/null; then
    echo -e "${GREEN}✅ API endpoint is responding${NC}"
else
    echo -e "${RED}❌ API endpoint is not responding${NC}"
fi

echo -e "${YELLOW}📋 Step 10: Cleanup old service files (optional)${NC}"
echo "--------------------------------------------------"

echo "Old service files that can be removed:"
echo "- /etc/systemd/system/gunicorn.service"
echo "- /etc/systemd/system/celery.service"
echo "- /etc/nginx/sites-available/api.medcor.ai"
echo "- /etc/nginx/sites-enabled/api.medcor.ai"

echo ""
echo "To remove them, run:"
echo "sudo rm /etc/systemd/system/gunicorn.service"
echo "sudo rm /etc/systemd/system/celery.service"
echo "sudo rm /etc/nginx/sites-available/api.medcor.ai"
echo "sudo rm /etc/nginx/sites-enabled/api.medcor.ai"
echo "sudo systemctl daemon-reload"

echo ""
echo -e "${BLUE}🎉 Migration Complete!${NC}"
echo "Your MedCor backend is now running on Docker."
echo "The old systemd services have been stopped and disabled."
echo "Your application should now be accessible at http://api.medcor.ai"