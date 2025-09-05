#!/bin/bash

# Simple script to show SSH key for GitHub Deploy Keys
# This will always display the key, even if other steps fail

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/var/www/html/medcor_backend2"
GITHUB_REPO="nugwuegbu/medcor_new_backend"

echo -e "${BLUE}🔑 SSH Key Setup for GitHub Deploy Keys${NC}"

# Navigate to project directory
cd "$PROJECT_DIR"

# Add GitHub to known_hosts
echo -e "${BLUE}Adding GitHub to known_hosts...${NC}"
mkdir -p ~/.ssh
ssh-keyscan -H github.com >> ~/.ssh/known_hosts

# Generate SSH key if it doesn't exist
if [ ! -f "$HOME/.ssh/id_rsa" ]; then
    echo -e "${YELLOW}Generating SSH key...${NC}"
    ssh-keygen -t rsa -b 4096 -C "medcor-deploy@$(hostname)" -f "$HOME/.ssh/id_rsa" -N ""
    chmod 600 "$HOME/.ssh/id_rsa"
    chmod 644 "$HOME/.ssh/id_rsa.pub"
    echo -e "${GREEN}SSH key generated${NC}"
else
    echo -e "${GREEN}SSH key already exists${NC}"
fi

# ALWAYS display the public key
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  COPY THIS SSH PUBLIC KEY TO GITHUB  ${NC}"
echo -e "${YELLOW}========================================${NC}"
echo
echo -e "${BLUE}Go to: https://github.com/$GITHUB_REPO/settings/keys${NC}"
echo -e "${BLUE}Click 'Add deploy key' and paste the key below:${NC}"
echo
echo -e "${GREEN}SSH Public Key:${NC}"
cat "$HOME/.ssh/id_rsa.pub"
echo
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  AFTER ADDING KEY, RUN: git pull origin main${NC}"
echo -e "${YELLOW}========================================${NC}"

# Configure git remote
echo -e "${BLUE}Configuring git remote...${NC}"
git remote set-url origin "git@github.com:$GITHUB_REPO.git"

# Test git pull
echo -e "${BLUE}Testing git pull...${NC}"
if git pull origin main; then
    echo -e "${GREEN}✅ Git pull successful!${NC}"
    echo -e "${GREEN}🎉 SSH setup complete!${NC}"
else
    echo -e "${RED}❌ Git pull failed. Please add the SSH key to GitHub first.${NC}"
    echo -e "${YELLOW}Steps:${NC}"
    echo -e "1. Copy the key above"
    echo -e "2. Go to GitHub Deploy Keys"
    echo -e "3. Add the key"
    echo -e "4. Run: git pull origin main"
fi