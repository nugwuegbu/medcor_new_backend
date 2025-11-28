# GitHub Actions CI/CD Deployment Guide

## Overview

This guide provides a comprehensive CI/CD pipeline for the MedCor Backend application using GitHub Actions. The pipeline automates testing, building, and deployment directly to your production server at `/var/www/html/medcor_backend2`.

### Architecture

- **Source Control**: GitHub (main branch)
- **CI/CD**: GitHub Actions
- **Containerization**: Docker
- **Deployment**: Direct deployment to production server
- **Database**: AWS RDS PostgreSQL
- **Load Balancer**: Nginx
- **Task Queue**: Celery with RabbitMQ
- **MCP Server**: FastMCP for AI integration
- **Monitoring**: Health checks and automated rollback

## Quick Start

### 1. Repository Setup

1. **Push your code to GitHub**:

   ```bash
   git add .
   git commit -m "Add GitHub Actions CI/CD pipeline"
   git push origin main
   ```

2. **Configure GitHub Secrets** (see [Environment Setup](#environment-setup) section)

3. **Deploy automatically** by pushing to main branch

### 2. Manual Deployment

You can trigger deployments manually from the GitHub Actions tab:

1. Go to **Actions** → **Deploy to Production**
2. Click **Run workflow**
3. Select branch and click **Run workflow**

## Environment Setup

### Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click on **"Repository secrets"** tab
3. Click **"New repository secret"** for each secret below:

| Secret               | Description                   | Example                                  |
| -------------------- | ----------------------------- | ---------------------------------------- |
| `PRODUCTION_HOST`    | Production server IP/hostname | `123.456.789.012`                        |
| `PRODUCTION_USER`    | SSH username                  | `ubuntu`                                 |
| `PRODUCTION_SSH_KEY` | Private SSH key               | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PRODUCTION_PORT`    | SSH port (optional)           | `22`                                     |

### Production Server Requirements

Your server at `/var/www/html/medcor_backend2` should have:

- **Docker & Docker Compose**
- **Git**
- **SSH access configured**
- **User in docker group**

## Pipeline Workflow

### 1. Test Stage (on every push/PR)

- **Code checkout**
- **Python environment setup**
- **Dependency installation**
- **Linting** (flake8, black, isort)
- **Security checks** (bandit, safety)
- **Unit tests** with coverage
- **Database tests** with PostgreSQL service

### 2. Deploy Stage (main branch only)

- **Build Docker image**
- **Create backup** of current deployment
- **Stop current services**
- **Upload new code** to production server
- **Start services** with Docker Compose
- **Health check** validation
- **Automatic rollback** if deployment fails

### 3. Notify Stage

- **Deployment status** notification
- **Success/failure** reporting

## File Structure

```
.github/
├── workflows/
│   ├── deploy.yml          # Main deployment workflow
│   ├── test.yml            # Test suite workflow
│   └── environment-setup.md # Environment configuration guide
scripts/
└── github-deploy.sh        # Production deployment script
```

## Deployment Process

### Automatic Deployment

1. **Push to main branch** triggers the pipeline
2. **Tests run** in parallel with Docker services
3. **If tests pass**, deployment begins
4. **Backup created** before deployment
5. **Services stopped** gracefully
6. **New code uploaded** to production server
7. **Services started** with Docker Compose
8. **Health check** validates deployment
9. **Rollback** if health check fails

### Manual Deployment

```bash
# On production server
cd /var/www/html/medcor_backend2
./scripts/github-deploy.sh deploy
```

### Rollback

```bash
# Automatic rollback on deployment failure
./scripts/github-deploy.sh rollback

# Manual rollback
./scripts/github-deploy.sh rollback
```

## Monitoring and Logs

### GitHub Actions Logs

- Go to **Actions** tab in GitHub
- Click on workflow run
- View detailed logs for each step

### Production Server Logs

```bash
# Deployment logs
tail -f /var/log/medcor-deploy.log

# Service status
./scripts/github-deploy.sh status

# Health check
./scripts/github-deploy.sh health-check
```

### Docker Logs

```bash
cd /var/www/html/medcor_backend2
docker-compose logs -f web
docker-compose logs -f celery
docker-compose logs -f nginx
```

## Configuration Files

### GitHub Actions Workflow (`.github/workflows/deploy.yml`)

Key features:

- **Multi-stage pipeline** (test → build → deploy)
- **Docker services** for testing (PostgreSQL, RabbitMQ)
- **SSH deployment** to production server
- **Automatic rollback** on failure
- **Health checks** and monitoring

### Deployment Script (`scripts/github-deploy.sh`)

Features:

- **Backup creation** before deployment
- **Graceful service management**
- **Health check validation**
- **Automatic rollback** on failure
- **Logging and monitoring**
- **Cleanup of old resources**

## Security Features

### GitHub Secrets

- **SSH keys** stored securely
- **Environment variables** protected
- **No sensitive data** in repository

### Production Security

- **Backup strategy** with automatic cleanup
- **Rollback capability** for quick recovery
- **Health monitoring** for early issue detection
- **Docker isolation** for services

## Troubleshooting

### Common Issues

1. **SSH Connection Failed**

   ```bash
   # Test SSH connection
   ssh -i ~/.ssh/your-key your-user@your-host
   ```

2. **Docker Permission Denied**

   ```bash
   # Add user to docker group
   sudo usermod -aG docker $USER
   # Logout and login again
   ```

3. **Health Check Failed**

   ```bash
   # Check service status
   docker-compose ps
   # Check logs
   docker-compose logs
   ```

4. **Deployment Rollback**
   ```bash
   # Manual rollback
   ./scripts/github-deploy.sh rollback
   ```

### Debug Commands

```bash
# Check deployment status
./scripts/github-deploy.sh status

# Run health check
./scripts/github-deploy.sh health-check

# View recent logs
tail -n 100 /var/log/medcor-deploy.log

# Check Docker services
docker-compose ps
docker-compose logs --tail=50
```

## Backup and Recovery

### Automatic Backups

- **Created before each deployment**
- **Stored in** `/var/www/html/backups/`
- **Keeps last 5 backups**
- **Automatic cleanup** of old backups

### Manual Backup

```bash
# Create manual backup
./scripts/github-deploy.sh deploy
# This creates a backup before deployment
```

### Recovery Process

```bash
# Automatic rollback on failure
# Manual rollback
./scripts/github-deploy.sh rollback
```

## Performance Optimization

### Docker Optimization

- **Multi-stage builds** for smaller images
- **Layer caching** for faster builds
- **Health checks** for service monitoring
- **Resource limits** for containers

### Deployment Optimization

- **Parallel testing** with services
- **Incremental deployments** (only changed files)
- **Health check validation** before completion
- **Automatic cleanup** of old resources

## Best Practices

### Code Quality

- **Linting** on every commit
- **Security scanning** with bandit and safety
- **Test coverage** reporting
- **Code formatting** with black and isort

### Deployment Safety

- **Backup before deployment**
- **Health check validation**
- **Automatic rollback** on failure
- **Gradual rollout** with monitoring

### Monitoring

- **Comprehensive logging**
- **Health check endpoints**
- **Service status monitoring**
- **Deployment notifications**

## Migration from Jenkins

If migrating from Jenkins:

1. **Disable Jenkins jobs**
2. **Configure GitHub Secrets**
3. **Test deployment** with manual trigger
4. **Update documentation**
5. **Remove Jenkins files** (optional)

## Support and Maintenance

### Regular Tasks

- **Monitor deployment logs**
- **Update dependencies** regularly
- **Review security reports**
- **Clean up old backups**

### Emergency Procedures

- **Manual rollback** if needed
- **Service restart** if required
- **Database backup** before major changes
- **Contact support** for critical issues

---

## Quick Reference

### Essential Commands

```bash
# Deploy manually
./scripts/github-deploy.sh deploy

# Check status
./scripts/github-deploy.sh status

# Health check
./scripts/github-deploy.sh health-check

# Rollback
./scripts/github-deploy.sh rollback
```

### Important Files

- `.github/workflows/deploy.yml` - Main deployment workflow
- `scripts/github-deploy.sh` - Production deployment script
- `docker-compose.yml` - Service configuration
- `Dockerfile` - Application container definition

### Key Directories

- `/var/www/html/medcor_backend2/` - Production application
- `/var/www/html/backups/` - Deployment backups
- `/var/log/medcor-deploy.log` - Deployment logs
