# Git Push with GITHUB_TOKEN Authentication

## Commands to run in your terminal:

### Option 1: Direct push with token (Recommended)
```bash
# Replace YOUR_USERNAME and YOUR_REPO with your actual GitHub username and repository name
git add .
git commit -m "added deployment manual"
git push https://${GITHUB_TOKEN}@github.com/YOUR_USERNAME/YOUR_REPO.git main
```

### Option 2: Set remote URL with token
```bash
# First, set the remote URL with token
git remote set-url origin https://${GITHUB_TOKEN}@github.com/YOUR_USERNAME/YOUR_REPO.git

# Then push normally
git add .
git commit -m "added deployment manual"
git push -u origin main
```

### Option 3: Use token as password
```bash
git add .
git commit -m "added deployment manual"
git push origin main

# When prompted:
# Username: YOUR_GITHUB_USERNAME
# Password: paste your GITHUB_TOKEN here (not your GitHub password)
```

## Files that will be committed:
- `DEPLOY_NOW.sh` - One-click deployment script
- `AWS_SECURITY_GROUP_SETUP.md` - AWS configuration guide
- `DEPLOYMENT_STEPS.md` - Step-by-step deployment instructions
- `deployment/medcor-ec2.pem` - EC2 key file
- `medcor-deploy.tar.gz` - Application package

## Note:
Make sure to replace:
- `YOUR_USERNAME` with your GitHub username
- `YOUR_REPO` with your repository name
- The GITHUB_TOKEN environment variable should be available in your terminal session