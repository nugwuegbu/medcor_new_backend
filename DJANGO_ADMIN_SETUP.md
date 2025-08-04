# Django Admin Setup for Localhost

## Creating Django Superuser

To access the Django admin interface on localhost, you need to create a superuser account:

```bash
# Navigate to your medcor_backend directory
cd /path/to/medcor_backend

# Create a superuser
python manage.py createsuperuser
```

When prompted, enter:
- Email: admin@localhost (or any email you prefer)
- Password: Choose a secure password
- Confirm password: Re-enter the password

## Multi-Tenant Admin Access

For multi-tenant access, the Django admin works differently:

### 1. Public Schema Admin (Main Admin)
Access at: `http://localhost:8000/admin/`
- This is the main admin for managing all tenants
- Login with the superuser you created

### 2. Tenant-Specific Admin
Access at: `http://<tenant_subdomain>.localhost:8000/admin/`
- Each tenant has its own admin interface
- Requires tenant-specific admin accounts

## Setting Up Tenant Admin Accounts

After creating the main superuser, you can:

1. **Create tenant-specific admins via Django shell:**
```bash
python manage.py shell
```

```python
from django_tenants.utils import schema_context
from users.models import User

# For medcorclinic tenant
with schema_context('medcorclinic'):
    admin = User.objects.create_superuser(
        email='admin@medcorclinic.com',
        password='your_password_here',
        first_name='Admin',
        last_name='MedCorClinic'
    )
```

2. **Or use the management command if available:**
```bash
python manage.py create_tenant_superuser --schema=medcorclinic --email=admin@medcorclinic.com
```

## Local Development Setup

For localhost development with subdomains:

1. **Update your /etc/hosts file (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows):**
```
127.0.0.1   localhost
127.0.0.1   medcorclinic.localhost
127.0.0.1   healthplus.localhost
127.0.0.1   citymedical.localhost
```

2. **Ensure your Django settings allow these hosts:**
```python
ALLOWED_HOSTS = ['localhost', '.localhost', '127.0.0.1']
```

## Troubleshooting

1. **Check if users exist:**
```bash
python manage.py shell
```
```python
from users.models import User
User.objects.filter(is_staff=True, is_superuser=True).values('email')
```

2. **Reset admin password:**
```bash
python manage.py changepassword admin@localhost
```

3. **Verify tenant domains:**
```bash
python manage.py shell
```
```python
from tenants.models import Tenant, Domain
for domain in Domain.objects.all():
    print(f"Tenant: {domain.tenant.schema_name}, Domain: {domain.domain}")
```

## Common Issues

1. **"Invalid password" error**: The password from populate_tenants.py might be hashed incorrectly. Create new superuser instead.

2. **"Domain does not exist" error**: Make sure the tenant domain is properly configured for localhost.

3. **CSRF errors**: Check that your CSRF settings allow localhost domains.

4. **Session issues**: Clear browser cookies for localhost and try again.