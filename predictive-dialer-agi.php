#!/usr/bin/php -q
<?php
/**
 * AGI Script for Predictive Dialer - Call Flow Control
 * This script handles the actual call flow when calls are connected
 */

require_once 'phpagi.php';

class PredictiveDialerAGI {
    private $agi;
    private $config;
    
    public function __construct() {
        $this->agi = new AGI();
        $this->config = [
            'db_host' => 'localhost',
            'db_name' => 'predictive_dialer',
            'db_user' => 'dialer',
            'db_pass' => 'password',
            'recording_path' => '/var/spool/asterisk/monitor/',
        ];
        
        // Answer the call
        $this->agi->answer();
    }
    
    /**
     * Main call flow handler
     */
    public function handleCall() {
        // Get call variables set by the dialer
        $campaignId = $this->agi->get_variable('CAMPAIGN_ID', true);
        $contactId = $this->agi->get_variable('CONTACT_ID', true);
        $contactName = $this->agi->get_variable('CONTACT_NAME', true);
        $contactNumber = $this->agi->get_variable('CONTACT_NUMBER', true);
        
        $this->agi->verbose("Handling predictive call for {$contactName} ({$contactNumber})");
        
        // Start call recording
        $recordingFile = $this->startRecording($campaignId, $contactId);
        
        // Detect if human or answering machine
        $amdResult = $this->detectAnsweringMachine();
        
        if ($amdResult == 'HUMAN') {
            $this->handleHumanAnswer($campaignId, $contactId);
        } else {
            $this->handleMachineAnswer($campaignId, $contactId);
        }
        
        // Stop recording and save call details
        $this->stopRecording();
        $this->logCallDetails($campaignId, $contactId, $amdResult);
    }
    
    /**
     * Detect answering machine using AMD
     */
    private function detectAnsweringMachine() {
        // Execute AMD (Answering Machine Detection)
        $this->agi->exec('AMD', '2500,1500,300,5000,120,50,5,256');
        
        // Get AMD result
        $amdStatus = $this->agi->get_variable('AMDSTATUS', true);
        $amdCause = $this->agi->get_variable('AMDCAUSE', true);
        
        $this->agi->verbose("AMD Status: {$amdStatus}, Cause: {$amdCause}");
        
        return $amdStatus;
    }
    
    /**
     * Handle human answered calls
     */
    private function handleHumanAnswer($campaignId, $contactId) {
        // Play initial greeting
        $this->agi->stream_file('custom/predictive-greeting');
        
        // Check for available agent
        $agent = $this->findAvailableAgent($campaignId);
        
        if ($agent) {
            // Agent found, transfer to agent
            $this->agi->verbose("Transferring to agent: {$agent['extension']}");
            
            // Play connecting message
            $this->agi->stream_file('custom/connecting-to-agent');
            
            // Set agent information
            $this->agi->set_variable('AGENT_ID', $agent['id']);
            $this->agi->set_variable('AGENT_NAME', $agent['name']);
            
            // Bridge to agent with options
            $dialOptions = 'tT'; // Allow transfer
            $this->agi->exec('Dial', "SIP/{$agent['extension']},30,{$dialOptions}");
            
            // Check dial status
            $dialStatus = $this->agi->get_variable('DIALSTATUS', true);
            $this->handleDialStatus($dialStatus, $campaignId, $contactId);
            
        } else {
            // No agent available
            $this->handleNoAgentAvailable($campaignId, $contactId);
        }
    }
    
    /**
     * Handle answering machine
     */
    private function handleMachineAnswer($campaignId, $contactId) {
        // Wait for beep detection
        $this->agi->exec('WaitForSilence', '3000,2');
        
        // Leave pre-recorded message
        $this->agi->stream_file('custom/machine-message');
        
        // Log machine answer
        $this->updateCallStatus($contactId, 'answering_machine');
    }
    
    /**
     * Find available agent for the campaign
     */
    private function findAvailableAgent($campaignId) {
        // In production, query database for available agents
        // This is a simplified example
        
        // Check agent queue status via AGI
        $queueStatus = $this->agi->exec('Queue', 'sales,t,,,300');
        
        // For demo purposes, return mock agent
        return [
            'id' => '1001',
            'name' => 'John Agent',
            'extension' => '1001',
            'skills' => ['sales', 'support']
        ];
    }
    
    /**
     * Handle no agent available scenario
     */
    private function handleNoAgentAvailable($campaignId, $contactId) {
        $this->agi->verbose("No agent available for campaign {$campaignId}");
        
        // Play apology message
        $this->agi->stream_file('custom/no-agents-available');
        
        // Offer callback option
        $this->agi->stream_file('custom/press-1-for-callback');
        
        // Get user input
        $result = $this->agi->get_data('beep', 5000, 1);
        
        if ($result['result'] == '1') {
            // Schedule callback
            $this->scheduleCallback($contactId);
            $this->agi->stream_file('custom/callback-scheduled');
        }
        
        // Update call status
        $this->updateCallStatus($contactId, 'no_agent_available');
    }
    
    /**
     * Handle dial status after agent connection attempt
     */
    private function handleDialStatus($status, $campaignId, $contactId) {
        switch ($status) {
            case 'ANSWER':
                // Call was successfully connected
                $this->updateCallStatus($contactId, 'connected');
                $callDuration = $this->agi->get_variable('CDR(billsec)', true);
                $this->logAgentCallTime($contactId, $callDuration);
                break;
                
            case 'BUSY':
                // Agent was busy
                $this->updateCallStatus($contactId, 'agent_busy');
                $this->handleNoAgentAvailable($campaignId, $contactId);
                break;
                
            case 'NOANSWER':
                // Agent didn't answer
                $this->updateCallStatus($contactId, 'agent_no_answer');
                $this->handleNoAgentAvailable($campaignId, $contactId);
                break;
                
            default:
                // Other failure
                $this->updateCallStatus($contactId, 'failed');
                break;
        }
    }
    
    /**
     * Start call recording
     */
    private function startRecording($campaignId, $contactId) {
        $timestamp = date('Y-m-d-H-i-s');
        $filename = "campaign_{$campaignId}_contact_{$contactId}_{$timestamp}";
        
        // Start monitoring (recording)
        $this->agi->exec('MixMonitor', "{$filename}.wav,b");
        
        return $filename;
    }
    
    /**
     * Stop call recording
     */
    private function stopRecording() {
        $this->agi->exec('StopMixMonitor');
    }
    
    /**
     * Schedule a callback for the contact
     */
    private function scheduleCallback($contactId) {
        // In production, insert into callback queue database
        $callbackTime = date('Y-m-d H:i:s', strtotime('+2 hours'));
        
        $this->agi->verbose("Scheduled callback for contact {$contactId} at {$callbackTime}");
        
        // Set callback flag
        $this->updateCallStatus($contactId, 'callback_scheduled', [
            'callback_time' => $callbackTime
        ]);
    }
    
    /**
     * Update call status in database
     */
    private function updateCallStatus($contactId, $status, $additionalData = []) {
        // In production, update database
        $this->agi->verbose("Updated contact {$contactId} status to: {$status}");
        
        // Log to CSV for demo
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'contact_id' => $contactId,
            'status' => $status,
            'callerid' => $this->agi->request['agi_callerid'],
            'uniqueid' => $this->agi->request['agi_uniqueid'],
        ];
        
        $logLine = implode(',', array_merge($logData, $additionalData)) . "\n";
        file_put_contents('/tmp/predictive_dialer_log.csv', $logLine, FILE_APPEND);
    }
    
    /**
     * Log complete call details
     */
    private function logCallDetails($campaignId, $contactId, $amdResult) {
        $callData = [
            'campaign_id' => $campaignId,
            'contact_id' => $contactId,
            'call_time' => date('Y-m-d H:i:s'),
            'amd_result' => $amdResult,
            'duration' => $this->agi->get_variable('CDR(duration)', true),
            'disposition' => $this->agi->get_variable('CDR(disposition)', true),
            'recording_file' => $this->agi->get_variable('MIXMONITOR_FILENAME', true),
        ];
        
        $this->agi->verbose("Call completed: " . json_encode($callData));
    }
    
    /**
     * Log agent call time for productivity tracking
     */
    private function logAgentCallTime($contactId, $duration) {
        $agentId = $this->agi->get_variable('AGENT_ID', true);
        
        $this->agi->verbose("Agent {$agentId} handled call {$contactId} for {$duration} seconds");
        
        // In production, update agent statistics in database
    }
    
    /**
     * Play IVR menu for DNC requests
     */
    public function handleDNCRequest() {
        $this->agi->stream_file('custom/dnc-menu');
        
        $result = $this->agi->get_data('beep', 5000, 1);
        
        if ($result['result'] == '1') {
            // Add to DNC list
            $phoneNumber = $this->agi->request['agi_callerid'];
            $this->addToDNCList($phoneNumber);
            
            $this->agi->stream_file('custom/added-to-dnc');
            $this->agi->verbose("Added {$phoneNumber} to DNC list");
        }
    }
    
    /**
     * Add number to Do Not Call list
     */
    private function addToDNCList($phoneNumber) {
        // In production, add to DNC database
        $dncEntry = date('Y-m-d H:i:s') . ",{$phoneNumber},customer_request\n";
        file_put_contents('/tmp/dnc_list.csv', $dncEntry, FILE_APPEND);
    }
}

// Main execution
$dialer = new PredictiveDialerAGI();
$dialer->handleCall();

// AGI cleanup
exit(0);
?>