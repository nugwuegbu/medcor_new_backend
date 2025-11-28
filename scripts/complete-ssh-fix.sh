#!/bin/bash

# Complete SSH fix for GitHub authentication
# This script will be run on the server to fix all SSH issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/var/www/html/medcor_backend2"
GITHUB_REPO="nugwuegbu/medcor_new_backend"

echo -e "${BLUE}🔧 Complete SSH fix for GitHub authentication...${NC}"

# Navigate to project directory
cd "$PROJECT_DIR"

# Add GitHub to known_hosts
echo -e "${BLUE}🔑 Adding GitHub to known_hosts...${NC}"
mkdir -p ~/.ssh
ssh-keyscan -H github.com >> ~/.ssh/known_hosts
echo -e "${GREEN}✅ GitHub added to known_hosts${NC}"

# Generate SSH key if it doesn't exist
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
echo -e "${YELLOW}📋 SSH Public Key (add this to GitHub Deploy Keys):${NC}"
echo -e "${BLUE}Repository: https://github.com/$GITHUB_REPO/settings/keys${NC}"
echo
echo -e "${GREEN}Public Key:${NC}"
cat "$HOME/.ssh/id_rsa.pub"
echo

# Configure git remote for SSH
echo -e "${BLUE}🔧 Configuring git remote for SSH...${NC}"
git remote set-url origin "git@github.com:$GITHUB_REPO.git"
echo -e "${GREEN}✅ Git remote configured for SSH access${NC}"

# Test SSH connection to GitHub
echo -e "${BLUE}🧪 Testing SSH connection to GitHub...${NC}"
if ssh -T -o StrictHostKeyChecking=no git@github.com 2>&1 | grep -q "successfully authenticated\|Hi"; then
    echo -e "${GREEN}✅ SSH connection to GitHub successful!${NC}"
else
    echo -e "${YELLOW}⚠️  SSH connection test failed. This is normal if you haven't added the key to GitHub yet.${NC}"
fi

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
    echo -e "${RED}❌ Git pull failed. Please add the SSH key to GitHub first.${NC}"
    echo -e "${YELLOW}Steps to fix:${NC}"
    echo -e "1. Copy the public key above"
    echo -e "2. Go to: https://github.com/$GITHUB_REPO/settings/keys"
    echo -e "3. Click 'Add deploy key'"
    echo -e "4. Paste the public key"
    echo -e "5. Title: 'Production Server Deploy Key'"
    echo -e "6. Check 'Allow write access'"
    echo -e "7. Click 'Add key'"
    echo -e "8. Run this script again"
fi

echo
echo -e "${GREEN}🎉 SSH setup complete!${NC}"
echo -e "${BLUE}Your CI/CD pipeline should now work! 🚀${NC}"