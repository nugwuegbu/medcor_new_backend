/**
 * Test API Documentation Access
 */

const BASE_URL = 'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000';

const docEndpoints = [
  '/api/docs/',
  '/api/swagger/', 
  '/api/redoc/',
  '/api/schema/',
  '/'  // Root endpoint should show API info
];

async function testDocumentation() {
  console.log('🔍 Testing API Documentation Access...\n');
  
  for (const endpoint of docEndpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      
      if (response.ok) {
        console.log(`✅ ${endpoint} - ${response.status} ${response.statusText}`);
        
        if (endpoint === '/') {
          const data = await response.json();
          console.log(`   📋 Available docs: ${JSON.stringify(data.documentation, null, 2)}`);
        }
      } else {
        console.log(`❌ ${endpoint} - ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - ERROR: ${error.message}`);
    }
  }
}

testDocumentation();