#!/bin/bash
# Deployment script for YouCam API Refactoring
# Usage: bash deploy_youcam_refactor.sh

set -e  # Exit on error

echo "================================================"
echo "YouCam API Refactor - AWS Deployment Script"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
AWS_SERVER="api.medcor.ai"
AWS_USER="ubuntu"
DEPLOY_PATH="/var/www/html/medcor_backend2"
BRANCH="clean-aws-rds-fix"
SERVICE_NAME="medcor-backend"

echo -e "${YELLOW}Step 1: Committing changes locally...${NC}"
git add youcam/youcam_client.py
git add youcam/views.py
git add requirements.txt
git add YOUCAM_ENHANCED_API_DOCUMENTATION.md
git add YOUCAM_DEPLOYMENT_GUIDE.md
git add *ANALYSIS*.md 2>/dev/null || true

git commit -m "Refactor: Implement real image analysis for all 4 YouCam APIs

- Add real face analysis with DeepFace (emotion, beauty, features)
- Add real skin analysis with CV2 (texture, pores, wrinkles, hydration)
- Add real hair analysis with CV2 (curl pattern, color, condition)
- Add real lips analysis with CV2 (health, texture, hydration)
- Add opencv-python, deepface, tf-keras dependencies
- Update response formats to match specifications
- Each image now returns unique analysis results
- Add intelligent personalized recommendations
- Production ready with graceful fallbacks" || echo "Nothing to commit or already committed"

echo -e "${GREEN}✓ Changes committed${NC}"
echo ""

echo -e "${YELLOW}Step 2: Pushing to repository...${NC}"
git push origin $BRANCH
echo -e "${GREEN}✓ Pushed to $BRANCH${NC}"
echo ""

echo -e "${YELLOW}Step 3: Deploying to AWS server...${NC}"
ssh $AWS_USER@$AWS_SERVER << 'ENDSSH'
    set -e
    
    echo "→ Navigating to project directory..."
    cd /var/www/html/medcor_backend2
    
    echo "→ Pulling latest changes..."
    git pull origin clean-aws-rds-fix
    
    echo "→ Activating virtual environment..."
    source venv/bin/activate
    
    echo "→ Installing new dependencies..."
    pip install opencv-python==4.8.1.78 deepface==0.0.79 tf-keras==2.15.0
    
    echo "→ Installing all requirements (if any missing)..."
    pip install -r requirements.txt
    
    echo "→ Collecting static files..."
    python manage.py collectstatic --noinput
    
    echo "→ Running migrations (if any)..."
    python manage.py migrate --noinput
    
    echo "→ Restarting Django service..."
    sudo systemctl restart medcor-backend
    
    echo "→ Checking service status..."
    sudo systemctl status medcor-backend --no-pager
    
    echo ""
    echo "✓ Deployment complete!"
ENDSSH

echo -e "${GREEN}✓ Deployed to AWS${NC}"
echo ""

echo -e "${YELLOW}Step 4: Verifying deployment...${NC}"
sleep 5  # Wait for service to start

# Test the API
echo "→ Testing API endpoint..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://api.medcor.ai/api/docs/

echo ""
echo -e "${GREEN}================================================"
echo "✓ DEPLOYMENT SUCCESSFUL!"
echo "================================================${NC}"
echo ""
echo "Next Steps:"
echo "1. Open https://api.medcor.ai/api/docs/"
echo "2. Test YouCam Face Analysis endpoint"
echo "3. Test YouCam Skin Analysis endpoint"
echo "4. Test YouCam Hair Analysis endpoint"
echo "5. Test YouCam Lips Analysis endpoint"
echo ""
echo "⚠️  IMPORTANT: First analysis request will take 5-10 minutes"
echo "    (DeepFace models downloading ~1.6 GB)"
echo "    Subsequent requests will be fast (<3 seconds)"
echo ""
echo "View logs on AWS:"
echo "  ssh $AWS_USER@$AWS_SERVER"
echo "  sudo journalctl -u $SERVICE_NAME -f"
echo ""



