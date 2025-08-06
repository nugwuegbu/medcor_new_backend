# Local Django Admin Setup Guide

## Prerequisites
- Python 3.11+ installed
- PostgreSQL installed locally (or use SQLite for testing)
- Git (to clone the repository)

## Step-by-Step Setup Instructions

### 1. Clone and Navigate to Backend
```bash
cd medcor_backend
```

### 2. Create Virtual Environment
```bash
python -m venv venv

# On Windows:
venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Database Settings

Create a `.env` file in the medcor_backend directory:
```bash
# For PostgreSQL (Recommended)
DATABASE_URL=postgresql://username:password@localhost:5432/medcor_db
SECRET_KEY=your-secret-key-here-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# For SQLite (Quick Testing)
# If you want to use SQLite instead, don't set DATABASE_URL
```

### 5. Run Database Migrations
```bash
# Create the database tables
python manage.py migrate

# Create tenant tables
python manage.py migrate_schemas --shared
```

### 6. Create Superuser Account
```bash
# Create a superuser for Django admin
python manage.py createsuperuser

# Enter when prompted:
# Username: admin
# Email: admin@medcor.ai
# Password: (choose a strong password)
```

### 7. Create Default Tenant (IMPORTANT)
```bash
# Run Python shell
python manage.py shell

# In the Python shell, run:
from tenants.models import Tenant, Domain

# Create the public tenant
tenant = Tenant(
    schema_name='public',
    name='Public',
    paid_until='2099-12-31',
    on_trial=False
)
tenant.save()

# Create domain for the public tenant
domain = Domain()
domain.domain = 'localhost'
domain.tenant = tenant
domain.is_primary = True
domain.save()

# Exit shell
exit()
```

### 8. Collect Static Files
```bash
python manage.py collectstatic --noinput
```

### 9. Run the Development Server
```bash
python manage.py runserver 8000
```

### 10. Access Django Admin
Open your browser and go to:
```
http://localhost:8000/admin/
```

Login with the superuser credentials you created in Step 6.

## Troubleshooting Common Issues

### Issue 1: "Access to this resource is denied"
This usually means the superuser wasn't created properly or the tenant configuration is missing.

**Solution:**
```bash
# Reset the superuser password
python manage.py shell
from django.contrib.auth import get_user_model
User = get_user_model()
admin = User.objects.filter(username='admin').first()
if admin:
    admin.is_superuser = True
    admin.is_staff = True
    admin.set_password('Admin123!')
    admin.save()
    print("Admin password reset successfully")
else:
    User.objects.create_superuser('admin', 'admin@medcor.ai', 'Admin123!')
    print("Admin user created successfully")
exit()
```

### Issue 2: Database Connection Error
If you get database connection errors:

**For SQLite (Quick Fix):**
Edit `medcor_backend/settings.py` temporarily:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

Then run migrations again:
```bash
python manage.py migrate
python manage.py createsuperuser
```

### Issue 3: Static Files Not Loading
If the admin interface looks broken (no CSS):

```bash
# Make sure you have the staticfiles directory
mkdir -p staticfiles

# Collect static files
python manage.py collectstatic --noinput

# If still not working, check STATIC_ROOT in settings.py
```

### Issue 4: ImportError or Module Not Found
Make sure all dependencies are installed:

```bash
pip install django
pip install django-tenants
pip install djangorestframework
pip install django-cors-headers
pip install psycopg2-binary
pip install python-dotenv
pip install djangorestframework-simplejwt
pip install django-filter
pip install drf-spectacular
pip install pillow
```

### Issue 5: Tenant-Related Errors
If you get tenant-related errors, you might need to use the simple settings:

```bash
# Use the simple settings file without multi-tenancy
python manage.py runserver --settings=medcor_backend.simple_settings 8000
```

## Quick Alternative: Bypass Multi-Tenancy (For Local Testing)

If you just want to quickly access the admin without dealing with tenants:

1. Create a file `local_settings.py` in the medcor_backend directory
2. Copy the content from `simple_settings.py`
3. Run with:
```bash
python manage.py migrate --settings=medcor_backend.local_settings
python manage.py createsuperuser --settings=medcor_backend.local_settings
python manage.py runserver --settings=medcor_backend.local_settings 8000
```

## Verify Setup

After successful setup, you should be able to:
1. Access http://localhost:8000/admin/
2. Login with your superuser credentials
3. See the Django admin dashboard with all models
4. Create and manage users, appointments, treatments, etc.

## Need Help?

If you're still having issues after following these steps:
1. Check the Django logs in the terminal
2. Verify Python version: `python --version` (should be 3.11+)
3. Check if all migrations ran: `python manage.py showmigrations`
4. Ensure the database is running (if using PostgreSQL)