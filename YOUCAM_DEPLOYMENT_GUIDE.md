# YouCam API Refactor - Deployment Guide to AWS

## 📋 Files Modified Today (YouCam Refactoring)

### Core Implementation Files:

1. **`youcam/youcam_client.py`** ⭐ CRITICAL

   - Added real face analysis with DeepFace
   - Added real skin analysis with CV2
   - Added real hair analysis with CV2
   - Added real lips analysis with CV2
   - Added 15+ helper methods for intelligent recommendations
   - **Size**: ~1,500 lines

2. **`youcam/views.py`** ⭐ CRITICAL

   - Updated `process_analysis_synchronously()` for all 4 analysis types
   - Updated response handling for new formats
   - Added support for Face, Skin, Hair, and Lips new formats

3. **`requirements.txt`** ⭐ CRITICAL

   - Added `opencv-python==4.8.1.78`
   - Added `deepface==0.0.79`
   - Added `tf-keras==2.15.0`

4. **`YOUCAM_ENHANCED_API_DOCUMENTATION.md`** 📝 DOCUMENTATION
   - Updated Face Analysis response format
   - Added field descriptions

### Documentation Files Created (Optional but Recommended):

5. `FACE_ANALYSIS_REFACTOR_SUMMARY.md`
6. `SKIN_ANALYSIS_REFACTOR_SUMMARY.md`
7. `HAIR_ANALYSIS_IMPLEMENTATION_SUMMARY.md`
8. `LIPS_ANALYSIS_IMPLEMENTATION_SUMMARY.md`
9. `REAL_FACE_ANALYSIS_IMPLEMENTATION.md`
10. `INSTALL_FACE_ANALYSIS.md`
11. `YOUCAM_COMPLETE_REFACTOR_SUMMARY.md`
12. `YOUCAM_DEPLOYMENT_GUIDE.md` (this file)

## 🚀 Deployment Steps to AWS

### Option 1: Quick Deployment (Recommended)

#### Step 1: Commit Changes

```bash
# Add the critical files
git add youcam/youcam_client.py
git add youcam/views.py
git add requirements.txt
git add YOUCAM_ENHANCED_API_DOCUMENTATION.md

# Optional: Add documentation files
git add FACE_ANALYSIS_REFACTOR_SUMMARY.md
git add SKIN_ANALYSIS_REFACTOR_SUMMARY.md
git add HAIR_ANALYSIS_IMPLEMENTATION_SUMMARY.md
git add LIPS_ANALYSIS_IMPLEMENTATION_SUMMARY.md
git add YOUCAM_COMPLETE_REFACTOR_SUMMARY.md
git add YOUCAM_DEPLOYMENT_GUIDE.md

# Commit
git commit -m "Refactor: Implement real image analysis for all 4 YouCam APIs with DeepFace & OpenCV

- Add real face analysis with DeepFace (emotion, beauty, features)
- Add real skin analysis with CV2 (texture, pores, wrinkles, hydration)
- Add real hair analysis with CV2 (curl pattern, color, condition)
- Add real lips analysis with CV2 (health, texture, hydration)
- Add opencv-python, deepface, tf-keras dependencies
- Update response formats to match specifications
- Each image now returns unique analysis results
- Add intelligent personalized recommendations
- Production ready with graceful fallbacks"

# Push to your branch
git push origin clean-aws-rds-fix
```

#### Step 2: SSH to AWS Server

```bash
ssh ubuntu@api.medcor.ai
# Or use your configured SSH alias
```

#### Step 3: Pull Changes on AWS

```bash
cd /var/www/html/medcor_backend2

# Pull latest changes
git pull origin clean-aws-rds-fix

# Or if you use a different branch
git pull origin main
```

#### Step 4: Install New Dependencies on AWS

```bash
# Activate virtual environment
source venv/bin/activate

# Install new packages
pip install opencv-python==4.8.1.78 deepface==0.0.79 tf-keras==2.15.0

# Or install all requirements
pip install -r requirements.txt
```

#### Step 5: Restart Django/Gunicorn on AWS

```bash
# If using systemd service
sudo systemctl restart medcor-backend

# Or if using supervisor
sudo supervisorctl restart medcor

# Or if using gunicorn directly
sudo systemctl restart gunicorn

# Check status
sudo systemctl status medcor-backend
```

#### Step 6: Verify Deployment

```bash
# Test the API
curl -X GET https://api.medcor.ai/api/docs/

# Test face analysis endpoint
curl -X POST https://api.medcor.ai/api/youcam/face-analysis/ \
  -H "Content-Type: application/json" \
  -d '{"imagebase64":"data:image/jpeg;base64,..."}'
```

---

### Option 2: Using Deployment Script

If you have an existing deployment script:

```bash
# Use your existing script
./deploy_to_aws.sh

# Or
bash scripts/deploy_youcam_updates.sh
```

---

### Option 3: Docker Deployment

If you're using Docker:

#### Step 1: Build New Image

```bash
# On local machine
docker build -t medcor-backend:youcam-refactor .

# Tag for ECR
docker tag medcor-backend:youcam-refactor \
  your-account-id.dkr.ecr.us-east-1.amazonaws.com/medcor-backend:youcam-refactor
```

#### Step 2: Push to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  your-account-id.dkr.ecr.us-east-1.amazonaws.com

# Push image
docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/medcor-backend:youcam-refactor
```

#### Step 3: Deploy on AWS

```bash
# SSH to AWS
ssh ubuntu@api.medcor.ai

# Pull new image
docker pull your-account-id.dkr.ecr.us-east-1.amazonaws.com/medcor-backend:youcam-refactor

# Restart containers
docker-compose down
docker-compose up -d
```

---

## ⚠️ Important Deployment Notes

### 1. DeepFace Models Auto-Download

**First Request Will Download Models (~1.6 GB)**:

- Emotion model: ~6 MB
- Age model: ~539 MB
- Gender model: ~537 MB
- Race model: ~537 MB

**Location**: `~/.deepface/weights/`

**Time**: First face/skin analysis will take 5-10 minutes (one-time)

**Subsequent requests**: Fast (2-3 seconds)

### 2. Memory Requirements

**Minimum RAM**: 2 GB
**Recommended RAM**: 4 GB (for smooth operation)

DeepFace + TensorFlow requires adequate memory.

### 3. Disk Space

**Required**: At least 3 GB free space

- ~1.6 GB for DeepFace models
- ~1 GB for dependencies
- Operating buffer

### 4. Environment Variables

No additional environment variables needed!

The system automatically:

- Uses DeepFace/CV2 when `YOUCAM_API_KEY` is not set
- Falls back gracefully if real API fails
- Works out of the box

### 5. Performance Considerations

**First Analysis Request**:

- May take 5-10 minutes (models downloading)
- Display loading message to users

**Subsequent Requests**:

- Fast (<3 seconds per analysis)
- Models are cached

**Optimization Tip**:
Pre-download models before going live:

```bash
# On AWS server, run a test analysis to download models
python manage.py shell

>>> from youcam.youcam_client import YouCamClient
>>> from django.core.files.uploadedfile import SimpleUploadedFile
>>> import base64
>>>
>>> # Create a dummy image
>>> client = YouCamClient()
>>> # This will trigger model downloads
>>> # Wait for completion
```

---

## 📝 Deployment Checklist

### Pre-Deployment:

- [ ] All files committed to git
- [ ] Changes pushed to repository
- [ ] Branch specified (clean-aws-rds-fix or main)
- [ ] Backup current AWS deployment (optional but recommended)

### During Deployment:

- [ ] SSH to AWS server
- [ ] Navigate to project directory
- [ ] Pull latest changes
- [ ] Install new dependencies (opencv-python, deepface, tf-keras)
- [ ] Collect static files (if needed): `python manage.py collectstatic --noinput`
- [ ] Run migrations (if any): `python manage.py migrate`
- [ ] Restart Django/Gunicorn service

### Post-Deployment:

- [ ] Verify server is running
- [ ] Test API endpoint: https://api.medcor.ai/api/docs/
- [ ] Test face analysis with sample image
- [ ] Check logs for errors
- [ ] Monitor first analysis (models downloading)
- [ ] Test all 4 analysis types

### Performance Check:

- [ ] First face analysis completes (may take 5-10 min)
- [ ] Subsequent analyses are fast (<3 seconds)
- [ ] Different images return different results
- [ ] Response formats match specifications

---

## 🔍 Verification Commands

### On AWS Server:

```bash
# Check if packages installed
pip list | grep opencv
pip list | grep deepface
pip list | grep tf-keras

# Check DeepFace models
ls -lh ~/.deepface/weights/

# View recent logs
tail -f /var/log/medcor/django.log

# Or
journalctl -u medcor-backend -f

# Test API endpoint
curl https://api.medcor.ai/api/youcam/face-analysis/ \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"imagebase64":"data:image/jpeg;base64,..."}'
```

---

## 🐛 Troubleshooting

### Issue 1: ModuleNotFoundError: No module named 'cv2'

**Solution**:

```bash
pip install opencv-python==4.8.1.78
```

### Issue 2: ModuleNotFoundError: No module named 'deepface'

**Solution**:

```bash
pip install deepface==0.0.79 tf-keras==2.15.0
```

### Issue 3: First Analysis Takes Too Long

**Expected Behavior**: First analysis downloads models (~1.6 GB)

**Solution**: Wait for completion. Subsequent requests will be fast.

### Issue 4: Out of Memory Error

**Solution**: Increase server memory or use smaller TensorFlow build

```bash
# Check memory usage
free -h

# If low, consider upgrading instance type
```

### Issue 5: CUDA Error (No GPU)

**Not an issue**: System automatically uses CPU. The warning is normal.

---

## 📊 Expected Results After Deployment

### Test Face Analysis:

```bash
curl -X POST https://api.medcor.ai/api/youcam/face-analysis/ \
  -H "Content-Type: application/json" \
  -d '{"imagebase64":"<base64-image>"}'
```

**Expected Response**:

```json
{
  "success": true,
  "result": {
    "api_source": "DeepFace_Analysis",
    "emotion": "Happy",
    "beauty_score": 85,
    "face_shape": "Oval",
    ...
  }
}
```

### Different Images = Different Results:

- Image 1 (happy face) → emotion: "Happy", beauty_score: 92
- Image 2 (neutral face) → emotion: "Neutral", beauty_score: 78
- Image 3 (sad face) → emotion: "Sad", beauty_score: 70

---

## 🎯 Quick Deploy Commands

### Complete Deployment in One Go:

```bash
# On local machine
git add youcam/ requirements.txt YOUCAM*.md *ANALYSIS*.md
git commit -m "YouCam API refactor: Real image analysis for all 4 APIs"
git push origin clean-aws-rds-fix

# SSH to AWS
ssh ubuntu@api.medcor.ai

# On AWS server
cd /var/www/html/medcor_backend2
git pull origin clean-aws-rds-fix
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart medcor-backend

# Verify
curl https://api.medcor.ai/api/docs/
```

---

## 🎉 Summary

**Modified Files for Deployment**:

1. ⭐ `youcam/youcam_client.py` (CRITICAL)
2. ⭐ `youcam/views.py` (CRITICAL)
3. ⭐ `requirements.txt` (CRITICAL)
4. 📝 Documentation files (OPTIONAL)

**New Dependencies**:

- opencv-python
- deepface
- tf-keras
- (+20 sub-dependencies)

**Deployment Time**: ~10-15 minutes
**First Analysis Time**: ~5-10 minutes (model download)
**Subsequent Analysis**: <3 seconds

**Status**: Ready to deploy! ✅

---

**Last Updated**: October 15, 2025  
**Version**: 3.0.0


