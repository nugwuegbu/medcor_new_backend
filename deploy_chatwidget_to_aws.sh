#!/bin/bash

# ChatWidget Deployment Script for AWS EC2
# This script deploys the chatwidget customization feature to AWS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_USER="ubuntu"
APP_DIR="/home/$APP_USER/medcor_backend2"
SERVICE_NAME="medcor"

echo -e "${GREEN}🚀 Deploying ChatWidget Customization to AWS EC2${NC}"
echo "=================================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as ubuntu user."
   exit 1
fi

# Check if application directory exists
if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory $APP_DIR does not exist. Please run the main deployment script first."
    exit 1
fi

cd "$APP_DIR"

print_step "1. Backing up current database..."
# Create backup before making changes
BACKUP_DIR="/home/$APP_USER/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Load environment variables
if [ -f ".env" ]; then
    source .env
    if [ ! -z "$DATABASE_URL" ]; then
        pg_dump $DATABASE_URL > $BACKUP_DIR/medcor_db_before_chatwidget_$DATE.sql
        print_status "Database backup created: medcor_db_before_chatwidget_$DATE.sql"
    else
        print_warning "DATABASE_URL not found in .env file. Skipping database backup."
    fi
else
    print_warning ".env file not found. Skipping database backup."
fi

print_step "2. Pulling latest changes from repository..."
git pull origin main

print_step "3. Activating virtual environment..."
source venv/bin/activate

print_step "4. Installing/updating dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

print_step "5. Running Django migrations for chatwidget..."
# Run migrations specifically for chatwidget
python manage.py migrate chatwidget

print_step "6. Collecting static files..."
python manage.py collectstatic --noinput

print_step "7. Testing chatwidget models..."
# Test that the models are working correctly
python manage.py shell << 'EOF'
from chatwidget.models import ChatWidgetCustomization, Theme, Features, Avatar, Voice, Integration
from tenants.models import Hospital
print("✅ ChatWidget models imported successfully")
print(f"ChatWidgetCustomization model: {ChatWidgetCustomization}")
print(f"Theme model: {Theme}")
print(f"Features model: {Features}")
print(f"Avatar model: {Avatar}")
print(f"Voice model: {Voice}")
print(f"Integration model: {Integration}")
EOF

print_step "8. Restarting services..."
sudo systemctl restart $SERVICE_NAME
sudo systemctl restart nginx

print_step "9. Checking service status..."
sleep 5  # Wait for service to start
if systemctl is-active --quiet $SERVICE_NAME; then
    print_status "✅ MedCor service is running"
else
    print_error "❌ MedCor service failed to start"
    sudo journalctl -u $SERVICE_NAME --no-pager -l
    exit 1
fi

if systemctl is-active --quiet nginx; then
    print_status "✅ Nginx service is running"
else
    print_error "❌ Nginx service failed to start"
    sudo systemctl status nginx --no-pager
    exit 1
fi

print_step "10. Testing API endpoints..."
# Test the chatwidget API endpoints
API_BASE="http://localhost:8000/api"

# Test schema endpoint
if curl -s "$API_BASE/schema/" | grep -q "user_message_background"; then
    print_status "✅ ChatWidget API schema is working"
else
    print_warning "⚠️  ChatWidget API schema might not be properly configured"
fi

# Test chatwidget endpoints
if curl -s "$API_BASE/chatwidget/" > /dev/null; then
    print_status "✅ ChatWidget API endpoints are accessible"
else
    print_warning "⚠️  ChatWidget API endpoints might not be working"
fi

print_step "11. Creating test data (optional)..."
# Ask if user wants to create test data
read -p "Do you want to create test chatwidget data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python manage.py shell << 'EOF'
from chatwidget.models import ChatWidgetCustomization, Theme, Features, Avatar, Voice, Integration
from tenants.models import Hospital
import uuid

# Get first hospital or create one for testing
try:
    hospital = Hospital.objects.first()
    if not hospital:
        print("No hospitals found. Please create a hospital first.")
    else:
        print(f"Using hospital: {hospital.name}")
        
        # Check if customization already exists
        if hasattr(hospital, 'chatwidget_customization'):
            print("ChatWidget customization already exists for this hospital.")
        else:
            # Create test customization
            customization = ChatWidgetCustomization.objects.create(hospital=hospital)
            
            # Create theme
            Theme.objects.create(
                chatwidget_customization=customization,
                company_logo="/media/logos/test-logo.png",
                primary_color="#2E86AB",
                secondary_color="#A23B72",
                accent_color="#F18F01",
                background_color="#FFFFFF",
                text_color="#333333",
                user_message_background="#F8F9FA",
                assistant_message_background="#E3F2FD",
                message_overlay_color="#BBDEFB",
                input_background="#FFFFFF",
                glow_border_color="#2E86AB"
            )
            
            # Create features
            Features.objects.create(
                chatwidget_customization=customization,
                avarta_interaction_type="voice",
                face_analysis=True,
                hair_analysis=True,
                skin_analysis=True,
                lips_analysis=False,
                hair_extension_analysis=True
            )
            
            # Create avatar
            Avatar.objects.create(
                chatwidget_customization=customization,
                avarta_language="en"
            )
            
            # Create voice
            Voice.objects.create(
                chatwidget_customization=customization,
                voice_id="test_voice_001"
            )
            
            # Create integration
            Integration.objects.create(
                chatwidget_customization=customization
            )
            
            print("✅ Test ChatWidget customization created successfully!")
            print(f"Customization ID: {customization.id}")
            print(f"Hospital: {hospital.name}")
            
except Exception as e:
    print(f"Error creating test data: {e}")
EOF
fi

print_step "12. Final verification..."
# Test the API with a sample request
echo "Testing API with sample request..."
curl -s -X GET "$API_BASE/chatwidget/" -H "Content-Type: application/json" | head -c 200
echo "..."

# Final status check
print_status "Checking final service status..."
sudo systemctl status $SERVICE_NAME --no-pager -l | head -10

echo ""
echo -e "${GREEN}✅ ChatWidget Customization deployment completed successfully!${NC}"
echo "=================================================="
echo ""
echo "Deployment Summary:"
echo "==================="
echo "✅ Database migrations applied"
echo "✅ Static files collected"
echo "✅ Services restarted"
echo "✅ API endpoints tested"
echo ""
echo "ChatWidget API Endpoints:"
echo "========================="
echo "• POST   /api/chatwidget/create-for-hospital/{hospital_id}/"
echo "• GET    /api/chatwidget/hospital/{hospital_id}/"
echo "• PUT    /api/chatwidget/update-for-hospital/{hospital_id}/"
echo "• DELETE /api/chatwidget/delete-for-hospital/{hospital_id}/"
echo "• GET    /api/chatwidget/"
echo "• GET    /api/chatwidget/{id}/"
echo "• PUT    /api/chatwidget/{id}/"
echo "• DELETE /api/chatwidget/{id}/"
echo ""
echo "Documentation:"
echo "=============="
echo "• API Documentation: CHATWIDGET_API_DOCUMENTATION.md"
echo "• cURL Examples: CHATWIDGET_CURL_EXAMPLES.md"
echo "• Test Script: test_chatwidget_api.py"
echo ""
echo "Next Steps:"
echo "==========="
echo "1. Test the API endpoints with your frontend"
echo "2. Create chatwidget customizations for your hospitals"
echo "3. Monitor logs: sudo journalctl -u $SERVICE_NAME -f"
echo "4. Check API schema: curl $API_BASE/schema/"
echo ""
echo -e "${GREEN}🎉 ChatWidget Customization is now live on AWS!${NC}"





















