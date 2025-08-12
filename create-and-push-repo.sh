#!/bin/bash

# Create GitHub repository and push code

echo "Creating GitHub repository using GitHub API..."

# Create the repository using GitHub API
curl -H "Authorization: token ${GITHUB_PERSONAL_ACCESS_TOKEN}" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/user/repos \
     -d '{"name":"medcor_new_backend","private":false,"description":"MedCor Hospital AI Platform - Backend"}'

echo ""
echo "Waiting for repository to be created..."
sleep 2

# Now push your code
echo "Setting remote URL..."
git remote set-url origin https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/nugwuegbu/medcor_new_backend.git

echo "Pushing to repository..."
git push -u origin rest_endpoints

echo "Done! Repository created and code pushed."