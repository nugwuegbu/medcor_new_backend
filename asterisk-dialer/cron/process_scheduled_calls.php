#!/usr/bin/php
<?php
/**
 * Cron script to process scheduled calls
 * Run this every minute via crontab
 */

require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/ami.class.php';

// Database connection
try {
    $db = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage() . "\n");
}

// Get current time
$current_date = date('Y-m-d');
$current_time = date('H:i:00'); // Round to nearest minute

// Check if within working hours
$working_start = getSetting('working_hours_start', '09:00');
$working_end = getSetting('working_hours_end', '17:00');

if ($current_time < $working_start || $current_time > $working_end) {
    echo "Outside working hours. Skipping.\n";
    exit;
}

// Get scheduled calls for current time
$stmt = $db->prepare("SELECT sc.*, c.phone, c.name 
                      FROM scheduled_calls sc 
                      JOIN contacts c ON sc.contact_id = c.id 
                      WHERE sc.scheduled_date = ? 
                      AND sc.scheduled_time = ? 
                      AND sc.status = 'pending'
                      ORDER BY sc.priority DESC");
$stmt->execute([$current_date, $current_time]);
$scheduled_calls = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (count($scheduled_calls) == 0) {
    echo "No scheduled calls for $current_date $current_time\n";
    exit;
}

echo "Processing " . count($scheduled_calls) . " scheduled calls...\n";

// Connect to AMI
try {
    $ami = new AsteriskAMI(AMI_HOST, AMI_PORT, AMI_USERNAME, AMI_PASSWORD);
    
    if (!$ami->connect()) {
        die("Cannot connect to Asterisk AMI\n");
    }
    
    if (!$ami->login()) {
        die("AMI login failed\n");
    }
    
    // Get current active channels count
    $active_channels = $ami->getActiveChannels();
    $current_calls = count($active_channels);
    $max_calls = getSetting('max_concurrent_calls', 10);
    
    foreach ($scheduled_calls as $call) {
        // Check if we've reached max concurrent calls
        if ($current_calls >= $max_calls) {
            echo "Max concurrent calls reached. Postponing remaining calls.\n";
            break;
        }
        
        // Format phone number
        $phone = preg_replace('/[^0-9]/', '', $call['phone']);
        
        // Create channel (adjust based on your trunk)
        $channel = "SIP/" . $phone . "@your-trunk";
        
        // Originate call
        $variables = array(
            'CONTACT_ID' => $call['contact_id'],
            'CAMPAIGN_ID' => $call['campaign_id'],
            'SCHEDULED_CALL_ID' => $call['id']
        );
        
        $result = $ami->originate(
            $channel,
            's',
            DIAL_CONTEXT,
            1,
            CALLER_ID,
            $variables
        );
        
        if ($result) {
            echo "Initiated call to {$call['name']} ({$call['phone']})\n";
            
            // Update scheduled call status
            $stmt = $db->prepare("UPDATE scheduled_calls SET status = 'completed' WHERE id = ?");
            $stmt->execute([$call['id']]);
            
            // Create call record
            $stmt = $db->prepare("INSERT INTO call_records (contact_id, campaign_id, phone_number, call_date) 
                                  VALUES (?, ?, ?, NOW())");
            $stmt->execute([$call['contact_id'], $call['campaign_id'], $call['phone']]);
            
            $current_calls++;
        } else {
            echo "Failed to initiate call to {$call['name']} ({$call['phone']})\n";
        }
        
        // Small delay between calls
        sleep(2);
    }
    
    $ami->disconnect();
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

/**
 * Get setting value from database
 */
function getSetting($key, $default = null) {
    global $db;
    
    $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = ?");
    $stmt->execute([$key]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $result ? $result['setting_value'] : $default;
}

echo "Scheduled call processing completed.\n";
?>