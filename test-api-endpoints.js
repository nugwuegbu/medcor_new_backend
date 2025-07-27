/**
 * Test script to validate all API endpoints are working correctly
 * Usage: node test-api-endpoints.js
 */

const BASE_URL = 'http://localhost:8000';

const endpoints = [
  // Hospitals/Clinics (Tenants)
  '/api/tenants/hospitals-clinics/',
  '/api/tenants/domains/',
  
  // Users - Role-based endpoints
  '/api/tenants/users/doctors/',
  '/api/tenants/users/patients/',
  '/api/tenants/users/nurses/',
  '/api/tenants/users/admins/',
  
  // Subscription Plans
  '/api/subscription/plans/',
  '/api/subscription/subscriptions/',
  '/api/subscription/payments/',
  '/api/subscription/usage/',
  
  // Appointments
  '/api/appointments/slots/',
  '/api/appointments/slot-exclusions/',
  '/api/appointments/appointments/',
  
  // Treatments (existing)
  '/api/treatments/',
  
  // API Documentation
  '/api/schema/',
  '/api/docs/',
  '/api/swagger/',
  '/api/redoc/'
];

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    const status = response.status;
    const statusText = response.statusText;
    
    // 401 is expected for authenticated endpoints without token
    // 200 is expected for public endpoints like documentation
    if (status === 200 || status === 401) {
      console.log(`✅ ${endpoint} - ${status} ${statusText}`);
      return true;
    } else {
      console.log(`❌ ${endpoint} - ${status} ${statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${endpoint} - ERROR: ${error.message}`);
    return false;
  }
}

async function testAllEndpoints() {
  console.log('🚀 Testing MedCor API Endpoints...\n');
  
  let passedCount = 0;
  let totalCount = endpoints.length;
  
  for (const endpoint of endpoints) {
    const passed = await testEndpoint(endpoint);
    if (passed) passedCount++;
  }
  
  console.log(`\n📊 Results: ${passedCount}/${totalCount} endpoints responding correctly`);
  
  if (passedCount === totalCount) {
    console.log('🎉 All API endpoints are properly configured!');
  } else {
    console.log('⚠️  Some endpoints need attention.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAllEndpoints();
}

module.exports = { testAllEndpoints, testEndpoint };