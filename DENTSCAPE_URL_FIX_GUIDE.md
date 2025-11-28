# Fix for Dentscape Image URLs on AWS

## 🎯 **PROBLEM**

**Issue**: Image URLs showing `localhost:8000` instead of `api.medcor.ai`

```json
{
  "annotations_image_url": "http://localhost:8000/static/dentscape/smile_curve_annotated.jpg"
}
```

**Expected**: URLs should show your actual domain

```json
{
  "annotations_image_url": "https://api.medcor.ai/static/dentscape/smile_curve_annotated.jpg"
}
```

## ✅ **SOLUTION IMPLEMENTED**

### **1. Updated URL Building Method**

**File**: `dentscape/dentscape_client.py`
**Method**: `_build_static_url()`

**Changes**:

- ✅ **Smart domain detection**: Automatically finds the first non-localhost domain
- ✅ **Production protocol**: Uses `https` when `DEBUG=False`
- ✅ **Override option**: Supports `DENTSCAPE_BASE_URL` environment variable

### **2. Added Environment Variable Support**

**File**: `medcor_backend2/settings.py`
**Added**:

```python
# Dentscape Configuration
DENTSCAPE_API_KEY = os.getenv("DENTSCAPE_API_KEY", "")
DENTSCAPE_MOCK_MODE = os.getenv("DENTSCAPE_MOCK_MODE", "True").lower() == "true"
DENTSCAPE_BASE_URL = os.getenv("DENTSCAPE_BASE_URL", "")  # Optional: Override base URL
```

## 🔧 **HOW TO FIX ON AWS**

### **Method 1: Automatic Detection (Recommended)**

**Step 1**: Ensure your AWS environment has the correct `ALLOWED_HOSTS`:

```bash
# In your .env file on AWS
ALLOWED_HOSTS=api.medcor.ai,localhost,127.0.0.1
DEBUG=False
```

**Step 2**: Deploy the updated files

```bash
# Transfer updated files
scp dentscape/dentscape_client.py ec2-user@your-aws-ip:/path/to/project/dentscape/
scp medcor_backend2/settings.py ec2-user@your-aws-ip:/path/to/project/medcor_backend2/

# Restart services
sudo systemctl restart gunicorn
```

**Result**: URLs will automatically use `https://api.medcor.ai`

### **Method 2: Explicit Override (If Method 1 doesn't work)**

**Step 1**: Add explicit base URL to your AWS environment:

```bash
# In your .env file on AWS
DENTSCAPE_BASE_URL=https://api.medcor.ai
```

**Step 2**: Deploy and restart services

```bash
sudo systemctl restart gunicorn
```

**Result**: URLs will use the explicitly set base URL

## 🧪 **TESTING**

### **Test URL Generation**:

```bash
# SSH into AWS server
ssh -i /path/to/key.pem ec2-user@your-aws-ip

# Test the API endpoint
curl -X POST https://api.medcor.ai/api/dentscape/analyses/smile-curve-upper/ \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_image", "user_id": "test_user"}'
```

### **Expected Response**:

```json
{
  "success": true,
  "annotations_image_url": "https://api.medcor.ai/static/dentscape/smile_curve_annotated.jpg",
  "analysis_results": { ... }
}
```

## 📋 **VERIFICATION CHECKLIST**

After deployment, verify:

- [ ] **Environment Variables**: `ALLOWED_HOSTS` includes `api.medcor.ai`
- [ ] **DEBUG Setting**: `DEBUG=False` in production
- [ ] **API Response**: URLs show `https://api.medcor.ai` instead of `localhost:8000`
- [ ] **Static Files**: Images accessible at `https://api.medcor.ai/static/dentscape/`
- [ ] **HTTPS**: All URLs use `https://` protocol

## 🔍 **TROUBLESHOOTING**

### **If URLs still show localhost**:

1. **Check ALLOWED_HOSTS**:

   ```bash
   python manage.py shell
   >>> from django.conf import settings
   >>> print(settings.ALLOWED_HOSTS)
   ```

2. **Check DEBUG setting**:

   ```bash
   python manage.py shell
   >>> from django.conf import settings
   >>> print(settings.DEBUG)
   ```

3. **Use explicit override**:
   ```bash
   # Add to .env file
   DENTSCAPE_BASE_URL=https://api.medcor.ai
   ```

### **If static files return 404**:

1. **Check static files collection**:

   ```bash
   python manage.py collectstatic --noinput
   ```

2. **Check file permissions**:

   ```bash
   ls -la staticfiles/dentscape/
   ```

3. **Check Nginx configuration**:
   ```bash
   sudo nginx -t
   ```

## 🎉 **EXPECTED RESULT**

After successful deployment:

### **Before (Broken)**:

```json
{
  "annotations_image_url": "http://localhost:8000/static/dentscape/smile_curve_annotated.jpg"
}
```

### **After (Fixed)**:

```json
{
  "annotations_image_url": "https://api.medcor.ai/static/dentscape/smile_curve_annotated.jpg"
}
```

## 📁 **FILES TO UPDATE ON AWS**

1. **Modified**: `dentscape/dentscape_client.py` (URL building method)
2. **Modified**: `medcor_backend2/settings.py` (Dentscape configuration)
3. **Environment**: Update `.env` file with correct `ALLOWED_HOSTS` and `DEBUG=False`

Your Dentscape image URLs will now correctly show `https://api.medcor.ai` instead of `localhost:8000`! 🚀




