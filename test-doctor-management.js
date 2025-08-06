#!/usr/bin/env node

/**
 * Test script for Doctor Management API Integration
 * This script demonstrates the doctor creation functionality
 */

const BASE_URL = 'http://localhost:5000';

// Demo clinic credentials
const CLINIC_CREDENTIALS = {
  email: 'clinic@medcor.ai',
  password: 'Clinic123!'
};

// Test doctor data
const testDoctor = {
  email: `doctor_${Date.now()}@hospital.com`,
  password: 'Doctor123!',
  first_name: 'John',
  last_name: 'Smith',
  username: `dr.smith_${Date.now()}`,
  phone_number: '+1234567890',
  address: '123 Medical Center, Boston, MA',
  role: 'doctor',
  tenant_id: 1, // Will be set based on logged-in clinic
  medical_license: 'MD123456',
  specialization: 'Cardiology',
  years_of_experience: 10,
  consultation_fee: 150,
  emergency_contact: 'Jane Smith',
  emergency_phone: '+1234567891',
  blood_type: 'O+',
  date_of_birth: '1980-01-15'
};

// Step 1: Login as clinic admin
async function loginAsClinic() {
  console.log('\n📌 Step 1: Logging in as clinic admin...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(CLINIC_CREDENTIALS)
    });

    const data = await response.json();
    
    if (data.token || data.access_token) {
      console.log('✅ Successfully logged in as clinic admin');
      console.log('   User:', data.user.email);
      console.log('   Role:', data.user.role);
      return data.token || data.access_token;
    } else {
      throw new Error('Login failed: ' + JSON.stringify(data));
    }
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    return null;
  }
}

// Step 2: Get tenant list
async function getTenants(token) {
  console.log('\n📌 Step 2: Fetching available tenants...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/tenants/list/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.tenants && data.tenants.length > 0) {
      console.log('✅ Found', data.tenants.length, 'tenant(s):');
      data.tenants.forEach(tenant => {
        console.log(`   - ${tenant.name} (ID: ${tenant.id})`);
      });
      return data.tenants[0].id; // Return first tenant ID
    } else {
      console.log('⚠️  No tenants found');
      return 1; // Default tenant ID
    }
  } catch (error) {
    console.error('❌ Failed to fetch tenants:', error.message);
    return 1;
  }
}

// Step 3: Create a doctor
async function createDoctor(token, tenantId) {
  console.log('\n📌 Step 3: Creating a new doctor...');
  
  // Update tenant ID
  testDoctor.tenant_id = tenantId;
  
  console.log('   Doctor details:');
  console.log('   - Name:', testDoctor.first_name, testDoctor.last_name);
  console.log('   - Email:', testDoctor.email);
  console.log('   - Specialization:', testDoctor.specialization);
  console.log('   - Tenant ID:', testDoctor.tenant_id);
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/users/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testDoctor)
    });

    const data = await response.json();
    
    if (response.ok && data.access_token) {
      console.log('✅ Doctor created successfully!');
      console.log('   User ID:', data.user.id);
      console.log('   Email:', data.user.email);
      console.log('   JWT Token generated:', data.access_token ? 'Yes' : 'No');
      return data.user;
    } else {
      throw new Error(data.message || JSON.stringify(data));
    }
  } catch (error) {
    console.error('❌ Failed to create doctor:', error.message);
    return null;
  }
}

// Step 4: Fetch all doctors
async function fetchDoctors(token) {
  console.log('\n📌 Step 4: Fetching all doctors...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/doctors/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Found', data.length || 0, 'doctor(s)');
      if (data.length > 0) {
        console.log('\n   Recent doctors:');
        data.slice(0, 5).forEach(doctor => {
          console.log(`   - Dr. ${doctor.first_name} ${doctor.last_name} (${doctor.specialization || 'General'})`);
        });
      }
      return data;
    } else {
      throw new Error('Failed to fetch doctors');
    }
  } catch (error) {
    console.error('❌ Failed to fetch doctors:', error.message);
    return [];
  }
}

// Main test function
async function runTest() {
  console.log('========================================');
  console.log('  Doctor Management API Integration Test');
  console.log('========================================');
  
  // Step 1: Login
  const token = await loginAsClinic();
  if (!token) {
    console.error('\n❌ Test failed: Could not authenticate');
    return;
  }
  
  // Step 2: Get tenant
  const tenantId = await getTenants(token);
  
  // Step 3: Create doctor
  const newDoctor = await createDoctor(token, tenantId);
  if (!newDoctor) {
    console.error('\n❌ Test failed: Could not create doctor');
    return;
  }
  
  // Step 4: Fetch doctors to verify
  await fetchDoctors(token);
  
  console.log('\n========================================');
  console.log('✅ Doctor Management Test Complete!');
  console.log('========================================');
  console.log('\nYou can now:');
  console.log('1. Login to the Staff Dashboard at http://localhost:5000');
  console.log('2. Navigate to the "Doctors" section');
  console.log('3. View doctors in grid or list view');
  console.log('4. Add new doctors using the "Add Doctor" button');
  console.log('\nThe form will auto-fill the hospital based on the logged-in user!');
}

// Run the test
runTest().catch(console.error);