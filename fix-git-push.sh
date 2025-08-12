#!/bin/bash

# Fix for GitHub push error - corrected repository URL

# First, ensure you're in the right directory and have changes to commit
git add .
git commit -m "added deployment manual"

# Push to repository WITHOUT trailing slash
# Option 1: With environment variable
git push https://${GITHUB_TOKEN}@github.com/nugwuegbu/medcor_new_backend.git main

# Option 2: With actual token (replace YOUR_TOKEN_HERE)
# git push https://YOUR_TOKEN_HERE@github.com/nugwuegbu/medcor_new_backend.git main

# If the above still doesn't work, try:
# 1. Verify repository exists at: https://github.com/nugwuegbu/medcor_new_backend
# 2. Check if it's a private repo and your token has 'repo' scope
# 3. Try setting the remote URL first:
#    git remote set-url origin https://${GITHUB_TOKEN}@github.com/nugwuegbu/medcor_new_backend.git
#    git push -u origin main