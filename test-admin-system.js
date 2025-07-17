/**
 * Comprehensive Admin System Testing Suite
 * Tests admin login, authentication, data management, and UI functionality
 */

// Test configuration
const BASE_URL = 'http://localhost:5000';
const ADMIN_CREDENTIALS = {
  email: 'admin@medcor.ai',
  password: 'Admin123!'
};

// Test state
let adminToken = null;
let testResults = [];

// Helper functions
function logTest(testName, status, details = '') {
  const result = { testName, status, details, timestamp: new Date().toISOString() };
  testResults.push(result);
  console.log(`${status === 'PASS' ? '✅' : '❌'} ${testName}: ${details}`);
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(adminToken && { 'Authorization': `Bearer ${adminToken}` })
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers }
    });
    
    const data = await response.text();
    let parsedData;
    
    try {
      parsedData = JSON.parse(data);
    } catch {
      parsedData = data;
    }
    
    return {
      ok: response.ok,
      status: response.status,
      data: parsedData
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message
    };
  }
}

// Test Suite 1: Admin Authentication
async function testAdminAuthentication() {
  console.log('\n🔐 Testing Admin Authentication...');
  
  // Test 1.1: Admin login with correct credentials
  const loginResponse = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(ADMIN_CREDENTIALS)
  });
  
  if (loginResponse.ok && loginResponse.data.token) {
    adminToken = loginResponse.data.token;
    logTest('Admin Login', 'PASS', 'Successfully logged in with admin credentials');
  } else {
    logTest('Admin Login', 'FAIL', `Login failed: ${loginResponse.data.error || 'Unknown error'}`);
    return false;
  }
  
  // Test 1.2: Verify admin role
  if (loginResponse.data.user && loginResponse.data.user.role === 'admin') {
    logTest('Admin Role Verification', 'PASS', 'User has admin role');
  } else {
    logTest('Admin Role Verification', 'FAIL', 'User does not have admin role');
  }
  
  // Test 1.3: Login with invalid credentials
  const invalidLoginResponse = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@medcor.ai', password: 'wrongpassword' })
  });
  
  if (!invalidLoginResponse.ok) {
    logTest('Invalid Credentials Rejection', 'PASS', 'Invalid credentials properly rejected');
  } else {
    logTest('Invalid Credentials Rejection', 'FAIL', 'Invalid credentials were accepted');
  }
  
  // Test 1.4: Non-admin user login attempt (should succeed but not have admin access)
  const patientLoginResponse = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'patient@medcor.ai', password: 'Patient123!' })
  });
  
  if (patientLoginResponse.ok && patientLoginResponse.data.user.role === 'patient') {
    logTest('Patient Login Success', 'PASS', 'Patient can login with correct role');
  } else {
    logTest('Patient Login Success', 'FAIL', 'Patient login failed');
  }
  
  return true;
}

// Test Suite 2: Admin API Endpoints
async function testAdminAPIEndpoints() {
  console.log('\n📊 Testing Admin API Endpoints...');
  
  if (!adminToken) {
    logTest('Admin API Tests', 'SKIP', 'No admin token available');
    return;
  }
  
  // Test 2.1: Get admin statistics
  const statsResponse = await makeRequest('/api/admin/stats');
  
  if (statsResponse.ok && statsResponse.data.totalPatients !== undefined) {
    logTest('Admin Statistics API', 'PASS', `Retrieved stats: ${statsResponse.data.totalPatients} patients`);
  } else {
    logTest('Admin Statistics API', 'FAIL', 'Failed to retrieve admin statistics');
  }
  
  // Test 2.2: Get all users
  const usersResponse = await makeRequest('/api/admin/users');
  
  if (usersResponse.ok && Array.isArray(usersResponse.data)) {
    const hasPasswordField = usersResponse.data.some(user => user.password !== undefined);
    if (!hasPasswordField) {
      logTest('Users API Security', 'PASS', `Retrieved ${usersResponse.data.length} users without password fields`);
    } else {
      logTest('Users API Security', 'FAIL', 'Password fields exposed in users response');
    }
  } else {
    logTest('Users API', 'FAIL', 'Failed to retrieve users');
  }
  
  // Test 2.3: Get all doctors
  const doctorsResponse = await makeRequest('/api/admin/doctors');
  
  if (doctorsResponse.ok && Array.isArray(doctorsResponse.data)) {
    logTest('Doctors API', 'PASS', `Retrieved ${doctorsResponse.data.length} doctors`);
  } else {
    logTest('Doctors API', 'FAIL', 'Failed to retrieve doctors');
  }
  
  // Test 2.4: Get all appointments
  const appointmentsResponse = await makeRequest('/api/admin/appointments');
  
  if (appointmentsResponse.ok && Array.isArray(appointmentsResponse.data)) {
    logTest('Appointments API', 'PASS', `Retrieved ${appointmentsResponse.data.length} appointments`);
  } else {
    logTest('Appointments API', 'FAIL', 'Failed to retrieve appointments');
  }
  
  // Test 2.5: Unauthorized access without token
  const unauthorizedResponse = await makeRequest('/api/admin/stats', {
    headers: { Authorization: '' }
  });
  
  if (!unauthorizedResponse.ok && unauthorizedResponse.status === 401) {
    logTest('Unauthorized Access Protection', 'PASS', 'Properly rejected requests without valid token');
  } else {
    logTest('Unauthorized Access Protection', 'FAIL', 'Accepted requests without valid token');
  }
}

// Test Suite 3: Data Validation and Integrity
async function testDataIntegrity() {
  console.log('\n🔍 Testing Data Integrity...');
  
  if (!adminToken) {
    logTest('Data Integrity Tests', 'SKIP', 'No admin token available');
    return;
  }
  
  // Test 3.1: Validate stats calculations
  const [statsResponse, usersResponse, doctorsResponse, appointmentsResponse] = await Promise.all([
    makeRequest('/api/admin/stats'),
    makeRequest('/api/admin/users'),
    makeRequest('/api/admin/doctors'),
    makeRequest('/api/admin/appointments')
  ]);
  
  if (statsResponse.ok && usersResponse.ok && doctorsResponse.ok && appointmentsResponse.ok) {
    const stats = statsResponse.data;
    const users = usersResponse.data;
    const doctors = doctorsResponse.data;
    const appointments = appointmentsResponse.data;
    
    const patientCount = users.filter(u => u.role === 'patient').length;
    const pendingCount = appointments.filter(a => a.status === 'pending').length;
    
    if (stats.totalPatients === patientCount) {
      logTest('Patient Count Accuracy', 'PASS', `Correct patient count: ${patientCount}`);
    } else {
      logTest('Patient Count Accuracy', 'FAIL', `Mismatch: stats=${stats.totalPatients}, actual=${patientCount}`);
    }
    
    if (stats.totalDoctors === doctors.length) {
      logTest('Doctor Count Accuracy', 'PASS', `Correct doctor count: ${doctors.length}`);
    } else {
      logTest('Doctor Count Accuracy', 'FAIL', `Mismatch: stats=${stats.totalDoctors}, actual=${doctors.length}`);
    }
    
    if (stats.pendingAppointments === pendingCount) {
      logTest('Pending Appointments Accuracy', 'PASS', `Correct pending count: ${pendingCount}`);
    } else {
      logTest('Pending Appointments Accuracy', 'FAIL', `Mismatch: stats=${stats.pendingAppointments}, actual=${pendingCount}`);
    }
  }
  
  // Test 3.2: Data structure validation
  if (usersResponse.ok) {
    const users = usersResponse.data;
    const hasRequiredFields = users.every(user => 
      user.id && user.name && user.email && user.role
    );
    
    if (hasRequiredFields) {
      logTest('User Data Structure', 'PASS', 'All users have required fields');
    } else {
      logTest('User Data Structure', 'FAIL', 'Some users missing required fields');
    }
  }
}

// Test Suite 4: UI Navigation and Accessibility
async function testUINavigation() {
  console.log('\n🖥️ Testing UI Navigation...');
  
  // Test 4.1: Admin login page accessibility
  const loginPageResponse = await makeRequest('/admin/login');
  
  if (loginPageResponse.ok) {
    logTest('Admin Login Page Access', 'PASS', 'Admin login page accessible');
  } else {
    logTest('Admin Login Page Access', 'FAIL', 'Admin login page not accessible');
  }
  
  // Test 4.2: Admin dashboard access (would require browser automation for full test)
  logTest('Dashboard UI Test', 'INFO', 'Full UI testing requires browser automation');
}

// Test Suite 5: Security and Performance
async function testSecurityAndPerformance() {
  console.log('\n🛡️ Testing Security and Performance...');
  
  // Test 5.1: Rate limiting and concurrent requests
  const concurrentRequests = [];
  for (let i = 0; i < 10; i++) {
    concurrentRequests.push(makeRequest('/api/admin/stats'));
  }
  
  const startTime = Date.now();
  const responses = await Promise.all(concurrentRequests);
  const endTime = Date.now();
  
  const successCount = responses.filter(r => r.ok).length;
  const avgResponseTime = (endTime - startTime) / responses.length;
  
  if (successCount === responses.length && avgResponseTime < 1000) {
    logTest('Concurrent Request Handling', 'PASS', `${successCount}/10 requests successful, avg ${avgResponseTime}ms`);
  } else {
    logTest('Concurrent Request Handling', 'FAIL', `${successCount}/10 requests successful, avg ${avgResponseTime}ms`);
  }
  
  // Test 5.2: SQL injection prevention (basic test)
  const maliciousPayload = {
    email: "admin@medcor.ai'; DROP TABLE users; --",
    password: "test"
  };
  
  const sqlInjectionResponse = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(maliciousPayload)
  });
  
  if (!sqlInjectionResponse.ok) {
    logTest('SQL Injection Protection', 'PASS', 'Malicious SQL payload properly rejected');
  } else {
    logTest('SQL Injection Protection', 'FAIL', 'System vulnerable to SQL injection');
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting MedCor Admin System Comprehensive Test Suite\n');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
  
  try {
    // Run all test suites
    await testAdminAuthentication();
    await testAdminAPIEndpoints();
    await testDataIntegrity();
    await testUINavigation();
    await testSecurityAndPerformance();
    
    // Generate test report
    console.log('\n📋 TEST SUMMARY');
    console.log('==================');
    
    const passCount = testResults.filter(r => r.status === 'PASS').length;
    const failCount = testResults.filter(r => r.status === 'FAIL').length;
    const skipCount = testResults.filter(r => r.status === 'SKIP').length;
    const infoCount = testResults.filter(r => r.status === 'INFO').length;
    
    console.log(`Total Tests: ${testResults.length}`);
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`⏭️ Skipped: ${skipCount}`);
    console.log(`ℹ️ Info: ${infoCount}`);
    console.log(`\nSuccess Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
    
    if (failCount > 0) {
      console.log('\n🚨 FAILED TESTS:');
      testResults.filter(r => r.status === 'FAIL').forEach(test => {
        console.log(`- ${test.testName}: ${test.details}`);
      });
    }
    
    console.log('\n✅ Admin system testing completed successfully!');
    return { passCount, failCount, skipCount, testResults };
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    return { error: error.message, testResults };
  }
}

// Run tests if executed directly (Node.js environment)
if (typeof window === 'undefined') {
  runAllTests().then(results => {
    process.exit(results.failCount > 0 ? 1 : 0);
  });
}