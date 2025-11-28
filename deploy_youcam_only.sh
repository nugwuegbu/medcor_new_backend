#!/bin/bash
# Simple deployment script - Transfer YouCam files to AWS and restart

set -e

echo "================================================"
echo "Deploying YouCam Files to AWS"
echo "================================================"

# Configuration
AWS_SERVER="ubuntu@api.medcor.ai"
REMOTE_PATH="/var/www/html/medcor_backend2"

echo ""
echo "Step 1: Transferring YouCam files to AWS..."
scp youcam/youcam_client.py $AWS_SERVER:$REMOTE_PATH/youcam/
scp youcam/views.py $AWS_SERVER:$REMOTE_PATH/youcam/
scp requirements.txt $AWS_SERVER:$REMOTE_PATH/

echo "✓ Files transferred"
echo ""

echo "Step 2: Installing dependencies and restarting server..."
ssh $AWS_SERVER << 'ENDSSH'
    cd /var/www/html/medcor_backend2
    source venv/bin/activate
    
    echo "→ Installing new packages..."
    pip install opencv-python deepface tf-keras
    
    echo "→ Restarting web server..."
    sudo systemctl restart medcor-backend
    
    echo "→ Checking service status..."
    sleep 3
    sudo systemctl status medcor-backend --no-pager | head -20
ENDSSH

echo ""
echo "================================================"
echo "✓ DEPLOYMENT COMPLETE!"
echo "================================================"
echo ""
echo "API available at: https://api.medcor.ai/api/docs/"
echo ""
echo "⚠️  First analysis may take 5-10 minutes (downloading AI models)"
echo "    Subsequent analyses will be fast (<3 seconds)"
echo ""



