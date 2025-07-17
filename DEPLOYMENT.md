# MedCor.ai Deployment Guide

## Overview
This document outlines the deployment process for MedCor.ai, which consists of a separated frontend and backend architecture ready for AWS deployment with CI/CD pipelines.

## Architecture

### Frontend (React + Vite)
- **Technology**: React 18, TypeScript, Vite
- **Deployment**: AWS S3 + CloudFront
- **Build**: Static files optimized for production
- **API Communication**: REST API calls to backend

### Backend (Django + PostgreSQL)
- **Technology**: Python 3.11, Django 4.2, PostgreSQL
- **Deployment**: AWS ECS Fargate + RDS
- **API**: Django REST Framework with JWT authentication
- **Database**: PostgreSQL with migrations

## Environment Variables

### Backend (.env)
```bash
# Django Configuration
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=api.medcor.ai,localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/medcor_db

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_LIFETIME=86400

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://medcor.ai,https://www.medcor.ai
CORS_ALLOW_CREDENTIALS=True

# External API Keys
OPENAI_API_KEY=sk-your-openai-key
HEYGEN_API_KEY=your-heygen-key
YOUCAM_API_KEY=your-youcam-key
YOUCAM_SECRET_KEY=your-youcam-secret
AZURE_FACE_API_KEY=your-azure-face-key
AZURE_FACE_ENDPOINT=your-azure-endpoint
ELEVENLABS_API_KEY=your-elevenlabs-key
WEATHER_API_KEY=your-weather-key

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=medcor-backend-assets
```

### Frontend (.env)
```bash
# API Configuration
VITE_API_BASE_URL=https://api.medcor.ai
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_DEBUG_MODE=false

# AWS Configuration
VITE_AWS_REGION=us-east-1
VITE_CDN_URL=https://cdn.medcor.ai
```

## AWS Infrastructure Setup

### 1. Backend Infrastructure (ECS + RDS)

#### RDS Database
```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier medcor-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username medcor_admin \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-12345678 \
  --db-subnet-group-name medcor-subnet-group
```

#### ECR Repository
```bash
# Create ECR repository for backend
aws ecr create-repository \
  --repository-name medcor-backend \
  --region us-east-1
```

#### ECS Cluster
```bash
# Create ECS cluster
aws ecs create-cluster \
  --cluster-name medcor-cluster \
  --capacity-providers FARGATE \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1
```

### 2. Frontend Infrastructure (S3 + CloudFront)

#### S3 Bucket
```bash
# Create S3 bucket for frontend
aws s3 mb s3://medcor-frontend-prod --region us-east-1

# Configure bucket for website hosting
aws s3 website s3://medcor-frontend-prod \
  --index-document index.html \
  --error-document index.html
```

#### CloudFront Distribution
```bash
# Create CloudFront distribution (use AWS Console or CloudFormation)
# Point to S3 bucket origin
# Enable HTTPS redirect
# Configure custom domain (medcor.ai)
```

## CI/CD Pipeline Setup

### GitHub Secrets
Set up the following secrets in your GitHub repository:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# API Keys
OPENAI_API_KEY=sk-your-openai-key
HEYGEN_API_KEY=your-heygen-key
YOUCAM_API_KEY=your-youcam-key
YOUCAM_SECRET_KEY=your-youcam-secret
AZURE_FACE_API_KEY=your-azure-face-key
AZURE_FACE_ENDPOINT=your-azure-endpoint
ELEVENLABS_API_KEY=your-elevenlabs-key
WEATHER_API_KEY=your-weather-key

# Database
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/medcor_db

# Notifications
SLACK_WEBHOOK_URL=your-slack-webhook-url
```

### Repository Structure

#### Backend Repository (`medcor-backend`)
```
medcor-backend/
├── .github/workflows/
│   └── backend-deploy.yml
├── medcor_backend/
│   ├── core/
│   ├── authentication/
│   ├── api/
│   └── settings.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

#### Frontend Repository (`medcor-frontend`)
```
medcor-frontend/
├── .github/workflows/
│   └── frontend-deploy.yml
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── config/
│   │   │   └── api.ts
│   │   └── lib/
│   │       └── api-client.ts
│   └── ...
├── package.json
├── vite.config.ts
├── Dockerfile.frontend
├── nginx.frontend.conf
├── .env.example
└── README.md
```

## Deployment Steps

### Initial Setup

1. **Fork Repositories**
   ```bash
   # Create separate repositories
   git clone https://github.com/your-org/medcor-backend.git
   git clone https://github.com/your-org/medcor-frontend.git
   ```

2. **Backend Setup**
   ```bash
   cd medcor-backend
   
   # Copy backend files
   cp -r medcor_backend/ .
   cp requirements.txt .
   cp Dockerfile .
   cp .env.example .env
   
   # Configure environment variables
   vim .env
   
   # Test locally
   python manage.py migrate
   python manage.py seed_db
   python manage.py runserver
   ```

3. **Frontend Setup**
   ```bash
   cd medcor-frontend
   
   # Copy frontend files
   cp -r client/ .
   cp package.json .
   cp vite.config.ts .
   cp .env.example .env
   
   # Configure environment variables
   vim .env
   
   # Test locally
   npm install
   npm run dev
   ```

### Production Deployment

1. **Backend Deployment**
   ```bash
   # Push to main branch triggers deployment
   git push origin main
   
   # Monitor deployment
   aws ecs describe-services \
     --cluster medcor-cluster \
     --services medcor-backend-service
   ```

2. **Frontend Deployment**
   ```bash
   # Push to main branch triggers deployment
   git push origin main
   
   # Monitor deployment
   aws s3 ls s3://medcor-frontend-prod
   aws cloudfront list-invalidations \
     --distribution-id E1234567890ABC
   ```

## Monitoring and Maintenance

### Health Checks
- **Backend**: `/api/health/` endpoint
- **Frontend**: `/health` endpoint via nginx

### Database Maintenance
```bash
# Run migrations
python manage.py migrate

# Seed fresh data
python manage.py seed_db

# Database backup
pg_dump $DATABASE_URL > backup.sql
```

### Log Monitoring
- **Backend**: AWS CloudWatch logs from ECS
- **Frontend**: CloudFront access logs
- **Database**: RDS performance insights

### Security Updates
- Regular dependency updates via Dependabot
- Security scanning in CI/CD pipeline
- SSL certificate renewal (automated via AWS Certificate Manager)

## Cost Optimization

### Backend (ECS)
- Use t3.micro instances for development
- Scale to t3.small/medium for production
- Enable auto-scaling based on CPU/memory

### Frontend (S3 + CloudFront)
- Enable compression in CloudFront
- Use S3 intelligent tiering
- Optimize image assets

### Database (RDS)
- Use db.t3.micro for development
- Scale to db.t3.small for production
- Enable automated backups

## Rollback Procedures

### Backend Rollback
```bash
# Rollback to previous task definition
aws ecs update-service \
  --cluster medcor-cluster \
  --service medcor-backend-service \
  --task-definition medcor-backend-task:PREVIOUS_REVISION
```

### Frontend Rollback
```bash
# Rollback S3 deployment
aws s3 sync s3://medcor-frontend-prod-backup s3://medcor-frontend-prod

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

## Support and Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `CORS_ALLOWED_ORIGINS` in backend settings
   - Verify frontend API base URL

2. **Database Connection**
   - Verify RDS security groups
   - Check database credentials

3. **API Key Issues**
   - Verify all external API keys are set
   - Check API key permissions and quotas

4. **Build Failures**
   - Check GitHub Actions logs
   - Verify environment variables

### Support Contacts
- **DevOps**: devops@medcor.ai
- **Backend**: backend@medcor.ai
- **Frontend**: frontend@medcor.ai

## Testing

### Local Testing
```bash
# Backend tests
cd medcor-backend
python manage.py test

# Frontend tests (when implemented)
cd medcor-frontend
npm test
```

### Production Testing
- Health check endpoints
- E2E tests via Playwright
- API integration tests
- Load testing with k6

---

**Note**: This deployment guide assumes you have proper AWS credentials and permissions set up. Always test in a staging environment before deploying to production.