<?php
/**
 * Predictive Dialer API Endpoints
 * RESTful API for the predictive dialer frontend
 */

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';
require_once 'ami.class.php';

// Database connection
try {
    $db = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}

// Get request method and endpoint
$method = $_SERVER['REQUEST_METHOD'];
$request = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';

// Handle different endpoints
switch ($request) {
    
    case 'dial':
        if ($method == 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $result = makeCall($data['phone'], $data['contact_id'], $data['campaign_id']);
            echo json_encode($result);
        }
        break;
        
    case 'hangup':
        if ($method == 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $result = hangupCall($data['channel']);
            echo json_encode($result);
        }
        break;
        
    case 'contacts':
        if ($method == 'GET') {
            $contacts = getContacts();
            echo json_encode($contacts);
        } elseif ($method == 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $result = addContact($data);
            echo json_encode($result);
        }
        break;
        
    case 'upload-contacts':
        if ($method == 'POST') {
            $result = uploadContacts($_FILES['file']);
            echo json_encode($result);
        }
        break;
        
    case 'campaigns':
        if ($method == 'GET') {
            $campaigns = getCampaigns();
            echo json_encode($campaigns);
        } elseif ($method == 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $result = createCampaign($data);
            echo json_encode($result);
        }
        break;
        
    case 'schedule-call':
        if ($method == 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $result = scheduleCall($data);
            echo json_encode($result);
        }
        break;
        
    case 'call-records':
        if ($method == 'GET') {
            $records = getCallRecords();
            echo json_encode($records);
        }
        break;
        
    case 'stats':
        if ($method == 'GET') {
            $stats = getStats();
            echo json_encode($stats);
        }
        break;
        
    case 'agent-status':
        if ($method == 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $result = updateAgentStatus($data['agent_id'], $data['status']);
            echo json_encode($result);
        }
        break;
        
    default:
        echo json_encode(['error' => 'Invalid endpoint']);
        break;
}

// Function to make a call via Asterisk AMI
function makeCall($phone, $contact_id = null, $campaign_id = null) {
    global $db;
    
    try {
        // Connect to AMI
        $ami = new AsteriskAMI(AMI_HOST, AMI_PORT, AMI_USERNAME, AMI_PASSWORD);
        
        if (!$ami->connect()) {
            return ['success' => false, 'message' => 'Cannot connect to Asterisk'];
        }
        
        if (!$ami->login()) {
            return ['success' => false, 'message' => 'AMI login failed'];
        }
        
        // Format phone number (remove non-digits)
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        // Create channel (adjust based on your trunk configuration)
        $channel = "SIP/" . $phone . "@your-trunk"; // Replace with your trunk name
        
        // Originate call
        $variables = array();
        if ($contact_id) {
            $variables['CONTACT_ID'] = $contact_id;
        }
        if ($campaign_id) {
            $variables['CAMPAIGN_ID'] = $campaign_id;
        }
        
        $result = $ami->originate(
            $channel,
            's',
            DIAL_CONTEXT,
            1,
            CALLER_ID,
            $variables
        );
        
        // Record call attempt
        if ($contact_id) {
            $stmt = $db->prepare("INSERT INTO call_records (contact_id, campaign_id, phone_number, call_date) 
                                  VALUES (?, ?, ?, NOW())");
            $stmt->execute([$contact_id, $campaign_id, $phone]);
            
            // Update contact call count
            $stmt = $db->prepare("UPDATE contacts SET call_count = call_count + 1, last_call_date = NOW() 
                                  WHERE id = ?");
            $stmt->execute([$contact_id]);
        }
        
        $ami->disconnect();
        
        return ['success' => $result, 'message' => $result ? 'Call initiated' : 'Call failed'];
        
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

// Function to hangup a call
function hangupCall($channel) {
    try {
        $ami = new AsteriskAMI(AMI_HOST, AMI_PORT, AMI_USERNAME, AMI_PASSWORD);
        
        if (!$ami->connect() || !$ami->login()) {
            return ['success' => false, 'message' => 'AMI connection failed'];
        }
        
        $result = $ami->hangup($channel);
        $ami->disconnect();
        
        return ['success' => $result, 'message' => $result ? 'Call terminated' : 'Hangup failed'];
        
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

// Function to get contacts
function getContacts() {
    global $db;
    
    $stmt = $db->query("SELECT * FROM contacts ORDER BY created_at DESC LIMIT 100");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Function to add a contact
function addContact($data) {
    global $db;
    
    try {
        $stmt = $db->prepare("INSERT INTO contacts (name, email, phone, company) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data['name'],
            $data['email'],
            $data['phone'],
            isset($data['company']) ? $data['company'] : null
        ]);
        
        return ['success' => true, 'id' => $db->lastInsertId()];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

// Function to upload contacts from CSV
function uploadContacts($file) {
    global $db;
    
    if (!isset($file['tmp_name'])) {
        return ['success' => false, 'message' => 'No file uploaded'];
    }
    
    $handle = fopen($file['tmp_name'], 'r');
    if (!$handle) {
        return ['success' => false, 'message' => 'Cannot read file'];
    }
    
    $headers = fgetcsv($handle);
    $count = 0;
    
    while (($data = fgetcsv($handle)) !== FALSE) {
        try {
            $stmt = $db->prepare("INSERT INTO contacts (name, email, phone, company) 
                                  VALUES (?, ?, ?, ?) 
                                  ON DUPLICATE KEY UPDATE name = VALUES(name)");
            $stmt->execute([
                $data[0], // name
                $data[1], // email
                $data[2], // phone
                isset($data[3]) ? $data[3] : null // company
            ]);
            $count++;
        } catch (Exception $e) {
            // Skip duplicate or invalid entries
            continue;
        }
    }
    
    fclose($handle);
    
    return ['success' => true, 'imported' => $count];
}

// Function to get campaigns
function getCampaigns() {
    global $db;
    
    $stmt = $db->query("SELECT c.*, 
                        (SELECT COUNT(*) FROM campaign_contacts WHERE campaign_id = c.id) as total_contacts,
                        (SELECT COUNT(*) FROM campaign_contacts WHERE campaign_id = c.id AND status = 'completed') as completed_contacts
                        FROM campaigns c 
                        ORDER BY created_at DESC");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Function to create a campaign
function createCampaign($data) {
    global $db;
    
    try {
        $stmt = $db->prepare("INSERT INTO campaigns (name, description, start_date, end_date, script) 
                              VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['name'],
            $data['description'],
            $data['start_date'],
            $data['end_date'],
            isset($data['script']) ? $data['script'] : null
        ]);
        
        $campaign_id = $db->lastInsertId();
        
        // Add contacts to campaign if specified
        if (isset($data['contact_ids']) && is_array($data['contact_ids'])) {
            foreach ($data['contact_ids'] as $contact_id) {
                $stmt = $db->prepare("INSERT INTO campaign_contacts (campaign_id, contact_id) VALUES (?, ?)");
                $stmt->execute([$campaign_id, $contact_id]);
            }
        }
        
        return ['success' => true, 'id' => $campaign_id];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

// Function to schedule a call
function scheduleCall($data) {
    global $db;
    
    try {
        $stmt = $db->prepare("INSERT INTO scheduled_calls (contact_id, campaign_id, scheduled_date, scheduled_time, priority, notes) 
                              VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['contact_id'],
            isset($data['campaign_id']) ? $data['campaign_id'] : null,
            $data['date'],
            $data['time'],
            isset($data['priority']) ? $data['priority'] : 'normal',
            isset($data['notes']) ? $data['notes'] : null
        ]);
        
        return ['success' => true, 'id' => $db->lastInsertId()];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

// Function to get call records
function getCallRecords() {
    global $db;
    
    $stmt = $db->query("SELECT cr.*, c.name as contact_name, camp.name as campaign_name 
                        FROM call_records cr 
                        LEFT JOIN contacts c ON cr.contact_id = c.id 
                        LEFT JOIN campaigns camp ON cr.campaign_id = camp.id 
                        ORDER BY cr.call_date DESC 
                        LIMIT 100");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Function to get statistics
function getStats() {
    global $db;
    
    $stats = array();
    
    // Total contacts
    $stmt = $db->query("SELECT COUNT(*) as count FROM contacts");
    $stats['total_contacts'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Calls today
    $stmt = $db->query("SELECT COUNT(*) as count FROM call_records WHERE DATE(call_date) = CURDATE()");
    $stats['calls_today'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Scheduled calls
    $stmt = $db->query("SELECT COUNT(*) as count FROM scheduled_calls WHERE status = 'pending'");
    $stats['scheduled_calls'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Success rate
    $stmt = $db->query("SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'answered' THEN 1 ELSE 0 END) as answered
                        FROM call_records 
                        WHERE call_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats['success_rate'] = $result['total'] > 0 ? round(($result['answered'] / $result['total']) * 100, 2) : 0;
    
    // Active campaigns
    $stmt = $db->query("SELECT COUNT(*) as count FROM campaigns WHERE status = 'active'");
    $stats['active_campaigns'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    return $stats;
}

// Function to update agent status
function updateAgentStatus($agent_id, $status) {
    global $db;
    
    try {
        $stmt = $db->prepare("INSERT INTO agent_status (agent_id, status) 
                              VALUES (?, ?) 
                              ON DUPLICATE KEY UPDATE status = VALUES(status)");
        $stmt->execute([$agent_id, $status]);
        
        return ['success' => true];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}
?>