# AWS Deployment Guide for Dentscape Integration

## 📁 **FILES TO TRANSFER TO AWS**

### **1. MODIFIED EXISTING FILES**

#### **A. Django Settings**

**File**: `medcor_backend2/settings.py`
**Changes**:

- Added `"dentscape"` to `INSTALLED_APPS` (line 59)
- Added `STATICFILES_DIRS` configuration (lines 152-155)

#### **B. Django URLs**

**File**: `medcor_backend2/urls.py`
**Changes**:

- Added `path("api/dentscape/", include("dentscape.urls"))` (line 48)

#### **C. Dentscape Client**

**File**: `dentscape/dentscape_client.py`
**Changes**:

- Added `_build_static_url()` method (lines 40-58)
- Updated all mock methods to use absolute URLs instead of relative paths

#### **D. Dentscape Views**

**File**: `dentscape/views.py`
**Changes**:

- Added `authentication_classes = []` to all ViewSets
- Added `permission_classes = []` to all ViewSets
- Removed authentication requirements

### **2. NEW FILES AND DIRECTORIES**

#### **A. Complete Dentscape App Directory**

**Directory**: `dentscape/` (entire directory)
**Contents**:

```
dentscape/
├── __init__.py
├── apps.py
├── models.py
├── views.py
├── serializers.py
├── urls.py
├── admin.py
├── dentscape_client.py
├── migrations/
│   ├── __init__.py
│   └── 0001_initial.py
└── static/
    └── dentscape/
        ├── smile_curve_annotated.jpg
        ├── e_line_annotated.jpg
        ├── tooth_segmentation_annotated.jpg
        ├── incisor_ratio_annotated.jpg
        ├── incisal_plane_annotated.jpg
        ├── interdental_proportion_annotated.jpg
        ├── before_orthodontics.jpg
        ├── after_orthodontics.jpg
        ├── before_veneer_whitening.jpg
        ├── after_veneer_whitening.jpg
        ├── before_whitening.jpg
        ├── after_whitening.jpg
        └── test_image.jpg
```

#### **B. Project-Level Static Files**

**Directory**: `static/dentscape/`
**Contents**: Same 13 image files as above

## 🚀 **AWS DEPLOYMENT STEPS**

### **Step 1: Transfer Files to AWS**

#### **Method A: Using SCP**

```bash
# Transfer modified Django files
scp -i /path/to/your/key.pem \
    medcor_backend2/settings.py \
    medcor_backend2/urls.py \
    ec2-user@your-aws-ip:/path/to/your/project/medcor_backend2/

# Transfer complete dentscape app directory
scp -r -i /path/to/your/key.pem \
    dentscape/ \
    ec2-user@your-aws-ip:/path/to/your/project/

# Transfer static files directory
scp -r -i /path/to/your/key.pem \
    static/ \
    ec2-user@your-aws-ip:/path/to/your/project/
```

#### **Method B: Using SFTP**

```bash
sftp -i /path/to/your/key.pem ec2-user@your-aws-ip
put medcor_backend2/settings.py /path/to/your/project/medcor_backend2/
put medcor_backend2/urls.py /path/to/your/project/medcor_backend2/
put -r dentscape/ /path/to/your/project/
put -r static/ /path/to/your/project/
```

### **Step 2: SSH into AWS Server**

```bash
ssh -i /path/to/your/key.pem ec2-user@your-aws-ip
cd /path/to/your/project
```

### **Step 3: Activate Virtual Environment**

```bash
source venv/bin/activate
```

### **Step 4: Run Database Migrations**

```bash
# Create migrations for dentscape app
python manage.py makemigrations dentscape

# Apply migrations
python manage.py migrate
```

### **Step 5: Collect Static Files**

```bash
# Collect all static files including new dentscape images
python manage.py collectstatic --noinput
```

### **Step 6: Test Django Configuration**

```bash
# Check for any configuration errors
python manage.py check
```

### **Step 7: Restart Services**

```bash
# Restart Gunicorn
sudo systemctl restart gunicorn

# Restart Nginx (if using)
sudo systemctl restart nginx

# Check service status
sudo systemctl status gunicorn
sudo systemctl status nginx
```

### **Step 8: Verify Deployment**

```bash
# Test API endpoints
curl -X GET http://your-domain/api/dentscape/

# Test static file serving
curl -I http://your-domain/static/dentscape/smile_curve_annotated.jpg

# Check logs for any errors
tail -f /path/to/your/project/logs/django.log
```

## 🔧 **ENVIRONMENT VARIABLES**

Add these to your AWS environment (`.env` file or environment configuration):

```bash
# Dentscape API Configuration
DENTSCAPE_API_KEY=your_actual_dentscape_api_key_here
DENTSCAPE_MOCK_MODE=False  # Set to True for testing without API key

# Ensure DEBUG is False for production
DEBUG=False
```

## ✅ **VERIFICATION CHECKLIST**

After deployment, verify:

- [ ] **API Endpoints**: All 9 Dentscape endpoints accessible
- [ ] **Authentication**: Endpoints work without authentication
- [ ] **Static Files**: All image URLs return 200 OK
- [ ] **Database**: New tables created successfully
- [ ] **Admin Interface**: Dentscape sections visible in Django admin
- [ ] **Logs**: No errors in Django/Gunicorn logs

## 🧪 **TESTING COMMANDS**

```bash
# Test analysis endpoint
curl -X POST http://your-domain/api/dentscape/analyses/smile-curve-upper/ \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_image", "user_id": "test_user"}'

# Test simulation endpoint
curl -X POST http://your-domain/api/dentscape/simulations/orthodontics/ \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_image", "user_id": "test_user"}'

# Test static file access
curl -I http://your-domain/static/dentscape/smile_curve_annotated.jpg
```

## 🚨 **TROUBLESHOOTING**

### **If Static Files Return 404**:

```bash
# Check if files exist
ls -la staticfiles/dentscape/

# Recollect static files
python manage.py collectstatic --clear --noinput

# Check Nginx configuration
sudo nginx -t
```

### **If API Endpoints Return 500**:

```bash
# Check Django logs
tail -f logs/django.log

# Check Gunicorn logs
sudo journalctl -u gunicorn -f

# Run Django check
python manage.py check
```

### **If Database Errors**:

```bash
# Check migration status
python manage.py showmigrations dentscape

# Apply migrations manually
python manage.py migrate dentscape
```

## 📊 **DEPLOYMENT SUMMARY**

**Total Files Modified**: 4 existing files
**Total New Files**: 13 static images + complete app directory
**New API Endpoints**: 9 (3 simulations + 6 analyses)
**New Database Tables**: 3 (simulations, analyses, history)
**Authentication**: Removed (public endpoints)

## 🎉 **EXPECTED RESULT**

After successful deployment:

- ✅ **9 new API endpoints** accessible without authentication
- ✅ **Working image URLs** for all analysis and simulation results
- ✅ **Complete Dentscape functionality** integrated into your Django project
- ✅ **Admin interface** for managing Dentscape records

Your Dentscape AI integration is now fully deployed! 🚀




