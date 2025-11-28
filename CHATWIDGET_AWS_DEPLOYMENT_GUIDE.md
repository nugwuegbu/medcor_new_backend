# ChatWidget Customization AWS Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the ChatWidget Customization feature to your AWS EC2 server.

## Files and Folders to Transfer

### 1. ChatWidget App Files

```
chatwidget/
├── __init__.py
├── admin.py
├── apps.py
├── models.py
├── serializers.py
├── urls.py
├── views.py
├── tests.py
└── migrations/
    ├── __init__.py
    ├── 0001_initial.py
    ├── 0002_alter_theme_company_logo.py
    └── 0003_auto_20251017_1521.py
```

### 2. Modified Project Files

```
medcor_backend2/
├── settings.py          # Added 'chatwidget' to INSTALLED_APPS
└── urls.py              # Added chatwidget URL patterns
```

### 3. Documentation Files (Optional)

```
CHATWIDGET_API_DOCUMENTATION.md
CHATWIDGET_CURL_EXAMPLES.md
CHATWIDGET_IMPLEMENTATION_SUMMARY.md
test_chatwidget_api.py
deploy_chatwidget_to_aws.sh
```

## Deployment Methods

### Method 1: Automated Deployment Script (Recommended)

1. **Transfer the deployment script to your AWS server:**

   ```bash
   scp deploy_chatwidget_to_aws.sh ubuntu@your-aws-server:/home/ubuntu/
   ```

2. **Make the script executable and run it:**
   ```bash
   ssh ubuntu@your-aws-server
   chmod +x deploy_chatwidget_to_aws.sh
   ./deploy_chatwidget_to_aws.sh
   ```

### Method 2: Manual Deployment

#### Step 1: Transfer Files

```bash
# Transfer chatwidget app
scp -r chatwidget/ ubuntu@your-aws-server:/home/ubuntu/medcor_backend2/

# Transfer modified project files
scp medcor_backend2/settings.py ubuntu@your-aws-server:/home/ubuntu/medcor_backend2/medcor_backend2/
scp medcor_backend2/urls.py ubuntu@your-aws-server:/home/ubuntu/medcor_backend2/medcor_backend2/
```

#### Step 2: SSH into AWS Server

```bash
ssh ubuntu@your-aws-server
cd /home/ubuntu/medcor_backend2
```

#### Step 3: Backup Database (Important!)

```bash
# Create backup directory
mkdir -p /home/ubuntu/backups

# Backup current database
DATE=$(date +%Y%m%d_%H%M%S)
source .env
pg_dump $DATABASE_URL > /home/ubuntu/backups/medcor_db_before_chatwidget_$DATE.sql
echo "Database backup created: medcor_db_before_chatwidget_$DATE.sql"
```

#### Step 4: Pull Latest Changes

```bash
git pull origin main
```

#### Step 5: Activate Virtual Environment

```bash
source venv/bin/activate
```

#### Step 6: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Step 7: Run Migrations

```bash
# Run chatwidget migrations specifically
python manage.py migrate chatwidget

# Or run all migrations
python manage.py migrate
```

#### Step 8: Collect Static Files

```bash
python manage.py collectstatic --noinput
```

#### Step 9: Test Models

```bash
python manage.py shell << 'EOF'
from chatwidget.models import ChatWidgetCustomization, Theme, Features, Avatar, Voice, Integration
print("✅ ChatWidget models imported successfully")
EOF
```

#### Step 10: Restart Services

```bash
sudo systemctl restart medcor
sudo systemctl restart nginx
```

#### Step 11: Verify Deployment

```bash
# Check service status
sudo systemctl status medcor
sudo systemctl status nginx

# Test API endpoints
curl -s http://localhost:8000/api/chatwidget/ | head -c 200
curl -s http://localhost:8000/api/schema/ | grep -q "user_message_background" && echo "✅ Schema updated"
```

## Post-Deployment Verification

### 1. Check Service Status

```bash
sudo systemctl status medcor --no-pager
sudo systemctl status nginx --no-pager
```

### 2. Test API Endpoints

```bash
# Test schema endpoint
curl -s http://localhost:8000/api/schema/ | grep "user_message_background"

# Test chatwidget endpoints
curl -s http://localhost:8000/api/chatwidget/

# Test with authentication (replace with your token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8000/api/chatwidget/
```

### 3. Check Logs

```bash
# Check application logs
sudo journalctl -u medcor -f

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 4. Create Test Data (Optional)

```bash
python manage.py shell << 'EOF'
from chatwidget.models import ChatWidgetCustomization, Theme, Features, Avatar, Voice, Integration
from tenants.models import Hospital

# Get first hospital
hospital = Hospital.objects.first()
if hospital:
    # Create test customization
    customization = ChatWidgetCustomization.objects.create(hospital=hospital)

    # Create theme
    Theme.objects.create(
        chatwidget_customization=customization,
        company_logo="/media/logos/test-logo.png",
        primary_color="#2E86AB",
        secondary_color="#A23B72",
        user_message_background="#F8F9FA",
        # ... other fields
    )

    print(f"✅ Test data created for hospital: {hospital.name}")
else:
    print("No hospitals found. Create a hospital first.")
EOF
```

## Database Migration Details

The deployment includes three migrations:

1. **0001_initial.py** - Creates all chatwidget tables
2. **0002_alter_theme_company_logo.py** - Changes company_logo from URLField to CharField
3. **0003_auto_20251017_1521.py** - Renames user_management_background to user_message_background

### Migration Commands

```bash
# Run specific chatwidget migrations
python manage.py migrate chatwidget

# Check migration status
python manage.py showmigrations chatwidget

# Rollback if needed (not recommended in production)
python manage.py migrate chatwidget 0001
```

## API Endpoints Available After Deployment

### Hospital-Specific Endpoints

- `POST /api/chatwidget/create-for-hospital/{hospital_id}/`
- `GET /api/chatwidget/hospital/{hospital_id}/`
- `PUT /api/chatwidget/update-for-hospital/{hospital_id}/`
- `DELETE /api/chatwidget/delete-for-hospital/{hospital_id}/`

### General CRUD Endpoints

- `GET /api/chatwidget/`
- `GET /api/chatwidget/{id}/`
- `PUT /api/chatwidget/{id}/`
- `DELETE /api/chatwidget/{id}/`

## Troubleshooting

### Common Issues

1. **Migration Errors**

   ```bash
   # Check migration status
   python manage.py showmigrations chatwidget

   # Reset migrations if needed (development only)
   python manage.py migrate chatwidget zero
   python manage.py migrate chatwidget
   ```

2. **Service Won't Start**

   ```bash
   # Check logs
   sudo journalctl -u medcor -f

   # Check syntax
   python manage.py check

   # Test database connection
   python manage.py dbshell
   ```

3. **API Not Working**

   ```bash
   # Check URL patterns
   python manage.py show_urls | grep chatwidget

   # Test endpoints
   curl -v http://localhost:8000/api/chatwidget/
   ```

4. **Permission Issues**
   ```bash
   # Fix permissions
   sudo chown -R ubuntu:ubuntu /home/ubuntu/medcor_backend2
   sudo chmod -R 755 /home/ubuntu/medcor_backend2
   ```

### Rollback Procedure

If you need to rollback the deployment:

1. **Stop services:**

   ```bash
   sudo systemctl stop medcor
   ```

2. **Restore database:**

   ```bash
   psql $DATABASE_URL < /home/ubuntu/backups/medcor_db_before_chatwidget_YYYYMMDD_HHMMSS.sql
   ```

3. **Remove chatwidget app:**

   ```bash
   rm -rf chatwidget/
   ```

4. **Restore settings.py and urls.py:**

   ```bash
   git checkout HEAD~1 medcor_backend2/settings.py
   git checkout HEAD~1 medcor_backend2/urls.py
   ```

5. **Restart services:**
   ```bash
   sudo systemctl start medcor
   ```

## Security Considerations

1. **Database Backup**: Always backup before deployment
2. **Environment Variables**: Ensure .env file has correct database credentials
3. **Permissions**: Run as ubuntu user, not root
4. **Firewall**: Ensure only necessary ports are open
5. **SSL**: Use HTTPS in production

## Monitoring

### Health Checks

```bash
# Application health
curl http://localhost:8000/api/health/

# Service status
systemctl is-active medcor
systemctl is-active nginx
```

### Log Monitoring

```bash
# Real-time logs
sudo journalctl -u medcor -f

# Error logs
sudo tail -f /var/log/nginx/error.log
```

## Support

If you encounter issues:

1. Check the logs first
2. Verify all files were transferred correctly
3. Ensure database migrations completed successfully
4. Test API endpoints individually
5. Check service status and permissions

## Success Indicators

✅ Deployment is successful when:

- All services are running (`systemctl status medcor`)
- API endpoints respond correctly
- Database migrations completed without errors
- ChatWidget models can be imported
- API schema includes chatwidget fields
- No errors in logs





















