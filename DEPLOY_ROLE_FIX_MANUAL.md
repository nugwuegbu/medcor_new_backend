# Manual Deployment Guide: Role Mapping Fix for AWS EC2

## Quick Summary
This guide helps you deploy the critical role mapping fix to your production server. The fix ensures doctors are correctly identified as "doctor" instead of "staff".

## What This Fixes
- ✅ Doctors now correctly return `"role": "doctor"` (not "staff")
- ✅ Admin users correctly return `"role": "admin"`
- ✅ Proper role detection for all user types

## Option 1: Using the Automated Script

### Step 1: Edit the deployment script
```bash
# Edit the script with your AWS details
nano deploy-role-fix-to-aws.sh
```

Update these lines with your actual values:
```bash
EC2_HOST="medcor.ai"                    # Your EC2 IP or domain
EC2_USER="ubuntu"                        # Your EC2 username
PEM_FILE="/path/to/your-medcor.pem"    # Path to your AWS key
```

### Step 2: Run the deployment
```bash
# Make the script executable
chmod +x deploy-role-fix-to-aws.sh

# Run the deployment
./deploy-role-fix-to-aws.sh
```

## Option 2: Manual SSH Deployment

### Step 1: Connect to your EC2 server
```bash
ssh -i your-key.pem ubuntu@medcor.ai
```

### Step 2: Backup existing files
```bash
# Create backup directory
sudo mkdir -p /var/www/backups/role-fix-$(date +%Y%m%d)

# Backup current authentication files
sudo cp /var/www/medcor_backend/user_auth/general_views.py \
        /var/www/backups/role-fix-$(date +%Y%m%d)/
sudo cp /var/www/medcor_backend/user_auth/views.py \
        /var/www/backups/role-fix-$(date +%Y%m%d)/
```

### Step 3: Edit the files directly on server

#### Fix 1: Edit general_views.py
```bash
sudo nano /var/www/medcor_backend/user_auth/general_views.py
```

Find this section (around line 70-87):
```python
# OLD CODE - WRONG ORDER
if user.is_superuser:
    role = 'admin'
elif user.is_staff:
    role = 'staff'  
elif hasattr(user, 'role'):
    role = user.role
```

Replace with:
```python
# NEW CODE - CORRECT ORDER
if hasattr(user, 'role') and user.role:
    role = user.role
elif user.is_superuser:
    role = 'admin'
else:
    # Fallback logic
    email_lower = email.lower()
    if 'doctor' in email_lower:
        role = 'doctor'
    elif 'patient' in email_lower:
        role = 'patient'
    elif 'clinic' in email_lower:
        role = 'clinic'
    else:
        role = 'patient'
```

Apply the same fix to the profile endpoint (around line 128-142).

#### Fix 2: Edit views.py
```bash
sudo nano /var/www/medcor_backend/user_auth/views.py
```

Find this line (around line 114):
```python
'role': 'admin' if user.is_superuser else 'staff',
```

Replace with:
```python
# Determine the correct role
if hasattr(user, 'role') and user.role:
    role = user.role
elif user.is_superuser:
    role = 'admin'
else:
    role = 'admin'  # If they have staff/admin access, they're admin

# Then in the response:
'role': role,
```

### Step 4: Restart services
```bash
# Restart Gunicorn (Django)
sudo systemctl restart gunicorn

# If using supervisor instead:
sudo supervisorctl restart medcor_backend

# Restart Nginx
sudo systemctl restart nginx
```

### Step 5: Test the fix
```bash
# Test doctor login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "doctor@medcor.ai", "password": "doctor123"}' \
  | python3 -m json.tool

# Should return: "role": "doctor" (not "staff")
```

## Option 3: Copy Files from Local

### Step 1: Copy fixed files from your local machine
```bash
# From your local machine
scp -i your-key.pem \
    medcor_backend/user_auth/general_views.py \
    ubuntu@medcor.ai:/tmp/

scp -i your-key.pem \
    medcor_backend/user_auth/views.py \
    ubuntu@medcor.ai:/tmp/
```

### Step 2: SSH into server and apply
```bash
ssh -i your-key.pem ubuntu@medcor.ai

# Backup and replace
sudo cp /var/www/medcor_backend/user_auth/*.py /tmp/backup/
sudo cp /tmp/general_views.py /var/www/medcor_backend/user_auth/
sudo cp /tmp/views.py /var/www/medcor_backend/user_auth/

# Set permissions
sudo chown www-data:www-data /var/www/medcor_backend/user_auth/*.py

# Restart services
sudo systemctl restart gunicorn nginx
```

## Verification

After deployment, test the authentication:

### Test via API
```bash
# From your local machine
curl -X POST https://medcor.ai/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "doctor@medcor.ai", "password": "doctor123"}'
```

Expected response:
```json
{
  "user": {
    "role": "doctor"  // ✅ Should be "doctor", not "staff"
  }
}
```

## Rollback (if needed)

If something goes wrong:
```bash
# SSH into server
ssh -i your-key.pem ubuntu@medcor.ai

# Restore from backup
sudo cp /var/www/backups/role-fix-*/general_views.py \
        /var/www/medcor_backend/user_auth/
sudo cp /var/www/backups/role-fix-*/views.py \
        /var/www/medcor_backend/user_auth/

# Restart services
sudo systemctl restart gunicorn nginx
```

## Troubleshooting

### If Gunicorn won't restart:
```bash
# Check logs
sudo journalctl -u gunicorn -n 50

# Check Python syntax
python3 -m py_compile /var/www/medcor_backend/user_auth/general_views.py
python3 -m py_compile /var/www/medcor_backend/user_auth/views.py
```

### If authentication still returns wrong role:
1. Clear Django cache: `sudo systemctl restart memcached` (if using)
2. Check if there are multiple Django instances running
3. Verify the files were actually updated: `sudo cat /var/www/medcor_backend/user_auth/views.py | grep role`

## Summary

The fix is simple but critical:
1. **Before**: System checked `is_staff` field first → doctors became "staff"
2. **After**: System checks actual `role` field first → doctors are "doctor"

This ensures proper role-based access control throughout your application.