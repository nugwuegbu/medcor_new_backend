#!/bin/bash

# Script to fix Django migration conflicts
# This script resolves migration dependency issues

set -e

echo "🔧 Fixing Django migration conflicts..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    print_error "Please run this script from the Django project root directory"
    exit 1
fi

print_status "Current migration status:"
python manage.py showmigrations core

echo ""
print_warning "This will fix migration conflicts by:"
echo "1. Renaming conflicting migration files"
echo "2. Updating dependencies"
echo "3. Resetting migration state if needed"
echo ""

read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Operation cancelled"
    exit 0
fi

# Backup current migrations
print_status "Creating backup of current migrations..."
cp -r core/migrations core/migrations_backup_$(date +%Y%m%d_%H%M%S)

# Fix migration file numbering conflicts
print_status "Fixing migration file numbering..."

# Rename the conflicting files
if [ -f "core/migrations/0005_make_specialization_nullable.py" ]; then
    mv core/migrations/0005_make_specialization_nullable.py core/migrations/0005a_make_specialization_nullable.py
    print_status "Renamed 0005_make_specialization_nullable.py to 0005a_make_specialization_nullable.py"
fi

if [ -f "core/migrations/0006_fix_specialization_data.py" ]; then
    mv core/migrations/0006_fix_specialization_data.py core/migrations/0006a_fix_specialization_data.py
    print_status "Renamed 0006_fix_specialization_data.py to 0006a_fix_specialization_data.py"
fi

# Update dependencies in the renamed files
if [ -f "core/migrations/0006a_fix_specialization_data.py" ]; then
    print_status "Updating dependencies in 0006a_fix_specialization_data.py..."
    sed -i 's/("core", "0005_make_specialization_nullable")/("core", "0005a_make_specialization_nullable")/g' core/migrations/0006a_fix_specialization_data.py
fi

# Check for other migration conflicts
print_status "Checking for other migration conflicts..."

# List all migration files to identify conflicts
ls -la core/migrations/*.py | grep -E "000[0-9]_" | sort

echo ""
print_status "Attempting to resolve migration state..."

# Option 1: Try to fake the problematic migrations
print_status "Attempting to fake problematic migrations..."
python manage.py migrate core 0004 --fake || print_warning "Could not fake migrate to 0004"

# Option 2: If that fails, try to reset migrations
if [ $? -ne 0 ]; then
    print_warning "Fake migration failed. Trying alternative approach..."
    
    # Check current database state
    print_status "Current database migration state:"
    python manage.py showmigrations core || true
    
    echo ""
    print_warning "You may need to manually resolve this. Options:"
    echo "1. Reset migrations: python manage.py migrate core zero"
    echo "2. Fake apply migrations: python manage.py migrate core --fake"
    echo "3. Delete and recreate migrations: rm core/migrations/0*.py && python manage.py makemigrations"
    
    exit 1
fi

# Try to run migrations
print_status "Running migrations..."
python manage.py migrate core

if [ $? -eq 0 ]; then
    print_success "Migrations completed successfully!"
    
    print_status "Final migration status:"
    python manage.py showmigrations core
    
    print_success "Migration conflict resolved!"
else
    print_error "Migration failed. Please check the error messages above."
    print_warning "You may need to manually resolve the migration conflicts."
    exit 1
fi