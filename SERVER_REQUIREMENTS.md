# Server Requirements - PII Collection System

## 🚀 Quick Installation

### **Step 1: Install New Python Packages**

```bash
pip install phonenumbers==8.13.36 email-validator==2.2.0
```

### **Step 2: Run Database Migration**

```bash
python manage.py migrate core
```

### **Step 3: Restart Services**

```bash
# Restart Django/Gunicorn
sudo systemctl restart gunicorn

# Restart Celery (if running)
sudo systemctl restart celery
```

---

## 📦 What to Install

### **New Python Packages (2 packages)**

1. **phonenumbers==8.13.36**
   - Purpose: Phone number validation and formatting
   - Size: ~2MB

2. **email-validator==2.2.0**
   - Purpose: Enhanced email validation
   - Size: ~100KB

### **Already Installed (No Action Needed)**

- ✅ Django 5.0.1
- ✅ PostgreSQL (psycopg2-binary)
- ✅ OpenAI SDK
- ✅ All other existing dependencies

---

## ✅ Complete Installation Command

```bash
# One command to install everything
pip install phonenumbers==8.13.36 email-validator==2.2.0 && \
python manage.py migrate core && \
sudo systemctl restart gunicorn celery
```

---

## 📋 Pre-Deployment Checklist

- [ ] Install `phonenumbers==8.13.36`
- [ ] Install `email-validator==2.2.0`
- [ ] Run migration: `python manage.py migrate core`
- [ ] Restart Django/Gunicorn
- [ ] Restart Celery (if running)
- [ ] Test API endpoint (optional)

---

## 🔍 Verify Installation

```bash
# Check packages
pip show phonenumbers
pip show email-validator

# Check database table
python manage.py dbshell
# Then: \dt user_profiles
```

---

## 📝 Files Updated

**requirements.txt** has been updated with:
```txt
# PII Collection and Validation
phonenumbers==8.13.36
email-validator==2.2.0
```

**Deploy this file** along with your code changes.

---

## 🆘 Troubleshooting

**If packages fail to install:**
```bash
pip install --upgrade pip
pip install phonenumbers==8.13.36 email-validator==2.2.0
```

**If migration fails:**
```bash
python manage.py migrate
python manage.py migrate core
```

---

## 📚 Full Documentation

See `SERVER_INSTALLATION_GUIDE.md` for detailed instructions.

---

## ✅ Summary

**Minimum Requirements:**
- 2 new Python packages
- 1 database migration
- Service restart

**Time Required:** ~2 minutes

**That's it!** 🎉













