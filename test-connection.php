<?php
// Test Asterisk AMI connection

$host = '3.13.214.103';
$port = 5038;
$timeout = 10;

echo "Testing connection to Asterisk Manager at $host:$port...\n";

// Test basic socket connection
$socket = @fsockopen($host, $port, $errno, $errstr, $timeout);

if (!$socket) {
    echo "ERROR: Cannot connect to $host:$port\n";
    echo "Error Code: $errno\n";
    echo "Error Message: $errstr\n";
    
    // Try to ping the host
    $ping = exec("ping -c 1 -W 2 $host 2>&1", $output, $result);
    if ($result === 0) {
        echo "\nHost $host is reachable via ping.\n";
        echo "The AMI service might be down or port $port is blocked.\n";
    } else {
        echo "\nHost $host is not responding to ping.\n";
        echo "The server might be down or blocking ICMP.\n";
    }
} else {
    echo "SUCCESS: Connected to $host:$port\n";
    
    // Read welcome message
    $welcome = fgets($socket, 4096);
    echo "Server says: " . trim($welcome) . "\n";
    
    // Close connection
    fclose($socket);
    
    echo "\nConnection test successful! The AMI service is running.\n";
}