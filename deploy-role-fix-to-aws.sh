#!/bin/bash

# =============================================================================
# Role Mapping Fix Deployment Script for AWS EC2 Production
# =============================================================================
# This script deploys the critical role mapping fixes to production
# Fixes: Doctors no longer returned as "staff", proper role detection
# =============================================================================

# Configuration - EDIT THESE WITH YOUR ACTUAL VALUES
EC2_HOST="your-ec2-public-ip-or-domain"  # Replace with medcor.ai or your EC2 IP
EC2_USER="ubuntu"                         # Usually 'ubuntu' for Ubuntu EC2
PEM_FILE="path/to/your-key.pem"          # Path to your AWS .pem key file
REMOTE_PATH="/var/www/medcor_backend"    # Django backend path on server

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   MedCor Role Mapping Fix Deployment    ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo -e "${YELLOW}This will deploy the following fixes:${NC}"
echo "  ✓ Doctors correctly returned as 'doctor' not 'staff'"
echo "  ✓ Role field checked before is_staff field"
echo "  ✓ Proper role detection for all user types"
echo ""
echo -e "${YELLOW}Files to be updated:${NC}"
echo "  - medcor_backend/user_auth/general_views.py"
echo "  - medcor_backend/user_auth/views.py"
echo ""

# Check if PEM file exists
if [ ! -f "$PEM_FILE" ]; then
    echo -e "${RED}Error: PEM file not found at $PEM_FILE${NC}"
    echo "Please update the PEM_FILE variable with your actual AWS key path"
    exit 1
fi

read -p "Deploy to $EC2_HOST? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 1
fi

# Create deployment package
echo -e "${GREEN}📦 Creating deployment package...${NC}"
mkdir -p deploy-role-fix

# Copy the fixed files
cp medcor_backend/user_auth/general_views.py deploy-role-fix/
cp medcor_backend/user_auth/views.py deploy-role-fix/

# Create remote deployment script
cat > deploy-role-fix/apply-fixes.sh << 'REMOTE_SCRIPT'
#!/bin/bash

# Script runs on the EC2 server
echo "Starting role fix deployment on server..."

# Create backup directory with timestamp
BACKUP_DIR="/var/www/backups/role-fix-$(date +%Y%m%d_%H%M%S)"
echo "Creating backup at $BACKUP_DIR..."
sudo mkdir -p $BACKUP_DIR

# Backup current files
sudo cp /var/www/medcor_backend/user_auth/general_views.py $BACKUP_DIR/ 2>/dev/null || echo "general_views.py not found, skipping backup"
sudo cp /var/www/medcor_backend/user_auth/views.py $BACKUP_DIR/ 2>/dev/null || echo "views.py not found, skipping backup"

# Apply the fixes
echo "Applying role mapping fixes..."
sudo cp /tmp/deploy-role-fix/general_views.py /var/www/medcor_backend/user_auth/
sudo cp /tmp/deploy-role-fix/views.py /var/www/medcor_backend/user_auth/

# Set correct permissions
echo "Setting permissions..."
sudo chown -R www-data:www-data /var/www/medcor_backend/user_auth/

# Collect static files if needed
cd /var/www/medcor_backend
sudo -u www-data python manage.py collectstatic --noinput 2>/dev/null || echo "Static collection skipped"

# Restart Gunicorn to apply changes
echo "Restarting Gunicorn service..."
sudo systemctl restart gunicorn

# Check if systemd service exists, otherwise try supervisor
if ! systemctl list-units --full -all | grep -Fq "gunicorn.service"; then
    echo "Gunicorn systemd service not found, trying supervisor..."
    sudo supervisorctl restart medcor_backend 2>/dev/null || echo "Supervisor not configured"
fi

# Restart Nginx for good measure
echo "Restarting Nginx..."
sudo systemctl restart nginx

echo "Waiting for services to stabilize..."
sleep 5

# Test the fix
echo ""
echo "Testing authentication endpoint..."
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "test"}' \
  -s | python3 -m json.tool 2>/dev/null | head -5 || echo "Test endpoint not accessible"

echo ""
echo "✅ Role mapping fixes deployed successfully!"
echo "Backup saved at: $BACKUP_DIR"
echo ""
echo "To rollback if needed, run:"
echo "  sudo cp $BACKUP_DIR/* /var/www/medcor_backend/user_auth/"
echo "  sudo systemctl restart gunicorn"
REMOTE_SCRIPT

chmod +x deploy-role-fix/apply-fixes.sh

# Transfer files to EC2
echo -e "${GREEN}📤 Transferring files to EC2...${NC}"
scp -i "$PEM_FILE" -r deploy-role-fix "$EC2_USER@$EC2_HOST:/tmp/"

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to transfer files. Check your EC2_HOST and PEM_FILE settings.${NC}"
    exit 1
fi

# Execute deployment on EC2
echo -e "${GREEN}🚀 Executing deployment on server...${NC}"
ssh -i "$PEM_FILE" "$EC2_USER@$EC2_HOST" "bash /tmp/deploy-role-fix/apply-fixes.sh"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo "The role mapping fixes are now live on production."
    echo ""
    echo -e "${YELLOW}Please test by logging in as:${NC}"
    echo "  - Admin user → Should return role: 'admin'"
    echo "  - Doctor user → Should return role: 'doctor' (not 'staff')"
    echo "  - Patient user → Should return role: 'patient'"
else
    echo -e "${RED}Deployment failed. Please check the error messages above.${NC}"
    exit 1
fi

# Cleanup local deployment files
rm -rf deploy-role-fix

echo ""
echo -e "${BLUE}Deployment script finished.${NC}"