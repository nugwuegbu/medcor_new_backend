#!/bin/bash

# Push to GitHub using GITHUB_PERSONAL_ACCESS_TOKEN

echo "Using GITHUB_PERSONAL_ACCESS_TOKEN to push..."

# Add and commit
git add .
git commit -m "added deployment manual"

# Push using the environment variable
git push https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/nugwuegbu/medcor_new_backend.git main

echo "Push complete!"