// Test script for avatar recording
// Run this script to record the current avatar for 10 seconds

async function recordAvatar() {
  const sessionId = 'test-recording-session';
  const duration = 10; // seconds
  
  console.log('Starting avatar recording test...');
  console.log(`Session ID: ${sessionId}`);
  console.log(`Duration: ${duration} seconds`);
  
  try {
    const response = await fetch('http://localhost:5000/api/avatar/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        duration
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✓ Recording successful!');
      console.log(`File saved at: ${result.filePath}`);
      console.log('Metadata:', result.metadata);
    } else {
      console.error('✗ Recording failed:', result.error);
    }
  } catch (error) {
    console.error('Error calling recording API:', error);
  }
}

// Run the test
recordAvatar();