#!/bin/bash

# Push to nugwuegbu/medcor_new_backend repository

# First, add and commit your changes
git add .
git commit -m "added deployment manual"

# Then push using your GITHUB_TOKEN
# Replace ${GITHUB_TOKEN} with your actual token
git push https://${GITHUB_TOKEN}@github.com/nugwuegbu/medcor_new_backend.git main

# Alternative: If you have GITHUB_TOKEN as environment variable
# export GITHUB_TOKEN=your_actual_token_here
# git push https://${GITHUB_TOKEN}@github.com/nugwuegbu/medcor_new_backend.git main