# 🚀 Quick Deployment Checklist for Medcor Hospital

## What You Need to Provide

### 1. **AWS EC2 Access** ✅
```
- Your .pem file (e.g., medcor-key.pem)
- EC2 username (usually 'ubuntu' for Ubuntu instances)
- EC2 public IP address
```

### 2. **Database Credentials** 🗄️
```
DATABASE_URL=postgresql://[username]:[password]@[host]:[port]/[database_name]

Example:
- Host: medcor-db.cluster-xyz.us-east-1.rds.amazonaws.com
- Port: 5432
- Database Name: medcor_production
- Username: medcor_admin
- Password: [secure_password]
```

### 3. **API Keys** 🔑
```
- OPENAI_API_KEY (for AI chat features)
- HEYGEN_API_KEY (for avatar integration)
- STRIPE_SECRET_KEY (if using payments)
- SENDGRID_API_KEY (for email notifications)
```

### 4. **Domain Information** 🌐
```
- Your domain name (e.g., medcor.yourdomain.com)
- SSL certificate (or we'll set up Let's Encrypt)
```

## Deployment Steps Overview

### Step 1: Prepare Files
```bash
# On your local machine, create deployment package:
tar -czf medcor-deploy.tar.gz \
  client/ server/ shared/ medcor_backend/ \
  package.json package-lock.json \
  pyproject.toml tsconfig.json \
  vite.config.ts tailwind.config.ts \
  drizzle.config.ts postcss.config.js
```

### Step 2: Transfer Files
```bash
# Upload to EC2
scp -i your-key.pem medcor-deploy.tar.gz ubuntu@[EC2-IP]:/home/ubuntu/
```

### Step 3: Connect & Deploy
```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@[EC2-IP]

# Run deployment script
wget https://raw.githubusercontent.com/your-repo/deployment/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### Step 4: Configure Environment
Create `/var/www/medcor/.env` with your credentials:
```env
# Django Settings
DJANGO_SECRET_KEY=[generate-with: openssl rand -base64 32]
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=[EC2-IP],[your-domain]

# Database
DATABASE_URL=postgresql://[user]:[pass]@[host]:5432/[dbname]

# API Keys
OPENAI_API_KEY=[your-key]
HEYGEN_API_KEY=[your-key]

# URLs
FRONTEND_URL=https://[your-domain]
BACKEND_URL=https://[your-domain]/api
```

### Step 5: Create Admin User
```bash
cd /var/www/medcor
source venv/bin/activate
python medcor_backend/manage.py createsuperuser
```

## EC2 Instance Requirements

### Minimum Specifications:
- **Instance Type**: t2.medium (2 vCPU, 4GB RAM)
- **Storage**: 30GB EBS
- **OS**: Ubuntu 22.04 LTS

### Recommended Specifications:
- **Instance Type**: t3.large (2 vCPU, 8GB RAM)
- **Storage**: 50GB EBS with GP3
- **OS**: Ubuntu 22.04 LTS

### Security Group Settings:
| Type | Protocol | Port Range | Source |
|------|----------|------------|---------|
| SSH | TCP | 22 | Your IP |
| HTTP | TCP | 80 | 0.0.0.0/0 |
| HTTPS | TCP | 443 | 0.0.0.0/0 |

## Database Setup Options

### Option 1: AWS RDS PostgreSQL (Recommended)
- Engine: PostgreSQL 15
- Instance: db.t3.micro (for testing) or db.t3.medium (production)
- Storage: 20GB minimum
- Multi-AZ: Enable for production
- Backup: Automated backups with 7-day retention

### Option 2: PostgreSQL on EC2
- Install PostgreSQL locally (not recommended for production)
- Requires additional configuration and backup strategy

## Post-Deployment Tasks

### 1. Test Application
```bash
# Check services
sudo systemctl status medcor
sudo systemctl status nginx

# Test endpoints
curl http://[EC2-IP]/health
curl http://[EC2-IP]/api/health
```

### 2. Setup SSL (Required for Production)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### 3. Configure Monitoring
- Enable AWS CloudWatch
- Setup log aggregation
- Configure alerts for service failures

### 4. Setup Backups
```bash
# Database backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Media files backup
tar -czf media_backup_$(date +%Y%m%d).tar.gz /var/www/medcor/media/
```

## Verification Checklist

After deployment, verify:
- [ ] Homepage loads: `http://[EC2-IP]`
- [ ] API docs accessible: `http://[EC2-IP]/api/schema/swagger-ui/`
- [ ] Admin panel works: `http://[EC2-IP]/admin`
- [ ] Can create/login users
- [ ] AI chat features work
- [ ] Database connections stable
- [ ] Static files load correctly
- [ ] File uploads work

## Common Issues & Solutions

### Issue: 502 Bad Gateway
```bash
# Check Gunicorn
sudo systemctl status medcor
sudo journalctl -u medcor -n 50

# Restart services
sudo systemctl restart medcor
sudo systemctl restart nginx
```

### Issue: Static files not loading
```bash
cd /var/www/medcor
source venv/bin/activate
python medcor_backend/manage.py collectstatic --noinput
```

### Issue: Database connection failed
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check security group allows PostgreSQL port 5432
```

## Support Commands

### View Logs
```bash
# Application logs
sudo tail -f /var/log/medcor/gunicorn_error.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -f
```

### Restart Services
```bash
# Full restart
sudo systemctl restart medcor nginx

# Reload configuration
sudo systemctl reload nginx
```

### Update Application
```bash
cd /var/www/medcor
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
npm install && npm run build
python medcor_backend/manage.py migrate
python medcor_backend/manage.py collectstatic --noinput
sudo systemctl restart medcor
```

## Contact for Issues

When reporting issues, provide:
1. Error messages from logs
2. Browser console errors
3. Steps to reproduce
4. EC2 instance ID
5. Time when error occurred

---

**Ready to Deploy?** Follow the AWS_EC2_DEPLOYMENT_GUIDE.md for detailed step-by-step instructions.