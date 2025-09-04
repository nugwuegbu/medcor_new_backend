#!/bin/bash

# Quick fix for Git authentication issues on production server
# Run this script on your AWS server to fix the git pull issue

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/var/www/html/medcor_backend2"
GITHUB_REPO="nugwuegbu/medcor_new_backend"

echo -e "${BLUE}🔧 Fixing Git authentication for CI/CD deployment...${NC}"

# Navigate to project directory
cd "$PROJECT_DIR"

# Check current git remote
echo -e "${BLUE}📋 Current git remote:${NC}"
git remote -v

# Configure git for SSH access
echo -e "${BLUE}🔧 Configuring git for SSH access...${NC}"
git remote set-url origin "git@github.com:$GITHUB_REPO.git"

echo -e "${GREEN}✅ Git remote updated to SSH${NC}"

# Check if SSH key exists
if [ ! -f "$HOME/.ssh/id_rsa" ]; then
    echo -e "${YELLOW}⚠️  No SSH key found. Generating one...${NC}"
    ssh-keygen -t rsa -b 4096 -C "medcor-deploy@$(hostname)" -f "$HOME/.ssh/id_rsa" -N ""
    chmod 600 "$HOME/.ssh/id_rsa"
    chmod 644 "$HOME/.ssh/id_rsa.pub"
    echo -e "${GREEN}✅ SSH key generated${NC}"
fi

# Display public key
echo -e "${YELLOW}📋 Add this public key to GitHub repository:${NC}"
echo -e "${BLUE}Repository: https://github.com/$GITHUB_REPO/settings/keys${NC}"
echo
echo -e "${GREEN}Public Key:${NC}"
cat "$HOME/.ssh/id_rsa.pub"
echo

# Test SSH connection
echo -e "${BLUE}🧪 Testing SSH connection to GitHub...${NC}"
ssh -T -o StrictHostKeyChecking=no git@github.com 2>&1 || true

# Try to pull
echo -e "${BLUE}🔄 Attempting to pull latest code...${NC}"
if git pull origin main; then
    echo -e "${GREEN}✅ Git pull successful!${NC}"
    
    # Make deployment script executable
    chmod +x scripts/traditional-deploy.sh
    echo -e "${GREEN}✅ Deployment script is now executable${NC}"
    
    # Test deployment script
    if [ -f "scripts/traditional-deploy.sh" ]; then
        echo -e "${GREEN}✅ Deployment script found and ready${NC}"
    else
        echo -e "${RED}❌ Deployment script not found${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Git pull failed. Please add the SSH key to GitHub first.${NC}"
    echo -e "${YELLOW}Then run: git pull origin main${NC}"
fi

echo
echo -e "${GREEN}🎉 Fix complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Add the public key above to GitHub repository settings"
echo -e "2. Run: git pull origin main"
echo -e "3. Test the CI/CD pipeline"