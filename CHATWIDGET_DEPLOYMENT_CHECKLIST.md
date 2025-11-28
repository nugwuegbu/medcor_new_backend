# ChatWidget AWS Deployment Checklist

## Pre-Deployment

- [ ] Backup current database
- [ ] Ensure AWS server is accessible via SSH
- [ ] Verify git repository is up to date
- [ ] Check that all required files are present

## Files to Transfer

- [ ] `chatwidget/` directory (entire app)
- [ ] `medcor_backend2/settings.py` (updated with chatwidget)
- [ ] `medcor_backend2/urls.py` (updated with chatwidget URLs)
- [ ] `deploy_chatwidget_to_aws.sh` (deployment script)

## Deployment Steps

- [ ] SSH into AWS server
- [ ] Navigate to application directory
- [ ] Run deployment script or manual steps
- [ ] Verify migrations completed successfully
- [ ] Check services are running
- [ ] Test API endpoints

## Post-Deployment Verification

- [ ] Service status: `sudo systemctl status medcor`
- [ ] API schema: `curl http://localhost:8000/api/schema/ | grep user_message_background`
- [ ] ChatWidget endpoints: `curl http://localhost:8000/api/chatwidget/`
- [ ] Database tables created
- [ ] No errors in logs

## Quick Commands

### Transfer Files

```bash
scp -r chatwidget/ ubuntu@your-server:/home/ubuntu/medcor_backend2/
scp medcor_backend2/settings.py ubuntu@your-server:/home/ubuntu/medcor_backend2/medcor_backend2/
scp medcor_backend2/urls.py ubuntu@your-server:/home/ubuntu/medcor_backend2/medcor_backend2/
scp deploy_chatwidget_to_aws.sh ubuntu@your-server:/home/ubuntu/
```

### Deploy

```bash
ssh ubuntu@your-server
chmod +x deploy_chatwidget_to_aws.sh
./deploy_chatwidget_to_aws.sh
```

### Verify

```bash
sudo systemctl status medcor
curl http://localhost:8000/api/chatwidget/
```





















