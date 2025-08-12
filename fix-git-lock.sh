#!/bin/bash

# Fix git lock issue and push to repository

echo "Removing git lock file..."
rm -f .git/config.lock

echo "Setting remote URL..."
git remote set-url origin https://github.com/nugwuegbu/medcor_new_backend.git

echo "Adding files..."
git add .

echo "Committing changes..."
git commit -m "added deployment manual"

echo "Pushing to repository..."
# Use your GITHUB_TOKEN
git push https://${GITHUB_TOKEN}@github.com/nugwuegbu/medcor_new_backend.git main

echo "Done!"