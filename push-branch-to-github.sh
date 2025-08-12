#!/bin/bash

# Push rest_endpoints branch to GitHub

echo "Pushing rest_endpoints branch to GitHub..."
echo ""

# Remove any lock files first
rm -f .git/index.lock

# Make sure remote is set with token
echo "Setting remote with token..."
git remote set-url origin https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/nugwuegbu/medcor_new_backend.git

# Add and commit any changes
echo "Adding changes..."
git add .
git commit -m "added deployment manual" || echo "No new changes to commit"

# Push the branch
echo ""
echo "Pushing rest_endpoints branch..."
git push -u origin rest_endpoints

echo ""
echo "✓ Branch pushed!"
echo "View it at: https://github.com/nugwuegbu/medcor_new_backend/tree/rest_endpoints"