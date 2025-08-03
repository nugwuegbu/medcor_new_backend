<?php
/**
 * Test Asterisk dialing methods
 */

require_once 'phpagi-asmanager.php';

$config = [
    'host' => '3.13.214.103',
    'port' => 5038,
    'username' => 'admin',
    'secret' => 'all0wm3n0t',
];

$manager = new AGI_AsteriskManager();
$connected = $manager->connect(
    $config['host'] . ':' . $config['port'],
    $config['username'],
    $config['secret']
);

if (!$connected) {
    die("Failed to connect\n");
}

echo "Testing different dialing methods...\n\n";

// Test 1: Direct dial with Dial application
echo "Test 1: Using Dial application directly\n";
$response = $manager->originate(
    'SIP/GoIP1/08035660292',  // Channel
    null,                      // Extension (null when using app)
    null,                      // Context (null when using app)
    null,                      // Priority (null when using app)
    'Dial',                    // Application
    'SIP/102,30',             // Data (dial SIP/102 for 30 seconds)
    30000,                     // Timeout
    'Test Call',               // CallerID
    ['TEST' => '1'],          // Variables
    null,                      // Account
    true,                      // Async
    null                       // ActionID
);
echo "Response: " . json_encode($response) . "\n\n";

// Test 2: Using Queue application
echo "Test 2: Using Queue application\n";
$response = $manager->originate(
    'SIP/GoIP1/08035660292',  // Channel
    null,                      // Extension
    null,                      // Context
    null,                      // Priority
    'Queue',                   // Application
    '6001',                    // Data (queue name)
    30000,                     // Timeout
    'Test Call',               // CallerID
    ['TEST' => '2'],          // Variables
    null,                      // Account
    true,                      // Async
    null                       // ActionID
);
echo "Response: " . json_encode($response) . "\n\n";

// Test 3: Using outbound route pattern
echo "Test 3: Testing with pattern match\n";
$response = $manager->originate(
    'SIP/GoIP1/08035660292',  // Channel
    '_X.',                     // Extension pattern (any number)
    'from-internal',           // Context
    '1',                       // Priority
    null,                      // Application
    null,                      // Data
    30000,                     // Timeout
    'Test Call',               // CallerID
    ['TEST' => '3'],          // Variables
    null,                      // Account
    true,                      // Async
    null                       // ActionID
);
echo "Response: " . json_encode($response) . "\n\n";

// Check dialplan contexts
echo "Checking available contexts:\n";
$response = $manager->command("dialplan show");
if ($response['Response'] == 'Success') {
    $lines = explode("\n", $response['data']);
    $contexts = [];
    foreach ($lines as $line) {
        if (preg_match("/\[ Context '([^']+)'/", $line, $matches)) {
            $contexts[] = $matches[1];
        }
    }
    echo "Found contexts: " . implode(", ", array_unique($contexts)) . "\n";
}

$manager->disconnect();
echo "\nTest complete!\n";
?>