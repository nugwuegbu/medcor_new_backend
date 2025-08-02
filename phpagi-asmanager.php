<?php
/**
 * Mock AGI_AsteriskManager class for demonstration
 * In production, use the real phpagi-asmanager.php from the phpagi library
 */

class AGI_AsteriskManager {
    private $connected = false;
    private $host;
    private $username;
    
    public function __construct() {
        echo "AGI_AsteriskManager initialized (Mock Mode)\n";
    }
    
    /**
     * Connect to Asterisk Manager Interface
     */
    public function connect($host, $username, $secret) {
        $this->host = $host;
        $this->username = $username;
        
        echo "Attempting to connect to Asterisk Manager at $host...\n";
        
        // In real implementation, this would establish socket connection
        // For demo, we'll simulate connection failure
        if ($host === 'localhost:5038' || $host === '127.0.0.1:5038') {
            echo "ERROR: Cannot connect to Asterisk Manager Interface at $host\n";
            echo "Please ensure:\n";
            echo "1. Asterisk is running\n";
            echo "2. Manager interface is enabled in manager.conf\n";
            echo "3. Port 5038 is accessible\n";
            echo "4. Credentials are correct\n\n";
            return false;
        }
        
        $this->connected = true;
        return true;
    }
    
    /**
     * Execute command
     */
    public function command($cmd) {
        if (!$this->connected) {
            return ['Response' => 'Error', 'Message' => 'Not connected'];
        }
        
        // Mock response for queue show command
        if (strpos($cmd, 'queue show') !== false) {
            return [
                'Response' => 'Success',
                'data' => "sales has 0 calls (max unlimited) in 'rrmemory' strategy (0s holdtime, 0s talktime), W:0, C:0, A:0, SL:0.0% within 0s\n" .
                         "   Members:\n" .
                         "      SIP/1001 (ringinuse disabled) (dynamic) (Not in use) has taken no calls yet\n" .
                         "      SIP/1002 (ringinuse disabled) (dynamic) (Not in use) has taken no calls yet\n" .
                         "   No Callers"
            ];
        }
        
        if (strpos($cmd, 'core show channels') !== false) {
            return [
                'Response' => 'Success',
                'data' => "Channel!Context!Extension!Priority!State!Application!Data!CallerID!Duration!Accountcode!PeerAccount!BridgeID"
            ];
        }
        
        return ['Response' => 'Success', 'data' => ''];
    }
    
    /**
     * Originate a call
     */
    public function originate($channel, $exten, $context, $priority, $application, 
                            $data, $timeout, $callerid, $variables, $account, 
                            $async, $actionid) {
        if (!$this->connected) {
            return ['Response' => 'Error', 'Message' => 'Not connected'];
        }
        
        echo "Would originate call to: $channel\n";
        echo "Context: $context, Priority: $priority\n";
        echo "Variables: " . json_encode($variables) . "\n";
        
        // Simulate origination response
        return [
            'Response' => 'Error',
            'Message' => 'Originate failed - No channel available'
        ];
    }
    
    /**
     * Redirect a channel
     */
    public function redirect($channel, $context, $exten, $priority) {
        if (!$this->connected) {
            return ['Response' => 'Error', 'Message' => 'Not connected'];
        }
        
        return ['Response' => 'Success'];
    }
    
    /**
     * Hangup a channel
     */
    public function hangup($channel) {
        if (!$this->connected) {
            return ['Response' => 'Error', 'Message' => 'Not connected'];
        }
        
        return ['Response' => 'Success'];
    }
    
    /**
     * Disconnect from manager
     */
    public function disconnect() {
        $this->connected = false;
        echo "Disconnected from Asterisk Manager\n";
    }
}

// Demo notice
echo "\n=== DEMO MODE ===\n";
echo "This is a mock implementation for demonstration.\n";
echo "For production use, install the real phpagi library:\n";
echo "  wget https://github.com/welltime/phpagi/archive/master.zip\n";
echo "  unzip master.zip && mv phpagi-master/phpagi-asmanager.php .\n";
echo "=================\n\n";
?>