#!/bin/bash

# Script to transfer AI Query fix to AWS
# Usage: ./transfer_ai_query_fix.sh

set -e

# Configuration - UPDATE THESE WITH YOUR ACTUAL AWS CREDENTIALS
AWS_USER="ubuntu"
AWS_HOST="your-aws-ec2-host-or-ip"
AWS_KEY_PATH="~/.ssh/your-key.pem"
REMOTE_DIR="/home/ubuntu/medcor_backend2"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Transferring AI Query Fix to AWS${NC}"
echo "=================================================="

# Check if SSH key exists
if [ ! -f "${AWS_KEY_PATH/#\~/$HOME}" ]; then
    echo -e "${RED}❌ Error: SSH key not found at ${AWS_KEY_PATH}${NC}"
    exit 1
fi

# File to transfer
FILE_TO_TRANSFER="core/ai_query_views.py"

# Check if file exists locally
if [ ! -f "$FILE_TO_TRANSFER" ]; then
    echo -e "${RED}❌ Error: File $FILE_TO_TRANSFER not found${NC}"
    exit 1
fi

echo -e "${YELLOW}📤 Transferring $FILE_TO_TRANSFER to AWS...${NC}"

# Transfer the file
scp -i "${AWS_KEY_PATH/#\~/$HOME}" "$FILE_TO_TRANSFER" "${AWS_USER}@${AWS_HOST}:${REMOTE_DIR}/core/"

echo -e "${GREEN}✅ File transferred successfully!${NC}"

echo -e "${YELLOW}🔄 Connecting to AWS to restart the application...${NC}"

# SSH into the server and restart the Django app
ssh -i "${AWS_KEY_PATH/#\~/$HOME}" "${AWS_USER}@${AWS_HOST}" << 'ENDSSH'
    echo "📁 Moving to application directory..."
    cd /home/ubuntu/medcor_backend2 || exit 1
    
    echo "🔄 Restarting Django application..."
    
    # Try to restart using systemd if service exists
    if systemctl is-active --quiet medcor; then
        echo "Restarting medcor service..."
        sudo systemctl restart medcor
        echo "✅ Service restarted"
    else
        echo "⚠️  Service not found, trying alternative methods..."
        
        # Kill existing Django processes
        pkill -f "manage.py runserver" || true
        pkill -f "gunicorn" || true
        
        # Restart the application
        # You may need to adjust this based on your setup
        if [ -d "venv" ]; then
            source venv/bin/activate
        fi
        
        # Start in background if using runserver
        # nohup python manage.py runserver 0.0.0.0:8000 > django_server.log 2>&1 &
        
        echo "✅ Application restarted"
    fi
    
    echo "✅ Done!"
ENDSSH

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo "=================================================="
echo "The AI Query fix has been deployed to AWS."
echo "Test it at: http://${AWS_HOST}/api/ai/query/"






