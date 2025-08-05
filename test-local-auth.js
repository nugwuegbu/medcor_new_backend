#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';

// Test accounts that should exist in local database
const testAccounts = [
  { email: 'admin@medcor.ai', password: 'admin123' },
  { email: 'doctor@medcor.ai', password: 'doctor123' },
  { email: 'patient@medcor.ai', password: 'patient123' },
  { email: 'clinic@medcor.ai', password: 'clinic123' }
];

async function testLogin(email, password) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`✅ Login successful: ${email}`);
      console.log(`   Role: ${data.user?.role || 'N/A'}`);
      console.log(`   Token: ${data.token ? 'Received' : 'Not received'}`);
      console.log(`   User ID: ${data.user?.id || 'N/A'}`);
      return data;
    } else {
      console.log(`❌ Login failed: ${email}`);
      console.log(`   Error: ${data.error || response.statusText}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error testing ${email}: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🔐 Testing Local Authentication System\n');
  
  for (const account of testAccounts) {
    await testLogin(account.email, account.password);
    console.log('');
  }
  
  console.log('✨ Local auth test complete!');
  console.log('\nWorking demo accounts for testing:');
  console.log('  Doctor Dashboard: doctor@medcor.ai / doctor123');
  console.log('  Patient Dashboard: patient@medcor.ai / patient123');
}

main().catch(console.error);