# MedCor Backend 2 - Deployment Guide

## Overview
This guide covers deployment of the MedCor Backend 2 Django application with multi-tenant architecture.

## Local Development Setup

### 1. Install Dependencies
```bash
cd medcor_backend2
pip install -r requirements.txt
```

### 2. Configure Database
Update `.env` file with your Supabase credentials:
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.ehfjquriwhleqssyygto.supabase.co:5432/postgres
```

### 3. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Create Superuser
```bash
python manage.py createsuperuser
```

### 5. Load Initial Data
```bash
python manage.py loaddata initial_data.json  # If available
```

### 6. Run Development Server
```bash
python manage.py runserver
```

## Production Deployment

### Using Gunicorn

#### 1. Install Production Dependencies
```bash
pip install gunicorn whitenoise
```

#### 2. Configure Gunicorn
Create `gunicorn_config.py`:
```python
bind = "0.0.0.0:8000"
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
preload_app = True
```

#### 3. Run with Gunicorn
```bash
gunicorn medcor_backend2.wsgi:application --config gunicorn_config.py
```

### Using Docker

#### 1. Create Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "medcor_backend2.wsgi:application", "--bind", "0.0.0.0:8000"]
```

#### 2. Build and Run
```bash
docker build -t medcor-backend .
docker run -p 8000:8000 --env-file .env medcor-backend
```

## CI/CD with GitHub Actions

### GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy MedCor Backend

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Run tests
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      run: |
        python manage.py test
    
    - name: Run migrations
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      run: |
        python manage.py migrate

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Production
      run: |
        # Add your deployment script here
        # e.g., SSH to server, Docker push, etc.
        echo "Deploying to production..."
```

## Cloud Deployment Options

### AWS EC2

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t3.medium or larger
   - Security group: Allow ports 80, 443, 22

2. **Install Dependencies**
```bash
sudo apt update
sudo apt install python3-pip python3-venv nginx postgresql-client
```

3. **Setup Application**
```bash
git clone <your-repo>
cd medcor_backend2
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

4. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /static/ {
        alias /app/staticfiles/;
    }
    
    location /media/ {
        alias /app/media/;
    }
}
```

5. **Setup Systemd Service**
Create `/etc/systemd/system/medcor.service`:
```ini
[Unit]
Description=MedCor Backend
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/app/medcor_backend2
Environment="PATH=/app/medcor_backend2/venv/bin"
ExecStart=/app/medcor_backend2/venv/bin/gunicorn medcor_backend2.wsgi:application --bind 127.0.0.1:8000

[Install]
WantedBy=multi-user.target
```

### Heroku Deployment

1. **Create Procfile**
```
web: gunicorn medcor_backend2.wsgi:application
```

2. **Create runtime.txt**
```
python-3.11.0
```

3. **Deploy**
```bash
heroku create medcor-backend
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
heroku run python manage.py migrate
```

### Railway/Render Deployment

1. **Create railway.json**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python manage.py migrate && gunicorn medcor_backend2.wsgi",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. **Deploy via CLI**
```bash
railway login
railway init
railway up
```

## Environment Variables

### Required Variables
```env
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com
CORS_ALLOWED_ORIGINS=https://your-frontend.com
```

### Optional Variables
```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_STORAGE_BUCKET_NAME=...
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=...
EMAIL_HOST_PASSWORD=...
```

## FastMCP Server Deployment

### Running MCP Server
```bash
python mcp_server.py
```

### Using with Supervisor
Create `/etc/supervisor/conf.d/mcp.conf`:
```ini
[program:mcp]
command=/app/venv/bin/python /app/medcor_backend2/mcp_server.py
directory=/app/medcor_backend2
user=ubuntu
autostart=true
autorestart=true
stderr_logfile=/var/log/mcp.err.log
stdout_logfile=/var/log/mcp.out.log
```

## SSL/TLS Setup

### Using Certbot
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Monitoring

### Health Check Endpoint
Create a health check view:
```python
# core/views.py
@api_view(['GET'])
def health_check(request):
    return Response({
        'status': 'healthy',
        'timestamp': timezone.now()
    })
```

### Using New Relic
```bash
pip install newrelic
newrelic-admin generate-config YOUR_LICENSE_KEY newrelic.ini
NEW_RELIC_CONFIG_FILE=newrelic.ini newrelic-admin run-program gunicorn medcor_backend2.wsgi
```

## Backup Strategy

### Database Backup
```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240101.sql
```

### Automated Backups
Add to crontab:
```cron
0 2 * * * pg_dump $DATABASE_URL > /backups/db_$(date +\%Y\%m\%d).sql
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check network connectivity

2. **Static Files Not Loading**
   - Run `python manage.py collectstatic`
   - Check STATIC_ROOT setting
   - Verify Nginx configuration

3. **CORS Errors**
   - Update CORS_ALLOWED_ORIGINS
   - Check middleware order

4. **Migration Issues**
   - Run `python manage.py makemigrations`
   - Check for model conflicts
   - Use `--fake` flag carefully

## Security Checklist

- [ ] Change SECRET_KEY in production
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Use HTTPS in production
- [ ] Enable CSRF protection
- [ ] Set secure cookie flags
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Monitoring enabled

## Support

For issues or questions:
- Check logs: `journalctl -u medcor`
- Database logs: `tail -f /var/log/postgresql/*.log`
- Application logs: `tail -f /app/logs/*.log`