#!/bin/bash

# Simple script to set OpenAI API key on the server
# This script uses a placeholder that you need to replace

set -e

echo "🤖 Setting OpenAI API key..."

# Navigate to project directory
cd /var/www/html/medcor_backend2

# Set the OpenAI API key in .env file
if [ -f ".env" ]; then
    # Update or add OPENAI_API_KEY
    if grep -q "OPENAI_API_KEY" .env; then
        sed -i 's|OPENAI_API_KEY=.*|OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE|' .env
        echo "✅ Updated OPENAI_API_KEY in .env"
    else
        echo "OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE" >> .env
        echo "✅ Added OPENAI_API_KEY to .env"
    fi
else
    echo "❌ .env file not found. Please run the comprehensive fix script first."
    exit 1
fi

# Restart services
echo "🔄 Restarting services..."
sudo systemctl restart gunicorn
sudo systemctl restart celery

echo "🎉 OpenAI API key set successfully!"
echo "🤖 AI features should now work with the provided API key"
echo "📝 Remember to replace YOUR_OPENAI_API_KEY_HERE with your actual API key"