# AWS Security Group Configuration for Medcor

## Required Inbound Rules

You need to configure your EC2 instance's Security Group to allow traffic on the custom ports.

### Step 1: Access AWS Console
1. Go to AWS EC2 Console
2. Navigate to **Security Groups** in the left sidebar
3. Find the security group attached to your EC2 instance (ec2-51-16-221-91)

### Step 2: Add Inbound Rules

Click "Edit inbound rules" and add these rules:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|---------|-------------|
| SSH | TCP | 22 | Your IP | SSH Access |
| Custom TCP | TCP | 8081 | 0.0.0.0/0 | Medcor Frontend |
| Custom TCP | TCP | 8001 | 0.0.0.0/0 | Medcor Backend API |

### Step 3: Save Rules
Click "Save rules" to apply the changes.

## DNS Configuration for medcor.ai

### Add these DNS records to your domain:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 51.16.221.91 | 300 |
| A | www | 51.16.221.91 | 300 |
| A | * | 51.16.221.91 | 300 |

This will enable:
- `medcor.ai:8081` - Frontend
- `medcor.ai:8001` - Backend API
- `*.medcor.ai` - Multi-tenant subdomains

## Verification

After configuring, test access:
```bash
# Test Frontend
curl http://medcor.ai:8081

# Test Backend
curl http://medcor.ai:8001/health
```