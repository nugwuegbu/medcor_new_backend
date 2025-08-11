<?php
/**
 * Asterisk Manager Interface (AMI) Class
 * Handles connection and communication with Asterisk
 */

class AsteriskAMI {
    private $socket;
    private $host;
    private $port;
    private $username;
    private $password;
    private $connected = false;
    private $logged_in = false;
    
    public function __construct($host, $port, $username, $password) {
        $this->host = $host;
        $this->port = $port;
        $this->username = $username;
        $this->password = $password;
    }
    
    /**
     * Connect to Asterisk AMI
     */
    public function connect() {
        $errno = 0;
        $errstr = '';
        
        $this->socket = @fsockopen($this->host, $this->port, $errno, $errstr, 5);
        
        if (!$this->socket) {
            throw new Exception("Cannot connect to Asterisk AMI: $errstr ($errno)");
        }
        
        // Read welcome message
        $response = $this->read();
        
        if (strpos($response, 'Asterisk Call Manager') !== false) {
            $this->connected = true;
            return true;
        }
        
        return false;
    }
    
    /**
     * Login to AMI
     */
    public function login() {
        if (!$this->connected) {
            throw new Exception("Not connected to AMI");
        }
        
        $command = "Action: Login\r\n";
        $command .= "Username: {$this->username}\r\n";
        $command .= "Secret: {$this->password}\r\n";
        $command .= "Events: off\r\n\r\n";
        
        $this->write($command);
        $response = $this->read();
        
        if (strpos($response, 'Success') !== false) {
            $this->logged_in = true;
            return true;
        }
        
        return false;
    }
    
    /**
     * Originate a call
     */
    public function originate($channel, $exten, $context, $priority = 1, $callerid = null, $variables = array()) {
        if (!$this->logged_in) {
            throw new Exception("Not logged in to AMI");
        }
        
        $command = "Action: Originate\r\n";
        $command .= "Channel: $channel\r\n";
        $command .= "Context: $context\r\n";
        $command .= "Exten: $exten\r\n";
        $command .= "Priority: $priority\r\n";
        $command .= "Async: yes\r\n";
        
        if ($callerid) {
            $command .= "CallerID: $callerid\r\n";
        }
        
        // Add custom variables
        foreach ($variables as $key => $value) {
            $command .= "Variable: $key=$value\r\n";
        }
        
        $command .= "ActionID: " . uniqid() . "\r\n\r\n";
        
        $this->write($command);
        $response = $this->read();
        
        return strpos($response, 'Success') !== false;
    }
    
    /**
     * Hangup a channel
     */
    public function hangup($channel) {
        if (!$this->logged_in) {
            throw new Exception("Not logged in to AMI");
        }
        
        $command = "Action: Hangup\r\n";
        $command .= "Channel: $channel\r\n\r\n";
        
        $this->write($command);
        $response = $this->read();
        
        return strpos($response, 'Success') !== false;
    }
    
    /**
     * Get channel status
     */
    public function getChannelStatus($channel = null) {
        if (!$this->logged_in) {
            throw new Exception("Not logged in to AMI");
        }
        
        $command = "Action: Status\r\n";
        if ($channel) {
            $command .= "Channel: $channel\r\n";
        }
        $command .= "\r\n";
        
        $this->write($command);
        return $this->read();
    }
    
    /**
     * Get active channels
     */
    public function getActiveChannels() {
        if (!$this->logged_in) {
            throw new Exception("Not logged in to AMI");
        }
        
        $command = "Action: CoreShowChannels\r\n\r\n";
        
        $this->write($command);
        $response = $this->read();
        
        // Parse response to get channel list
        $channels = array();
        $lines = explode("\r\n", $response);
        
        foreach ($lines as $line) {
            if (strpos($line, 'Channel:') === 0) {
                $channels[] = trim(substr($line, 8));
            }
        }
        
        return $channels;
    }
    
    /**
     * Logout from AMI
     */
    public function logout() {
        if ($this->logged_in) {
            $command = "Action: Logoff\r\n\r\n";
            $this->write($command);
            $this->logged_in = false;
        }
    }
    
    /**
     * Disconnect from AMI
     */
    public function disconnect() {
        if ($this->socket) {
            $this->logout();
            fclose($this->socket);
            $this->connected = false;
        }
    }
    
    /**
     * Write command to socket
     */
    private function write($command) {
        if (!$this->socket) {
            throw new Exception("Socket not connected");
        }
        
        fputs($this->socket, $command);
    }
    
    /**
     * Read response from socket
     */
    private function read() {
        if (!$this->socket) {
            throw new Exception("Socket not connected");
        }
        
        $response = '';
        
        while (!feof($this->socket)) {
            $buffer = fgets($this->socket, 4096);
            $response .= $buffer;
            
            // Check for end of response
            if ($buffer == "\r\n") {
                break;
            }
        }
        
        return $response;
    }
    
    /**
     * Execute custom AMI command
     */
    public function command($action, $parameters = array()) {
        if (!$this->logged_in) {
            throw new Exception("Not logged in to AMI");
        }
        
        $command = "Action: $action\r\n";
        
        foreach ($parameters as $key => $value) {
            $command .= "$key: $value\r\n";
        }
        
        $command .= "\r\n";
        
        $this->write($command);
        return $this->read();
    }
    
    public function __destruct() {
        $this->disconnect();
    }
}
?>