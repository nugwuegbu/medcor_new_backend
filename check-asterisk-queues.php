<?php
/**
 * Debug script to check Asterisk queues and agents
 */

require_once 'phpagi-asmanager.php';

$config = [
    'host' => '3.13.214.103',
    'port' => 5038,
    'username' => 'admin',
    'secret' => 'all0wm3n0t',
];

echo "=== Asterisk Queue Debug Tool ===\n\n";

$manager = new AGI_AsteriskManager();

// Connect to Asterisk
$connected = $manager->connect(
    $config['host'] . ':' . $config['port'],
    $config['username'],
    $config['secret']
);

if (!$connected) {
    die("Failed to connect to Asterisk Manager\n");
}

echo "Connected successfully!\n\n";

// Check all queues
echo "1. Checking all queues:\n";
echo str_repeat('-', 50) . "\n";
$response = $manager->command("queue show");
if ($response['Response'] == 'Success') {
    echo $response['data'] . "\n";
} else {
    echo "Failed to get queue information\n";
}

echo "\n2. Checking specific queue 'iRechargeInboundCalls':\n";
echo str_repeat('-', 50) . "\n";
$response = $manager->command("queue show iRechargeInboundCalls");
if ($response['Response'] == 'Success') {
    echo $response['data'] . "\n";
} else {
    echo "Queue 'iRechargeInboundCalls' not found or error\n";
}

// Check SIP peers
echo "\n3. Checking SIP peers (potential agents):\n";
echo str_repeat('-', 50) . "\n";
$response = $manager->command("sip show peers");
if ($response['Response'] == 'Success') {
    $lines = explode("\n", $response['data']);
    foreach ($lines as $line) {
        if (strpos($line, 'OK') !== false || strpos($line, 'UNREACHABLE') !== false) {
            echo $line . "\n";
        }
    }
} else {
    echo "Failed to get SIP peers\n";
}

// Check active channels
echo "\n4. Checking active channels:\n";
echo str_repeat('-', 50) . "\n";
$response = $manager->command("core show channels");
if ($response['Response'] == 'Success') {
    echo $response['data'] . "\n";
} else {
    echo "Failed to get channel information\n";
}

$manager->disconnect();
echo "\nDebug complete!\n";
?>