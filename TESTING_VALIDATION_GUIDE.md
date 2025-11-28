# MedCor Backend Testing and Validation Guide

## Table of Contents

1. [Overview](#overview)
2. [Local Testing](#local-testing)
3. [Docker Testing](#docker-testing)
4. [CI/CD Pipeline Testing](#cicd-pipeline-testing)
5. [Deployment Validation](#deployment-validation)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)
8. [Troubleshooting](#troubleshooting)

## Overview

This guide provides comprehensive testing procedures for the MedCor Backend application, including local development, Docker containerization, CI/CD pipeline validation, and production deployment verification.

## Local Testing

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Virtual environment

### Setup

```bash
# Clone repository
git clone <repository-url>
cd medcor_backend2

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Set up database
createdb medcor_test_db
python manage.py migrate
python manage.py createsuperuser
```

### Unit Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test core
python manage.py test youcam

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html

# Run tests in parallel
python manage.py test --parallel
```

### Code Quality Tests

```bash
# Linting
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

# Code formatting
black --check .
isort --check-only .

# Security checks
bandit -r . -f json -o bandit-report.json
safety check --json --output safety-report.json
```

### Manual Testing

```bash
# Start development server
python manage.py runserver

# Test endpoints
curl http://localhost:8000/api/health/
curl http://localhost:8000/api/schema/swagger-ui/
curl http://localhost:8000/admin/
```

## Docker Testing

### Build and Test Docker Image

```bash
# Build image
docker build -t medcor-backend:test .

# Test image
docker run --rm -p 8000:8000 medcor-backend:test

# Test with environment variables
docker run --rm -p 8000:8000 \
  -e DEBUG=True \
  -e SECRET_KEY=test-key \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  medcor-backend:test
```

### Docker Compose Testing

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs web
docker-compose logs celery

# Run tests in container
docker-compose exec web python manage.py test

# Test health endpoints
curl http://localhost/api/health/
curl http://localhost/api/ready/
curl http://localhost/api/live/

# Stop services
docker-compose down
```

### Integration Testing

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Wait for services to be ready
sleep 30

# Run integration tests
docker-compose -f docker-compose.test.yml exec -T web python manage.py test --settings=medcor_backend2.test_settings

# Cleanup
docker-compose -f docker-compose.test.yml down
```

## CI/CD Pipeline Testing

### Jenkins Pipeline Testing

#### Local Jenkins Setup

```bash
# Install Jenkins locally (for testing)
docker run -d -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:lts

# Access Jenkins at http://localhost:8080
# Install required plugins:
# - Docker Pipeline
# - AWS Steps
# - GitHub Integration
```

#### Pipeline Validation

1. **Create Test Pipeline**:

   - Create new pipeline job
   - Use Jenkinsfile from repository
   - Configure with test credentials

2. **Test Pipeline Stages**:

   ```bash
   # Test checkout stage
   git checkout dev
   git add .
   git commit -m "Test: Pipeline validation"
   git push origin dev
   ```

3. **Monitor Pipeline Execution**:
   - Check Jenkins console output
   - Verify each stage completes successfully
   - Review test results and reports

### GitHub Actions Testing

#### Local Testing with Act

```bash
# Install act
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Test workflow locally
act -j test
act -j build-and-push
```

#### Repository Testing

1. **Create Test Branch**:

   ```bash
   git checkout -b test-pipeline
   git add .
   git commit -m "Test: GitHub Actions pipeline"
   git push origin test-pipeline
   ```

2. **Monitor Actions**:
   - Check GitHub Actions tab
   - Review workflow execution
   - Verify all jobs pass

## Deployment Validation

### Pre-Deployment Checklist

- [ ] All tests pass
- [ ] Docker image builds successfully
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates valid
- [ ] DNS records updated

### Development Deployment Testing

```bash
# Deploy to development
make deploy-dev

# Or manually
ssh ubuntu@api.medcor.ai 'cd /var/www/html/medcor_backend2 && sudo ./scripts/deploy.sh development'

# Validate deployment
python scripts/smoke_tests.py --environment=development --base-url=http://api.medcor.ai
```

### Production Deployment Testing

```bash
# Deploy to production (requires manual approval)
make deploy-prod

# Or manually
ssh ubuntu@api.medcor.ai 'cd /var/www/html/medcor_backend2 && sudo ./scripts/deploy.sh production'

# Validate deployment
python scripts/smoke_tests.py --environment=production --base-url=https://api.medcor.ai
```

### Post-Deployment Validation

```bash
# Health checks
curl -f https://api.medcor.ai/api/health/
curl -f https://api.medcor.ai/api/ready/
curl -f https://api.medcor.ai/api/live/

# API endpoints
curl -f https://api.medcor.ai/api/schema/swagger-ui/
curl -f https://api.medcor.ai/admin/

# Database connectivity
curl -f https://api.medcor.ai/api/specialties/

# YouCam endpoints
curl -f https://api.medcor.ai/api/youcam/
```

## Performance Testing

### Load Testing with Apache Bench

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test health endpoint
ab -n 1000 -c 10 http://localhost/api/health/

# Test API endpoints
ab -n 100 -c 5 http://localhost/api/specialties/

# Test with authentication
ab -n 100 -c 5 -H "Authorization: Bearer YOUR_TOKEN" http://localhost/api/youcam/
```

### Database Performance Testing

```bash
# Test database connection
python manage.py dbshell

# Run database queries
SELECT COUNT(*) FROM core_user;
SELECT COUNT(*) FROM youcam_youcamanalysis;

# Test database performance
python manage.py shell
>>> from django.db import connection
>>> from django.test.utils import override_settings
>>> with override_settings(DEBUG=True):
...     # Run your queries here
...     pass
```

### Memory and CPU Monitoring

```bash
# Monitor Docker containers
docker stats

# Monitor system resources
htop
free -h
df -h

# Monitor application logs
tail -f /var/log/medcor-deployment.log
docker-compose logs -f web
```

## Security Testing

### Vulnerability Scanning

```bash
# Scan Docker image
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image medcor-backend:latest

# Scan code for security issues
bandit -r . -f json -o bandit-report.json
safety check --json --output safety-report.json

# Check for known vulnerabilities
pip-audit
```

### Authentication Testing

```bash
# Test JWT authentication
curl -X POST http://localhost/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Test protected endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost/api/youcam/
```

### Network Security Testing

```bash
# Test SSL/TLS
openssl s_client -connect api.medcor.ai:443

# Test security headers
curl -I https://api.medcor.ai/api/health/

# Test CORS
curl -H "Origin: https://medcor.ai" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS https://api.medcor.ai/api/health/
```

## Troubleshooting

### Common Issues and Solutions

#### Docker Build Failures

```bash
# Check Dockerfile syntax
docker build --no-cache -t medcor-backend:test .

# Check build context
docker build --progress=plain -t medcor-backend:test .

# Debug build process
docker run --rm -it python:3.11-slim bash
```

#### Database Connection Issues

```bash
# Test database connectivity
docker-compose exec web python manage.py dbshell

# Check database logs
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d db
```

#### Application Startup Issues

```bash
# Check application logs
docker-compose logs web

# Test application manually
docker-compose exec web python manage.py runserver 0.0.0.0:8000

# Check environment variables
docker-compose exec web env
```

#### Health Check Failures

```bash
# Test health endpoint manually
curl -v http://localhost/api/health/

# Check service dependencies
docker-compose exec web python -c "import redis; r = redis.Redis.from_url('redis://redis:6379/0'); print(r.ping())"

# Check database connection
docker-compose exec web python manage.py shell -c "from django.db import connection; connection.ensure_connection()"
```

### Debug Commands

```bash
# Container debugging
docker-compose exec web bash
docker-compose exec db psql -U medcor_user medcor_db

# Log analysis
docker-compose logs --tail=100 web
grep -i error /var/log/medcor-deployment.log

# System monitoring
docker system df
docker system prune -f
```

### Performance Debugging

```bash
# Database query analysis
python manage.py shell
>>> from django.db import connection
>>> connection.queries

# Memory profiling
pip install memory-profiler
python -m memory_profiler manage.py runserver

# CPU profiling
pip install py-spy
py-spy top --pid $(pgrep -f "python manage.py runserver")
```

## Validation Checklist

### Pre-Deployment

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Code quality checks pass
- [ ] Security scans pass
- [ ] Docker image builds successfully
- [ ] Environment variables configured
- [ ] Database migrations tested

### Post-Deployment

- [ ] Health checks pass
- [ ] API endpoints accessible
- [ ] Database connectivity verified
- [ ] Static files served correctly
- [ ] SSL certificates valid
- [ ] Performance metrics acceptable
- [ ] Error logs clean
- [ ] Monitoring alerts configured

### Production Readiness

- [ ] Backup procedures tested
- [ ] Rollback procedures tested
- [ ] Monitoring and alerting configured
- [ ] Security measures implemented
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Team trained on procedures

## Continuous Improvement

### Metrics to Track

- Test coverage percentage
- Build success rate
- Deployment frequency
- Mean time to recovery (MTTR)
- Application performance metrics
- Security vulnerability count

### Regular Reviews

- Weekly pipeline performance review
- Monthly security assessment
- Quarterly architecture review
- Annual disaster recovery testing

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Maintained by**: MedCor Development Team
