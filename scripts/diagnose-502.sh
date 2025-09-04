#!/bin/bash

# 502 Bad Gateway Diagnostic Script for MedCor Backend
# Run this script on your AWS server to diagnose the issue

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 MedCor Backend 502 Error Diagnostic Script${NC}"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.yml not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 1: Checking Docker and Docker Compose${NC}"
echo "--------------------------------------------------"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Docker is installed: $(docker --version)${NC}"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Docker Compose is installed: $(docker-compose --version)${NC}"
fi

echo -e "${YELLOW}📋 Step 2: Checking Docker Services Status${NC}"
echo "--------------------------------------------------"

# Check if containers are running
echo "Docker containers status:"
docker-compose ps

echo ""
echo "Docker containers logs (last 20 lines):"
echo "======================================"

# Check web service logs
echo -e "${BLUE}🌐 Web Service Logs:${NC}"
docker-compose logs --tail=20 web || echo "No web service logs found"

echo ""
echo -e "${BLUE}🐰 Celery Service Logs:${NC}"
docker-compose logs --tail=20 celery || echo "No celery service logs found"

echo ""
echo -e "${BLUE}🔧 MCP Server Logs:${NC}"
docker-compose logs --tail=20 mcp-server || echo "No mcp-server service logs found"

echo ""
echo -e "${BLUE}🌍 Nginx Service Logs:${NC}"
docker-compose logs --tail=20 nginx || echo "No nginx service logs found"

echo -e "${YELLOW}📋 Step 3: Checking Network Connectivity${NC}"
echo "--------------------------------------------------"

# Check if web service is accessible
echo "Testing web service connectivity:"
if docker-compose ps web | grep -q "Up"; then
    echo -e "${GREEN}✅ Web service is running${NC}"
    
    # Test internal connectivity
    echo "Testing internal connectivity to web service:"
    if docker-compose exec -T web curl -f http://localhost:8000/api/health/ 2>/dev/null; then
        echo -e "${GREEN}✅ Web service health check passed${NC}"
    else
        echo -e "${RED}❌ Web service health check failed${NC}"
    fi
else
    echo -e "${RED}❌ Web service is not running${NC}"
fi

# Check if nginx is accessible
echo ""
echo "Testing nginx service connectivity:"
if docker-compose ps nginx | grep -q "Up"; then
    echo -e "${GREEN}✅ Nginx service is running${NC}"
    
    # Test nginx connectivity
    if curl -f http://localhost/health/ 2>/dev/null; then
        echo -e "${GREEN}✅ Nginx health check passed${NC}"
    else
        echo -e "${RED}❌ Nginx health check failed${NC}"
    fi
else
    echo -e "${RED}❌ Nginx service is not running${NC}"
fi

echo -e "${YELLOW}📋 Step 4: Checking Port Availability${NC}"
echo "--------------------------------------------------"

# Check if ports are in use
echo "Checking port 80 (nginx):"
if netstat -tlnp | grep -q ":80 "; then
    echo -e "${GREEN}✅ Port 80 is in use${NC}"
    netstat -tlnp | grep ":80 "
else
    echo -e "${RED}❌ Port 80 is not in use${NC}"
fi

echo ""
echo "Checking port 8000 (web service):"
if netstat -tlnp | grep -q ":8000 "; then
    echo -e "${GREEN}✅ Port 8000 is in use${NC}"
    netstat -tlnp | grep ":8000 "
else
    echo -e "${RED}❌ Port 8000 is not in use${NC}"
fi

echo -e "${YELLOW}📋 Step 5: Checking Environment Variables${NC}"
echo "--------------------------------------------------"

# Check if .env file exists
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    echo "Environment file contents (hiding sensitive data):"
    grep -v -E "(PASSWORD|SECRET|KEY)" .env | head -10
else
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
fi

echo -e "${YELLOW}📋 Step 6: Checking Database Connectivity${NC}"
echo "--------------------------------------------------"

# Test database connection
echo "Testing database connection:"
if docker-compose exec -T web python manage.py check --database default 2>/dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo "Database error details:"
    docker-compose exec -T web python manage.py check --database default 2>&1 || true
fi

echo -e "${YELLOW}📋 Step 7: Quick Fix Attempts${NC}"
echo "--------------------------------------------------"

echo "Attempting to restart services..."
docker-compose down
sleep 5
docker-compose up -d

echo ""
echo "Waiting for services to start..."
sleep 30

echo ""
echo "Final status check:"
docker-compose ps

echo ""
echo -e "${BLUE}🔧 Recommended Next Steps:${NC}"
echo "1. If services are not running, check the logs above for errors"
echo "2. If database connection fails, verify your AWS RDS credentials"
echo "3. If nginx fails, check if port 80 is available"
echo "4. If web service fails, check Django application logs"
echo "5. Run 'docker-compose logs [service-name]' for detailed logs"

echo ""
echo -e "${GREEN}✅ Diagnostic complete!${NC}"