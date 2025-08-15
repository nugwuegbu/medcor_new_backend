# Setting Up Free PostgreSQL Database for MedCor AI

## Option 1: Supabase (Recommended - Easiest)
Supabase provides a free PostgreSQL database with 500MB storage.

### Steps:
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub, GitLab, or Email
4. Create a new project:
   - Name: `medcor-ai`
   - Database Password: (choose a strong password and save it)
   - Region: Choose closest to you
5. Wait for database to provision (1-2 minutes)
6. Go to Settings → Database
7. Copy the "Connection string" (URI)
8. Replace `[YOUR-PASSWORD]` with your actual password

### Your Connection String Format:
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

## Option 2: Aiven
Aiven offers a free PostgreSQL with 1 month trial.

### Steps:
1. Go to https://aiven.io
2. Sign up for free trial
3. Create PostgreSQL service
4. Copy connection string

## Option 3: ElephantSQL
ElephantSQL offers free PostgreSQL with 20MB (good for testing).

### Steps:
1. Go to https://www.elephantsql.com
2. Sign up and create "Tiny Turtle" (free) instance
3. Copy the connection URL from details page

## Option 4: Neon (New Account)
If your current Neon is disabled, create a new one.

### Steps:
1. Go to https://neon.tech
2. Sign up with a different email
3. Create new project
4. Copy connection string

---

## After Getting Your Database URL:

Once you have your database URL from any of the above services, provide it to me and I'll:
1. Configure it in your application
2. Run migrations to create tables
3. Test the connection
4. Set up default accounts

The database URL should look like:
```
postgresql://username:password@host:port/database
```