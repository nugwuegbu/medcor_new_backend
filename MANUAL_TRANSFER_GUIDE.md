# Manual File Transfer Guide for Dentscape AI Integration

## 🎯 **ESSENTIAL FILES TO TRANSFER**

### **1. COMPLETE DENTSCAPE APP DIRECTORY**

**Location**: `/home/nnamdi/pyth/medcor_backend2/dentscape/`

**Transfer this entire directory** to your AWS instance at: `your-project-path/dentscape/`

**Contents**:

```
dentscape/
├── __init__.py                    (68 bytes)
├── apps.py                        (233 bytes)
├── models.py                      (8,857 bytes)
├── views.py                       (44,611 bytes)
├── serializers.py                 (5,904 bytes)
├── urls.py                        (671 bytes)
├── admin.py                       (2,865 bytes)
├── dentscape_client.py            (44,738 bytes)
└── migrations/
    ├── __init__.py                (0 bytes)
    └── 0001_initial.py            (13,154 bytes)
```

### **2. MODIFIED EXISTING FILES**

#### **A. Settings File**

**Source**: `/home/nnamdi/pyth/medcor_backend2/medcor_backend2/settings.py`
**Target**: `your-project-path/medcor_backend2/settings.py`

**Change Required**: Add `"dentscape",` to INSTALLED_APPS (around line 59)

#### **B. URLs File**

**Source**: `/home/nnamdi/pyth/medcor_backend2/medcor_backend2/urls.py`
**Target**: `your-project-path/medcor_backend2/urls.py`

**Change Required**: Add `path("api/dentscape/", include("dentscape.urls")),` to urlpatterns (around line 48)

## 📋 **MANUAL TRANSFER STEPS**

### **Step 1: Transfer Dentscape App Directory**

**Using SCP:**

```bash
# Transfer entire dentscape directory
scp -r -i /path/to/your/key.pem \
    /home/nnamdi/pyth/medcor_backend2/dentscape/ \
    ec2-user@your-aws-instance-ip:/path/to/your/project/
```

**Using SFTP:**

```bash
sftp -i /path/to/your/key.pem ec2-user@your-aws-instance-ip
put -r /home/nnamdi/pyth/medcor_backend2/dentscape/ /path/to/your/project/
```

**Using File Manager (if GUI available):**

- Copy the entire `dentscape/` folder
- Paste it into your project directory on AWS

### **Step 2: Modify Existing Files**

#### **A. Update settings.py**

```bash
# SSH into your AWS instance
ssh -i /path/to/your/key.pem ec2-user@your-aws-instance-ip

# Navigate to project directory
cd /path/to/your/project

# Edit settings.py
nano medcor_backend2/settings.py

# Find INSTALLED_APPS and add "dentscape", (around line 59)
# It should look like:
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'core',
    'tenants',
    'appointments',
    'medical_records',
    'treatments',
    'subscription_plans',
    'specialty',
    'email_service',
    'youcam',
    'dentscape',  # ← ADD THIS LINE
    'langchain_ai',
    'knowledgebase',
    'chatwidget'
]
```

#### **B. Update urls.py**

```bash
# Edit urls.py
nano medcor_backend2/urls.py

# Add the dentscape URL routing (around line 48)
# It should look like:
urlpatterns = [
    # ... existing patterns ...
    path("api/youcam/", include("youcam.urls")),
    path("api/dentscape/", include("dentscape.urls")),  # ← ADD THIS LINE
    path("api/ai/", include("langchain_ai.urls")),
    # ... rest of patterns ...
]
```

## 🔧 **POST-TRANSFER COMMANDS**

After transferring files, run these commands on your AWS instance:

```bash
# Navigate to project directory
cd /path/to/your/project

# Activate virtual environment
source venv/bin/activate

# Run database migrations
python manage.py makemigrations dentscape
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Test the deployment
python manage.py check

# Restart your web server
sudo systemctl restart gunicorn  # or your web server
sudo systemctl restart nginx     # if using nginx
```

## 🌍 **ENVIRONMENT VARIABLES**

Add these to your AWS environment:

```bash
# Add to your .env file or environment configuration
DENTSCAPE_API_KEY=your_actual_dentscape_api_key_here
DENTSCAPE_MOCK_MODE=False  # Set to True for testing without API key
```

## ✅ **VERIFICATION**

After deployment, verify everything works:

```bash
# Test API documentation
curl -X GET http://your-domain/api/docs/

# Test Dentscape endpoints (no authentication required)
curl -X GET http://your-domain/api/dentscape/

# Test a simulation endpoint without authentication
curl -X POST http://your-domain/api/dentscape/simulations/orthodontics/ \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_image", "user_id": "test_user"}'

# Check Django admin (requires authentication)
# Visit: http://your-domain/admin/
# You should see "Dentscape Simulations" and "Dentscape Analyses" sections
```

## 🔓 **AUTHENTICATION STATUS**

**IMPORTANT**: All Dentscape API endpoints are now **PUBLIC** and do **NOT** require authentication:

- ✅ **Simulation endpoints**: No authentication required
- ✅ **Analysis endpoints**: No authentication required
- ✅ **History endpoints**: No authentication required
- ✅ **List endpoints**: No authentication required

**Only Django Admin requires authentication** (for management purposes).

## 📁 **FILE STRUCTURE ON AWS**

After transfer, your project should have:

```
your-project-directory/
├── medcor_backend2/
│   ├── settings.py          (modified)
│   └── urls.py              (modified)
├── dentscape/               (new directory)
│   ├── __init__.py
│   ├── apps.py
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   ├── admin.py
│   ├── dentscape_client.py
│   └── migrations/
│       ├── __init__.py
│       └── 0001_initial.py
└── ... (other existing files)
```

## 🚨 **IMPORTANT NOTES**

1. **Permissions**: Ensure the `dentscape/` directory has proper permissions (755)
2. **Ownership**: Make sure files are owned by the correct user (usually `www-data` or your app user)
3. **Virtual Environment**: Always activate your virtual environment before running commands
4. **Database Backup**: Consider backing up your database before running migrations
5. **Testing**: Test in a staging environment first if possible

## 🔄 **ROLLBACK PLAN**

If something goes wrong:

```bash
# Remove dentscape from INSTALLED_APPS
# Remove dentscape URL routing
# Restart services
# Check application status
```

## 📊 **FILE SIZES SUMMARY**

- **dentscape/ directory**: ~120KB total
- **settings.py modification**: 1 line addition
- **urls.py modification**: 1 line addition
- **Total transfer size**: ~120KB

This is a minimal deployment that adds the complete Dentscape AI functionality to your existing Django project! 🚀
