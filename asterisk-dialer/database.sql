-- Predictive Dialer Database Schema for MySQL/MariaDB
-- Compatible with CentOS 7 default MariaDB

CREATE DATABASE IF NOT EXISTS predictive_dialer;
USE predictive_dialer;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'supervisor', 'agent') DEFAULT 'agent',
    active TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    company VARCHAR(100),
    status ENUM('new', 'scheduled', 'completed', 'failed', 'dnc') DEFAULT 'new',
    last_call_date DATETIME,
    call_count INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_status (status)
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status ENUM('active', 'paused', 'completed') DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    dial_ratio INT DEFAULT 2,
    max_attempts INT DEFAULT 3,
    script TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Campaign contacts association
CREATE TABLE IF NOT EXISTS campaign_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    contact_id INT NOT NULL,
    status ENUM('pending', 'dialing', 'connected', 'completed', 'failed') DEFAULT 'pending',
    attempts INT DEFAULT 0,
    last_attempt DATETIME,
    assigned_to INT,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    UNIQUE KEY unique_campaign_contact (campaign_id, contact_id)
);

-- Call records table
CREATE TABLE IF NOT EXISTS call_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_id INT NOT NULL,
    campaign_id INT,
    agent_id INT,
    phone_number VARCHAR(20) NOT NULL,
    call_date DATETIME NOT NULL,
    duration INT DEFAULT 0, -- in seconds
    status ENUM('answered', 'no_answer', 'busy', 'failed', 'voicemail') DEFAULT 'no_answer',
    outcome ENUM('interested', 'not_interested', 'callback', 'dnc', 'wrong_number', 'none') DEFAULT 'none',
    recording_file VARCHAR(255),
    notes TEXT,
    asterisk_uniqueid VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (agent_id) REFERENCES users(id),
    INDEX idx_call_date (call_date),
    INDEX idx_asterisk_uniqueid (asterisk_uniqueid)
);

-- Scheduled calls table
CREATE TABLE IF NOT EXISTS scheduled_calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_id INT NOT NULL,
    campaign_id INT,
    agent_id INT,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    priority ENUM('low', 'normal', 'high') DEFAULT 'normal',
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (agent_id) REFERENCES users(id),
    INDEX idx_scheduled_datetime (scheduled_date, scheduled_time)
);

-- Agent status table
CREATE TABLE IF NOT EXISTS agent_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    status ENUM('available', 'busy', 'break', 'offline') DEFAULT 'offline',
    current_call_id INT,
    last_status_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES users(id),
    FOREIGN KEY (current_call_id) REFERENCES call_records(id),
    UNIQUE KEY unique_agent (agent_id)
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123 - change this!)
INSERT INTO users (username, password, role) VALUES 
('admin', '$2y$10$YourHashedPasswordHere', 'admin');

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, description) VALUES
('dial_timeout', '30', 'Timeout in seconds for dial attempts'),
('max_concurrent_calls', '10', 'Maximum simultaneous calls'),
('recording_enabled', '1', 'Enable call recording (1=yes, 0=no)'),
('recording_path', '/var/spool/asterisk/monitor/', 'Path to store recordings'),
('working_hours_start', '09:00', 'Start of calling hours'),
('working_hours_end', '17:00', 'End of calling hours'),
('retry_interval', '3600', 'Seconds between retry attempts');

-- Create indexes for performance
CREATE INDEX idx_campaign_status ON campaigns(status);
CREATE INDEX idx_campaign_contacts_status ON campaign_contacts(status);
CREATE INDEX idx_scheduled_calls_status ON scheduled_calls(status);