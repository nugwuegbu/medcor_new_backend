<?php
/**
 * Predictive Dialer Implementation using PHP AGI and Asterisk Manager
 * This sample demonstrates automated dialing with agent availability checking
 */

require_once 'phpagi-asmanager.php';

class PredictiveDialer {
    private $manager;
    private $config;
    private $activeChannels = [];
    
    public function __construct($config = []) {
        $this->config = array_merge([
            'host' => '127.0.0.1',
            'port' => 5038,
            'username' => 'admin',
            'secret' => 'mysecret',
            'connect_timeout' => 10,
            'read_timeout' => 10,
            'agent_context' => 'from-internal',
            'outbound_context' => 'from-internal',
            'trunk' => 'SIP/trunk',
            'campaign_id' => 'campaign_001',
            'dial_ratio' => 1.5, // Dial 1.5 calls per available agent
            'answer_timeout' => 30000, // 30 seconds
            'agent_wrapup_time' => 5000, // 5 seconds after call
        ], $config);
        
        $this->connectToAsterisk();
    }
    
    /**
     * Connect to Asterisk Manager Interface
     */
    private function connectToAsterisk() {
        $this->manager = new AGI_AsteriskManager();
        
        $connected = $this->manager->connect(
            $this->config['host'] . ':' . $this->config['port'],
            $this->config['username'],
            $this->config['secret']
        );
        
        if (!$connected) {
            throw new Exception("Could not connect to Asterisk Manager");
        }
        
        return true;
    }
    
    /**
     * Get available agents from queue
     */
    public function getAvailableAgents($queue = 'sales') {
        $response = $this->manager->command("queue show $queue");
        $agents = [];
        
        if ($response['Response'] == 'Success') {
            $lines = explode("\n", $response['data']);
            foreach ($lines as $line) {
                // Parse agent status from queue show output
                if (preg_match('/SIP\/(\d+).*\(Not in use\)/', $line, $matches)) {
                    $agents[] = [
                        'extension' => $matches[1],
                        'channel' => 'SIP/' . $matches[1],
                        'status' => 'available'
                    ];
                }
            }
        }
        
        return $agents;
    }
    
    /**
     * Get numbers to dial from database or CSV
     */
    public function getDialList($limit = 10) {
        // In production, this would query your database
        // For demo, returning sample numbers
        return [
            ['id' => 1, 'number' => '15551234567', 'name' => 'John Doe', 'priority' => 1],
            ['id' => 2, 'number' => '15551234568', 'name' => 'Jane Smith', 'priority' => 2],
            ['id' => 3, 'number' => '15551234569', 'name' => 'Bob Johnson', 'priority' => 1],
            ['id' => 4, 'number' => '15551234570', 'name' => 'Alice Brown', 'priority' => 3],
        ];
    }
    
    /**
     * Initiate predictive dialing campaign
     */
    public function startCampaign() {
        echo "Starting predictive dialing campaign: {$this->config['campaign_id']}\n";
        
        while (true) {
            // Get available agents
            $availableAgents = $this->getAvailableAgents();
            $agentCount = count($availableAgents);
            
            if ($agentCount == 0) {
                echo "No available agents. Waiting...\n";
                sleep(5);
                continue;
            }
            
            // Calculate how many calls to make based on dial ratio
            $callsToMake = ceil($agentCount * $this->config['dial_ratio']);
            
            // Get numbers to dial
            $numbersToCall = $this->getDialList($callsToMake);
            
            // Initiate calls
            foreach ($numbersToCall as $contact) {
                $this->originateCall($contact);
                usleep(500000); // 0.5 second delay between calls
            }
            
            // Monitor active calls
            $this->monitorActiveCalls();
            
            // Wait before next iteration
            sleep(10);
        }
    }
    
    /**
     * Originate an outbound call
     */
    private function originateCall($contact) {
        $variables = [
            'CAMPAIGN_ID' => $this->config['campaign_id'],
            'CONTACT_ID' => $contact['id'],
            'CONTACT_NAME' => $contact['name'],
            'CONTACT_NUMBER' => $contact['number'],
        ];
        
        $response = $this->manager->originate(
            $this->config['trunk'] . '/' . $contact['number'],
            null, // No direct extension, will use Local channel
            $this->config['outbound_context'],
            'predictive-connect', // Priority label in dialplan
            null, // No initial application
            null, // No initial data
            $this->config['answer_timeout'],
            'Predictive Dialer Call to ' . $contact['name'],
            $variables,
            null, // Account
            true, // Async
            null  // Action ID
        );
        
        if ($response['Response'] == 'Success') {
            echo "Initiated call to {$contact['name']} ({$contact['number']})\n";
            $this->activeChannels[] = [
                'contact' => $contact,
                'timestamp' => time(),
                'status' => 'dialing'
            ];
        } else {
            echo "Failed to call {$contact['name']}: {$response['Message']}\n";
        }
    }
    
    /**
     * Monitor active calls and connect to agents
     */
    private function monitorActiveCalls() {
        $response = $this->manager->command('core show channels concise');
        
        if ($response['Response'] == 'Success') {
            $channels = explode("\n", $response['data']);
            
            foreach ($channels as $channel) {
                $parts = explode('!', $channel);
                if (count($parts) > 5) {
                    $channelName = $parts[0];
                    $state = $parts[4];
                    
                    // Check if call is answered
                    if ($state == 'Up' && strpos($channelName, $this->config['trunk']) !== false) {
                        $this->connectCallToAgent($channelName);
                    }
                }
            }
        }
    }
    
    /**
     * Connect answered call to available agent
     */
    private function connectCallToAgent($customerChannel) {
        $availableAgents = $this->getAvailableAgents();
        
        if (count($availableAgents) > 0) {
            $agent = $availableAgents[0]; // Get first available agent
            
            // Transfer the call to the agent
            $response = $this->manager->redirect(
                $customerChannel,
                $this->config['agent_context'],
                $agent['extension'],
                '1'
            );
            
            if ($response['Response'] == 'Success') {
                echo "Connected call on $customerChannel to agent {$agent['extension']}\n";
                $this->logCallConnection($customerChannel, $agent);
            }
        } else {
            // No agent available, play hold music or message
            $this->manager->command("channel redirect $customerChannel hold-queue,s,1");
            echo "No agent available for $customerChannel, placing in hold queue\n";
        }
    }
    
    /**
     * Log call connection for reporting
     */
    private function logCallConnection($channel, $agent) {
        // In production, log to database
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'campaign_id' => $this->config['campaign_id'],
            'channel' => $channel,
            'agent' => $agent['extension'],
            'status' => 'connected'
        ];
        
        // For demo, just print
        echo "Call Log: " . json_encode($logEntry) . "\n";
    }
    
    /**
     * Handle abandoned calls (no agent available)
     */
    public function handleAbandonedCall($channel) {
        // Play message and schedule callback
        $this->manager->command("channel redirect $channel abandoned-message,s,1");
        
        // Log abandoned call
        echo "Call abandoned on channel: $channel\n";
    }
    
    /**
     * Get campaign statistics
     */
    public function getCampaignStats() {
        // In production, query from database
        return [
            'total_calls' => count($this->activeChannels),
            'answered_calls' => 0,
            'abandoned_calls' => 0,
            'average_wait_time' => 0,
            'agents_available' => count($this->getAvailableAgents()),
        ];
    }
    
    /**
     * Stop the campaign
     */
    public function stopCampaign() {
        echo "Stopping campaign {$this->config['campaign_id']}\n";
        
        // Hangup all active campaign calls
        foreach ($this->activeChannels as $channel) {
            $this->manager->hangup($channel['channel']);
        }
        
        $this->manager->disconnect();
    }
}

// Dialplan context for Asterisk (extensions.conf)
/*
[from-internal]
exten => predictive-connect,1,Answer()
 same => n,Wait(1)
 same => n,Playback(please-hold-connect-agent)
 same => n,MusicOnHold(default)
 same => n,Hangup()

[hold-queue]
exten => s,1,Answer()
 same => n,Playback(all-agents-busy)
 same => n,MusicOnHold(default,300)
 same => n,Hangup()

[abandoned-message]
exten => s,1,Answer()
 same => n,Playback(sorry-no-agents)
 same => n,AMD()
 same => n,GotoIf($["${AMDSTATUS}" = "HUMAN"]?human:machine)
 same => n(human),Playback(will-callback-soon)
 same => n,Goto(end)
 same => n(machine),Playback(callback-message-machine)
 same => n(end),Hangup()
*/

// Example usage
try {
    $config = [
        'host' => 'localhost',
        'username' => 'admin',
        'secret' => 'amp111',
        'campaign_id' => 'sales_campaign_001',
        'dial_ratio' => 1.3,
    ];
    
    $dialer = new PredictiveDialer($config);
    
    // Start the campaign (runs continuously)
    $dialer->startCampaign();
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

// CLI control script example
if (php_sapi_name() === 'cli' && isset($argv[1])) {
    switch ($argv[1]) {
        case 'start':
            $dialer->startCampaign();
            break;
            
        case 'stop':
            $dialer->stopCampaign();
            break;
            
        case 'stats':
            print_r($dialer->getCampaignStats());
            break;
            
        default:
            echo "Usage: php predictive-dialer.php [start|stop|stats]\n";
    }
}
?>