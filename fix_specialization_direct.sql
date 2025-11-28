-- Direct SQL fix for specialization column issue
-- Run this on your PostgreSQL database to fix the NOT NULL constraint

-- Step 1: Make the specialization column nullable
ALTER TABLE users ALTER COLUMN specialization DROP NOT NULL;

-- Step 2: Update empty strings to NULL
UPDATE users SET specialization = NULL WHERE specialization = '';

-- Step 3: Verify the changes
SELECT 
    specialization, 
    COUNT(*) as count 
FROM users 
GROUP BY specialization;

-- Step 4: Check if there are any remaining NOT NULL constraints on specialization
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'specialization';