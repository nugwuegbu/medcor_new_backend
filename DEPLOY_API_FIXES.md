# Deployment Guide: API Endpoint Fixes for Production

## Summary of Changes
This deployment includes critical fixes for API endpoints that are returning 404 errors in production at medcor.ai.

## Fixed Endpoints
1. `/api/appointments/appointments/` - Appointments listing endpoint
2. `/api/analysis-tracking-stats` - Analysis usage statistics  
3. `/api/analysis-tracking` - Analysis usage tracking (GET)
4. `/api/track-analysis` - Analysis usage tracking (POST)

## Modified Files
```
medcor_backend/medcor_backend/urls_public.py
medcor_backend/api/views.py  
medcor_backend/simple_django_server.py
medcor_backend/api/urls.py
```

## Deployment Steps

### 1. Backup Current Production Files
```bash
# SSH into production server
ssh ubuntu@medcor.ai

# Create backup
sudo cp -r /var/www/medcor_backend /var/www/medcor_backend.backup.$(date +%Y%m%d)
```

### 2. Update Production Files
```bash
# Copy updated files from local to production
scp medcor_backend/medcor_backend/urls_public.py ubuntu@medcor.ai:/tmp/
scp medcor_backend/api/views.py ubuntu@medcor.ai:/tmp/
scp medcor_backend/simple_django_server.py ubuntu@medcor.ai:/tmp/
scp medcor_backend/api/urls.py ubuntu@medcor.ai:/tmp/

# SSH into production
ssh ubuntu@medcor.ai

# Move files to correct locations
sudo cp /tmp/urls_public.py /var/www/medcor_backend/medcor_backend/
sudo cp /tmp/views.py /var/www/medcor_backend/api/
sudo cp /tmp/simple_django_server.py /var/www/medcor_backend/
sudo cp /tmp/urls.py /var/www/medcor_backend/api/

# Set correct permissions
sudo chown www-data:www-data /var/www/medcor_backend/medcor_backend/urls_public.py
sudo chown www-data:www-data /var/www/medcor_backend/api/views.py
sudo chown www-data:www-data /var/www/medcor_backend/simple_django_server.py
sudo chown www-data:www-data /var/www/medcor_backend/api/urls.py
```

### 3. Restart Services
```bash
# Restart Gunicorn
sudo systemctl restart gunicorn

# Restart Nginx  
sudo systemctl restart nginx

# Check service status
sudo systemctl status gunicorn
sudo systemctl status nginx
```

### 4. Verify Endpoints
Test each endpoint to ensure they're working:

```bash
# Test appointments endpoint
curl https://medcor.ai/api/appointments/appointments/

# Test analysis tracking stats
curl https://medcor.ai/api/analysis-tracking-stats

# Test analysis tracking GET
curl https://medcor.ai/api/analysis-tracking

# Test track analysis POST
curl -X POST https://medcor.ai/api/track-analysis \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test-prod", "analysisType": "face", "widgetLocation": "chat_widget"}'
```

### 5. Verify Swagger Documentation
Open https://medcor.ai/api/docs/ and verify:
- Analysis Tracking endpoints appear in the documentation
- Appointments endpoint is listed correctly

## Rollback Procedure
If issues occur, rollback to the backup:

```bash
# SSH into production
ssh ubuntu@medcor.ai

# Restore from backup
sudo rm -rf /var/www/medcor_backend
sudo cp -r /var/www/medcor_backend.backup.$(date +%Y%m%d) /var/www/medcor_backend

# Restart services
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

## Key Changes Made

### 1. urls_public.py
- Fixed path prefixes for appointments: `/api/appointments/`
- Fixed path prefixes for tenants: `/api/tenants/`  
- Fixed path prefixes for subscriptions: `/api/subscription/`

### 2. api/views.py
- Added drf-spectacular decorators for Swagger documentation
- Added proper tags and operation IDs for API documentation
- Ensured analysis tracking views are properly documented

### 3. simple_django_server.py  
- Added support for `/api/appointments/appointments/` endpoint
- Added `/api/analysis-tracking-stats` GET endpoint
- Added `/api/analysis-tracking` GET endpoint
- Added `/api/track-analysis` POST endpoint
- All endpoints work in fallback mode when Neon database is unavailable

### 4. api/urls.py
- Already configured with correct URL patterns
- Includes analysis tracking endpoints

## Testing Checklist
- [ ] `/api/appointments/appointments/` returns appointment list
- [ ] `/api/analysis-tracking-stats` returns statistics
- [ ] `/api/analysis-tracking` returns tracking data (GET)
- [ ] `/api/track-analysis` accepts POST requests
- [ ] All endpoints appear in Swagger documentation at `/api/docs/`
- [ ] Endpoints work with both full Django and fallback mode

## Notes
- The fallback server runs when Neon database is unavailable
- All endpoints support both full Django mode and fallback mode
- Analysis tracking data is stored in-memory during fallback mode
- Production uses `urls_public.py` for public schema routing