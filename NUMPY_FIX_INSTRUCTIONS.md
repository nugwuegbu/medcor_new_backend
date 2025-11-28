# NumPy Compatibility Fix for AWS Server

## Problem
OpenCV (`opencv-python==4.8.1.78`) was compiled with NumPy 1.x, but NumPy 2.2.6 is installed, causing:
```
AttributeError: _ARRAY_API not found
ImportError: numpy.core.multiarray failed to import
```

## Solution
Downgrade NumPy to version <2.0 to maintain compatibility with OpenCV.

## Steps to Fix on AWS Server

### 1. Update requirements.txt
The `requirements.txt` file has been updated to use `numpy<2.0` instead of `numpy==2.2.6`.

### 2. SSH into AWS Server
```bash
ssh your-aws-server
```

### 3. Navigate to Project Directory
```bash
cd /var/www/html/medcor_backend2
```

### 4. Activate Virtual Environment
```bash
source venv/bin/activate
```

### 5. Uninstall Current NumPy
```bash
pip uninstall numpy -y
```

### 6. Install Compatible NumPy Version
```bash
pip install "numpy<2.0"
```

Or reinstall all dependencies:
```bash
pip install -r requirements.txt
```

### 7. Verify Installation
```bash
python -c "import numpy; print('NumPy version:', numpy.__version__)"
python -c "import cv2; print('OpenCV import successful')"
```

Expected output:
- NumPy version should be 1.x (e.g., 1.26.4)
- OpenCV should import without errors

### 8. Restart Services
```bash
# Restart Gunicorn
sudo systemctl restart gunicorn.service

# Restart Celery (if running)
sudo systemctl restart celery.service

# Or if running manually:
pkill -f gunicorn
pkill -f celery
# Then restart them
```

### 9. Test Django Server
```bash
python manage.py check
python manage.py runserver  # Test locally first
```

## Alternative: Pin Specific NumPy 1.x Version

If you want to pin a specific stable version, you can use:
```bash
pip install "numpy>=1.24.0,<2.0"
```

Or in requirements.txt:
```txt
numpy>=1.24.0,<2.0
```

## Verification Commands

After fixing, verify everything works:

```bash
# Check NumPy version
python -c "import numpy; print(numpy.__version__)"

# Check OpenCV import
python -c "import cv2; print('OpenCV OK')"

# Check Django can start
python manage.py check

# Test youcam module import
python -c "from youcam.youcam_client import YouCamClient; print('YouCam import OK')"
```

## Notes

- **NumPy 2.0 Breaking Changes**: NumPy 2.0 introduced breaking changes that require modules compiled with NumPy 2.0. OpenCV 4.8.1.78 was compiled with NumPy 1.x, so it's incompatible.
- **Future Solution**: When OpenCV releases a version compiled with NumPy 2.0, you can upgrade both packages together.
- **Other Affected Packages**: Check if `deepface` or `tf-keras` also require NumPy <2.0. They may have similar compatibility issues.

## Troubleshooting

If you still see errors after downgrading:

1. **Clear pip cache**:
   ```bash
   pip cache purge
   pip install --no-cache-dir "numpy<2.0"
   ```

2. **Reinstall OpenCV**:
   ```bash
   pip uninstall opencv-python -y
   pip install opencv-python==4.8.1.78
   ```

3. **Check for conflicting packages**:
   ```bash
   pip list | grep numpy
   pip list | grep opencv
   ```

4. **Verify virtual environment**:
   Make sure you're using the correct virtual environment and not system Python.




























