// Test Face Analysis API directly
const testFaceAnalysis = async () => {
  try {
    console.log('Testing Face Analysis API...');
    
    const response = await fetch('http://localhost:5000/api/face-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'test_image_data' })
    });
    
    const data = await response.json();
    console.log('API Response:', data);
    
    if (data.success) {
      console.log('✓ API working correctly');
      console.log('✓ Backend returns:', data.result);
    } else {
      console.log('✗ API failed:', data.error);
    }
  } catch (error) {
    console.error('✗ Network error:', error);
  }
};

testFaceAnalysis();