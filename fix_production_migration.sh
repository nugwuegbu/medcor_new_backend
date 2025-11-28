#!/bin/bash

# Fix Production Migration Script
# This script fixes the specialization migration issue on production

echo "🚀 Fixing Production Migration Issue"
echo "=================================="

# Set production server details
PROD_SERVER="root@api.medcor.ai"
PROD_PATH="/var/www/html/medcor_backend2"

echo "📋 Step 1: Backup current database"
echo "Creating database backup before migration..."

# Create backup (you'll need to run this manually on the server)
echo "Run this on the production server:"
echo "pg_dump -h medcore.czouassyu7f2.il-central-1.rds.amazonaws.com -U postgres -d medcor_db2 > /var/www/html/medcor_backend2/backup_$(date +%Y%m%d_%H%M%S).sql"

echo ""
echo "📋 Step 2: Copy fixed migration files to production"
echo "Copying migration files..."

# Copy the new migration file
scp core/migrations/0005_make_specialization_nullable.py $PROD_SERVER:$PROD_PATH/core/migrations/

# Copy the updated migration file
scp core/migrations/0006_fix_specialization_data.py $PROD_SERVER:$PROD_PATH/core/migrations/

echo "✅ Migration files copied to production"

echo ""
echo "📋 Step 3: Run migrations on production"
echo "Run these commands on the production server:"

cat << 'EOF'
# SSH into production server
ssh root@api.medcor.ai

# Navigate to project directory
cd /var/www/html/medcor_backend2

# Activate virtual environment
source venv/bin/activate

# Check current migration status
python manage.py showmigrations core

# Run the migrations
python manage.py migrate core

# If migration fails, you can also try:
# python manage.py migrate core 0005_make_specialization_nullable --fake
# python manage.py migrate core 0006_fix_specialization_data
EOF

echo ""
echo "📋 Step 4: Alternative manual fix (if migrations still fail)"
echo "If the migration still fails, run this SQL directly on the database:"

cat << 'EOF'
-- Connect to your PostgreSQL database and run:
ALTER TABLE users ALTER COLUMN specialization DROP NOT NULL;
UPDATE users SET specialization = NULL WHERE specialization = '';
EOF

echo ""
echo "📋 Step 5: Verify the fix"
echo "After running migrations, verify with:"
echo "python manage.py shell -c \"from core.models import User; print('Users with null specialization:', User.objects.filter(specialization__isnull=True).count())\""

echo ""
echo "🎉 Migration fix script completed!"
echo "Follow the steps above to fix the production migration issue."