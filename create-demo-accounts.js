#!/usr/bin/env node

import https from 'https';

const DJANGO_API_URL = 'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000';

// Demo accounts to create
const demoAccounts = [
  {
    email: 'doctor@demo.com',
    password: 'demo123',
    role: 'doctor',
    first_name: 'John',
    last_name: 'Doe',
    tenant_id: 1 // Assuming tenant ID 1 exists
  },
  {
    email: 'patient@demo.com', 
    password: 'demo123',
    role: 'patient',
    first_name: 'Jane',
    last_name: 'Smith',
    tenant_id: 1
  }
];

async function createAccount(account) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(account);
    const url = new URL(`${DJANGO_API_URL}/api/auth/register/`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      rejectUnauthorized: false // Skip SSL verification for dev
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`✅ Created account: ${account.email}`);
          resolve(responseData);
        } else {
          console.log(`❌ Failed to create ${account.email}: ${res.statusCode}`);
          console.log(`   Response: ${responseData}`);
          resolve(null);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Error creating ${account.email}: ${err.message}`);
      resolve(null);
    });
    
    req.write(data);
    req.end();
  });
}

async function testLogin(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });
    const url = new URL(`${DJANGO_API_URL}/api/auth/login/`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      rejectUnauthorized: false
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ Login successful for: ${email}`);
          resolve(responseData);
        } else {
          console.log(`❌ Login failed for ${email}: ${res.statusCode}`);
          console.log(`   Response: ${responseData}`);
          resolve(null);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Login error for ${email}: ${err.message}`);
      resolve(null);
    });
    
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔧 Creating Demo Accounts for MedCor Platform\n');
  
  // Create accounts
  for (const account of demoAccounts) {
    await createAccount(account);
  }
  
  console.log('\n🔑 Testing Login for Demo Accounts\n');
  
  // Test login
  for (const account of demoAccounts) {
    await testLogin(account.email, account.password);
  }
  
  console.log('\n✨ Demo account setup complete!');
  console.log('\nYou can now login with:');
  console.log('  Doctor: doctor@demo.com / demo123');
  console.log('  Patient: patient@demo.com / demo123');
}

main().catch(console.error);