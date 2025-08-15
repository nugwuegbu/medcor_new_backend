#!/usr/bin/env node

/**
 * Test Voice-to-MCP Appointment Booking Flow
 * This demonstrates how voice commands trigger MCP server actions
 */

import fetch from 'node-fetch';

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const TEST_TOKEN = null; // Will be set after login

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function simulateVoiceCommand(voiceText) {
  log(`\n🎤 User says: "${voiceText}"`, 'cyan');
  
  try {
    // Step 1: Send voice command to backend
    log('📡 Sending to voice processing endpoint...', 'yellow');
    const response = await fetch(`${API_BASE_URL}/api/chat/voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: voiceText,
        sessionId: `test-session-${Date.now()}`,
        language: 'en'
      })
    });

    const data = await response.json();
    
    // Step 2: Show what the backend detected
    if (data.voiceCommand) {
      log('✅ Voice command detected!', 'green');
      log(`   Feature: ${data.voiceCommand.feature}`, 'blue');
      log(`   Action: ${data.voiceCommand.action}`, 'blue');
      
      if (data.voiceCommand.data) {
        log('   Extracted data:', 'blue');
        Object.entries(data.voiceCommand.data).forEach(([key, value]) => {
          log(`     - ${key}: ${value}`, 'blue');
        });
      }
    }
    
    // Step 3: Show MCP server actions that would be triggered
    if (data.voiceCommand?.feature === 'appointment') {
      log('\n🔧 MCP Server Actions:', 'yellow');
      log('1. list_doctors() - Finding doctor in database', 'green');
      log('2. list_appointment_slots() - Checking availability', 'green');
      log('3. create_appointment() - Booking the slot', 'green');
      log('4. Return confirmation to user', 'green');
    }
    
    // Step 4: Show the response
    log(`\n🤖 AI responds: "${data.message}"`, 'cyan');
    
    return data;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return null;
  }
}

async function demonstrateMCPTools() {
  log('\n📚 Available MCP Server Tools for Appointments:', 'bright');
  
  const mcpTools = [
    {
      name: 'list_doctors',
      description: 'Get all available doctors',
      example: 'list_doctors(tenant_id=1)'
    },
    {
      name: 'list_appointment_slots',
      description: 'Check available time slots',
      example: 'list_appointment_slots(doctor_id=2, date="2025-01-15")'
    },
    {
      name: 'create_appointment',
      description: 'Book an appointment',
      example: 'create_appointment(patient_id=1, doctor_id=2, date="2025-01-15", time="14:00")'
    },
    {
      name: 'update_appointment_status',
      description: 'Change appointment status',
      example: 'update_appointment_status(appointment_id=1, status="confirmed")'
    }
  ];
  
  mcpTools.forEach(tool => {
    log(`\n🔧 ${tool.name}`, 'green');
    log(`   ${tool.description}`, 'yellow');
    log(`   Example: ${tool.example}`, 'blue');
  });
}

async function testCompleteFlow() {
  log('\n' + '='.repeat(60), 'bright');
  log('🏥 MedCor Voice-to-MCP Appointment Booking Test', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  
  // Test various voice commands
  const testCommands = [
    "I want to book an appointment with Dr. Johnson",
    "Schedule me with Dr. Chen tomorrow at 2 PM",
    "I need to see a cardiologist next week",
    "Book appointment with Dr. Smith for headache consultation",
    "Can you check if Dr. Johnson is available on Friday?"
  ];
  
  log('Testing voice commands that trigger MCP server:', 'yellow');
  
  for (const command of testCommands) {
    await simulateVoiceCommand(command);
    log('\n' + '-'.repeat(40), 'bright');
  }
  
  // Show MCP tools
  await demonstrateMCPTools();
  
  // Show the flow diagram
  log('\n📊 Complete Voice-to-MCP Flow:', 'bright');
  log('', 'yellow');
  log('1. User speaks → "Book appointment with Dr. Johnson"', 'blue');
  log('   ↓', 'yellow');
  log('2. Browser Speech Recognition → Converts to text', 'blue');
  log('   ↓', 'yellow');
  log('3. Backend /api/chat/voice → Detects intent & extracts data', 'blue');
  log('   ↓', 'yellow');
  log('4. MCP Server calls:', 'blue');
  log('   • list_doctors() → Find Dr. Johnson\'s ID', 'green');
  log('   • list_appointment_slots() → Check availability', 'green');
  log('   • create_appointment() → Book the slot', 'green');
  log('   ↓', 'yellow');
  log('5. Avatar responds → "I\'ve booked your appointment"', 'blue');
}

// Run the test
testCompleteFlow().then(() => {
  log('\n✅ Test complete!', 'green');
  log('\nNote: This test shows the flow without actually creating appointments.', 'yellow');
  log('The real system would execute the MCP server tools and update the database.\n', 'yellow');
}).catch(error => {
  log(`\n❌ Test failed: ${error.message}`, 'red');
  process.exit(1);
});