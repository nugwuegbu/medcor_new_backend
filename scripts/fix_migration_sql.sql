-- SQL script to fix Django migration conflicts
-- Run this directly on your PostgreSQL database

-- Check current migration state
SELECT app, name, applied FROM django_migrations WHERE app = 'core' ORDER BY id;

-- Remove the conflicting migration
DELETE FROM django_migrations 
WHERE app = 'core' AND name = '0006_fix_specialization_data';

-- Remove the dependency migration if it exists
DELETE FROM django_migrations 
WHERE app = 'core' AND name = '0005_make_specialization_nullable';

-- Check final state
SELECT app, name, applied FROM django_migrations WHERE app = 'core' ORDER BY id;

-- Show success message
SELECT 'Migration conflict resolved! You can now run: python manage.py migrate core' as message;