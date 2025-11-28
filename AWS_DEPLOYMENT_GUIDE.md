# AWS Deployment Guide for Dentscape AI Integration

## Files Created/Modified Summary

### **New Files Created:**

1. **Dentscape App Directory**: `dentscape/`

   - `dentscape/__init__.py`
   - `dentscape/apps.py`
   - `dentscape/models.py`
   - `dentscape/views.py`
   - `dentscape/serializers.py`
   - `dentscape/urls.py`
   - `dentscape/admin.py`
   - `dentscape/dentscape_client.py`
   - `dentscape/migrations/0001_initial.py`

2. **Documentation Files**:

   - `DENTSCAPE_API_DOCUMENTATION.md`
   - `DENTSCAPE_IMPLEMENTATION_SUMMARY.md`
   - `DENTSCAPE_SCHEMA_FIX_SUMMARY.md`
   - `DENTSCAPE_CREATE_METHOD_FIX.md`
   - `DENTSCAPE_FINAL_FIX_SUMMARY.md`
   - `ANALYSIS_RESULTS_FIELD_SUMMARY.md`
   - `ANNOTATIONS_IMAGE_URL_SUMMARY.md`

3. **Test Files**:
   - `test_dentscape_integration.py`
   - `test_dentscape_endpoints.py`
   - `test_analysis_results.py`

### **Modified Files:**

1. `medcor_backend2/settings.py` - Added "dentscape" to INSTALLED_APPS
2. `medcor_backend2/urls.py` - Added dentscape URL routing

## Deployment Steps

### **Step 1: Prepare Files for Transfer**

```bash
# Create a deployment package
cd /home/nnamdi/pyth/medcor_backend2
tar -czf dentscape_deployment.tar.gz \
    dentscape/ \
    medcor_backend2/settings.py \
    medcor_backend2/urls.py \
    DENTSCAPE_*.md \
    ANALYSIS_*.md \
    ANNOTATIONS_*.md \
    test_dentscape*.py \
    test_analysis_results.py
```

### **Step 2: Transfer Files to AWS**

#### **Option A: Using SCP (Secure Copy)**

```bash
# Transfer the deployment package
scp -i /path/to/your/key.pem dentscape_deployment.tar.gz \
    ec2-user@your-aws-instance-ip:/home/ec2-user/

# SSH into your AWS instance
ssh -i /path/to/your/key.pem ec2-user@your-aws-instance-ip
```

#### **Option B: Using AWS CLI**

```bash
# Upload to S3 first
aws s3 cp dentscape_deployment.tar.gz s3://your-bucket-name/

# Then download on EC2 instance
aws s3 cp s3://your-bucket-name/dentscape_deployment.tar.gz ./
```

### **Step 3: Deploy on AWS Instance**

```bash
# SSH into your AWS instance
ssh -i /path/to/your/key.pem ec2-user@your-aws-instance-ip

# Navigate to your project directory
cd /path/to/your/medcor_backend2

# Extract the deployment package
tar -xzf ~/dentscape_deployment.tar.gz

# Activate virtual environment
source venv/bin/activate

# Install any new dependencies (if needed)
pip install -r requirements.txt

# Run database migrations
python manage.py makemigrations dentscape
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Test the deployment
python manage.py check
python manage.py test dentscape
```

### **Step 4: Environment Configuration**

```bash
# Add Dentscape API key to your environment
echo "DENTSCAPE_API_KEY=your_actual_api_key_here" >> .env

# Or add to your existing environment configuration
# Edit your .env file or environment variables
```

### **Step 5: Restart Services**

#### **For Django Development Server:**

```bash
# Stop current server (Ctrl+C)
# Start server
python manage.py runserver 0.0.0.0:8000
```

#### **For Production with Gunicorn:**

```bash
# Restart Gunicorn
sudo systemctl restart gunicorn

# Restart Nginx (if using)
sudo systemctl restart nginx

# Check status
sudo systemctl status gunicorn
sudo systemctl status nginx
```

#### **For Docker Deployment:**

```bash
# Rebuild and restart containers
docker-compose down
docker-compose build
docker-compose up -d

# Check logs
docker-compose logs -f
```

### **Step 6: Verify Deployment**

```bash
# Test API endpoints
curl -X GET http://your-domain/api/docs/
curl -X GET http://your-domain/api/dentscape/

# Test with authentication
curl -X POST http://your-domain/api/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{"email": "your_email", "password": "your_password"}'

# Use the token to test Dentscape endpoints
curl -X POST http://your-domain/api/dentscape/analyses/smile-curve-upper/ \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -F "user_id=test_user" \
    -F "image=@/path/to/test/image.jpg"
```

## Environment Variables Required

Add these to your AWS environment:

```bash
# Dentscape API Configuration
DENTSCAPE_API_KEY=your_dentscape_api_key_here
DENTSCAPE_MOCK_MODE=False  # Set to True for testing without API key

# Existing variables (should already be configured)
DATABASE_URL=your_database_url
SECRET_KEY=your_secret_key
DEBUG=False  # Set to False for production
ALLOWED_HOSTS=your-domain.com,your-aws-instance-ip
```

## Database Migration Commands

```bash
# Create migrations for the new app
python manage.py makemigrations dentscape

# Apply migrations
python manage.py migrate

# If you need to rollback (emergency only)
python manage.py migrate dentscape zero
```

## Testing Commands

```bash
# Run Django system checks
python manage.py check

# Run tests
python manage.py test dentscape

# Test specific functionality
python test_dentscape_integration.py
python test_dentscape_endpoints.py
```

## Monitoring and Logs

```bash
# Check application logs
tail -f /var/log/your-app.log

# Check Gunicorn logs
sudo journalctl -u gunicorn -f

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Rollback Plan (If Needed)

```bash
# If deployment fails, rollback:
# 1. Remove dentscape from INSTALLED_APPS
# 2. Remove dentscape URL routing
# 3. Restart services
# 4. Check application status
```

## Security Considerations

1. **API Keys**: Ensure `DENTSCAPE_API_KEY` is properly secured
2. **File Permissions**: Set appropriate permissions for uploaded images
3. **CORS**: Configure CORS settings for your frontend domain
4. **Rate Limiting**: Consider implementing rate limiting for API endpoints

## Performance Optimization

1. **Static Files**: Ensure static files are properly served
2. **Database Indexing**: Consider adding database indexes for frequently queried fields
3. **Caching**: Implement caching for API responses if needed
4. **CDN**: Use CDN for serving static files and images

## Troubleshooting

### **Common Issues:**

1. **Migration Errors**: Check database connectivity and permissions
2. **Import Errors**: Verify all dependencies are installed
3. **Permission Errors**: Check file permissions and ownership
4. **API Key Issues**: Verify environment variables are loaded correctly

### **Debug Commands:**

```bash
# Check Django configuration
python manage.py check --deploy

# Verify database connection
python manage.py dbshell

# Check installed packages
pip list | grep dentscape

# Test API endpoints locally
python test_dentscape_endpoints.py
```

## Success Verification

After deployment, verify:

✅ **API Documentation**: `/api/docs/` shows Dentscape endpoints  
✅ **Database**: Dentscape tables created successfully  
✅ **Authentication**: API endpoints require proper authentication  
✅ **Mock Responses**: Endpoints return proper mock data  
✅ **Error Handling**: Proper error responses for invalid requests  
✅ **Logging**: Application logs show no critical errors

## Next Steps

1. **Configure Production API Key**: Replace mock mode with real Dentscape API key
2. **Set Up Monitoring**: Implement monitoring for API usage and performance
3. **Load Testing**: Test API endpoints under load
4. **Documentation**: Update API documentation for frontend team
5. **Backup**: Ensure database backups include new Dentscape tables

Your Dentscape AI integration is now ready for production deployment! 🚀





