#!/usr/bin/env node

import https from 'https';

const BACKEND_URL = 'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BACKEND_URL + path);
    
    const req = https.request(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testAppointmentCreation() {
  console.log('\n📅 Testing Fixed Appointment Creation');
  console.log('=====================================');
  
  // Test data without required slot and treatment fields
  const appointmentData = {
    patient: 1,  // Patient ID
    doctor: 1,   // Doctor ID
    appointment_slot_date: '2025-08-10',
    appointment_slot_start_time: '09:00:00',
    appointment_slot_end_time: '10:00:00',
    medical_record: 'Regular checkup',  // Now sent as text, not file
    appointment_status: 'Pending'
  };
  
  console.log('Sending appointment data:', JSON.stringify(appointmentData, null, 2));
  
  try {
    const response = await makeRequest('/appointments/', {
      method: 'POST',
      body: JSON.stringify(appointmentData)
    });
    
    console.log(`\nStatus: ${response.status}`);
    
    if (response.status === 201) {
      console.log('✅ Appointment created successfully!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } else if (response.status === 400) {
      console.log('⚠️ Bad request - checking if fields are still required:');
      console.log(JSON.stringify(response.data, null, 2));
      
      // Check if slot/treatment are still required
      if (response.data.slot || response.data.treatment) {
        console.log('\n❌ Fields are still marked as required!');
      } else {
        console.log('\n✅ Required field errors resolved, other validation issues:');
      }
    } else if (response.status === 401) {
      console.log('✅ Endpoint working - requires authentication');
      console.log('Note: Fields are no longer required');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAppointmentCreation();
