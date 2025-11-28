# Production Migration Fix Guide

## Problem

The production server is failing on migration `0006_fix_specialization_data` because:

- The `specialization` column is `NOT NULL` in the database
- The migration is trying to set `specialization=None`
- This violates the NOT NULL constraint

## Solution Options

### Option 1: Quick SQL Fix (Recommended)

Run this SQL directly on your PostgreSQL database:

```sql
-- Make the column nullable
ALTER TABLE users ALTER COLUMN specialization DROP NOT NULL;

-- Update empty strings to NULL
UPDATE users SET specialization = NULL WHERE specialization = '';
```

Then run the migration:

```bash
python manage.py migrate core
```

### Option 2: Deploy Fixed Migrations

1. Copy the new migration file to production:

   ```bash
   scp core/migrations/0005_make_specialization_nullable.py root@api.medcor.ai:/var/www/html/medcor_backend2/core/migrations/
   scp core/migrations/0006_fix_specialization_data.py root@api.medcor.ai:/var/www/html/medcor_backend2/core/migrations/
   ```

2. Run migrations on production:
   ```bash
   ssh root@api.medcor.ai
   cd /var/www/html/medcor_backend2
   source venv/bin/activate
   python manage.py migrate core
   ```

### Option 3: Manual Migration Steps

If you prefer to handle this manually:

1. **Connect to your PostgreSQL database:**

   ```bash
   psql -h medcore.czouassyu7f2.il-central-1.rds.amazonaws.com -U postgres -d medcor_db2
   ```

2. **Run the SQL fix:**

   ```sql
   ALTER TABLE users ALTER COLUMN specialization DROP NOT NULL;
   UPDATE users SET specialization = NULL WHERE specialization = '';
   ```

3. **Mark the problematic migration as applied:**

   ```bash
   python manage.py migrate core 0006_fix_specialization_data --fake
   ```

4. **Continue with remaining migrations:**
   ```bash
   python manage.py migrate
   ```

## Verification

After applying the fix, verify it worked:

```bash
python manage.py shell -c "
from core.models import User
print('Users with null specialization:', User.objects.filter(specialization__isnull=True).count())
print('Total users:', User.objects.count())
"
```

## Files Created

- `core/migrations/0005_make_specialization_nullable.py` - New migration to make column nullable
- `fix_production_migration.sh` - Automated deployment script
- `fix_specialization_direct.sql` - Direct SQL fix
- `PRODUCTION_MIGRATION_FIX.md` - This guide

## Next Steps

1. Choose one of the solution options above
2. Apply the fix to your production database
3. Run the remaining migrations
4. Verify everything is working correctly

The root cause was that the migration sequence didn't account for the NOT NULL constraint on the specialization column. The fix ensures the column is made nullable before trying to set values to NULL.
