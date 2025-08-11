# 🚀 Medcor Hospital Deployment - Step by Step

## Prerequisites Checklist
✅ AWS EC2 Instance: ec2-51-16-221-91.il-central-1.compute.amazonaws.com  
✅ Database: medcore.czouassyu7f2.il-central-1.rds.amazonaws.com  
✅ PEM File: Saved in deployment/medcor-ec2.pem  
✅ Deployment Package: medcor-deploy.tar.gz (3.6MB)  

## Step 1: Download Files from Replit

Download these files to your local machine:
1. `DEPLOY_NOW.sh` - Main deployment script
2. `deployment/medcor-ec2.pem` - Your PEM key
3. `medcor-deploy.tar.gz` - Application package

## Step 2: Open Terminal on Your Local Machine

```bash
# Navigate to the directory where you downloaded the files
cd ~/Downloads  # or wherever you saved the files

# Make scripts executable
chmod +x DEPLOY_NOW.sh
chmod 400 deployment/medcor-ec2.pem
```

## Step 3: Configure AWS Security Group

**IMPORTANT**: Before deploying, add these inbound rules to your EC2 Security Group:

1. Go to AWS EC2 Console → Security Groups
2. Find your instance's security group
3. Add inbound rules:
   - Port 8001 (TCP) from 0.0.0.0/0 - Backend API
   - Port 8081 (TCP) from 0.0.0.0/0 - Frontend

## Step 4: Run Deployment

Execute the deployment script:
```bash
./DEPLOY_NOW.sh
```

This will:
- Transfer files to EC2
- Install all dependencies
- Setup Python/Node.js environments
- Configure Nginx and Gunicorn
- Start services on ports 8001 and 8081
- Create admin user

## Step 5: Monitor Deployment

The script will show progress for each step:
```
✅ Step 1: Setting PEM file permissions...
✅ Step 2: Creating deployment package...
✅ Step 3: Transferring files to EC2...
✅ Step 4: Executing deployment on EC2...
✅ Step 5: Testing deployment...
```

## Step 6: Access Your Application

After successful deployment, access:

### Frontend
```
http://ec2-51-16-221-91.il-central-1.compute.amazonaws.com:8081
```

### Backend API
```
http://ec2-51-16-221-91.il-central-1.compute.amazonaws.com:8001/api/
```

### Django Admin
```
http://ec2-51-16-221-91.il-central-1.compute.amazonaws.com:8001/admin/
Username: admin
Password: MedcorAdmin2025!
```

## Step 7: Add API Keys (Post-Deployment)

SSH into the server to add your API keys:
```bash
ssh -i deployment/medcor-ec2.pem ubuntu@ec2-51-16-221-91.il-central-1.compute.amazonaws.com

# Edit environment file
nano /var/www/medcor/.env

# Add your API keys:
OPENAI_API_KEY=your-actual-key
ELEVENLABS_API_KEY=your-actual-key
HEYGEN_API_KEY=your-actual-key

# Save and restart
sudo systemctl restart medcor-backend
```

## Step 8: Configure DNS (Optional)

To use medcor.ai domain:
1. Add A record pointing to: 51.16.221.91
2. Update DNS settings for medcor.ai

## Troubleshooting

### If ports are not accessible:
```bash
# Check AWS Security Group has ports 8001 and 8081 open
# Check services are running:
ssh -i deployment/medcor-ec2.pem ubuntu@ec2-51-16-221-91.il-central-1.compute.amazonaws.com
sudo systemctl status medcor-backend
sudo systemctl status medcor-frontend
sudo systemctl status nginx
```

### View logs:
```bash
# Backend logs
sudo journalctl -u medcor-backend -f

# Frontend logs  
sudo journalctl -u medcor-frontend -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Restart services:
```bash
sudo systemctl restart medcor-backend medcor-frontend nginx
```

## Success Indicators

You'll know deployment is successful when:
- ✅ Frontend loads at port 8081
- ✅ Backend responds at port 8001/health
- ✅ Admin panel accessible at port 8001/admin
- ✅ Can login with admin credentials
- ✅ No errors in service logs

## Need Help?

If you encounter issues:
1. Check AWS Security Group rules
2. Verify database connectivity
3. Review service logs
4. Ensure all ports are open

---

**Ready to deploy? Start with Step 1 above!**