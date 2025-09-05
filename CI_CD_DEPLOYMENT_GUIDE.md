# MedCor Backend CI/CD Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [GitHub Actions Setup](#github-actions-setup)
4. [Production Server Configuration](#production-server-configuration)
5. [Deployment Process](#deployment-process)
6. [Testing Strategy](#testing-strategy)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Troubleshooting](#troubleshooting)
9. [Security Considerations](#security-considerations)

## Overview

This guide provides a comprehensive CI/CD pipeline for the MedCor Backend application using GitHub Actions. The pipeline automates the entire process from code commit to production deployment directly to your server at `/var/www/html/medcor_backend2`.

### Architecture

- **Source Control**: GitHub (main branch)
- **CI/CD**: GitHub Actions
- **Containerization**: Docker
- **Deployment**: Direct deployment to production server
- **Database**: AWS RDS PostgreSQL (medcore.czouassyu7f2.il-central-1.rds.amazonaws.com)
- **Load Balancer**: Nginx
- **Task Queue**: Celery with RabbitMQ message broker
- **MCP Server**: FastMCP for AI integration
- **Monitoring**: Health checks and automated rollback

## Prerequisites

### Local Development Environment

- Docker and Docker Compose
- Python 3.11+
- Git
- GitHub account with repository access

### Production Server Requirements

- Ubuntu 24.04 (or compatible Linux distribution)
- Docker and Docker Compose installed
- SSH access configured
- User with docker group permissions
- Directory: `/var/www/html/medcor_backend2`

### Required Environment Variables

```bash
# Database Configuration (PostgreSQL)
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=medcor_db2
DATABASE_USER=postgres
DATABASE_PASS=3765R7vmFQwF6ddlNyWa
DATABASE_HOST=medcore.czouassyu7f2.il-central-1.rds.amazonaws.com
DATABASE_PORT=5432

# Application
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,your-server-ip

# Celery
CELERY_BROKER_URL=amqp://guest:guest@localhost:5672//
CELERY_RESULT_BACKEND=rpc://

# CORS
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com

# Email (if using email features)
GMAIL_APP_PASSWORD=your-gmail-app-password
```

## GitHub Actions Setup

### 1. Repository Configuration

1. **Navigate to your GitHub repository**
2. **Go to Settings → Secrets and variables → Actions**
3. **Click on "Repository secrets" tab**
4. **Click "New repository secret"**
5. **Add the following secrets:**

| Secret Name          | Description                                      | Example Value                            |
| -------------------- | ------------------------------------------------ | ---------------------------------------- |
| `PRODUCTION_HOST`    | IP address or hostname of your production server | `123.456.789.012` or `your-server.com`   |
| `PRODUCTION_USER`    | Username for SSH access to production server     | `ubuntu` or `ec2-user`                   |
| `PRODUCTION_SSH_KEY` | Private SSH key for server access                | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PRODUCTION_PORT`    | SSH port (optional, defaults to 22)              | `22`                                     |

### 2. SSH Key Setup

You have several options for SSH key setup. Choose the method that best fits your situation:

#### Option A: Using Existing AWS EC2 .pem File (Recommended)

If you already have a `.pem` file from AWS EC2:

```bash
# 1. Convert .pem file to OpenSSH format (if needed)
ssh-keygen -p -m PEM -f your-key.pem

# 2. Copy the .pem file content to GitHub Secrets
cat your-key.pem

# 3. Test SSH connection
ssh -i your-key.pem your-username@your-server-ip
```

**Steps to get the .pem file content:**

1. **Download from AWS Console:**

   - Go to AWS EC2 Console
   - Navigate to Key Pairs
   - Download your existing key pair (.pem file)

2. **Or use AWS CLI:**

   ```bash
   # List existing key pairs
   aws ec2 describe-key-pairs

   # Download key pair (if you have the name)
   aws ec2 describe-key-pairs --key-names your-key-name
   ```

#### Option B: Generate New SSH Key Pair

If you don't have an existing key or want to create a new one:

```bash
# 1. Generate a new SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions@medcor-backend" -f ~/.ssh/github_actions_key

# 2. Copy the public key to your production server
ssh-copy-id -i ~/.ssh/github_actions_key.pub your-username@your-server-ip

# 3. Copy the private key content to GitHub Secrets
cat ~/.ssh/github_actions_key
```

#### Option C: Using AWS EC2 Instance Connect

If your EC2 instance supports EC2 Instance Connect:

```bash
# 1. Generate key pair through AWS
aws ec2 create-key-pair --key-name github-actions-key --query 'KeyMaterial' --output text > github-actions-key.pem

# 2. Set proper permissions
chmod 400 github-actions-key.pem

# 3. Copy the .pem file content to GitHub Secrets
cat github-actions-key.pem
```

### 3. Detailed SSH Key Setup Steps

#### Step 1: Locate or Create Your SSH Key

**If you have an existing .pem file:**

```bash
# Check if you have .pem files
ls -la ~/.ssh/*.pem
ls -la ~/Downloads/*.pem

# If found, use it directly
cp your-existing-key.pem ~/.ssh/github_actions_key.pem
chmod 400 ~/.ssh/github_actions_key.pem
```

**If you need to create a new key:**

```bash
# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Generate new key pair
ssh-keygen -t rsa -b 4096 -C "github-actions@medcor-backend" -f ~/.ssh/github_actions_key

# Set proper permissions
chmod 600 ~/.ssh/github_actions_key
chmod 644 ~/.ssh/github_actions_key.pub
```

#### Step 2: Add Public Key to Production Server

```bash
# Method 1: Using ssh-copy-id (if available)
ssh-copy-id -i ~/.ssh/github_actions_key.pub your-username@your-server-ip

# Method 2: Manual copy
# First, copy the public key content
cat ~/.ssh/github_actions_key.pub

# Then SSH to your server and add it to authorized_keys
ssh your-username@your-server-ip
mkdir -p ~/.ssh
echo "your-public-key-content" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
exit
```

#### Step 3: Test SSH Connection

```bash
# Test the connection
ssh -i ~/.ssh/github_actions_key your-username@your-server-ip

# If using .pem file
ssh -i your-key.pem your-username@your-server-ip
```

#### Step 4: Get Private Key Content for GitHub Secrets

```bash
# For OpenSSH format key
cat ~/.ssh/github_actions_key

# For .pem file
cat your-key.pem

# The output should look like:
# -----BEGIN OPENSSH PRIVATE KEY-----
# b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABFwAAAAdzc2gtcn...
# ... (many lines of base64 encoded content) ...
# -----END OPENSSH PRIVATE KEY-----
```

#### Step 5: Add to GitHub Repository Secrets

1. **Go to your GitHub repository**
2. **Click Settings → Secrets and variables → Actions**
3. **Click "Repository secrets" tab**
4. **Click "New repository secret"**
5. **Name**: `PRODUCTION_SSH_KEY`
6. **Value**: Paste the entire private key content (including `-----BEGIN` and `-----END` lines)
7. **Click "Add secret"**

### 4. Troubleshooting SSH Key Issues

#### Common Issues and Solutions:

**Issue 1: Permission denied (publickey)**

```bash
# Check if the key exists and has correct permissions
ls -la ~/.ssh/github_actions_key
chmod 600 ~/.ssh/github_actions_key

# Verify the public key is on the server
ssh your-username@your-server-ip "cat ~/.ssh/authorized_keys"
```

**Issue 2: Key format not supported**

```bash
# Convert .pem to OpenSSH format
ssh-keygen -p -m PEM -f your-key.pem

# Or convert OpenSSH to .pem format
ssh-keygen -p -m PEM -f ~/.ssh/github_actions_key
```

**Issue 3: SSH connection timeout**

```bash
# Check if SSH service is running on the server
ssh your-username@your-server-ip "sudo systemctl status ssh"

# Check security group settings (AWS)
# Ensure port 22 is open in your EC2 security group
```

**Issue 4: Wrong username**

```bash
# Common usernames for different OS:
# Ubuntu: ubuntu
# Amazon Linux: ec2-user
# CentOS: centos
# Debian: admin

# Test with different usernames
ssh -i ~/.ssh/github_actions_key ubuntu@your-server-ip
ssh -i ~/.ssh/github_actions_key ec2-user@your-server-ip
```

### 3. Workflow Files

The following workflow files are automatically created in your repository:

- `.github/workflows/deploy.yml` - Main deployment workflow
- `.github/workflows/test.yml` - Test suite workflow
- `.github/workflows/security-scan.yml` - Security scanning workflow
- `.github/dependabot.yml` - Automated dependency updates

## Production Server Configuration

### 1. Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose git curl

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again to apply group changes
```

### 2. Create Directory Structure

```bash
# Create project directory
sudo mkdir -p /var/www/html/medcor_backend2
sudo mkdir -p /var/www/html/backups
sudo mkdir -p /var/log

# Set proper permissions
sudo chown -R $USER:$USER /var/www/html/medcor_backend2
sudo chown -R $USER:$USER /var/www/html/backups
```

### 3. Environment Configuration

```bash
# Copy environment file to production server
scp env.prod your-username@your-server-ip:/var/www/html/medcor_backend2/.env

# Or create it manually
cd /var/www/html/medcor_backend2
nano .env
```

### 4. Test Server Setup

```bash
# Test Docker installation
docker --version
docker-compose --version

# Test SSH access from GitHub Actions
# (This will be tested when you push to main branch)
```

## Deployment Process

### Automatic Deployment

The deployment process is fully automated and triggers on every push to the main branch:

1. **Code Push** → Triggers GitHub Actions workflow
2. **Testing Phase** → Runs comprehensive tests
3. **Build Phase** → Builds Docker image
4. **Deploy Phase** → Deploys to production server
5. **Health Check** → Validates deployment success
6. **Notification** → Reports deployment status

### Manual Deployment

####deployment key added

You can also trigger deployments manually:

1. **Go to Actions tab** in your GitHub repository
2. **Select "Deploy to Production"** workflow
3. **Click "Run workflow"**
4. **Select branch and click "Run workflow"**

### Deployment Script

The deployment is handled by `scripts/github-deploy.sh` which:

- Creates timestamped backups before deployment
- Stops current services gracefully
- Uploads new code to production server
- Starts services with Docker Compose
- Performs health checks
- Automatically rolls back if deployment fails

## Testing Strategy

### Automated Testing

The GitHub Actions pipeline includes comprehensive testing:

#### 1. Code Quality Tests

- **Linting**: flake8, black, isort
- **Security Scanning**: bandit, safety, semgrep
- **Code Formatting**: Automated formatting checks

#### 2. Unit Tests

- **Django Tests**: All application tests
- **Database Tests**: With PostgreSQL service
- **Coverage Reports**: Test coverage analysis

#### 3. Integration Tests

- **API Tests**: REST API endpoints
- **Database Integration**: RDS PostgreSQL
- **Message Queue**: RabbitMQ integration

#### 4. Security Tests

- **Vulnerability Scanning**: Weekly security scans
- **Dependency Updates**: Automated via Dependabot
- **Security Reports**: PR comments with findings

### Test Configuration

Tests run in isolated Docker containers with:

- PostgreSQL database service
- RabbitMQ message broker
- Python 3.11 environment
- All required dependencies

## Monitoring and Logging

### GitHub Actions Monitoring

- **Workflow Status**: View in Actions tab
- **Build Logs**: Detailed logs for each step
- **Test Results**: Comprehensive test reporting
- **Security Reports**: Automated security scanning

### Production Server Monitoring

#### Deployment Logs

```bash
# View deployment logs
tail -f /var/log/medcor-deploy.log

# Check recent deployments
ls -la /var/www/html/backups/
```

#### Service Status

```bash
# Check service status
cd /var/www/html/medcor_backend2
./scripts/github-deploy.sh status

# Health check
./scripts/github-deploy.sh health-check
```

#### Docker Logs

```bash
# View application logs
docker-compose logs -f web

# View Celery logs
docker-compose logs -f celery

# View Nginx logs
docker-compose logs -f nginx
```

### Health Checks

The system includes multiple health check layers:

1. **Application Health**: `/api/health/` endpoint
2. **Service Health**: Docker container health checks
3. **Database Health**: PostgreSQL connection validation
4. **Message Queue Health**: RabbitMQ connectivity

## Troubleshooting

### Common Issues

#### 1. SSH Connection Failed

```bash
# Test SSH connection manually
ssh -i ~/.ssh/your-key your-user@your-host

# Verify GitHub Secrets are correct
# Check PRODUCTION_HOST, PRODUCTION_USER, PRODUCTION_SSH_KEY
```

#### 2. Docker Permission Denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again
# Or restart the session
```

#### 3. Health Check Failed

```bash
# Check service status
docker-compose ps

# Check application logs
docker-compose logs web

# Check if all services are running
docker-compose logs
```

#### 4. Deployment Rollback

```bash
# Manual rollback
cd /var/www/html/medcor_backend2
./scripts/github-deploy.sh rollback

# Check available backups
ls -la /var/www/html/backups/
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

# Check disk space
df -h

# Check memory usage
free -h
```

## Security Considerations

### GitHub Security

- **Secrets Management**: All sensitive data stored in GitHub Secrets
- **SSH Key Security**: Private keys never committed to repository
- **Access Control**: Repository access limited to authorized users
- **Branch Protection**: Main branch protected with required status checks

### Production Security

- **Backup Strategy**: Automatic backups before each deployment
- **Rollback Capability**: Quick recovery from failed deployments
- **Health Monitoring**: Continuous health check validation
- **Docker Isolation**: Services run in isolated containers
- **Log Monitoring**: Comprehensive logging for security auditing

### Security Scanning

- **Automated Scans**: Weekly security vulnerability scanning
- **Dependency Updates**: Automated security updates via Dependabot
- **Code Analysis**: Static analysis with bandit and semgrep
- **PR Security Reviews**: Security findings posted as PR comments

## Backup and Recovery

### Automatic Backups

- **Pre-deployment Backups**: Created before each deployment
- **Backup Location**: `/var/www/html/backups/`
- **Retention Policy**: Keeps last 5 backups
- **Automatic Cleanup**: Old backups removed automatically

### Manual Backup

```bash
# Create manual backup
cd /var/www/html/medcor_backend2
./scripts/github-deploy.sh deploy
# This creates a backup before deployment
```

### Recovery Process

```bash
# Automatic rollback on deployment failure
# Manual rollback
./scripts/github-deploy.sh rollback

# Restore from specific backup
sudo cp -r /var/www/html/backups/medcor_backend2_backup_YYYYMMDD_HHMMSS /var/www/html/medcor_backend2
```

## Performance Optimization

### Docker Optimization

- **Multi-stage Builds**: Optimized Docker images
- **Layer Caching**: Faster build times
- **Health Checks**: Service monitoring
- **Resource Limits**: Container resource management

### Deployment Optimization

- **Parallel Testing**: Tests run in parallel
- **Incremental Deployments**: Only changed files uploaded
- **Health Check Validation**: Quick deployment validation
- **Automatic Cleanup**: Old resources cleaned up

## Best Practices

### Code Quality

- **Linting**: Automated code quality checks
- **Security Scanning**: Regular vulnerability assessments
- **Test Coverage**: Comprehensive test coverage
- **Code Formatting**: Consistent code style

### Deployment Safety

- **Backup Before Deploy**: Always backup before deployment
- **Health Check Validation**: Verify deployment success
- **Automatic Rollback**: Quick recovery from failures
- **Gradual Rollout**: Monitor deployment progress

### Monitoring

- **Comprehensive Logging**: Detailed logs for debugging
- **Health Check Endpoints**: Service health monitoring
- **Deployment Notifications**: Status updates
- **Performance Metrics**: Resource usage monitoring

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

### GitHub Actions Workflows

- **Deploy to Production** - Main deployment workflow
- **Test Suite** - Comprehensive testing
- **Security Scan** - Security vulnerability scanning
- **Dependabot** - Automated dependency updates

---

## Getting Started

1. **Configure GitHub Secrets** (see [GitHub Actions Setup](#github-actions-setup))
2. **Set up Production Server** (see [Production Server Configuration](#production-server-configuration))
3. **Push to Main Branch** - Triggers automatic deployment
4. **Monitor Deployment** - Check Actions tab and server logs
5. **Verify Health** - Ensure all services are running correctly

For detailed setup instructions, see the [GitHub Actions Environment Setup Guide](.github/workflows/environment-setup.md).
