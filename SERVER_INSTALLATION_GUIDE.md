# Server Installation Guide - PII Collection System

## 📋 Requirements to Install on Server

### **1. New Python Packages (Required for PII Collection)**

Add these two packages to your server:

```bash
pip install phonenumbers==8.13.36 email-validator==2.2.0
```

**What they do:**
- `phonenumbers`: Validates and formats phone numbers (international support)
- `email-validator`: Enhanced email validation beyond Django's basic validation

---

### **2. Complete Installation Steps**

#### **Step 1: Update requirements.txt**

The `requirements.txt` file has been updated with the new packages. Make sure it includes:

```txt
# PII Collection and Validation
phonenumbers==8.13.36
email-validator==2.2.0
```

#### **Step 2: Install Dependencies**

```bash
# Navigate to project directory
cd /path/to/medcor_backend2

# Activate virtual environment (if using one)
source venv/bin/activate  # or: python3 -m venv venv && source venv/bin/activate

# Install new packages
pip install phonenumbers==8.13.36 email-validator==2.2.0

# OR install all requirements (recommended)
pip install -r requirements.txt
```

#### **Step 3: Run Database Migrations**

```bash
# Create migration (if not already done)
python manage.py makemigrations core

# Apply migration
python manage.py migrate core
```

This will create the `user_profiles` table in your database.

#### **Step 4: Restart Services**

```bash
# Restart Django/Gunicorn
sudo systemctl restart gunicorn  # or your Django service
# OR
sudo supervisorctl restart gunicorn

# Restart Celery (if running)
sudo systemctl restart celery  # or your Celery service
# OR
sudo supervisorctl restart celery
```

---

## 🔍 Verification

### **Check Installation**

```bash
# Verify packages are installed
pip show phonenumbers
pip show email-validator

# Should show:
# Name: phonenumbers
# Version: 8.13.36
# 
# Name: email-validator
# Version: 2.2.0
```

### **Test Database Migration**

```bash
# Check if table exists
python manage.py dbshell
# Then in PostgreSQL:
# \dt user_profiles
# Should show the table
```

### **Test PII Extraction**

```python
# In Django shell
python manage.py shell

from core.pii_service import PIIExtractor

extractor = PIIExtractor()
result = extractor.extract_all("My email is test@example.com and phone is +1234567890")
print(result)
# Should output: {'email': 'test@example.com', 'phone_number': '+1234567890', 'name': None}
```

---

## 📦 Complete Requirements List

### **Core Dependencies (Already Installed)**

These should already be on your server:

- ✅ Django==5.0.1
- ✅ djangorestframework==3.14.0
- ✅ psycopg2-binary==2.9.9 (PostgreSQL)
- ✅ openai==1.106.1
- ✅ celery==5.3.4
- ✅ redis==4.6.0

### **New Dependencies (Need to Install)**

- ⚠️ **phonenumbers==8.13.36** - NEW
- ⚠️ **email-validator==2.2.0** - NEW

### **Optional Dependencies**

These are optional and may already be installed:

- python-dotenv==1.0.0 (for .env file support)
- drf-spectacular==0.27.0 (for Swagger docs)

---

## 🚀 Quick Install Script

Create a script `install_pii_dependencies.sh`:

```bash
#!/bin/bash
set -e

echo "Installing PII Collection dependencies..."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install new packages
pip install phonenumbers==8.13.36 email-validator==2.2.0

# Run migrations
python manage.py migrate core

echo "✅ PII Collection dependencies installed successfully!"
echo "⚠️  Don't forget to restart your Django and Celery services!"
```

**Make it executable and run:**
```bash
chmod +x install_pii_dependencies.sh
./install_pii_dependencies.sh
```

---

## 🔧 Server Configuration

### **No New Environment Variables Needed**

The PII collection system uses existing configuration:
- ✅ Uses existing database (PostgreSQL)
- ✅ Uses existing OpenAI API key
- ✅ No new environment variables required

### **Database Changes**

**New Table:** `user_profiles`
- Created automatically by migration
- No manual setup needed

---

## 📝 Files to Deploy

### **New Files (Must Deploy)**

1. `core/pii_service.py` - PII extraction service
2. `core/pii_collection_manager.py` - Collection manager
3. `core/migrations/0015_userprofile.py` - Database migration

### **Modified Files (Must Deploy)**

1. `core/chat_models.py` - Added UserProfile model
2. `core/services.py` - Enhanced system prompt
3. `core/chat_views.py` - Integrated PII collection
4. `core/chat_serializers.py` - Added UserProfile serializers
5. `core/chat_urls.py` - Added new endpoints
6. `core/ai_query_views.py` - Integrated PII collection
7. `requirements.txt` - Added new dependencies

---

## ✅ Pre-Deployment Checklist

- [ ] Update `requirements.txt` on server
- [ ] Install new Python packages: `phonenumbers` and `email-validator`
- [ ] Deploy all new/modified files
- [ ] Run database migration: `python manage.py migrate core`
- [ ] Verify migration: Check `user_profiles` table exists
- [ ] Restart Django/Gunicorn service
- [ ] Restart Celery service (if running)
- [ ] Test PII extraction (optional)
- [ ] Test API endpoints (optional)

---

## 🧪 Post-Installation Testing

### **Test 1: API Endpoint**

```bash
# Test chat endpoint with PII
curl -X POST http://your-server/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My email is test@example.com",
    "session_id": "test-123",
    "language": "en"
  }'

# Should return: {"pii_collected": true, ...}
```

### **Test 2: Profile Endpoint**

```bash
# Get profile
curl http://your-server/api/profile/test-123/

# Should return profile with email
```

### **Test 3: AI Query Endpoint**

```bash
# Test AI query with PII
curl -X POST http://your-server/api/ai/query/ \
  -H "Content-Type: application/json" \
  -d '{
    "question": "My email is test@example.com",
    "session_id": "test-123"
  }'

# Should return: {"pii_collected": true, ...}
```

---

## 🔄 Rollback Instructions

If you need to rollback:

```bash
# 1. Revert database migration
python manage.py migrate core 0014

# 2. Remove packages (optional)
pip uninstall phonenumbers email-validator

# 3. Revert code changes (git)
git checkout HEAD~1  # or specific commit before PII changes
```

---

## 📊 System Requirements

### **Python Version**
- Python 3.8+ (should already be installed)

### **Database**
- PostgreSQL (should already be configured)
- No additional setup needed

### **Memory**
- No additional memory requirements
- PII extraction is lightweight

### **Disk Space**
- Minimal: ~2MB for new packages

---

## 🆘 Troubleshooting

### **Issue: ImportError for phonenumbers**

```bash
# Solution: Install package
pip install phonenumbers==8.13.36
```

### **Issue: ImportError for email_validator**

```bash
# Solution: Install package
pip install email-validator==2.2.0
```

### **Issue: Migration Error**

```bash
# Solution: Check if previous migrations are applied
python manage.py migrate

# If table already exists:
python manage.py migrate core 0015 --fake
```

### **Issue: PII Not Extracting**

```bash
# Check logs
tail -f /var/log/gunicorn/error.log

# Test in Django shell
python manage.py shell
from core.pii_service import PIIExtractor
extractor = PIIExtractor()
print(extractor.extract_email("test@example.com"))
```

---

## 📚 Summary

**Minimum Requirements:**
1. Install 2 new Python packages
2. Run 1 database migration
3. Restart services

**Commands:**
```bash
pip install phonenumbers==8.13.36 email-validator==2.2.0
python manage.py migrate core
sudo systemctl restart gunicorn celery
```

**That's it!** The system will work automatically after installation. 🎉













