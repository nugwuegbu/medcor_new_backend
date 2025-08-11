# Temporary local settings with SQLite database
# This file is used when the Neon database is disabled
# Import all settings from main settings file

from .settings import *

# Override database to use SQLite
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'local_db.sqlite3',
    }
}

# Disable multi-tenancy for local SQLite
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != 'django_tenants']
MIDDLEWARE = [m for m in MIDDLEWARE if 'django_tenants' not in m and 'tenant_users' not in m]

# Remove tenant routers
DATABASE_ROUTERS = []

# Disable tenant model
TENANT_MODEL = None
TENANT_DOMAIN_MODEL = None

# Use default auth backend only
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

print("=" * 60)
print("🚨 USING LOCAL SQLITE DATABASE (TEMPORARY)")
print("This is a temporary solution while Neon database is disabled")
print("=" * 60)