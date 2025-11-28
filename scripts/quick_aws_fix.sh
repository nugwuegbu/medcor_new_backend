#!/bin/bash

# Quick fix for AWS migration issue
# Run these commands on your AWS server

echo "🚀 Quick AWS Migration Fix"
echo "========================="

# Navigate to project directory
cd /var/www/html/medcor_backend2

# Activate virtual environment
source venv/bin/activate

echo "📋 Current migration status:"
python manage.py showmigrations core

echo ""
echo "🔧 Applying quick fix..."

# Method 1: Fake migrate to resolve dependency issues
echo "Step 1: Faking migrations to resolve dependencies..."
python manage.py migrate core 0004 --fake

# Method 2: Try to apply remaining migrations
echo "Step 2: Applying remaining migrations..."
python manage.py migrate core

if [ $? -eq 0 ]; then
    echo "✅ SUCCESS! Migrations completed."
    echo ""
    echo "📊 Final status:"
    python manage.py showmigrations core
    echo ""
    echo "🎉 You can now continue with your deployment!"
else
    echo "❌ Still having issues. Trying alternative approach..."
    
    # Alternative: Reset and fake all migrations
    echo "Alternative: Resetting migration state..."
    python manage.py migrate core zero --fake
    python manage.py migrate core --fake-initial
    
    if [ $? -eq 0 ]; then
        echo "✅ Alternative fix successful!"
    else
        echo "❌ Manual intervention required."
        echo ""
        echo "Please run these commands manually:"
        echo "1. python manage.py migrate core zero --fake"
        echo "2. python manage.py makemigrations core"
        echo "3. python manage.py migrate core --fake"
    fi
fi