// Test script to verify authentication flow and dashboard endpoints
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  patient: {
    email: 'patient@medcor.ai',
    password: 'patient123'
  },
  doctor: {
    email: 'doctor@medcor.ai', 
    password: 'doctor123'
  }
};

async function testLogin(role) {
  try {
    console.log(`\n=== Testing ${role} login ===`);
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_USER[role].email,
      password: TEST_USER[role].password
    });
    
    const { token, user } = loginResponse.data;
    console.log(`✓ Login successful for ${role}`);
    console.log(`  - Token: ${token ? 'Received' : 'Missing'}`);
    console.log(`  - Username: ${user.username}`);
    console.log(`  - Role: ${user.role}`);
    
    return token;
  } catch (error) {
    console.error(`✗ Login failed for ${role}:`, error.response?.data || error.message);
    return null;
  }
}

async function testAuthEndpoints(token, role) {
  if (!token) return;
  
  console.log(`\n=== Testing ${role} authenticated endpoints ===`);
  const headers = { Authorization: `Bearer ${token}` };
  
  // Test /api/auth/me
  try {
    const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, { headers });
    console.log(`✓ /api/auth/me working`);
    console.log(`  - Username: ${meResponse.data.username}`);
  } catch (error) {
    console.error(`✗ /api/auth/me failed:`, error.response?.data || error.message);
  }
  
  // Test appointments endpoint
  try {
    const appointmentsResponse = await axios.get(`${BASE_URL}/api/appointments/appointments/`, { headers });
    console.log(`✓ /api/appointments/appointments/ working`);
    console.log(`  - Appointments count: ${appointmentsResponse.data.length}`);
  } catch (error) {
    console.error(`✗ /api/appointments/appointments/ failed:`, error.response?.data || error.message);
  }
  
  if (role === 'doctor') {
    // Test treatments endpoint for doctors
    try {
      const treatmentsResponse = await axios.get(`${BASE_URL}/api/treatments/`, { headers });
      console.log(`✓ /api/treatments/ working`);
      console.log(`  - Treatments count: ${treatmentsResponse.data.length}`);
    } catch (error) {
      console.error(`✗ /api/treatments/ failed:`, error.response?.data || error.message);
    }
    
    // Test users endpoint for doctors
    try {
      const usersResponse = await axios.get(`${BASE_URL}/api/tenants/users/`, { headers });
      const patients = usersResponse.data.filter(u => u.role === 'patient');
      console.log(`✓ /api/tenants/users/ working`);
      console.log(`  - Total patients: ${patients.length}`);
    } catch (error) {
      console.error(`✗ /api/tenants/users/ failed:`, error.response?.data || error.message);
    }
  }
}

async function testSignup() {
  console.log('\n=== Testing signup with auto-role detection ===');
  const newUser = {
    name: 'Test User',
    email: `test${Date.now()}@medcor.ai`,
    password: 'Test123456!',
    confirmPassword: 'Test123456!',
    username: `testuser${Date.now()}`,
    phoneNumber: '+1234567890',
    role: 'patient' // This should be auto-detected from URL in real app
  };
  
  try {
    const signupResponse = await axios.post(`${BASE_URL}/api/auth/signup`, newUser);
    console.log('✓ Signup successful');
    console.log(`  - Username: ${signupResponse.data.user.username}`);
    console.log(`  - Role: ${signupResponse.data.user.role}`);
  } catch (error) {
    console.error('✗ Signup failed:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('Starting authentication flow tests...\n');
  
  // Test patient login and endpoints
  const patientToken = await testLogin('patient');
  await testAuthEndpoints(patientToken, 'patient');
  
  // Test doctor login and endpoints
  const doctorToken = await testLogin('doctor');
  await testAuthEndpoints(doctorToken, 'doctor');
  
  // Test signup
  await testSignup();
  
  console.log('\n=== Tests completed ===');
}

// Run tests
runTests().catch(console.error);