#!/bin/bash

# Deployment script for API endpoint fixes to medcor.ai
# This script packages and deploys the fixed files to production

echo "========================================="
echo "MedCor API Endpoint Fixes Deployment"
echo "========================================="

# Configuration
PRODUCTION_SERVER="ubuntu@medcor.ai"
PRODUCTION_PATH="/var/www/medcor_backend"
BACKUP_DIR="/var/www/backups"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  This script will deploy API fixes to production at medcor.ai${NC}"
echo "Fixed endpoints:"
echo "  - /api/appointments/appointments/"
echo "  - /api/analysis-tracking-stats"
echo "  - /api/analysis-tracking"
echo "  - /api/track-analysis"
echo ""
read -p "Do you want to continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 1
fi

# Create deployment package
echo -e "${GREEN}📦 Creating deployment package...${NC}"
mkdir -p deploy-package

# Copy files to deployment package
cp medcor_backend/medcor_backend/urls_public.py deploy-package/
cp medcor_backend/api/views.py deploy-package/
cp medcor_backend/simple_django_server.py deploy-package/
cp medcor_backend/api/urls.py deploy-package/

# Create deployment script for remote execution
cat > deploy-package/remote-deploy.sh << 'EOF'
#!/bin/bash
# Remote deployment script

# Create backup
echo "Creating backup..."
sudo mkdir -p /var/www/backups
sudo cp -r /var/www/medcor_backend /var/www/backups/medcor_backend.$(date +%Y%m%d_%H%M%S)

# Update files
echo "Updating files..."
sudo cp /tmp/deploy-package/urls_public.py /var/www/medcor_backend/medcor_backend/
sudo cp /tmp/deploy-package/views.py /var/www/medcor_backend/api/
sudo cp /tmp/deploy-package/simple_django_server.py /var/www/medcor_backend/
sudo cp /tmp/deploy-package/urls.py /var/www/medcor_backend/api/

# Set permissions
echo "Setting permissions..."
sudo chown -R www-data:www-data /var/www/medcor_backend/

# Restart services
echo "Restarting services..."
sudo systemctl restart gunicorn
sudo systemctl restart nginx

# Wait for services to start
sleep 5

# Check status
echo "Checking service status..."
sudo systemctl status gunicorn --no-pager | head -n 5
sudo systemctl status nginx --no-pager | head -n 5

echo "Deployment complete!"
EOF

chmod +x deploy-package/remote-deploy.sh

# Transfer files to production
echo -e "${GREEN}📤 Transferring files to production server...${NC}"
scp -r deploy-package/ $PRODUCTION_SERVER:/tmp/ 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to transfer files. Please check SSH connection to $PRODUCTION_SERVER${NC}"
    exit 1
fi

# Execute remote deployment
echo -e "${GREEN}🚀 Executing deployment on production server...${NC}"
ssh $PRODUCTION_SERVER "bash /tmp/deploy-package/remote-deploy.sh"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed on remote server${NC}"
    exit 1
fi

# Test endpoints
echo -e "${GREEN}🧪 Testing endpoints...${NC}"

echo "Testing /api/appointments/appointments/..."
curl -s -o /dev/null -w "%{http_code}" https://medcor.ai/api/appointments/appointments/ | {
    read http_code
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Appointments endpoint: OK${NC}"
    else
        echo -e "${RED}❌ Appointments endpoint: HTTP $http_code${NC}"
    fi
}

echo "Testing /api/analysis-tracking-stats..."
curl -s -o /dev/null -w "%{http_code}" https://medcor.ai/api/analysis-tracking-stats | {
    read http_code
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Analysis stats endpoint: OK${NC}"
    else
        echo -e "${RED}❌ Analysis stats endpoint: HTTP $http_code${NC}"
    fi
}

echo "Testing /api/track-analysis (POST)..."
curl -s -o /dev/null -w "%{http_code}" -X POST https://medcor.ai/api/track-analysis \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test", "analysisType": "face", "widgetLocation": "chat"}' | {
    read http_code
    if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Track analysis endpoint: OK${NC}"
    else
        echo -e "${RED}❌ Track analysis endpoint: HTTP $http_code${NC}"
    fi
}

# Clean up local deployment package
rm -rf deploy-package/

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Check https://medcor.ai/api/docs/ for updated Swagger documentation"
echo "2. Test the endpoints from your application"
echo "3. Monitor logs: ssh $PRODUCTION_SERVER 'sudo journalctl -u gunicorn -f'"