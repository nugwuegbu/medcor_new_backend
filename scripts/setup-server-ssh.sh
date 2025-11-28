#!/bin/bash

# Quick setup script for server SSH access to GitHub
# Run this on your AWS server to fix the CI/CD deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/var/www/html/medcor_backend2"

echo -e "${BLUE}🔧 Setting up server SSH access to GitHub...${NC}"

# Navigate to project directory
cd "$PROJECT_DIR"

# Add GitHub to known_hosts
echo -e "${BLUE}🔑 Adding GitHub to known_hosts...${NC}"
mkdir -p ~/.ssh
ssh-keyscan -H github.com >> ~/.ssh/known_hosts
echo -e "${GREEN}✅ GitHub added to known_hosts${NC}"

# Check if SSH key exists
if [ ! -f "$HOME/.ssh/id_rsa" ]; then
    echo -e "${YELLOW}⚠️  No SSH key found. Generating one...${NC}"
    ssh-keygen -t rsa -b 4096 -C "medcor-deploy@$(hostname)" -f "$HOME/.ssh/id_rsa" -N ""
    chmod 600 "$HOME/.ssh/id_rsa"
    chmod 644 "$HOME/.ssh/id_rsa.pub"
    echo -e "${GREEN}✅ SSH key generated${NC}"
else
    echo -e "${GREEN}✅ SSH key already exists${NC}"
fi

# Display the public key
echo -e "${YELLOW}📋 IMPORTANT: Add this public key to GitHub repository:${NC}"
echo -e "${BLUE}Repository: https://github.com/nugwuegbu/medcor_new_backend/settings/keys${NC}"
echo -e "${BLUE}Click 'Add deploy key' and paste the key below:${NC}"
echo
echo -e "${GREEN}Public Key:${NC}"
cat "$HOME/.ssh/id_rsa.pub"
echo
echo -e "${YELLOW}⚠️  After adding the key to GitHub, press Enter to continue...${NC}"
read -p "Press Enter after adding the key to GitHub..."

# Configure git remote for SSH
echo -e "${BLUE}🔧 Configuring git remote for SSH...${NC}"
git remote set-url origin "git@github.com:nugwuegbu/medcor_new_backend.git"
echo -e "${GREEN}✅ Git remote configured for SSH access${NC}"

# Test git pull
echo -e "${BLUE}🔄 Testing git pull...${NC}"
if git pull origin main; then
    echo -e "${GREEN}✅ Git pull successful!${NC}"
    
    # Make deployment script executable
    chmod +x scripts/traditional-deploy.sh
    echo -e "${GREEN}✅ Deployment script is now executable${NC}"
    
    # Test deployment script
    if [ -f "scripts/traditional-deploy.sh" ]; then
        echo -e "${GREEN}✅ Deployment script found and ready${NC}"
        echo -e "${GREEN}🎉 CI/CD setup complete! Your pipeline should now work.${NC}"
    else
        echo -e "${RED}❌ Deployment script not found${NC}"
    fi
else
    echo -e "${RED}❌ Git pull failed. Please check that you added the SSH key to GitHub.${NC}"
    echo -e "${YELLOW}Make sure to:${NC}"
    echo -e "1. Go to: https://github.com/nugwuegbu/medcor_new_backend/settings/keys"
    echo -e "2. Click 'Add deploy key'"
    echo -e "3. Paste the public key above"
    echo -e "4. Give it a title like 'Production Server Deploy Key'"
    echo -e "5. Check 'Allow write access'"
    echo -e "6. Click 'Add key'"
    echo -e "7. Run this script again"
fi

echo
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo -e "${BLUE}Your CI/CD pipeline should now work! 🚀${NC}"