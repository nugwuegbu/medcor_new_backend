#!/bin/bash

# Medcor Hospital One-Click Deployment Script
# Run this script from your local machine to deploy to EC2

set -e

echo "🏥 Medcor Hospital - One-Click Deployment"
echo "=========================================="
echo ""
echo "📍 Target Server: ec2-51-16-221-91.il-central-1.compute.amazonaws.com"
echo "📍 Frontend Port: 8081"
echo "📍 Backend Port: 8001"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# EC2 Details
EC2_HOST="ec2-51-16-221-91.il-central-1.compute.amazonaws.com"
EC2_USER="ubuntu"
PEM_FILE="deployment/medcor-ec2.pem"

# Step 1: Set permissions
echo -e "${GREEN}Step 1: Setting PEM file permissions...${NC}"
chmod 400 $PEM_FILE

# Step 2: Check if deployment package exists
if [ ! -f "medcor-deploy.tar.gz" ]; then
    echo -e "${GREEN}Step 2: Creating deployment package...${NC}"
    tar -czf medcor-deploy.tar.gz \
        client/ server/ shared/ medcor_backend/ \
        package.json package-lock.json pyproject.toml \
        tsconfig.json vite.config.ts tailwind.config.ts \
        drizzle.config.ts postcss.config.js components.json \
        deployment/medcor-custom-deploy.sh \
        deployment/requirements.txt \
        deployment/env-with-secrets.txt
else
    echo -e "${GREEN}Step 2: Deployment package found${NC}"
fi

# Step 3: Transfer files
echo -e "${GREEN}Step 3: Transferring files to EC2...${NC}"
scp -o StrictHostKeyChecking=no -i $PEM_FILE medcor-deploy.tar.gz $EC2_USER@$EC2_HOST:/home/ubuntu/
scp -o StrictHostKeyChecking=no -i $PEM_FILE deployment/medcor-custom-deploy.sh $EC2_USER@$EC2_HOST:/home/ubuntu/

# Step 4: Execute deployment on EC2
echo -e "${GREEN}Step 4: Executing deployment on EC2...${NC}"
ssh -o StrictHostKeyChecking=no -i $PEM_FILE $EC2_USER@$EC2_HOST << 'ENDSSH'
#!/bin/bash

# Make deployment script executable
chmod +x /home/ubuntu/medcor-custom-deploy.sh

# Run deployment
echo "Starting deployment script..."
/home/ubuntu/medcor-custom-deploy.sh

# Create Django superuser automatically
cd /var/www/medcor
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=medcor_backend.settings_production

# Create default superuser (username: admin, password: MedcorAdmin2025!)
python medcor_backend/manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@medcor.ai', 'MedcorAdmin2025!')
    print("Created superuser: admin / MedcorAdmin2025!")
else:
    print("Superuser already exists")
EOF

# Add API keys to .env file
echo "Adding API keys to configuration..."
cat >> /var/www/medcor/.env << 'ENVEOF'

# Additional API Keys (update these with your actual keys)
OPENAI_API_KEY=${OPENAI_API_KEY:-sk-your-openai-key}
ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY:-your-elevenlabs-key}
HEYGEN_API_KEY=${HEYGEN_API_KEY:-your-heygen-key}
ENVEOF

# Restart services
echo "Restarting services..."
sudo systemctl restart medcor-backend
sudo systemctl restart medcor-frontend
sudo systemctl restart nginx

# Test deployment
echo ""
echo "Testing deployment..."
echo -n "Backend Health: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health || echo "Failed"
echo ""
echo -n "Frontend Status: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/ || echo "Failed"
echo ""

ENDSSH

# Step 5: Test from local machine
echo ""
echo -e "${GREEN}Step 5: Testing deployment from local machine...${NC}"
echo -n "Testing Frontend (8081): "
curl -s -o /dev/null -w "%{http_code}" http://$EC2_HOST:8081/ || echo "Connection failed"
echo ""
echo -n "Testing Backend API (8001): "
curl -s -o /dev/null -w "%{http_code}" http://$EC2_HOST:8001/health || echo "Connection failed"
echo ""

# Display access information
echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://$EC2_HOST:8081"
echo "   Backend API: http://$EC2_HOST:8001/api/"
echo "   Django Admin: http://$EC2_HOST:8001/admin/"
echo ""
echo "🔑 Django Admin Credentials:"
echo "   Username: admin"
echo "   Password: MedcorAdmin2025!"
echo ""
echo "📝 Important Notes:"
echo "1. Update DNS for medcor.ai to point to: 51.16.221.91"
echo "2. Add your actual API keys in /var/www/medcor/.env"
echo ""
echo "🔧 SSH Access:"
echo "   ssh -i $PEM_FILE $EC2_USER@$EC2_HOST"
echo ""
echo "📊 Monitor Logs:"
echo "   ssh -i $PEM_FILE $EC2_USER@$EC2_HOST 'sudo journalctl -u medcor-backend -f'"
echo ""
echo "🔄 Restart Services:"
echo "   ssh -i $PEM_FILE $EC2_USER@$EC2_HOST 'sudo systemctl restart medcor-backend medcor-frontend nginx'"
echo ""
echo -e "${YELLOW}⚠️  If ports 8001 or 8081 are not accessible:${NC}"
echo "   1. Check AWS Security Group allows inbound traffic on ports 8001 and 8081"
echo "   2. Add inbound rules for TCP ports 8001 and 8081 from source 0.0.0.0/0"
echo ""