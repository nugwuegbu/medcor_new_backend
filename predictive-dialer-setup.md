# Predictive Dialer Setup Guide for Asterisk PBX

## Overview
This implementation provides a complete predictive dialing solution using PHP AGI and Asterisk Manager Interface. The system automatically dials multiple numbers, detects answering machines, and connects answered calls to available agents.

## Components

### 1. **predictive-dialer-sample.php**
- Main dialer engine using Asterisk Manager Interface
- Manages campaign execution and call origination
- Monitors agent availability and call states
- Handles abandoned calls and statistics

### 2. **predictive-dialer-agi.php**
- AGI script for call flow control
- Answering Machine Detection (AMD)
- Agent routing and queue management
- Call recording and logging

## Installation Steps

### 1. Install Dependencies
```bash
# Install PHP AGI library
cd /var/lib/asterisk/agi-bin/
wget https://github.com/welltime/phpagi/archive/master.zip
unzip master.zip
mv phpagi-master phpagi

# Install manager library
cp phpagi/phpagi-asmanager.php /usr/share/asterisk/agi-bin/
```

### 2. Configure Asterisk Manager (manager.conf)
```ini
[general]
enabled = yes
port = 5038
bindaddr = 0.0.0.0

[admin]
secret = mysecret
read = all
write = all
```

### 3. Set Up Dialplan (extensions.conf)
```ini
[predictive-dialer]
; Main predictive dialer context
exten => _X.,1,NoOp(Predictive Dialer Call to ${EXTEN})
 same => n,Set(CAMPAIGN_ID=${CAMPAIGN_ID})
 same => n,Set(CONTACT_ID=${CONTACT_ID})
 same => n,AGI(predictive-dialer-agi.php)
 same => n,Hangup()

[agent-queue]
; Queue for available agents
exten => s,1,Queue(sales,tT,,,300)
 same => n,Hangup()

[dnc-request]
; Do Not Call request handler
exten => s,1,AGI(predictive-dialer-agi.php,dnc)
 same => n,Hangup()
```

### 4. Create Agent Queue (queues.conf)
```ini
[sales]
strategy = rrmemory
timeout = 30
retry = 5
wrapuptime = 5
maxlen = 0
announce-frequency = 30
announce-holdtime = yes
member => SIP/1001
member => SIP/1002
member => SIP/1003
```

## Database Schema

```sql
CREATE DATABASE predictive_dialer;

CREATE TABLE campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    status ENUM('active', 'paused', 'completed'),
    dial_ratio FLOAT DEFAULT 1.5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT,
    phone_number VARCHAR(20),
    name VARCHAR(100),
    status ENUM('new', 'dialing', 'connected', 'no_answer', 'busy', 'failed'),
    attempts INT DEFAULT 0,
    last_attempt TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

CREATE TABLE call_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT,
    contact_id INT,
    agent_id VARCHAR(20),
    call_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration INT,
    disposition VARCHAR(50),
    recording_path VARCHAR(255),
    amd_result VARCHAR(20),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

CREATE TABLE dnc_list (
    phone_number VARCHAR(20) PRIMARY KEY,
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(100)
);
```

## Usage Examples

### Start a Campaign
```bash
php predictive-dialer-sample.php start
```

### Monitor Campaign Statistics
```bash
php predictive-dialer-sample.php stats
```

### Stop Campaign
```bash
php predictive-dialer-sample.php stop
```

## Configuration Options

### Dial Ratio
- `dial_ratio`: Number of calls per available agent (e.g., 1.5)
- Higher ratios = more aggressive dialing
- Monitor abandon rate and adjust accordingly

### Timeouts
- `answer_timeout`: Maximum ring time before considering no answer
- `agent_wrapup_time`: Time between agent calls
- AMD timeouts for accurate detection

## Best Practices

1. **Compliance**
   - Implement DNC list checking
   - Respect calling hours (TCPA compliance)
   - Record opt-out requests

2. **Performance**
   - Monitor abandon rates (keep under 3%)
   - Adjust dial ratio based on agent availability
   - Use local channels for better control

3. **Reporting**
   - Track key metrics: connect rate, talk time, abandon rate
   - Monitor agent productivity
   - Record all calls for quality assurance

## Troubleshooting

### Common Issues

1. **"Cannot connect to Asterisk Manager"**
   - Check manager.conf configuration
   - Verify firewall allows port 5038
   - Ensure manager module is loaded: `module show like manager`

2. **"No audio on connected calls"**
   - Check NAT settings in sip.conf
   - Verify RTP port range in firewall
   - Enable directmedia=no for SIP peers

3. **"AMD not detecting properly"**
   - Adjust AMD parameters in AGI script
   - Test with different silence thresholds
   - Consider commercial AMD solutions for better accuracy

## Security Considerations

1. Use strong passwords for AMI access
2. Restrict AMI access by IP address
3. Implement rate limiting for dial attempts
4. Encrypt recordings and sensitive data
5. Regular security audits of the system

## Additional Features

The implementation can be extended with:
- Real-time web dashboard
- SMS capabilities
- Email integration
- CRM integration
- Advanced reporting
- Skill-based routing
- Callback scheduling
- Time zone management