#!/bin/bash

# Set Git Remote with GitHub Token Authentication

echo "Setting remote URL with GITHUB_PERSONAL_ACCESS_TOKEN..."

# Option 1: Update existing remote 'origin'
git remote set-url origin https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/nugwuegbu/medcor_new_backend.git

echo "Remote URL updated with token authentication!"
echo ""
echo "Now you can push with:"
echo "git push -u origin rest_endpoints"