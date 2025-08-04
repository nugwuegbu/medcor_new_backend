# Fix Django Admin 404 Error After Login

## The Problem
After logging in, Django admin returns 404 with "Access to this resource is denied". This happens in multi-tenant Django apps when the admin site is not properly configured for the public schema.

## Solution 1: Check Tenant Middleware Settings

In your Django settings, ensure the middleware is configured correctly:

```python
# settings.py
MIDDLEWARE = [
    'django_tenants.middleware.main.TenantMainMiddleware',  # This should be first
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

## Solution 2: Add Admin to Public Schema Apps

Make sure admin is included in your public schema apps:

```python
# settings.py
SHARED_APPS = [
    'django_tenants',
    'django.contrib.admin',  # Must be here
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'tenants',  # Your tenant app
    'users',    # Your user app
]

TENANT_APPS = [
    'django.contrib.admin',  # Also here for tenant-specific admin
    # Other tenant-specific apps
]

INSTALLED_APPS = list(SHARED_APPS) + [app for app in TENANT_APPS if app not in SHARED_APPS]
```

## Solution 3: Public Schema Admin URL Configuration

Check your main urls.py:

```python
# urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),  # This must be present
    # Other URL patterns
]
```

## Solution 4: Create Admin Access for Public Schema

Run these commands to ensure admin access in public schema:

```bash
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
from django_tenants.utils import schema_context

User = get_user_model()

# Ensure you're in public schema
with schema_context('public'):
    # Check if your admin user exists and is active
    admin = User.objects.filter(email='admin@localhost').first()
    if admin:
        print(f"Admin exists: {admin.email}")
        print(f"Is active: {admin.is_active}")
        print(f"Is staff: {admin.is_staff}")
        print(f"Is superuser: {admin.is_superuser}")
        
        # Make sure all permissions are set
        admin.is_active = True
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()
        print("Admin permissions updated")
    else:
        # Create new admin if doesn't exist
        admin = User.objects.create_superuser(
            email='admin@localhost',
            password='your_password_here'
        )
        print("New admin created")
```

## Solution 5: Check PUBLIC_SCHEMA_URLCONF

If you have separate URL configurations:

```python
# settings.py
PUBLIC_SCHEMA_URLCONF = 'medcor_backend.urls'  # Your main urls.py
ROOT_URLCONF = 'medcor_backend.urls'
```

## Solution 6: Debug the Issue

Add this temporary debug code to your settings:

```python
# settings.py (temporary - remove after debugging)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'django_tenants': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

## Quick Fix Steps:

1. **Stop your Django server**

2. **Run migrations for public schema:**
```bash
python manage.py migrate_schemas --schema=public
```

3. **Create a fresh superuser:**
```bash
python manage.py create_superuser_public
```

If this command doesn't exist, use:
```bash
python manage.py shell
```
Then:
```python
from django.contrib.auth import get_user_model
from django_tenants.utils import schema_context

with schema_context('public'):
    User = get_user_model()
    User.objects.create_superuser('admin@localhost', 'password123')
```

4. **Restart the server:**
```bash
python manage.py runserver
```

5. **Try accessing admin again:**
- Go to `http://localhost:8000/admin/`
- Login with your new credentials

## If Still Not Working:

Check if you have any custom authentication backends or middleware that might be interfering. The multi-tenant setup sometimes requires the admin to be explicitly allowed in the public schema.