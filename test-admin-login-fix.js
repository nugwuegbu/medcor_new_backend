// Test script to verify admin login is working correctly
async function testAdminLogin() {
  console.log('Testing Admin Login Flow...\n');
  
  // Clear any existing tokens first
  localStorage.clear();
  console.log('✓ Cleared local storage');
  
  // Test admin login endpoint
  const loginUrl = 'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/api/auth/admin/login/';
  
  try {
    console.log('Attempting login with admin@medcor.ai...');
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No Authorization header should be sent for login
      },
      body: JSON.stringify({
        email: 'admin@medcor.ai',
        password: 'Admin123!'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✓ Login successful!');
      console.log('Response structure:', {
        hasAccess: !!data.access,
        hasAccessToken: !!data.access_token,
        hasToken: !!data.token,
        hasUser: !!data.user,
        hasRefresh: !!data.refresh
      });
      
      const token = data.access || data.access_token || data.token;
      if (token) {
        console.log('✓ Token received:', token.substring(0, 20) + '...');
        
        // Test profile endpoint with the token
        console.log('\nTesting profile endpoint with token...');
        const profileResponse = await fetch('https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/api/auth/profile/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          console.log('✓ Profile fetch successful:', profile);
        } else {
          console.log('✗ Profile fetch failed:', profileResponse.status);
        }
      }
    } else {
      console.log('✗ Login failed:', response.status);
      console.log('Error:', data);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testAdminLogin();