# Predictive Dialer Deployment Guide for CentOS 7 with Asterisk

## Prerequisites
- CentOS 7 server with Asterisk installed
- PHP 5.4 or higher
- MySQL/MariaDB database
- Apache or Nginx web server
- Root or sudo access

## Step 1: Configure Asterisk Manager Interface (AMI)

Edit your Asterisk manager.conf file:
```bash
sudo nano /etc/asterisk/manager.conf
```

Add or modify the following configuration:
```ini
[general]
enabled = yes
port = 5038
bindaddr = 127.0.0.1

[admin]
secret = your_secure_password_here
deny = 0.0.0.0/0.0.0.0
permit = 127.0.0.1/255.255.255.255
read = all
write = all
```

Reload Asterisk to apply changes:
```bash
sudo asterisk -rx "manager reload"
```

## Step 2: Install Required PHP Extensions

```bash
# Install PHP extensions if not already installed
sudo yum install -y php-mysql php-pdo php-mbstring php-xml php-json

# Restart Apache
sudo systemctl restart httpd
```

## Step 3: Setup MariaDB Database

```bash
# Install MariaDB if not installed
sudo yum install -y mariadb-server mariadb

# Start and enable MariaDB
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Secure MariaDB installation
sudo mysql_secure_installation

# Login to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE predictive_dialer;
CREATE USER 'dialer_user'@'localhost' IDENTIFIED BY 'your_db_password';
GRANT ALL PRIVILEGES ON predictive_dialer.* TO 'dialer_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import database schema
mysql -u dialer_user -p predictive_dialer < /var/www/html/asterisk-dialer/database.sql
```

## Step 4: Deploy Application Files

```bash
# Create directory for the application
sudo mkdir -p /var/www/html/asterisk-dialer

# Copy all files to the web directory
# If you're transferring files, use SCP or FTP to upload:
# - config.php
# - ami.class.php
# - api.php
# - database.sql
# - The HTML file (rename to index.html)

# Set proper permissions
sudo chown -R apache:apache /var/www/html/asterisk-dialer
sudo chmod -R 755 /var/www/html/asterisk-dialer

# Create uploads directory
sudo mkdir -p /var/www/html/asterisk-dialer/uploads
sudo chmod 775 /var/www/html/asterisk-dialer/uploads
```

## Step 5: Configure the Application

Edit the configuration file:
```bash
sudo nano /var/www/html/asterisk-dialer/config.php
```

Update the following settings:
```php
// AMI Configuration
define('AMI_USERNAME', 'admin');  // Your AMI username from manager.conf
define('AMI_PASSWORD', 'your_secure_password_here'); // Your AMI password

// Database Configuration
define('DB_USER', 'dialer_user');
define('DB_PASS', 'your_db_password');

// Update dial context based on your Asterisk setup
define('DIAL_CONTEXT', 'from-internal'); // Or your outbound context

// Set your caller ID
define('CALLER_ID', 'Your Company <your_phone_number>');
```

## Step 6: Configure Apache Virtual Host

Create a virtual host configuration:
```bash
sudo nano /etc/httpd/conf.d/asterisk-dialer.conf
```

Add the following:
```apache
<VirtualHost *:80>
    ServerName your-server-domain.com
    DocumentRoot /var/www/html/asterisk-dialer
    
    <Directory /var/www/html/asterisk-dialer>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog /var/log/httpd/dialer_error.log
    CustomLog /var/log/httpd/dialer_access.log combined
</VirtualHost>
```

Restart Apache:
```bash
sudo systemctl restart httpd
```

## Step 7: Configure Asterisk Dialplan

Edit your Asterisk extensions.conf:
```bash
sudo nano /etc/asterisk/extensions.conf
```

Add a context for predictive dialer:
```ini
[predictive-dialer]
exten => _X.,1,NoOp(Predictive Dialer Call to ${EXTEN})
 same => n,Set(CDR(userfield)=CONTACT_ID:${CONTACT_ID},CAMPAIGN_ID:${CAMPAIGN_ID})
 same => n,MixMonitor(/var/spool/asterisk/monitor/${UNIQUEID}.wav)
 same => n,Dial(SIP/${EXTEN}@your-trunk,30,tT)
 same => n,Hangup()

; Add to your outbound context
[from-internal]
include => predictive-dialer
```

Reload Asterisk dialplan:
```bash
sudo asterisk -rx "dialplan reload"
```

## Step 8: Configure SIP Trunk

Edit your SIP configuration:
```bash
sudo nano /etc/asterisk/sip.conf
```

Add or verify your trunk configuration:
```ini
[your-trunk]
type=peer
host=your.sip.provider.com
username=your_sip_username
secret=your_sip_password
fromuser=your_sip_username
fromdomain=your.sip.provider.com
context=from-trunk
insecure=port,invite
canreinvite=no
disallow=all
allow=ulaw
allow=alaw
```

## Step 9: Setup Call Recording Directory

```bash
# Create recording directory
sudo mkdir -p /var/spool/asterisk/monitor
sudo chown asterisk:asterisk /var/spool/asterisk/monitor
sudo chmod 755 /var/spool/asterisk/monitor
```

## Step 10: Configure Firewall

```bash
# Open required ports
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=5038/tcp  # AMI port (only if remote access needed)
sudo firewall-cmd --reload
```

## Step 11: Create Admin User

```bash
# Generate password hash for admin user
php -r "echo password_hash('your_admin_password', PASSWORD_DEFAULT);"

# Update the admin password in database
mysql -u dialer_user -p predictive_dialer
UPDATE users SET password='generated_hash_here' WHERE username='admin';
EXIT;
```

## Step 12: Update HTML Frontend

Edit the index.html file and update the API endpoint:
```javascript
// Find and replace the API URL in the JavaScript section
const API_URL = 'http://your-server-domain.com/asterisk-dialer/api.php';
```

## Step 13: Test the Installation

1. **Test AMI Connection:**
```bash
telnet localhost 5038
```
You should see: "Asterisk Call Manager/x.x"

2. **Test Database Connection:**
```bash
mysql -u dialer_user -p predictive_dialer -e "SHOW TABLES;"
```

3. **Test PHP Installation:**
Create a test file:
```bash
echo "<?php phpinfo(); ?>" | sudo tee /var/www/html/asterisk-dialer/info.php
```
Visit: http://your-server/asterisk-dialer/info.php
Delete after testing: `sudo rm /var/www/html/asterisk-dialer/info.php`

4. **Access the Application:**
Open your browser and navigate to:
```
http://your-server-domain.com/asterisk-dialer/
```

## Step 14: Configure Cron Jobs (Optional)

For automated calling campaigns:
```bash
sudo crontab -e
```

Add:
```cron
# Process scheduled calls every minute
* * * * * /usr/bin/php /var/www/html/asterisk-dialer/cron/process_scheduled_calls.php

# Clean old call records monthly
0 0 1 * * /usr/bin/php /var/www/html/asterisk-dialer/cron/cleanup.php
```

## Troubleshooting

### Common Issues and Solutions:

1. **AMI Connection Failed:**
   - Check manager.conf configuration
   - Verify Asterisk is running: `sudo systemctl status asterisk`
   - Check AMI port: `netstat -an | grep 5038`

2. **Database Connection Error:**
   - Verify MariaDB is running: `sudo systemctl status mariadb`
   - Check database credentials in config.php
   - Test connection: `mysql -u dialer_user -p`

3. **Calls Not Connecting:**
   - Verify trunk configuration in sip.conf
   - Check Asterisk CLI for errors: `sudo asterisk -rvvv`
   - Verify dialplan context

4. **Permission Errors:**
   - Fix ownership: `sudo chown -R apache:apache /var/www/html/asterisk-dialer`
   - Fix permissions: `sudo chmod -R 755 /var/www/html/asterisk-dialer`

5. **PHP Errors:**
   - Check PHP error log: `sudo tail -f /var/log/httpd/error_log`
   - Verify PHP version: `php -v`
   - Ensure all required extensions are installed

## Security Recommendations

1. **Use HTTPS:**
   - Install SSL certificate
   - Configure Apache for HTTPS

2. **Restrict AMI Access:**
   - Only allow localhost connections to AMI
   - Use strong passwords

3. **Database Security:**
   - Use strong database passwords
   - Restrict database user privileges

4. **Application Security:**
   - Implement authentication for web interface
   - Use prepared statements (already implemented)
   - Regular security updates

## Monitoring

Monitor the system:
```bash
# Watch Asterisk activity
sudo asterisk -rvvv

# Monitor Apache logs
sudo tail -f /var/log/httpd/dialer_access.log

# Monitor system resources
top

# Check active channels
sudo asterisk -rx "core show channels"
```

## Backup

Regular backup script:
```bash
#!/bin/bash
# Save as /usr/local/bin/backup_dialer.sh

BACKUP_DIR="/backup/dialer"
DATE=$(date +%Y%m%d)

# Backup database
mysqldump -u dialer_user -p predictive_dialer > $BACKUP_DIR/db_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/html/asterisk-dialer/

# Backup Asterisk config
tar -czf $BACKUP_DIR/asterisk_$DATE.tar.gz /etc/asterisk/

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

## Support

For issues or questions:
1. Check Asterisk logs: `/var/log/asterisk/`
2. Check Apache logs: `/var/log/httpd/`
3. Check application logs in the uploads directory
4. Test individual components step by step

## Next Steps

After successful deployment:
1. Train users on the system
2. Import initial contact lists
3. Create calling campaigns
4. Configure agent accounts
5. Set up call recording policies
6. Monitor system performance