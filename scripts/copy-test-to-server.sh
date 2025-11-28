#!/bin/bash

# Script to copy the test script to AWS server
# Run this from your local machine

echo "🚀 Copying test script to AWS server..."

# Replace with your actual server details
SERVER_USER="ubuntu"
SERVER_HOST="your-server-ip"
SERVER_PATH="/var/www/html/medcor_backend2/scripts/"

# Copy the test script
scp scripts/test-celery-async-integration.py ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}

echo "✅ Test script copied to server!"
echo "📝 Now you can run on the server:"
echo "   cd /var/www/html/medcor_backend2"
echo "   python scripts/test-celery-async-integration.py"