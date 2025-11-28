#!/bin/bash

# Setup GitHub SSH Access for CI/CD Deployment
# This script helps configure SSH access to GitHub on your production server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GITHUB_REPO="nugwuegbu/medcor_new_backend"
SSH_KEY_PATH="$HOME/.ssh/github_deploy_key"
PROJECT_DIR="/var/www/html/medcor_backend2"

echo -e "${BLUE}🔧 Setting up GitHub SSH access for CI/CD deployment...${NC}"

# Check if SSH key already exists
if [ -f "$SSH_KEY_PATH" ]; then
    echo -e "${YELLOW}⚠️  SSH key already exists at $SSH_KEY_PATH${NC}"
    read -p "Do you want to regenerate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f "$SSH_KEY_PATH" "$SSH_KEY_PATH.pub"
    else
        echo -e "${GREEN}✅ Using existing SSH key${NC}"
        exit 0
    fi
fi

# Generate SSH key
echo -e "${BLUE}🔑 Generating SSH key for GitHub access...${NC}"
ssh-keygen -t rsa -b 4096 -C "medcor-deploy@$(hostname)" -f "$SSH_KEY_PATH" -N ""

# Set proper permissions
chmod 600 "$SSH_KEY_PATH"
chmod 644 "$SSH_KEY_PATH.pub"

echo -e "${GREEN}✅ SSH key generated successfully!${NC}"

# Display the public key
echo -e "${YELLOW}📋 Please add this public key to your GitHub repository:${NC}"
echo -e "${BLUE}Repository: https://github.com/$GITHUB_REPO/settings/keys${NC}"
echo -e "${BLUE}Or: https://github.com/$GITHUB_REPO/settings/keys/new${NC}"
echo
echo -e "${GREEN}Public Key:${NC}"
cat "$SSH_KEY_PATH.pub"
echo

# Configure SSH config
echo -e "${BLUE}🔧 Configuring SSH config...${NC}"
mkdir -p "$HOME/.ssh"
cat >> "$HOME/.ssh/config" << EOF

# GitHub deployment key
Host github-deploy
    HostName github.com
    User git
    IdentityFile $SSH_KEY_PATH
    IdentitiesOnly yes
EOF

# Test SSH connection
echo -e "${BLUE}🧪 Testing SSH connection to GitHub...${NC}"
if ssh -T -o StrictHostKeyChecking=no github-deploy 2>&1 | grep -q "successfully authenticated"; then
    echo -e "${GREEN}✅ SSH connection to GitHub successful!${NC}"
else
    echo -e "${YELLOW}⚠️  SSH connection test failed. This is normal if you haven't added the key to GitHub yet.${NC}"
fi

# Configure git remote
echo -e "${BLUE}🔧 Configuring git remote for SSH...${NC}"
cd "$PROJECT_DIR"
git remote set-url origin "git@github-deploy:$GITHUB_REPO.git"

echo -e "${GREEN}✅ Git remote configured for SSH access${NC}"

# Test git pull
echo -e "${BLUE}🧪 Testing git pull...${NC}"
if git pull origin main; then
    echo -e "${GREEN}✅ Git pull successful!${NC}"
else
    echo -e "${YELLOW}⚠️  Git pull failed. Make sure you've added the public key to GitHub.${NC}"
fi

echo
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Copy the public key above"
echo -e "2. Go to: https://github.com/$GITHUB_REPO/settings/keys"
echo -e "3. Click 'Add deploy key'"
echo -e "4. Paste the public key and give it a title like 'Production Server Deploy Key'"
echo -e "5. Make sure to check 'Allow write access' if you need it"
echo -e "6. Click 'Add key'"
echo -e "7. Test the CI/CD pipeline by pushing to main branch"
echo
echo -e "${BLUE}Your CI/CD pipeline should now work! 🚀${NC}"