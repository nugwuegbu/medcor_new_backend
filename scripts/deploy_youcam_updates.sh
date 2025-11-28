#!/bin/bash

# Deploy YouCam Updates to AWS
# This script deploys the latest YouCam API changes and bug fixes

set -e  # Exit on error

echo "================================"
echo "Deploying YouCam Updates to AWS"
echo "================================"

# Configuration
AWS_HOST="ubuntu@ec2-54-157-62-221.compute-1.amazonaws.com"
PROJECT_PATH="/home/ubuntu/medcor_backend2"
VENV_PATH="$PROJECT_PATH/venv"

echo ""
echo "Files to be deployed:"
echo "  - youcam/views.py (Removed general endpoints, added JSONParser)"
echo "  - youcam/urls.py (Updated URL configuration)"
echo "  - youcam/serializers.py (Added Base64ImageField)"
echo "  - youcam/README.md (Updated documentation)"
echo "  - medcor_backend2/settings.py (Removed YouCam AI Analysis tag)"
echo "  - core/views.py (Fixed doctor_appointments bug)"
echo "  - YOUCAM_*.md (Documentation files)"
echo ""

# Step 1: Copy modified files to AWS
echo "Step 1: Copying modified files to AWS..."
scp youcam/views.py $AWS_HOST:$PROJECT_PATH/youcam/
scp youcam/urls.py $AWS_HOST:$PROJECT_PATH/youcam/
scp youcam/serializers.py $AWS_HOST:$PROJECT_PATH/youcam/
scp youcam/README.md $AWS_HOST:$PROJECT_PATH/youcam/
scp medcor_backend2/settings.py $AWS_HOST:$PROJECT_PATH/medcor_backend2/
scp core/views.py $AWS_HOST:$PROJECT_PATH/core/
scp YOUCAM_ENHANCED_API_DOCUMENTATION.md $AWS_HOST:$PROJECT_PATH/
scp YOUCAM_API_CHANGES_SUMMARY.md $AWS_HOST:$PROJECT_PATH/
scp YOUCAM_BASE64_UPDATE_SUMMARY.md $AWS_HOST:$PROJECT_PATH/

echo "✓ Files copied successfully"

# Step 2: Restart services on AWS
echo ""
echo "Step 2: Restarting Django services on AWS..."
ssh $AWS_HOST << 'ENDSSH'
    set -e
    
    echo "Activating virtual environment..."
    cd /home/ubuntu/medcor_backend2
    source venv/bin/activate
    
    echo "Collecting static files..."
    python manage.py collectstatic --noinput
    
    echo "Restarting Gunicorn service..."
    sudo systemctl restart gunicorn
    
    echo "Checking service status..."
    sudo systemctl status gunicorn --no-pager | head -10
    
    echo "✓ Services restarted successfully"
ENDSSH

echo ""
echo "================================"
echo "✓ Deployment completed successfully!"
echo "================================"
echo ""
echo "Changes deployed:"
echo "  ✓ YouCam API now accepts JSON with base64 encoded images"
echo "  ✓ Content-Type: application/json (not multipart/form-data)"
echo "  ✓ Field name changed from 'image' to 'imagebase64'"
echo "  ✓ Removed general YouCam AI Analysis endpoints"
echo "  ✓ Fixed doctor_appointments bug in hospital API"
echo ""
echo "Test the changes:"
echo "  curl -X POST 'https://medcor.ai/api/youcam/skin-analysis/' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"imagebase64\":\"data:image/jpeg;base64,...\"}'"
echo ""
echo "Check API documentation:"
echo "  https://medcor.ai/api/docs/"
echo ""




