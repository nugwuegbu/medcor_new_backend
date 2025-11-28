# GitHub Actions Environment Setup

This document explains how to configure the GitHub Actions CI/CD pipeline for the MedCor Backend project.

## Required GitHub Secrets

To enable automatic deployment, you need to configure the following secrets in your GitHub repository:

### 1. Go to Repository Settings

1. Navigate to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click on **Secrets and variables** → **Actions**
4. Click on **"Repository secrets"** tab
5. Click **"New repository secret"**

### 2. Add the Following Secrets

| Secret Name          | Description                                      | Example Value                            |
| -------------------- | ------------------------------------------------ | ---------------------------------------- |
| `PRODUCTION_HOST`    | IP address or hostname of your production server | `123.456.789.012` or `your-server.com`   |
| `PRODUCTION_USER`    | Username for SSH access to production server     | `ubuntu` or `ec2-user`                   |
| `PRODUCTION_SSH_KEY` | Private SSH key for server access                | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PRODUCTION_PORT`    | SSH port (optional, defaults to 22)              | `22`                                     |

### 3. SSH Key Setup Options

You have several options for SSH key setup. Choose the method that best fits your situation:

#### Option A: Using Existing AWS EC2 .pem File (Recommended)

If you already have a `.pem` file from AWS EC2:

```bash
# 1. Locate your .pem file
ls -la ~/.ssh/*.pem
ls -la ~/Downloads/*.pem

# 2. Copy the .pem file content to GitHub Secrets
cat your-key.pem

# 3. Test SSH connection
ssh -i your-key.pem your-username@your-server-ip
```

**To get your .pem file:**

1. **AWS Console Method:**

   - Go to AWS EC2 Console
   - Navigate to Key Pairs
   - Download your existing key pair (.pem file)

2. **AWS CLI Method:**

   ```bash
   # List existing key pairs
   aws ec2 describe-key-pairs

   # Create new key pair
   aws ec2 create-key-pair --key-name github-actions-key --query 'KeyMaterial' --output text > github-actions-key.pem
   chmod 400 github-actions-key.pem
   ```

#### Option B: Generate New SSH Key Pair

If you don't have an existing key:

```bash
# 1. Create .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 2. Generate new SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions@medcor-backend" -f ~/.ssh/github_actions_key

# 3. Set proper permissions
chmod 600 ~/.ssh/github_actions_key
chmod 644 ~/.ssh/github_actions_key.pub

# 4. Copy the public key to your production server
ssh-copy-id -i ~/.ssh/github_actions_key.pub your-username@your-server-ip

# 5. Copy the private key content to GitHub Secrets
cat ~/.ssh/github_actions_key
```

### 4. Detailed SSH Key Setup Steps

#### Step 1: Add Public Key to Production Server

```bash
# Method 1: Using ssh-copy-id (recommended)
ssh-copy-id -i ~/.ssh/github_actions_key.pub your-username@your-server-ip

# Method 2: Manual copy
# First, get the public key content
cat ~/.ssh/github_actions_key.pub

# Then SSH to your server and add it
ssh your-username@your-server-ip
mkdir -p ~/.ssh
echo "your-public-key-content" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
exit
```

#### Step 2: Test SSH Connection

```bash
# Test with OpenSSH key
ssh -i ~/.ssh/github_actions_key your-username@your-server-ip

# Test with .pem file
ssh -i your-key.pem your-username@your-server-ip
```

#### Step 3: Get Private Key Content

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

#### Step 4: Common Usernames by OS

- **Ubuntu**: `ubuntu`
- **Amazon Linux**: `ec2-user`
- **CentOS**: `centos`
- **Debian**: `admin`

### 5. Troubleshooting SSH Issues

**Permission denied (publickey):**

```bash
# Check key permissions
ls -la ~/.ssh/github_actions_key
chmod 600 ~/.ssh/github_actions_key

# Verify public key is on server
ssh your-username@your-server-ip "cat ~/.ssh/authorized_keys"
```

**Key format issues:**

```bash
# Convert .pem to OpenSSH format
ssh-keygen -p -m PEM -f your-key.pem

# Convert OpenSSH to .pem format
ssh-keygen -p -m PEM -f ~/.ssh/github_actions_key
```

**Connection timeout:**

```bash
# Check SSH service
ssh your-username@your-server-ip "sudo systemctl status ssh"

# Check AWS Security Group - ensure port 22 is open
```

### 4. Production Server Requirements

Your production server should have:

- **Docker and Docker Compose** installed
- **Git** installed
- **SSH access** configured
- **User permissions** to run Docker commands
- **Directory structure**:
  ```
  /var/www/html/medcor_backend2/  # Your project directory
  /var/www/html/backups/          # Backup directory (will be created)
  /var/log/medcor-deploy.log      # Deployment logs
  ```

### 5. Server Setup Commands

Run these commands on your production server to prepare it:

```bash
# Install Docker and Docker Compose
sudo apt update
sudo apt install -y docker.io docker-compose git

# Add your user to docker group
sudo usermod -aG docker $USER

# Create necessary directories
sudo mkdir -p /var/www/html/medcor_backend2
sudo mkdir -p /var/www/html/backups
sudo mkdir -p /var/log

# Set proper permissions
sudo chown -R $USER:$USER /var/www/html/medcor_backend2
sudo chown -R $USER:$USER /var/www/html/backups

# Logout and login again to apply docker group changes
```

### 6. Environment File Setup

Make sure you have the appropriate environment file on your production server:

```bash
# Copy your production environment file
cp env.prod /var/www/html/medcor_backend2/.env

# Or create environment file with correct database configuration
cat > /var/www/html/medcor_backend2/.env << EOF
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
EOF
```

### 7. Testing the Setup

You can test the deployment script manually on your production server:

```bash
# Test the deployment script
cd /var/www/html/medcor_backend2
./scripts/github-deploy.sh status

# Test health check
./scripts/github-deploy.sh health-check
```

## Workflow Triggers

The GitHub Actions workflow will automatically trigger on:

- **Push to main branch**: Full deployment to production
- **Pull Request to main**: Run tests only (no deployment)

## Manual Deployment

You can also trigger deployments manually:

1. Go to **Actions** tab in your GitHub repository
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Select the branch and click **Run workflow**

## Monitoring and Troubleshooting

### View Deployment Logs

- GitHub Actions logs: Go to **Actions** tab → Click on the workflow run
- Server logs: Check `/var/log/medcor-deploy.log` on your production server

### Common Issues

1. **SSH Connection Failed**

   - Verify `PRODUCTION_HOST`, `PRODUCTION_USER`, and `PRODUCTION_SSH_KEY` secrets
   - Test SSH connection manually: `ssh -i ~/.ssh/your-key your-user@your-host`

2. **Docker Permission Denied**

   - Ensure user is in docker group: `sudo usermod -aG docker $USER`
   - Logout and login again

3. **Health Check Failed**

   - Check if all services are running: `docker-compose ps`
   - Check application logs: `docker-compose logs`

4. **Deployment Rollback**
   - The script automatically creates backups before deployment
   - Manual rollback: `./scripts/github-deploy.sh rollback`

## Security Considerations

- **SSH Key Security**: Keep your private SSH key secure and never commit it to the repository
- **Environment Variables**: Use GitHub Secrets for sensitive data
- **Server Access**: Limit SSH access to necessary users only
- **Firewall**: Configure firewall rules to allow only necessary ports

## Backup Strategy

The deployment script automatically:

- Creates timestamped backups before each deployment
- Keeps the last 5 backups
- Performs automatic rollback if deployment fails
- Cleans up old Docker images

Backup location: `/var/www/html/backups/medcor_backend2_backup_YYYYMMDD_HHMMSS`
