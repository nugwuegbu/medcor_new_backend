#!/bin/bash

# Quick Fix Script for 502 Bad Gateway Error
# Run this script on your AWS server to attempt common fixes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 MedCor Backend 502 Error Quick Fix Script${NC}"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.yml not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 1: Stopping all services${NC}"
echo "----------------------------------------"
docker-compose down

echo -e "${YELLOW}📋 Step 2: Cleaning up Docker resources${NC}"
echo "----------------------------------------"
# Remove any orphaned containers
docker-compose down --remove-orphans

# Clean up unused Docker resources
docker system prune -f

echo -e "${YELLOW}📋 Step 3: Checking and fixing file permissions${NC}"
echo "----------------------------------------"
# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 .

echo -e "${YELLOW}📋 Step 4: Ensuring environment file exists${NC}"
echo "----------------------------------------"
# Check if .env file exists, if not create from env.prod
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

echo -e "${YELLOW}📋 Step 5: Rebuilding and starting services${NC}"
echo "----------------------------------------"
# Rebuild and start services
docker-compose build --no-cache
docker-compose up -d

echo -e "${YELLOW}📋 Step 6: Waiting for services to start${NC}"
echo "----------------------------------------"
# Wait for services to start
echo "Waiting 60 seconds for services to initialize..."
sleep 60

echo -e "${YELLOW}📋 Step 7: Running database migrations${NC}"
echo "----------------------------------------"
# Run database migrations
docker-compose exec -T web python manage.py migrate || echo "Migration failed, continuing..."

echo -e "${YELLOW}📋 Step 8: Collecting static files${NC}"
echo "----------------------------------------"
# Collect static files
docker-compose exec -T web python manage.py collectstatic --noinput || echo "Static files collection failed, continuing..."

echo -e "${YELLOW}📋 Step 9: Checking service status${NC}"
echo "----------------------------------------"
# Check service status
echo "Service status:"
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

echo ""
echo -e "${BLUE}🔍 If issues persist, check the logs:${NC}"
echo "docker-compose logs web"
echo "docker-compose logs nginx"
echo "docker-compose logs celery"

echo ""
echo -e "${GREEN}✅ Quick fix complete!${NC}"