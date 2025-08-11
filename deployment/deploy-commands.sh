#!/bin/bash

# Medcor Deployment Commands - Run these from your local machine

echo "📦 Medcor Hospital Deployment Commands"
echo "======================================"
echo ""

# Step 1: Set permissions for PEM file
echo "Step 1: Set PEM file permissions"
echo "---------------------------------"
echo "chmod 400 deployment/medcor-ec2.pem"
echo ""

# Step 2: Package the application
echo "Step 2: Package the application"
echo "--------------------------------"
echo "tar -czf medcor-deploy.tar.gz \\"
echo "  client/ server/ shared/ medcor_backend/ \\"
echo "  package.json package-lock.json pyproject.toml \\"
echo "  tsconfig.json vite.config.ts tailwind.config.ts \\"
echo "  drizzle.config.ts postcss.config.js components.json \\"
echo "  deployment/medcor-custom-deploy.sh deployment/requirements.txt"
echo ""

# Step 3: Transfer files to EC2
echo "Step 3: Transfer files to EC2"
echo "------------------------------"
echo "scp -i deployment/medcor-ec2.pem medcor-deploy.tar.gz ubuntu@ec2-51-16-221-91.il-central-1.compute.amazonaws.com:/home/ubuntu/"
echo ""
echo "scp -i deployment/medcor-ec2.pem deployment/medcor-custom-deploy.sh ubuntu@ec2-51-16-221-91.il-central-1.compute.amazonaws.com:/home/ubuntu/"
echo ""

# Step 4: SSH into EC2
echo "Step 4: Connect to EC2 and deploy"
echo "----------------------------------"
echo "ssh -i deployment/medcor-ec2.pem ubuntu@ec2-51-16-221-91.il-central-1.compute.amazonaws.com"
echo ""
echo "# Once connected, run:"
echo "chmod +x medcor-custom-deploy.sh"
echo "./medcor-custom-deploy.sh"
echo ""

# Step 5: Add API Keys after deployment
echo "Step 5: After deployment, add API keys"
echo "---------------------------------------"
echo "# SSH into server and edit .env file:"
echo "ssh -i deployment/medcor-ec2.pem ubuntu@ec2-51-16-221-91.il-central-1.compute.amazonaws.com"
echo "nano /var/www/medcor/.env"
echo ""
echo "# Add these API keys from your secrets:"
echo "OPENAI_API_KEY=your-key"
echo "HEYGEN_API_KEY=your-key"
echo "STRIPE_SECRET_KEY=your-key"
echo "SENDGRID_API_KEY=your-key"
echo "# (Use all your stored secrets except GITHUB_TOKEN)"
echo ""
echo "# Then restart backend:"
echo "sudo systemctl restart medcor-backend"
echo ""

# Step 6: Create Django superuser
echo "Step 6: Create Django admin user"
echo "---------------------------------"
echo "cd /var/www/medcor && source venv/bin/activate"
echo "DJANGO_SETTINGS_MODULE=medcor_backend.settings_production python medcor_backend/manage.py createsuperuser"
echo ""

# Step 7: Test URLs
echo "Step 7: Test the deployment"
echo "----------------------------"
echo "# Frontend:"
echo "curl http://ec2-51-16-221-91.il-central-1.compute.amazonaws.com:8081"
echo ""
echo "# Backend API:"
echo "curl http://ec2-51-16-221-91.il-central-1.compute.amazonaws.com:8001/api/"
echo ""
echo "# Admin Panel:"
echo "http://ec2-51-16-221-91.il-central-1.compute.amazonaws.com:8001/admin/"
echo ""

echo "======================================"
echo "🚀 Ready to deploy! Copy and run the commands above."