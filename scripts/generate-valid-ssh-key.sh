#!/bin/bash

# Generate a valid OpenSSH public key for GitHub Deploy Keys
# This ensures the key is in the correct format

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/var/www/html/medcor_backend2"
GITHUB_REPO="nugwuegbu/medcor_new_backend"

echo -e "${BLUE}🔑 Generating valid OpenSSH public key for GitHub...${NC}"

# Navigate to project directory
cd "$PROJECT_DIR"

# Add GitHub to known_hosts
echo -e "${BLUE}Adding GitHub to known_hosts...${NC}"
mkdir -p ~/.ssh
ssh-keyscan -H github.com >> ~/.ssh/known_hosts

# Remove any existing keys to start fresh
echo -e "${BLUE}Removing any existing SSH keys...${NC}"
rm -f ~/.ssh/id_rsa ~/.ssh/id_rsa.pub

# Generate a new SSH key with proper OpenSSH format
echo -e "${BLUE}Generating new SSH key in OpenSSH format...${NC}"
ssh-keygen -t rsa -b 4096 -C "medcor-deploy@$(hostname)" -f ~/.ssh/id_rsa -N ""

# Set proper permissions
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub

# Verify the key format
echo -e "${BLUE}Verifying key format...${NC}"
if head -1 ~/.ssh/id_rsa.pub | grep -q "ssh-rsa"; then
    echo -e "${GREEN}✅ Key is in correct OpenSSH format${NC}"
else
    echo -e "${RED}❌ Key format is invalid${NC}"
    exit 1
fi

# Display the public key with clear formatting
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  COPY THIS SSH PUBLIC KEY TO GITHUB  ${NC}"
echo -e "${YELLOW}========================================${NC}"
echo
echo -e "${BLUE}Go to: https://github.com/$GITHUB_REPO/settings/keys${NC}"
echo -e "${BLUE}Click 'Add deploy key' and paste the key below:${NC}"
echo
echo -e "${GREEN}SSH Public Key (OpenSSH format):${NC}"
cat ~/.ssh/id_rsa.pub
echo
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  TITLE: Production Server Deploy Key  ${NC}"
echo -e "${YELLOW}  ALLOW WRITE ACCESS: ✅ Check this    ${NC}"
echo -e "${YELLOW}========================================${NC}"

# Configure git remote
echo -e "${BLUE}Configuring git remote...${NC}"
git remote set-url origin "git@github.com:$GITHUB_REPO.git"

# Test the key format
echo -e "${BLUE}Testing key format with ssh-keygen...${NC}"
ssh-keygen -l -f ~/.ssh/id_rsa.pub

echo -e "${GREEN}✅ SSH key generated successfully!${NC}"
echo -e "${YELLOW}Add this key to GitHub Deploy Keys and then run: git pull origin main${NC}"