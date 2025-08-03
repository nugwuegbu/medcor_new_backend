<?php
/**
 * Real AGI_AsteriskManager class implementation for Asterisk Manager Interface
 * Handles socket connections and AMI protocol
 */

class AGI_AsteriskManager {
    private $socket = false;
    private $connected = false;
    private $host;
    private $username;
    private $timeout = 10;
    
    public function __construct() {
        // Constructor
    }
    
    /**
     * Connect to Asterisk Manager Interface
     */
    public function connect($host, $username, $secret) {
        $this->host = $host;
        $this->username = $username;
        
        echo "Connecting to Asterisk Manager at $host...\n";
        
        // Parse host and port
        $parts = explode(':', $host);
        $ip = $parts[0];
        $port = isset($parts[1]) ? $parts[1] : 5038;
        
        // Create socket connection
        $this->socket = @fsockopen($ip, $port, $errno, $errstr, $this->timeout);
        
        if (!$this->socket) {
            echo "ERROR: Cannot connect to Asterisk Manager at $host\n";
            echo "Error: $errno - $errstr\n";
            return false;
        }
        
        // Set socket timeout
        stream_set_timeout($this->socket, $this->timeout);
        
        // Read welcome message
        $response = $this->readResponse();
        echo "Server: " . trim($response[0]) . "\n";
        
        // Send login
        $loginCmd = "Action: Login\r\n";
        $loginCmd .= "Username: $username\r\n";
        $loginCmd .= "Secret: $secret\r\n";
        $loginCmd .= "Events: off\r\n\r\n";
        
        fwrite($this->socket, $loginCmd);
        
        // Read login response
        $response = $this->readResponse();
        
        foreach ($response as $line) {
            if (strpos($line, 'Response: Success') !== false) {
                echo "Successfully connected to Asterisk Manager\n";
                $this->connected = true;
                return true;
            }
            if (strpos($line, 'Response: Error') !== false) {
                echo "Login failed: " . implode("\n", $response) . "\n";
                fclose($this->socket);
                return false;
            }
        }
        
        return false;
    }
    
    /**
     * Read response from socket
     */
    private function readResponse() {
        $response = array();
        
        while ($line = fgets($this->socket, 4096)) {
            if ($line == "\r\n") break; // End of response
            $response[] = $line;
        }
        
        return $response;
    }
    
    /**
     * Execute command
     */
    public function command($cmd) {
        if (!$this->connected || !$this->socket) {
            return ['Response' => 'Error', 'Message' => 'Not connected'];
        }
        
        $action = "Action: Command\r\n";
        $action .= "Command: $cmd\r\n\r\n";
        
        fwrite($this->socket, $action);
        
        $response = $this->readResponse();
        $result = ['Response' => 'Error', 'data' => ''];
        
        foreach ($response as $line) {
            if (strpos($line, 'Response: Success') !== false) {
                $result['Response'] = 'Success';
            } elseif (strpos($line, 'Output:') === 0) {
                $result['data'] .= substr($line, 7);
            }
        }
        
        return $result;
    }
    
    /**
     * Originate a call
     */
    public function originate($channel, $exten, $context, $priority, $application, 
                            $data, $timeout, $callerid, $variables, $account, 
                            $async, $actionid) {
        if (!$this->connected || !$this->socket) {
            return ['Response' => 'Error', 'Message' => 'Not connected'];
        }
        
        $action = "Action: Originate\r\n";
        $action .= "Channel: $channel\r\n";
        
        // If using Application, don't send Context/Extension/Priority
        if ($application) {
            $action .= "Application: $application\r\n";
            if ($data) {
                $action .= "Data: $data\r\n";
            }
        } else {
            // If using Context/Extension/Priority
            if ($context) $action .= "Context: $context\r\n";
            if ($exten) $action .= "Exten: $exten\r\n";
            if ($priority) $action .= "Priority: $priority\r\n";
        }
        
        $action .= "Timeout: $timeout\r\n";
        $action .= "CallerID: $callerid\r\n";
        $action .= "Async: " . ($async ? 'true' : 'false') . "\r\n";
        
        // Add variables
        if (is_array($variables)) {
            foreach ($variables as $key => $value) {
                $action .= "Variable: $key=$value\r\n";
            }
        }
        
        $action .= "\r\n";
        
        fwrite($this->socket, $action);
        
        $response = $this->readResponse();
        $result = ['Response' => 'Error', 'Message' => 'Unknown error'];
        
        foreach ($response as $line) {
            if (strpos($line, 'Response: Success') !== false) {
                $result['Response'] = 'Success';
                $result['Message'] = 'Originate successfully queued';
            } elseif (strpos($line, 'Response: Error') !== false) {
                $result['Response'] = 'Error';
            } elseif (strpos($line, 'Message:') !== false) {
                $result['Message'] = trim(substr($line, 8));
            }
        }
        
        return $result;
    }
    
    /**
     * Redirect a channel
     */
    public function redirect($channel, $context, $exten, $priority) {
        if (!$this->connected || !$this->socket) {
            return ['Response' => 'Error', 'Message' => 'Not connected'];
        }
        
        $action = "Action: Redirect\r\n";
        $action .= "Channel: $channel\r\n";
        $action .= "Context: $context\r\n";
        $action .= "Exten: $exten\r\n";
        $action .= "Priority: $priority\r\n\r\n";
        
        fwrite($this->socket, $action);
        
        $response = $this->readResponse();
        return $this->parseResponse($response);
    }
    
    /**
     * Hangup a channel
     */
    public function hangup($channel) {
        if (!$this->connected || !$this->socket) {
            return ['Response' => 'Error', 'Message' => 'Not connected'];
        }
        
        $action = "Action: Hangup\r\n";
        $action .= "Channel: $channel\r\n\r\n";
        
        fwrite($this->socket, $action);
        
        $response = $this->readResponse();
        return $this->parseResponse($response);
    }
    
    /**
     * Disconnect from manager
     */
    public function disconnect() {
        if ($this->socket) {
            $action = "Action: Logoff\r\n\r\n";
            fwrite($this->socket, $action);
            fclose($this->socket);
            $this->socket = false;
            $this->connected = false;
            echo "Disconnected from Asterisk Manager\n";
        }
    }
    
    /**
     * Parse response into array
     */
    private function parseResponse($response) {
        $result = ['Response' => 'Error'];
        
        foreach ($response as $line) {
            if (strpos($line, 'Response: Success') !== false) {
                $result['Response'] = 'Success';
            } elseif (strpos($line, 'Message:') !== false) {
                $result['Message'] = trim(substr($line, 8));
            }
        }
        
        return $result;
    }
}

// Remove demo notice since this is now a real implementation
?>
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