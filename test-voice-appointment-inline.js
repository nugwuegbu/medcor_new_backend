// Test Voice Appointment with Inline Calendar
import fetch from 'node-fetch';

async function testVoiceAppointmentInline() {
  const API_BASE = 'http://localhost:5000';
  const sessionId = 'test-session-' + Date.now();
  
  console.log('=== Testing Voice Appointment with Inline Calendar ===');
  console.log('Session ID:', sessionId);
  
  try {
    // Test 1: Voice command for appointment booking
    console.log('\n1. Testing voice appointment request...');
    const voiceResponse = await fetch(`${API_BASE}/api/chat/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Hello I want to book an appointment with Dr Johnson at 2:00 p.m. tomorrow",
        sessionId: sessionId,
        language: 'en'
      })
    });
    
    const voiceData = await voiceResponse.json();
    console.log('Voice Response:', JSON.stringify(voiceData, null, 2));
    
    // Check if VOICE_FLOW command is returned
    if (voiceData.message.includes('VOICE_FLOW:APPOINTMENT:START')) {
      console.log('✓ Voice flow initiated correctly');
      
      // Check if appointment data was parsed
      if (voiceData.voiceCommand?.data) {
        console.log('✓ Appointment details parsed:');
        console.log('  - Doctor:', voiceData.voiceCommand.data.doctor);
        console.log('  - Date:', voiceData.voiceCommand.data.date);
        console.log('  - Time:', voiceData.voiceCommand.data.time);
        console.log('  - Reason:', voiceData.voiceCommand.data.reason);
      }
    }
    
    // Test 2: Continue conversation with more details
    console.log('\n2. Testing follow-up voice input...');
    const followUpResponse = await fetch(`${API_BASE}/api/chat/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "I need it for a general checkup",
        sessionId: sessionId,
        conversationState: {
          feature: 'appointment',
          step: 'continuous_listening',
          context: {}
        }
      })
    });
    
    const followUpData = await followUpResponse.json();
    console.log('Follow-up Response:', JSON.stringify(followUpData, null, 2));
    
    console.log('\n=== Test Complete ===');
    console.log('The inline calendar should now be displayed within the chat widget with:');
    console.log('- Pre-filled doctor name: Dr. Johnson');
    console.log('- Pre-selected date: Tomorrow');
    console.log('- Pre-selected time: 2:00 PM');
    console.log('- The user can continue speaking to adjust these details');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testVoiceAppointmentInline();