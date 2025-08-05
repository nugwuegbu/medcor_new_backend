#!/usr/bin/env node

import https from 'https';

const DJANGO_API_URL = 'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000';

// Test accounts
const testAccounts = [
  { email: 'admin@localhost', password: 'admin123' },
  { email: 'doctor@medcorclinic.com', password: 'doctor123' },
  { email: 'patient@medcorclinic.com', password: 'patient123' },
  { email: 'admin@medcor.ai', password: 'admin123' },
  { email: 'doctor@medcor.ai', password: 'doctor123' },
  { email: 'patient@medcor.ai', password: 'patient123' }
];

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
          console.log(`✅ Login successful: ${email}`);
          try {
            const parsed = JSON.parse(responseData);
            console.log(`   Role: ${parsed.user?.role || 'N/A'}`);
            console.log(`   Token: ${parsed.access ? 'Received' : 'Not received'}`);
          } catch (e) {}
        } else {
          console.log(`❌ Login failed: ${email} - ${res.statusCode}`);
        }
        resolve(responseData);
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Error: ${email} - ${err.message}`);
      resolve(null);
    });
    
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔐 Testing Django Authentication with Various Accounts\n');
  
  for (const account of testAccounts) {
    await testLogin(account.email, account.password);
  }
  
  console.log('\n✨ Authentication test complete!');
}

main().catch(console.error);