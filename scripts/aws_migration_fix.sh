#!/bin/bash

# Quick fix for AWS migration conflicts
# Run this on your AWS server

set -e

echo "🚀 AWS Migration Fix Script"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    echo "❌ Please run this script from the Django project root directory"
    exit 1
fi

echo "📋 Current migration status:"
python manage.py showmigrations core

echo ""
echo "🔧 Fixing migration conflicts..."

# Method 1: Fake the problematic migrations
echo "Step 1: Faking problematic migrations..."
python manage.py migrate core 0004 --fake

# Method 2: Try to apply the remaining migrations
echo "Step 2: Applying remaining migrations..."
python manage.py migrate core

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully!"
    echo ""
    echo "📊 Final migration status:"
    python manage.py showmigrations core
else
    echo "❌ Migration failed. Trying alternative approach..."
    
    # Method 3: Reset and recreate migrations
    echo "Step 3: Resetting migrations..."
    python manage.py migrate core zero --fake
    
    echo "Step 4: Recreating migrations..."
    python manage.py makemigrations core
    
    echo "Step 5: Applying migrations..."
    python manage.py migrate core --fake-initial
    
    if [ $? -eq 0 ]; then
        echo "✅ Migrations fixed successfully!"
    else
        echo "❌ Still having issues. Manual intervention required."
        echo ""
        echo "Manual steps:"
        echo "1. Check migration files: ls -la core/migrations/"
        echo "2. Remove duplicate migrations manually"
        echo "3. Run: python manage.py migrate core --fake"
    fi
fi

echo ""
echo "🎉 Migration fix completed!"