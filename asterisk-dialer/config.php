<?php
/**
 * Predictive Dialer Configuration
 * For CentOS 7 with Asterisk and PHP 5.4
 */

// Asterisk Manager Interface (AMI) Configuration
define('AMI_HOST', '127.0.0.1');  // Asterisk server IP
define('AMI_PORT', 5038);         // AMI port (default 5038)
define('AMI_USERNAME', 'admin');   // AMI username from manager.conf
define('AMI_PASSWORD', 'your_password_here'); // AMI password from manager.conf

// Database Configuration (MySQL/MariaDB)
define('DB_HOST', 'localhost');
define('DB_NAME', 'predictive_dialer');
define('DB_USER', 'dialer_user');
define('DB_PASS', 'your_db_password');

// Dialer Configuration
define('DIAL_CONTEXT', 'from-internal'); // Asterisk context for outbound calls
define('DIAL_TIMEOUT', 30000);            // Call timeout in milliseconds
define('CALLER_ID', 'Predictive Dialer <1234567890>'); // Outbound caller ID

// Campaign Settings
define('MAX_CONCURRENT_CALLS', 10);      // Maximum simultaneous calls
define('DIAL_RATIO', 2);                 // Calls per available agent
define('ANSWER_TIMEOUT', 20);            // Seconds to wait for answer
define('WRAPUP_TIME', 30);               // Seconds between calls for agent

// File Upload Settings
define('UPLOAD_DIR', '/var/www/html/asterisk-dialer/uploads/');
define('MAX_FILE_SIZE', 10485760);       // 10MB in bytes
define('ALLOWED_EXTENSIONS', array('csv', 'xlsx', 'xls'));

// Session Configuration
define('SESSION_TIMEOUT', 3600);         // 1 hour in seconds

// Time Zone
date_default_timezone_set('America/New_York');

// Error Reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Create upload directory if it doesn't exist
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}
?>