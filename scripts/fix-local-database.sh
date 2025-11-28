#!/bin/bash

# Script to fix local database configuration
echo "🔧 Fixing local database configuration..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Create a backup
cp .env .env.backup
echo "✅ Created backup: .env.backup"

# Fix the DATABASE_ENGINE in .env
sed -i 's/DATABASE_ENGINE=""/DATABASE_ENGINE="django.db.backends.postgresql"/' .env

echo "✅ Fixed DATABASE_ENGINE in .env file"

# Test database connection
echo "🔄 Testing database connection..."
python manage.py check --database default

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed. Please check your PostgreSQL setup."
    echo "💡 Make sure PostgreSQL is running and the database 'medcor_db2' exists."
    echo "💡 You can create the database with:"
    echo "   sudo -u postgres createdb medcor_db2"
fi